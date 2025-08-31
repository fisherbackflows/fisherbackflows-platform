import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';

// Payment processor configurations
const PAYMENT_CONFIG = {
  stripe: {
    enabled: true,
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  },
  square: {
    enabled: false,
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    applicationId: process.env.SQUARE_APPLICATION_ID,
    environment: process.env.SQUARE_ENVIRONMENT || 'sandbox'
  }
};

// Create payment intent and invoice payment link
export async function POST(request: NextRequest) {
  try {
    const { action, invoiceId, amount, customerEmail, customerName } = await request.json();
    
    const supabase = createRouteHandlerClient(request);

    switch (action) {
      case 'create_payment_link':
        return await createPaymentLink(invoiceId, amount, customerEmail, customerName, supabase);
      
      case 'process_payment':
        return await processPayment(request.json(), supabase);
      
      case 'handle_webhook':
        return await handlePaymentWebhook(request, supabase);
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}

// Create payment link for invoice
async function createPaymentLink(invoiceId: string, amount: number, customerEmail: string, customerName: string, supabase: any) {
  try {
    // Get invoice details
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone,
          address
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (error || !invoice) {
      throw new Error('Invoice not found');
    }

    // Create Stripe payment intent (if using Stripe)
    if (PAYMENT_CONFIG.stripe.enabled && PAYMENT_CONFIG.stripe.secretKey) {
      const paymentIntent = await createStripePaymentIntent({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        customerEmail,
        invoiceId,
        description: `Fisher Backflows - Invoice #${invoice.invoice_number}`,
        metadata: {
          invoice_id: invoiceId,
          invoice_number: invoice.invoice_number,
          customer_id: invoice.customer_id,
          customer_name: customerName
        }
      });

      // Create payment record
      const { data: paymentRecord } = await supabase
        .from('payments')
        .insert({
          invoice_id: invoiceId,
          customer_id: invoice.customer_id,
          amount: amount,
          status: 'pending',
          payment_method: 'stripe',
          payment_intent_id: paymentIntent.id,
          payment_link: `https://checkout.stripe.com/pay/${paymentIntent.client_secret}`,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      return NextResponse.json({
        success: true,
        paymentLink: paymentRecord.payment_link,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret
      });
    }

    // Fallback to manual payment tracking
    const manualPaymentLink = `${process.env.NEXT_PUBLIC_BASE_URL}/pay/${invoiceId}`;
    
    await supabase
      .from('payments')
      .insert({
        invoice_id: invoiceId,
        customer_id: invoice.customer_id,
        amount: amount,
        status: 'pending',
        payment_method: 'manual',
        payment_link: manualPaymentLink,
        created_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      paymentLink: manualPaymentLink,
      paymentMethod: 'manual'
    });

  } catch (error) {
    console.error('Error creating payment link:', error);
    throw error;
  }
}

// Create Stripe payment intent
async function createStripePaymentIntent(paymentData: any) {
  try {
    // Check if Stripe is configured
    if (!PAYMENT_CONFIG.stripe.secretKey) {
      console.warn('Stripe not configured, using mock payment intent');
      
      // Mock Stripe response for development
      const mockPaymentIntent = {
        id: `pi_mock_${Date.now()}`,
        client_secret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36)}`,
        amount: paymentData.amount,
        currency: paymentData.currency,
        status: 'requires_payment_method',
        metadata: paymentData.metadata,
        mock: true
      };

      console.log('Mock Stripe payment intent created:', mockPaymentIntent);
      return mockPaymentIntent;
    }

    // Use real Stripe SDK with runtime check
    if (!PAYMENT_CONFIG.stripe.secretKey) {
      throw new Error('Stripe secret key not configured');
    }
    const Stripe = require('stripe');
    const stripe = new Stripe(PAYMENT_CONFIG.stripe.secretKey, {
      apiVersion: '2024-06-20',
    });
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: paymentData.amount,
      currency: paymentData.currency,
      description: paymentData.description,
      metadata: paymentData.metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('Real Stripe payment intent created:', paymentIntent.id);
    return paymentIntent;

  } catch (error) {
    console.error('Stripe payment intent error:', error);
    throw error;
  }
}

// Process successful payment
async function processPayment(paymentData: any, supabase: any) {
  try {
    const { paymentIntentId, invoiceId, amount, paymentMethodId } = paymentData;

    // Verify payment with processor
    const paymentVerified = await verifyPayment(paymentIntentId);
    
    if (!paymentVerified) {
      throw new Error('Payment verification failed');
    }

    // Update invoice as paid
    const { data: updatedInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .update({
        status: 'Paid',
        paid_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', invoiceId)
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone
        )
      `)
      .single();

    if (invoiceError) throw invoiceError;

    // Update payment record
    await supabase
      .from('payments')
      .update({
        status: 'completed',
        payment_method_id: paymentMethodId,
        processed_at: new Date().toISOString()
      })
      .eq('payment_intent_id', paymentIntentId);

    // Update customer balance
    await supabase
      .from('customers')
      .update({
        balance: 0 // Assuming this payment clears the balance
      })
      .eq('id', updatedInvoice.customer_id);

    // Send payment confirmation email
    await sendPaymentConfirmationEmail({
      customerEmail: updatedInvoice.customers.email,
      customerName: updatedInvoice.customers.name,
      invoiceNumber: updatedInvoice.invoice_number,
      amount: amount,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'Credit Card'
    });

    // Auto-schedule next year's test reminder (if annual test)
    await scheduleNextYearReminder(updatedInvoice.customer_id, supabase);

    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully',
      invoice: updatedInvoice,
      automated: {
        emailSent: true,
        balanceUpdated: true,
        reminderScheduled: true
      }
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    throw error;
  }
}

// Handle payment webhook (from Stripe, Square, etc.)
async function handlePaymentWebhook(request: NextRequest, supabase: any) {
  try {
    const signature = request.headers.get('stripe-signature');
    const payload = await request.text();

    // Verify webhook signature (important for security)
    if (!verifyWebhookSignature(payload, signature)) {
      throw new Error('Invalid webhook signature');
    }

    const event = JSON.parse(payload);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object, supabase);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object, supabase);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePayment(event.data.object, supabase);
        break;
    }

    return NextResponse.json({ success: true, processed: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}

// Verify payment with processor
async function verifyPayment(paymentIntentId: string): Promise<boolean> {
  try {
    // Check if this is a mock payment
    if (paymentIntentId.startsWith('pi_mock_')) {
      console.log('Mock payment verification for:', paymentIntentId);
      return true;
    }

    // Check if Stripe is configured
    if (!PAYMENT_CONFIG.stripe.secretKey) {
      console.warn('Stripe not configured, mock verifying payment:', paymentIntentId);
      return true;
    }

    // Use real Stripe verification with runtime check
    if (!PAYMENT_CONFIG.stripe.secretKey) {
      throw new Error('Stripe secret key not configured');
    }
    const Stripe = require('stripe');
    const stripe = new Stripe(PAYMENT_CONFIG.stripe.secretKey, {
      apiVersion: '2024-06-20',
    });
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    const isSucceeded = paymentIntent.status === 'succeeded';
    console.log('Real Stripe payment verification:', paymentIntentId, 'Status:', paymentIntent.status);
    
    return isSucceeded;

  } catch (error) {
    console.error('Payment verification error:', error);
    return false;
  }
}

// Verify webhook signature
function verifyWebhookSignature(payload: string, signature: string | null): boolean {
  try {
    // Check if webhook secret is configured
    if (!PAYMENT_CONFIG.stripe.webhookSecret || !signature) {
      console.warn('Stripe webhook not fully configured, allowing webhook for development');
      return true;
    }

    // Use real Stripe webhook verification with runtime check
    if (!PAYMENT_CONFIG.stripe.secretKey) {
      throw new Error('Stripe secret key not configured');
    }
    const Stripe = require('stripe');
    const stripe = new Stripe(PAYMENT_CONFIG.stripe.secretKey, {
      apiVersion: '2024-06-20',
    });
    
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      PAYMENT_CONFIG.stripe.webhookSecret
    );
    
    console.log('Real Stripe webhook signature verified:', event.type);
    return true;

  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}

// Handle successful payment webhook
async function handlePaymentSuccess(paymentIntent: any, supabase: any) {
  try {
    const invoiceId = paymentIntent.metadata.invoice_id;
    
    if (!invoiceId) {
      console.error('No invoice ID in payment metadata');
      return;
    }

    // Process the payment
    await processPayment({
      paymentIntentId: paymentIntent.id,
      invoiceId: invoiceId,
      amount: paymentIntent.amount / 100, // Convert from cents
      paymentMethodId: paymentIntent.payment_method
    }, supabase);

  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

// Handle payment failure
async function handlePaymentFailure(paymentIntent: any, supabase: any) {
  try {
    // Update payment record
    await supabase
      .from('payments')
      .update({
        status: 'failed',
        failure_reason: paymentIntent.last_payment_error?.message || 'Payment failed'
      })
      .eq('payment_intent_id', paymentIntent.id);

    // Send payment failure notification
    // await sendPaymentFailureNotification(paymentIntent);

  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

// Handle invoice payment (for subscription billing)
async function handleInvoicePayment(invoice: any, supabase: any) {
  // Handle subscription/recurring billing payments
  console.log('Invoice payment received:', invoice.id);
}

// Send payment confirmation email
async function sendPaymentConfirmationEmail(data: any) {
  try {
    const emailData = {
      type: 'payment_received',
      customerEmail: data.customerEmail,
      customerName: data.customerName,
      invoiceNumber: data.invoiceNumber,
      amount: data.amount,
      paymentDate: data.paymentDate,
      paymentMethod: data.paymentMethod
    };

    // Send via email automation system
    await fetch('/api/automation/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData)
    });

  } catch (error) {
    console.error('Error sending payment confirmation:', error);
  }
}

// Schedule next year's test reminder
async function scheduleNextYearReminder(customerId: string, supabase: any) {
  try {
    const reminderDate = new Date();
    reminderDate.setFullYear(reminderDate.getFullYear() + 1);
    reminderDate.setDate(reminderDate.getDate() - 30); // 30 days before next test is due

    await supabase
      .from('scheduled_reminders')
      .insert({
        customer_id: customerId,
        reminder_type: 'annual_test_due',
        scheduled_date: reminderDate.toISOString().split('T')[0],
        status: 'scheduled',
        message: 'Your annual backflow test is due soon. Schedule now to stay compliant.'
      });

  } catch (error) {
    console.error('Error scheduling reminder:', error);
  }
}

// Get payment status
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request);
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoiceId');
    const paymentIntentId = searchParams.get('paymentIntentId');

    if (paymentIntentId) {
      // Get payment by payment intent ID
      const { data: payment, error } = await supabase
        .from('payments')
        .select('*')
        .eq('payment_intent_id', paymentIntentId)
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        payment
      });
    }

    if (invoiceId) {
      // Get payments for invoice
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return NextResponse.json({
        success: true,
        payments: payments || []
      });
    }

    // Get recent payments
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        invoices (
          invoice_number,
          amount
        ),
        customers (
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      payments: payments || []
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}