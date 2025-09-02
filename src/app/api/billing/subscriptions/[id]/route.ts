import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/lib/auth';

// Lazy load Stripe to avoid build-time environment variable issues
const getStripe = async () => {
  const Stripe = (await import('stripe')).default;
  
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });
};

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET - Get specific subscription details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: subscriptionId } = await params;
    const user = await auth.getApiUser(request);
    
    if (!user || !['admin', 'technician'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseAdmin || createRouteHandlerClient(request);
    
    // Get subscription from database
    const { data: subscription, error } = await supabase
      .from('billing_subscriptions')
      .select(`
        *,
        customer:customers(
          first_name, last_name, email, phone,
          address_line1, city, state, zip_code
        )
      `)
      .eq('id', subscriptionId)
      .single();

    if (error || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Get latest data from Stripe
    const stripe = await getStripe();
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id,
      {
        expand: ['items.data.price.product', 'latest_invoice', 'customer']
      }
    );

    return NextResponse.json({
      success: true,
      subscription: {
        ...subscription,
        stripe_data: stripeSubscription
      }
    });

  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

// PUT - Update subscription
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: subscriptionId } = await params;
    const user = await auth.getApiUser(request);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      billing_cycle,
      device_ids,
      pause = false,
      resume = false,
      update_payment_method = false
    } = body;

    const supabase = supabaseAdmin || createRouteHandlerClient(request);
    
    // Get current subscription
    const { data: subscription, error: fetchError } = await supabase
      .from('billing_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (fetchError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    const stripe = await getStripe();

    // Handle pause/resume
    if (pause) {
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        pause_collection: {
          behavior: 'void'
        }
      });

      await supabase
        .from('billing_subscriptions')
        .update({ 
          status: 'paused',
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      return NextResponse.json({
        success: true,
        message: 'Subscription paused successfully'
      });
    }

    if (resume) {
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        pause_collection: ''  // Resume by removing pause
      });

      await supabase
        .from('billing_subscriptions')
        .update({ 
          status: 'active',
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      return NextResponse.json({
        success: true,
        message: 'Subscription resumed successfully'
      });
    }

    // Handle device count changes
    if (device_ids && Array.isArray(device_ids)) {
      const newDeviceCount = device_ids.length;
      const currentDeviceCount = subscription.device_ids ? subscription.device_ids.length : 1;

      if (newDeviceCount !== currentDeviceCount) {
        // Calculate new pricing
        const basePrice = subscription.amount_per_period / (currentDeviceCount || 1);
        const newAmount = basePrice * newDeviceCount;

        // Update subscription in Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
        
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          items: [{
            id: stripeSubscription.items.data[0].id,
            quantity: newDeviceCount
          }],
          metadata: {
            ...stripeSubscription.metadata,
            device_count: newDeviceCount.toString(),
            device_ids: device_ids.join(',')
          }
        });

        // Update database
        await supabase
          .from('billing_subscriptions')
          .update({
            device_ids: device_ids,
            amount_per_period: newAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', subscriptionId);
      }
    }

    // Handle billing cycle changes
    if (billing_cycle && billing_cycle !== subscription.billing_cycle) {
      // Note: Changing billing cycles in Stripe requires creating a new subscription
      // For now, we'll just update our records and recommend manual handling
      await supabase
        .from('billing_subscriptions')
        .update({
          billing_cycle: billing_cycle,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      return NextResponse.json({
        success: true,
        message: 'Billing cycle updated. Note: Changes will take effect on next billing period.',
        warning: 'Billing cycle changes require manual intervention in Stripe dashboard.'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription updated successfully'
    });

  } catch (error) {
    console.error('Update subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Cancel subscription
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: subscriptionId } = await params;
    const user = await auth.getApiUser(request);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const cancelImmediately = searchParams.get('immediate') === 'true';

    const supabase = supabaseAdmin || createRouteHandlerClient(request);
    
    // Get subscription
    const { data: subscription, error: fetchError } = await supabase
      .from('billing_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (fetchError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    const stripe = await getStripe();

    if (cancelImmediately) {
      // Cancel immediately
      await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
      
      await supabase
        .from('billing_subscriptions')
        .update({ 
          status: 'canceled',
          is_active: false,
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      return NextResponse.json({
        success: true,
        message: 'Subscription canceled immediately'
      });
    } else {
      // Cancel at period end
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true
      });

      await supabase
        .from('billing_subscriptions')
        .update({ 
          status: 'cancel_at_period_end',
          cancel_at_period_end: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      return NextResponse.json({
        success: true,
        message: 'Subscription will cancel at the end of current billing period',
        cancel_date: subscription.current_period_end
      });
    }

  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription: ' + (error as Error).message },
      { status: 500 }
    );
  }
}