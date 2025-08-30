import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail, emailTemplates } from '@/lib/email';
import { logger } from '@/lib/logger';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18',
}) : null;

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!stripe || !endpointSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    logger.error('Missing Stripe signature');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err) {
    logger.error('Webhook signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  logger.info('Stripe webhook received', { type: event.type });

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer);
        break;
      
      default:
        logger.info('Unhandled webhook event type', { type: event.type });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Webhook processing failed', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  if (!supabaseAdmin) return;

  try {
    // Find the invoice by Stripe payment intent ID
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .single();

    if (invoiceError || !invoice) {
      logger.error('Invoice not found for payment intent', paymentIntent.id);
      return;
    }

    // Record the payment
    const { error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        invoice_id: invoice.id,
        customer_id: invoice.customer_id,
        amount: paymentIntent.amount / 100, // Convert cents to dollars
        payment_method: 'card',
        stripe_payment_id: paymentIntent.id,
        status: 'completed'
      });

    if (paymentError) {
      logger.error('Failed to record payment', paymentError);
      return;
    }

    // Update invoice status
    const { error: updateError } = await supabaseAdmin
      .from('invoices')
      .update({
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0],
        balance_due: 0
      })
      .eq('id', invoice.id);

    if (updateError) {
      logger.error('Failed to update invoice', updateError);
      return;
    }

    // Send payment confirmation email
    const customer = invoice.customer as any;
    const template = emailTemplates.paymentReceived(
      customer.name, 
      `$${(paymentIntent.amount / 100).toFixed(2)}`
    );

    await sendEmail({
      to: customer.email,
      subject: template.subject,
      html: template.html
    });

    logger.info('Payment processed successfully', {
      invoiceId: invoice.id,
      customerId: customer.id,
      amount: paymentIntent.amount / 100
    });

  } catch (error) {
    logger.error('Error handling payment succeeded', error);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  if (!supabaseAdmin) return;

  try {
    // Find the invoice
    const { data: invoice } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .single();

    if (!invoice) return;

    // Record failed payment attempt
    await supabaseAdmin
      .from('payments')
      .insert({
        invoice_id: invoice.id,
        customer_id: invoice.customer_id,
        amount: paymentIntent.amount / 100,
        payment_method: 'card',
        stripe_payment_id: paymentIntent.id,
        status: 'failed'
      });

    // Send payment failure notification
    const customer = invoice.customer as any;
    await sendEmail({
      to: customer.email,
      subject: 'Payment Failed - Fisher Backflows',
      html: `
        <h2>Payment Failed</h2>
        <p>Hi ${customer.name},</p>
        <p>Your payment for invoice ${invoice.invoice_number} could not be processed.</p>
        <p>Please try again or contact us for assistance.</p>
        <p>Amount: $${(paymentIntent.amount / 100).toFixed(2)}</p>
        <p>Thank you,<br>Fisher Backflows Team</p>
      `
    });

    logger.info('Payment failure processed', {
      invoiceId: invoice.id,
      amount: paymentIntent.amount / 100
    });

  } catch (error) {
    logger.error('Error handling payment failed', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Handle Stripe-generated invoice payments if using Stripe invoicing
  logger.info('Stripe invoice payment succeeded', { invoiceId: invoice.id });
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  // Sync Stripe customer with local database if needed
  logger.info('Stripe customer created', { customerId: customer.id });
}