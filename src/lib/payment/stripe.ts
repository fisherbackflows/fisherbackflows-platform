/**
 * Enterprise Stripe Payment Processing System
 * Fisher Backflows - World-Class Payment Infrastructure
 */

import Stripe from 'stripe';
import { logger } from '@/lib/logger';
import { cache } from '@/lib/cache';
import { 
  PaymentSchema, 
  StripePaymentSchema, 
  RefundSchema,
  validateAndSanitize 
} from '@/lib/validation/schemas';
import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════

const stripeConfig = {
  apiVersion: '2024-12-18' as Stripe.LatestApiVersion,
  typescript: true,
  maxNetworkRetries: 3,
  timeout: 30000,
  telemetry: true
};

// Initialize Stripe with proper error handling
let stripe: Stripe | null = null;
try {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }
  
  if (key.includes('your-') || key === 'sk_test_dummy_key') {
    throw new Error('Invalid Stripe secret key - please configure a real key');
  }
  
  if (key.startsWith('sk_test_')) {
    logger.warn('Stripe running in test mode');
  }
  
  stripe = new Stripe(key, stripeConfig);
  logger.info('Stripe initialized successfully', { 
    mode: key.startsWith('sk_test_') ? 'test' : 'live' 
  });
} catch (error: any) {
  logger.error('Failed to initialize Stripe', { error: error.message });
  // Don't initialize with dummy key - fail hard to prevent issues
  stripe = null;
}

// ═══════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  status: string;
  paymentMethod?: string;
  metadata: Record<string, string>;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  chargeId?: string;
  receiptUrl?: string;
  error?: string;
  errorCode?: string;
  requiresAction?: boolean;
  actionUrl?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  amount?: number;
  status?: string;
  error?: string;
}

export interface CustomerData {
  id?: string;
  email: string;
  name: string;
  phone?: string;
  address?: {
    line1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  metadata?: Record<string, string>;
}

export interface SubscriptionData {
  customerId: string;
  priceId: string;
  quantity?: number;
  trialDays?: number;
  metadata?: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════════════════
// CUSTOMER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

export class StripeCustomerManager {
  /**
   * Create or update a Stripe customer
   */
  static async upsertCustomer(data: CustomerData): Promise<Stripe.Customer> {
    if (!stripe) throw new Error('Stripe not initialized');

    try {
      // Check if customer exists
      let customer: Stripe.Customer | null = null;
      
      if (data.id) {
        // Try to retrieve existing customer
        try {
          customer = await stripe.customers.retrieve(data.id) as Stripe.Customer;
          if (customer.deleted) customer = null;
        } catch (error) {
          logger.warn('Customer not found, creating new', { customerId: data.id });
        }
      }

      if (!customer && data.email) {
        // Search by email
        const customers = await stripe.customers.list({
          email: data.email,
          limit: 1
        });
        if (customers.data.length > 0) {
          customer = customers.data[0];
        }
      }

      if (customer) {
        // Update existing customer
        return await stripe.customers.update(customer.id, {
          email: data.email,
          name: data.name,
          phone: data.phone,
          address: data.address,
          metadata: {
            ...customer.metadata,
            ...data.metadata,
            updated_at: new Date().toISOString()
          }
        });
      } else {
        // Create new customer
        return await stripe.customers.create({
          email: data.email,
          name: data.name,
          phone: data.phone,
          address: data.address,
          metadata: {
            ...data.metadata,
            created_at: new Date().toISOString(),
            source: 'fisher_backflows_platform'
          }
        });
      }
    } catch (error) {
      logger.error('Failed to upsert customer', { error, data });
      throw error;
    }
  }

