import { NextRequest, NextResponse } from 'next/server';
import StripeService from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const CheckoutRequestSchema = z.object({
  customerId: z.string().uuid(),
  items: z.array(z.object({
    description: z.string(),
    amount: z.number().positive(),
    quantity: z.number().int().positive().default(1)
  })).min(1),
  invoiceId: z.string().uuid().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CheckoutRequestSchema.parse(body);

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
    let stripeCustomerId = customer.stripe_customer_id;
    if (!stripeCustomerId) {
      const stripeCustomer = await StripeService.customer.upsertCustomer({
        email: customer.email,
        name: `${customer.first_name} ${customer.last_name}`,
        phone: customer.phone,
        metadata: {
          customer_id: customer.id,
          company: customer.company_name || ''
        }
      });
      
      stripeCustomerId = stripeCustomer.id;
      
      // Save Stripe customer ID
      await supabase
        .from('customers')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', customer.id);
    }

    // Calculate total amount
    const totalAmount = validatedData.items.reduce(
      (sum, item) => sum + (item.amount * item.quantity), 
      0
    );

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        customer_id: validatedData.customerId,
        invoice_id: validatedData.invoiceId,
        amount: totalAmount,
        status: 'pending',
        description: `Checkout for ${customer.first_name} ${customer.last_name}`,
        metadata: {
          items: validatedData.items,
          checkout_session: true
        }
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

    // Get base URL for success/cancel redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`;
    
    // Create Stripe checkout session
    const checkoutUrl = await StripeService.payment.createCheckoutSession(
      stripeCustomerId,
      validatedData.items,
      validatedData.successUrl || `${baseUrl}/portal/payment-success?payment_id=${payment.id}`,
      validatedData.cancelUrl || `${baseUrl}/portal/payment-cancelled?payment_id=${payment.id}`,
      {
        payment_id: payment.id,
        customer_id: customer.id,
        invoice_id: validatedData.invoiceId || ''
      }
    );

    // Update payment with checkout session URL
    await supabase
      .from('payments')
      .update({ 
        checkout_url: checkoutUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id);

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      checkoutUrl,
      amount: totalAmount
    });

  } catch (error) {
    logger.error('Checkout session creation error', { error });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid checkout data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}