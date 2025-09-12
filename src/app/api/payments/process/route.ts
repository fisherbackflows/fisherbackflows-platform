import { NextRequest, NextResponse } from 'next/server';
import StripeService from '@/lib/stripe';
import { createRouteHandlerClient } from '@/lib/supabase';
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
    const supabase = createRouteHandlerClient(request);
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

    // For now, we'll create a temporary Stripe customer (no DB storage until we add the column)
    const stripeCustomer = await StripeService.customer.upsertCustomer({
      email: customer.email,
      name: `${customer.first_name} ${customer.last_name}`,
      phone: customer.phone,
      address: {
        line1: customer.address_line1 || '',
        line2: customer.address_line2 || '',
        city: customer.city || '',
        state: customer.state || '',
        postal_code: customer.zip_code || '',
        country: 'US'
      },
      metadata: {
        customer_id: customer.id,
        company: customer.company_name || ''
      }
    });

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
        // Get current invoice to calculate new balance
        const { data: invoice } = await supabase
          .from('invoices')
          .select('amount_paid, balance_due, total_amount')
          .eq('id', validatedData.invoiceId)
          .single();
        
        if (invoice) {
          const newAmountPaid = (invoice.amount_paid || 0) + validatedData.amount;
          const newBalanceDue = invoice.total_amount - newAmountPaid;
          const isPaid = newBalanceDue <= 0;
          
          await supabase
            .from('invoices')
            .update({
              status: isPaid ? 'paid' : 'draft',
              amount_paid: newAmountPaid,
              balance_due: Math.max(0, newBalanceDue),
              paid_date: isPaid ? new Date().toISOString() : null
            })
            .eq('id', validatedData.invoiceId);
            
          console.log(`✅ Invoice ${validatedData.invoiceId} updated: $${newAmountPaid} paid, $${newBalanceDue} balance`);
        }
      }

      // Send confirmation email
      try {
        const { sendEmail, emailTemplates } = await import('@/lib/email');
        const customerName = `${customer.first_name} ${customer.last_name}`;
        const emailTemplate = emailTemplates.paymentReceived(customerName, `$${validatedData.amount.toFixed(2)}`);
        
        await sendEmail({
          to: customer.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html
        });
        
        console.log('✅ Payment confirmation email sent to:', customer.email);
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