  /**
   * Get customer payment methods
   */
  static async getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    if (!stripe) throw new Error('Stripe not initialized');

    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });
      return paymentMethods.data;
    } catch (error) {
      logger.error('Failed to get payment methods', { error, customerId });
      return [];
    }
  }

  /**
   * Delete a payment method
   */
  static async deletePaymentMethod(paymentMethodId: string): Promise<boolean> {
    if (!stripe) throw new Error('Stripe not initialized');

    try {
      await stripe.paymentMethods.detach(paymentMethodId);
      return true;
    } catch (error) {
      logger.error('Failed to delete payment method', { error, paymentMethodId });
      return false;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// PAYMENT PROCESSING
// ═══════════════════════════════════════════════════════════════════════

export class StripePaymentProcessor {
  /**
   * Create a payment intent
   */
  static async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    metadata?: Record<string, string>
  ): Promise<PaymentIntent> {
    if (!stripe) throw new Error('Stripe not initialized');

    try {
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        },
        metadata: {
          ...metadata,
          created_at: new Date().toISOString(),
          platform: 'fisher_backflows'
        }
      });

      return {
        id: intent.id,
        clientSecret: intent.client_secret!,
        amount: intent.amount,
        status: intent.status,
        metadata: intent.metadata
      };
    } catch (error) {
      logger.error('Failed to create payment intent', { error, amount });
      throw error;
    }
  }

  /**
   * Process a payment with saved payment method
   */
  static async processPayment(
    customerId: string,
    paymentMethodId: string,
    amount: number,
    invoiceId?: string,
    savePaymentMethod: boolean = false
  ): Promise<PaymentResult> {
    if (!stripe) throw new Error('Stripe not initialized');

    try {
      // Create payment intent
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        customer: customerId,
        payment_method: paymentMethodId,
        off_session: true,
        confirm: true,
        setup_future_usage: savePaymentMethod ? 'off_session' : undefined,
        metadata: {
          invoice_id: invoiceId || '',
          processed_at: new Date().toISOString()
        }
      });

      if (intent.status === 'succeeded') {
        const charge = intent.charges.data[0];
        return {
          success: true,
          paymentId: intent.id,
          chargeId: charge?.id,
          receiptUrl: charge?.receipt_url || undefined
        };
      } else if (intent.status === 'requires_action') {
        return {
          success: false,
          requiresAction: true,
          actionUrl: intent.next_action?.redirect_to_url?.url,
          error: 'Payment requires additional authentication'
        };
      } else {
        return {
          success: false,
          error: `Payment failed with status: ${intent.status}`
        };
      }
    } catch (error: any) {
      logger.error('Payment processing failed', { error, customerId, amount });
      
      // Handle specific Stripe errors
      if (error.type === 'StripeCardError') {
        return {
          success: false,
          error: error.message,
          errorCode: error.code
        };
      }
      
      return {
        success: false,
        error: 'Payment processing failed. Please try again.'
      };
    }
  }

  /**
   * Create a checkout session for online payments
   */
  static async createCheckoutSession(
    customerId: string,
    lineItems: Array<{
      description: string;
      amount: number;
      quantity: number;
    }>,
    successUrl: string,
    cancelUrl: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    if (!stripe) throw new Error('Stripe not initialized');

    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card', 'us_bank_account'],
        line_items: lineItems.map(item => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.description
            },
            unit_amount: Math.round(item.amount * 100)
          },
          quantity: item.quantity
        })),
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          ...metadata,
          created_at: new Date().toISOString()
        },
        payment_intent_data: {
          setup_future_usage: 'off_session'
        },
        customer_update: {
          address: 'auto'
        },
        automatic_tax: {
          enabled: true
        }
      });

      return session.url!;
    } catch (error) {
      logger.error('Failed to create checkout session', { error });
      throw error;
    }
  }

  /**
   * Confirm a payment intent
   */
  static async confirmPayment(
    paymentIntentId: string,
    paymentMethodId?: string
  ): Promise<PaymentResult> {
    if (!stripe) throw new Error('Stripe not initialized');

    try {
      const intent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId
      });

      if (intent.status === 'succeeded') {
        const charge = intent.charges.data[0];
        return {
          success: true,
          paymentId: intent.id,
          chargeId: charge?.id,
          receiptUrl: charge?.receipt_url || undefined
        };
      } else {
        return {
          success: false,
          error: `Payment confirmation failed with status: ${intent.status}`
        };
      }
    } catch (error: any) {
      logger.error('Payment confirmation failed', { error, paymentIntentId });
      return {
        success: false,
        error: error.message || 'Payment confirmation failed'
      };
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// REFUND MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

export class StripeRefundManager {
  /**
   * Process a refund
   */
  static async processRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: string
  ): Promise<RefundResult> {
    if (!stripe) throw new Error('Stripe not initialized');

    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason: reason as Stripe.RefundCreateParams.Reason || 'requested_by_customer',
        metadata: {
          refunded_at: new Date().toISOString(),
          reason: reason || 'Customer request'
        }
      });

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status || 'pending'
      };
    } catch (error: any) {
      logger.error('Refund processing failed', { error, paymentIntentId });
      return {
        success: false,
        error: error.message || 'Refund processing failed'
      };
    }
  }

  /**
   * Get refund status
   */
  static async getRefundStatus(refundId: string): Promise<string | null> {
    if (!stripe) throw new Error('Stripe not initialized');

    try {
      const refund = await stripe.refunds.retrieve(refundId);
      return refund.status || null;
    } catch (error) {
      logger.error('Failed to get refund status', { error, refundId });
      return null;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SUBSCRIPTION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

export class StripeSubscriptionManager {
  /**
   * Create a subscription
   */
  static async createSubscription(data: SubscriptionData): Promise<Stripe.Subscription> {
    if (!stripe) throw new Error('Stripe not initialized');

    try {
      const subscription = await stripe.subscriptions.create({
        customer: data.customerId,
        items: [{
          price: data.priceId,
          quantity: data.quantity || 1
        }],
        trial_period_days: data.trialDays,
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          ...data.metadata,
          created_at: new Date().toISOString()
        }
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to create subscription', { error, data });
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false
  ): Promise<Stripe.Subscription> {
    if (!stripe) throw new Error('Stripe not initialized');

    try {
      if (immediately) {
        return await stripe.subscriptions.cancel(subscriptionId);
      } else {
        return await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true
        });
      }
    } catch (error) {
      logger.error('Failed to cancel subscription', { error, subscriptionId });
      throw error;
    }
  }

  /**
   * Update subscription
   */
  static async updateSubscription(
    subscriptionId: string,
    updates: {
      priceId?: string;
      quantity?: number;
      trialEnd?: number | 'now';
    }
  ): Promise<Stripe.Subscription> {
    if (!stripe) throw new Error('Stripe not initialized');

    try {
      const updateParams: Stripe.SubscriptionUpdateParams = {
        trial_end: updates.trialEnd
      };

      if (updates.priceId || updates.quantity) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const itemId = subscription.items.data[0].id;

        updateParams.items = [{
          id: itemId,
          price: updates.priceId,
          quantity: updates.quantity
        }];
      }

      return await stripe.subscriptions.update(subscriptionId, updateParams);
    } catch (error) {
      logger.error('Failed to update subscription', { error, subscriptionId });
      throw error;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// WEBHOOK HANDLER
// ═══════════════════════════════════════════════════════════════════════

export class StripeWebhookHandler {
  /**
   * Verify webhook signature
   */
  static verifySignature(
    payload: string | Buffer,
    signature: string
  ): Stripe.Event | null {
    if (!stripe) throw new Error('Stripe not initialized');

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error('Stripe webhook secret not configured');
      return null;
    }

    try {
      return stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
    } catch (error) {
      logger.error('Webhook signature verification failed', { error });
      return null;
    }
  }

  /**
   * Handle webhook event
   */
  static async handleEvent(event: Stripe.Event): Promise<void> {
    logger.info('Processing Stripe webhook', { 
      type: event.type, 
      id: event.id 
    });

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
          break;

        case 'charge.refunded':
          await this.handleRefund(event.data.object as Stripe.Charge);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          await this.handleSubscriptionChange(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoicePayment(event.data.object as Stripe.Invoice);
          break;

        case 'checkout.session.completed':
          await this.handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
          break;

        default:
          logger.debug('Unhandled webhook event type', { type: event.type });
      }
    } catch (error) {
      logger.error('Webhook event processing failed', { 
        error, 
        eventType: event.type,
        eventId: event.id 
      });
      throw error;
    }
  }

  private static async handlePaymentSuccess(intent: Stripe.PaymentIntent): Promise<void> {
    // Update database with successful payment
    logger.info('Payment succeeded', { 
      intentId: intent.id, 
      amount: intent.amount 
    });
    
    try {
      const { supabase } = await import('@/lib/supabase');
      
      // Update payment record
      await supabase
        .from('payments')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          transaction_id: intent.id
        })
        .eq('stripe_payment_intent_id', intent.id);
      
      // Update invoice status if linked
      const invoiceId = intent.metadata.invoice_id;
      if (invoiceId) {
        await supabase
          .from('invoices')
          .update({
            status: 'paid',
            paid_date: new Date().toISOString()
          })
          .eq('id', invoiceId);
      }
      
      // Send confirmation email
      const { notificationService } = await import('@/lib/notifications/notification-service');
      await notificationService.sendPaymentConfirmation({
        paymentId: intent.id,
        amount: intent.amount / 100,
        customerId: intent.customer as string
      });
      
    } catch (error) {
      logger.error('Failed to handle payment success', { error, intentId: intent.id });
    }
  }

  private static async handlePaymentFailure(intent: Stripe.PaymentIntent): Promise<void> {
    // Handle failed payment
    logger.warn('Payment failed', { 
      intentId: intent.id, 
      error: intent.last_payment_error 
    });
    
    try {
      const { supabase } = await import('@/lib/supabase');
      
      // Update payment record
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          error_message: intent.last_payment_error?.message || 'Payment failed'
        })
        .eq('stripe_payment_intent_id', intent.id);
      
      // Keep invoice status as unpaid but add note
      const invoiceId = intent.metadata.invoice_id;
      if (invoiceId) {
        await supabase
          .from('invoices')
          .update({
            status: 'payment_failed'
          })
          .eq('id', invoiceId);
      }
      
      // Notify customer of payment failure
      const { notificationService } = await import('@/lib/notifications/notification-service');
      await notificationService.sendPaymentFailureNotification({
        paymentId: intent.id,
        customerId: intent.customer as string,
        error: intent.last_payment_error?.message || 'Payment failed'
      });
      
    } catch (error) {
      logger.error('Failed to handle payment failure', { error, intentId: intent.id });
    }
  }

  private static async handleRefund(charge: Stripe.Charge): Promise<void> {
    // Process refund
    logger.info('Refund processed', { 
      chargeId: charge.id, 
      refundAmount: charge.amount_refunded 
    });
    
    try {
      const { supabase } = await import('@/lib/supabase');
      
      // Update payment record with refund info
      await supabase
        .from('payments')
        .update({
          status: charge.refunded ? 'refunded' : 'partially_refunded',
          notes: `Refunded: $${charge.amount_refunded / 100}`
        })
        .eq('transaction_id', charge.payment_intent);
      
      // Send refund confirmation
      const { notificationService } = await import('@/lib/notifications/notification-service');
      await notificationService.sendRefundConfirmation({
        chargeId: charge.id,
        refundAmount: charge.amount_refunded / 100,
        customerId: charge.customer as string
      });
      
    } catch (error) {
      logger.error('Failed to handle refund', { error, chargeId: charge.id });
    }
  }

  private static async handleSubscriptionChange(subscription: Stripe.Subscription): Promise<void> {
    // Handle subscription changes
    logger.info('Subscription changed', { 
      subscriptionId: subscription.id, 
      status: subscription.status 
    });
    
    try {
      const { supabase } = await import('@/lib/supabase');
      
      // Update customer subscription status
      await supabase
        .from('customers')
        .update({
          subscription_status: subscription.status,
          subscription_id: subscription.id,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_customer_id', subscription.customer);
      
      // Send subscription status update notification
      const { notificationService } = await import('@/lib/notifications/notification-service');
      await notificationService.sendSubscriptionStatusUpdate({
        subscriptionId: subscription.id,
        status: subscription.status,
        customerId: subscription.customer as string
      });
      
    } catch (error) {
      logger.error('Failed to handle subscription change', { error, subscriptionId: subscription.id });
    }
  }

  private static async handleInvoicePayment(invoice: Stripe.Invoice): Promise<void> {
    // Handle invoice payment
    logger.info('Invoice paid', { 
      invoiceId: invoice.id, 
      amount: invoice.amount_paid 
    });
    
    try {
      const { supabase } = await import('@/lib/supabase');
      
      // Update invoice status in database
      await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_date: new Date().toISOString(),
          stripe_invoice_id: invoice.id
        })
        .eq('stripe_invoice_id', invoice.id);
      
      // Send payment confirmation
      const { notificationService } = await import('@/lib/notifications/notification-service');
      await notificationService.sendInvoicePaymentConfirmation({
        invoiceId: invoice.id,
        amount: invoice.amount_paid / 100,
        customerId: invoice.customer as string
      });
      
    } catch (error) {
      logger.error('Failed to handle invoice payment', { error, invoiceId: invoice.id });
    }
  }

  private static async handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
    // Handle completed checkout
    logger.info('Checkout completed', { 
      sessionId: session.id, 
      customerId: session.customer 
    });
    
    try {
      const { supabase } = await import('@/lib/supabase');
      
      // Update order/payment status
      await supabase
        .from('payments')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          stripe_session_id: session.id
        })
        .eq('stripe_session_id', session.id);
      
      // Send checkout completion confirmation
      const { notificationService } = await import('@/lib/notifications/notification-service');
      await notificationService.sendCheckoutConfirmation({
        sessionId: session.id,
        customerId: session.customer as string,
        amountTotal: session.amount_total ? session.amount_total / 100 : 0
      });
      
    } catch (error) {
      logger.error('Failed to handle checkout completion', { error, sessionId: session.id });
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// REPORTING & ANALYTICS
// ═══════════════════════════════════════════════════════════════════════

export class StripeReporting {
  /**
   * Get payment analytics
   */
  static async getPaymentAnalytics(
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    if (!stripe) throw new Error('Stripe not initialized');

    try {
      const charges = await stripe.charges.list({
        created: {
          gte: Math.floor(startDate.getTime() / 1000),
          lte: Math.floor(endDate.getTime() / 1000)
        },
        limit: 100
      });

      const analytics = {
        totalRevenue: 0,
        totalRefunds: 0,
        transactionCount: 0,
        averageTransaction: 0,
        successRate: 0,
        byPaymentMethod: {} as Record<string, number>,
        byStatus: {} as Record<string, number>
      };

      charges.data.forEach(charge => {
        analytics.transactionCount++;
        
        if (charge.paid) {
          analytics.totalRevenue += charge.amount;
        }
        
        analytics.totalRefunds += charge.amount_refunded;
        
        const method = charge.payment_method_details?.type || 'unknown';
        analytics.byPaymentMethod[method] = (analytics.byPaymentMethod[method] || 0) + 1;
        
        const status = charge.status;
        analytics.byStatus[status] = (analytics.byStatus[status] || 0) + 1;
      });

      analytics.averageTransaction = analytics.totalRevenue / analytics.transactionCount;
      analytics.successRate = (analytics.byStatus['succeeded'] || 0) / analytics.transactionCount * 100;
      analytics.totalRevenue = analytics.totalRevenue / 100; // Convert from cents
      analytics.totalRefunds = analytics.totalRefunds / 100;
      analytics.averageTransaction = analytics.averageTransaction / 100;

      return analytics;
    } catch (error) {
      logger.error('Failed to get payment analytics', { error });
      throw error;
    }
  }

  /**
   * Get customer lifetime value
   */
  static async getCustomerLifetimeValue(customerId: string): Promise<number> {
    if (!stripe) throw new Error('Stripe not initialized');

    try {
      const charges = await stripe.charges.list({
        customer: customerId,
        limit: 100
      });

      const totalValue = charges.data
        .filter(charge => charge.paid)
        .reduce((sum, charge) => sum + (charge.amount - charge.amount_refunded), 0);

      return totalValue / 100; // Convert from cents
    } catch (error) {
      logger.error('Failed to get customer lifetime value', { error, customerId });
      return 0;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Format amount for display
 */
export function formatAmount(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

/**
 * Calculate processing fee
 */
export function calculateProcessingFee(
  amount: number,
  isACH: boolean = false
): number {
  if (isACH) {
    // ACH: 0.8% capped at $5
    return Math.min(amount * 0.008, 5);
  } else {
    // Card: 2.9% + $0.30
    return amount * 0.029 + 0.30;
  }
}

/**
 * Validate card number (Luhn algorithm)
 */
export function validateCardNumber(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Get card brand from number
 */
export function getCardBrand(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '');
  
  if (/^4/.test(digits)) return 'Visa';
  if (/^5[1-5]/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'American Express';
  if (/^6(?:011|5)/.test(digits)) return 'Discover';
  
  return 'Unknown';
}

// ═══════════════════════════════════════════════════════════════════════
// EXPORT DEFAULT PAYMENT SERVICE
// ═══════════════════════════════════════════════════════════════════════

export default {
  isInitialized: () => stripe !== null,
  customer: StripeCustomerManager,
  payment: StripePaymentProcessor,
  refund: StripeRefundManager,
  subscription: StripeSubscriptionManager,
  webhook: StripeWebhookHandler,
  reporting: StripeReporting,
  utils: {
    formatAmount,
    calculateProcessingFee,
    validateCardNumber,
    getCardBrand
  }
};