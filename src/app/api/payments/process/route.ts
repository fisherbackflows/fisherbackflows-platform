import { NextRequest, NextResponse } from 'next/server';
import StripeService from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const PaymentRequestSchema = z.object({
  amount: z.number().positive(),
  customerId: z.string().uuid(),
  invoiceId: z.string().uuid().optional(),
  paymentMethodId: z.string().optional(),
  savePaymentMethod: z.boolean().default(false),
  description: z.string().optional(),
  metadata: z.record(z.string()).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = PaymentRequestSchema.parse(body);

    // Get customer from database
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', validatedData.customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Create or get Stripe customer
    let stripeCustomer;
    if (customer.stripe_customer_id) {
      // Existing Stripe customer
      stripeCustomer = { id: customer.stripe_customer_id };
    } else {
      // Create new Stripe customer
      stripeCustomer = await StripeService.customer.upsertCustomer({
        email: customer.email,
        name: `${customer.first_name} ${customer.last_name}`,
        phone: customer.phone,
        address: customer.address ? {
          line1: customer.address.street,
          city: customer.address.city,
          state: customer.address.state,
          postal_code: customer.address.zip,
          country: 'US'
        } : undefined,
        metadata: {
          customer_id: customer.id,
          company: customer.company_name || ''
        }
      });

      // Save Stripe customer ID
      await supabase
        .from('customers')
        .update({ stripe_customer_id: stripeCustomer.id })
        .eq('id', customer.id);
    }

    // Create payment record in database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        customer_id: validatedData.customerId,
        invoice_id: validatedData.invoiceId,
        amount: validatedData.amount,
        status: 'pending',
        description: validatedData.description || `Payment from ${customer.first_name} ${customer.last_name}`,
        metadata: validatedData.metadata
      })
      .select()
      .single();

    if (paymentError || !payment) {
      logger.error('Failed to create payment record', { error: paymentError });
      return NextResponse.json(
        { error: 'Failed to create payment record' },
        { status: 500 }
      );
    }

    // Process payment based on method
    let result;
    if (validatedData.paymentMethodId) {
      // Process with saved payment method
      result = await StripeService.payment.processPayment(
        stripeCustomer.id,
        validatedData.paymentMethodId,
        validatedData.amount,
        payment.id,
        validatedData.savePaymentMethod
      );
    } else {
      // Create payment intent for new payment method
      const intent = await StripeService.payment.createPaymentIntent(
        validatedData.amount,
        'usd',
        {
          payment_id: payment.id,
          customer_id: customer.id,
          invoice_id: validatedData.invoiceId || ''
        }
      );

      // Update payment with intent ID
      await supabase
        .from('payments')
        .update({ 
          stripe_payment_intent_id: intent.id,
          client_secret: intent.clientSecret
        })
        .eq('id', payment.id);

      return NextResponse.json({
        success: true,
        paymentId: payment.id,
        clientSecret: intent.clientSecret,
        amount: validatedData.amount,
        requiresPaymentMethod: true
      });
    }

    // Update payment status based on result
    if (result.success) {
      await supabase
        .from('payments')
        .update({
          status: 'completed',
          transaction_id: result.paymentId,
          receipt_url: result.receiptUrl,
          processed_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      // Update invoice if linked
      if (validatedData.invoiceId) {
        await supabase
          .from('invoices')
          .update({
            status: 'paid',
            paid_date: new Date().toISOString()
          })
          .eq('id', validatedData.invoiceId);
      }

      // Send confirmation email
      try {
        const { sendPaymentConfirmation } = await import('@/lib/email-templates');
        await sendPaymentConfirmation({
          to: customer.email,
          customerName: `${customer.first_name} ${customer.last_name}`,
          amount: validatedData.amount,
          paymentId: payment.id,
          receiptUrl: result.receiptUrl
        });
      } catch (emailError) {
        logger.error('Failed to send payment confirmation email', { error: emailError });
      }

      return NextResponse.json({
        success: true,
        paymentId: payment.id,
        transactionId: result.paymentId,
        receiptUrl: result.receiptUrl,
        amount: validatedData.amount
      });
    } else {
      // Payment failed or requires action
      await supabase
        .from('payments')
        .update({
          status: result.requiresAction ? 'requires_action' : 'failed',
          error_message: result.error
        })
        .eq('id', payment.id);

      return NextResponse.json({
        success: false,
        paymentId: payment.id,
        error: result.error,
        requiresAction: result.requiresAction,
        actionUrl: result.actionUrl
      }, { status: result.requiresAction ? 200 : 400 });
    }

  } catch (error) {
    logger.error('Payment processing error', { error });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid payment data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}

// Get payment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID required' },
        { status: 400 }
      );
    }

    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        *,
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          company_name
        ),
        invoice:invoices(
          id,
          invoice_number,
          total_amount
        )
      `)
      .eq('id', paymentId)
      .single();

    if (error || !payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payment
    });

  } catch (error) {
    logger.error('Error fetching payment status', { error });
    return NextResponse.json(
      { error: 'Failed to fetch payment status' },
      { status: 500 }
    );
  }
}