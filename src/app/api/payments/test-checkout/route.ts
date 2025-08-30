import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, description, successUrl, cancelUrl } = body;

    // Create Stripe checkout session directly
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: description || 'Fisher Backflows Invoice Payment',
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/portal/payment-success`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/portal/payment-cancelled`,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id
    });

  } catch (error: any) {
    console.error('Test checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}