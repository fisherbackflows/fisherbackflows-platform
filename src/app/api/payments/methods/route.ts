import { NextRequest, NextResponse } from 'next/server';
import StripeService from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// Get customer's saved payment methods
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID required' },
        { status: 400 }
      );
    }

    // Get customer from database
    const { data: customer, error } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', customerId)
      .single();

    if (error || !customer || !customer.stripe_customer_id) {
      return NextResponse.json({
        success: true,
        paymentMethods: []
      });
    }

    // Get payment methods from Stripe
    const paymentMethods = await StripeService.customer.getPaymentMethods(
      customer.stripe_customer_id
    );

    // Format payment methods for frontend
    const formattedMethods = paymentMethods.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: pm.card ? {
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year
      } : null,
      created: pm.created,
      isDefault: pm.metadata?.default === 'true'
    }));

    return NextResponse.json({
      success: true,
      paymentMethods: formattedMethods
    });

  } catch (error) {
    logger.error('Error fetching payment methods', { error });
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}

// Add a new payment method
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, paymentMethodId, setAsDefault } = body;

    if (!customerId || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Customer ID and payment method ID required' },
        { status: 400 }
      );
    }

    // Get customer from database
    const { data: customer, error } = await supabase
      .from('customers')
      .select('stripe_customer_id, email, first_name, last_name')
      .eq('id', customerId)
      .single();

    if (error || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Create Stripe customer if doesn't exist
    let stripeCustomerId = customer.stripe_customer_id;
    if (!stripeCustomerId) {
      const stripeCustomer = await StripeService.customer.upsertCustomer({
        email: customer.email,
        name: `${customer.first_name} ${customer.last_name}`,
        metadata: { customer_id: customerId }
      });
      
      stripeCustomerId = stripeCustomer.id;
      
      // Save Stripe customer ID
      await supabase
        .from('customers')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', customerId);
    }

    // Attach payment method to customer in Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }
    
    const stripe = (await import('stripe')).default(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });
    
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId
    });

    // Set as default if requested
    if (setAsDefault) {
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment method added successfully'
    });

  } catch (error: any) {
    logger.error('Error adding payment method', { error });
    return NextResponse.json(
      { error: error.message || 'Failed to add payment method' },
      { status: 500 }
    );
  }
}

// Delete a payment method
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get('paymentMethodId');

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID required' },
        { status: 400 }
      );
    }

    const success = await StripeService.customer.deletePaymentMethod(paymentMethodId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Payment method removed successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to remove payment method' },
        { status: 500 }
      );
    }

  } catch (error) {
    logger.error('Error deleting payment method', { error });
    return NextResponse.json(
      { error: 'Failed to delete payment method' },
      { status: 500 }
    );
  }
}