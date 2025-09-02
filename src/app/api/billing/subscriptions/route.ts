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

// GET - List customer subscriptions
export async function GET(request: NextRequest) {
  try {
    const user = await auth.getApiUser(request);
    if (!user || !['admin', 'technician'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    const supabase = supabaseAdmin || createRouteHandlerClient(request);

    if (customerId) {
      // Get subscriptions for specific customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('stripe_customer_id')
        .eq('id', customerId)
        .single();

      if (customerError || !customer?.stripe_customer_id) {
        return NextResponse.json({
          success: true,
          subscriptions: []
        });
      }

      const stripe = await getStripe();
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.stripe_customer_id,
        status: 'all',
        expand: ['data.items.data.price.product']
      });

      return NextResponse.json({
        success: true,
        subscriptions: subscriptions.data
      });
    } else {
      // Get all active subscriptions from database
      const { data: subscriptions, error } = await supabase
        .from('billing_subscriptions')
        .select(`
          *,
          customer:customers(
            first_name, last_name, email, phone,
            address_line1, city, state, zip_code
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching subscriptions:', error);
        return NextResponse.json(
          { error: 'Failed to fetch subscriptions' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        subscriptions: subscriptions || []
      });
    }

  } catch (error) {
    console.error('Subscriptions API error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

// POST - Create new subscription
export async function POST(request: NextRequest) {
  try {
    const user = await auth.getApiUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      customerId, 
      serviceType = 'annual_testing',
      billingCycle = 'yearly',
      deviceIds = [],
      startDate,
      customPrice
    } = body;

    // Validate required fields
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin || createRouteHandlerClient(request);
    
    // Get customer information
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const stripe = await getStripe();
    
    // Create or retrieve Stripe customer
    let stripeCustomerId = customer.stripe_customer_id;
    
    if (!stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({
        email: customer.email,
        name: `${customer.first_name} ${customer.last_name}`,
        phone: customer.phone || undefined,
        address: {
          line1: customer.address_line1 || '',
          city: customer.city || '',
          state: customer.state || '',
          postal_code: customer.zip_code || '',
          country: 'US'
        },
        metadata: {
          customer_id: customer.id,
          account_number: customer.account_number
        }
      });
      
      stripeCustomerId = stripeCustomer.id;
      
      // Update customer with Stripe ID
      await supabase
        .from('customers')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', customerId);
    }

    // Determine pricing based on service type and device count
    const deviceCount = deviceIds.length || 1;
    let unitAmount; // in cents
    let productName;
    
    if (customPrice) {
      unitAmount = Math.round(customPrice * 100);
      productName = `Custom ${serviceType} - ${deviceCount} device(s)`;
    } else {
      // Standard pricing
      switch (serviceType) {
        case 'annual_testing':
          unitAmount = deviceCount * 8500; // $85 per device annually
          productName = `Annual Backflow Testing - ${deviceCount} device(s)`;
          break;
        case 'quarterly_testing':
          unitAmount = deviceCount * 25000; // $250 per device quarterly  
          productName = `Quarterly Backflow Testing - ${deviceCount} device(s)`;
          break;
        case 'repair_maintenance':
          unitAmount = deviceCount * 15000; // $150 per device annually
          productName = `Annual Maintenance Plan - ${deviceCount} device(s)`;
          break;
        default:
          unitAmount = 8500;
          productName = 'Backflow Testing Service';
      }
    }

    // Create Stripe product and price
    const product = await stripe.products.create({
      name: productName,
      description: `Recurring ${serviceType.replace('_', ' ')} service for Fisher Backflows`,
      metadata: {
        service_type: serviceType,
        customer_id: customerId,
        device_count: deviceCount.toString()
      }
    });

    const price = await stripe.prices.create({
      unit_amount: unitAmount,
      currency: 'usd',
      recurring: {
        interval: billingCycle === 'yearly' ? 'year' : 
                 billingCycle === 'quarterly' ? 'month' : 'month',
        interval_count: billingCycle === 'quarterly' ? 3 : 1
      },
      product: product.id,
      metadata: {
        service_type: serviceType,
        device_count: deviceCount.toString()
      }
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{
        price: price.id,
        quantity: 1
      }],
      collection_method: 'charge_automatically',
      billing_cycle_anchor: startDate ? Math.floor(new Date(startDate).getTime() / 1000) : undefined,
      metadata: {
        customer_id: customerId,
        service_type: serviceType,
        device_ids: deviceIds.join(','),
        created_by: user.id
      },
      expand: ['latest_invoice.payment_intent']
    });

    // Store subscription in database
    const subscriptionData = {
      id: subscription.id,
      customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: stripeCustomerId,
      service_type: serviceType,
      billing_cycle: billingCycle,
      device_ids: deviceIds,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      amount_per_period: unitAmount,
      currency: 'usd',
      is_active: subscription.status === 'active',
      next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: dbError } = await supabase
      .from('billing_subscriptions')
      .insert(subscriptionData);

    if (dbError) {
      console.error('Error storing subscription:', dbError);
      // Don't fail the request as Stripe subscription was created successfully
    }

    console.log(`✅ Created subscription for customer ${customer.first_name} ${customer.last_name}: $${unitAmount/100}/${billingCycle}`);

    return NextResponse.json({
      success: true,
      message: 'Subscription created successfully',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        amount: unitAmount / 100,
        currency: 'usd',
        billing_cycle: billingCycle,
        service_type: serviceType,
        device_count: deviceCount,
        current_period_end: subscription.current_period_end,
        customer: {
          name: `${customer.first_name} ${customer.last_name}`,
          email: customer.email
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription: ' + (error as Error).message },
      { status: 500 }
    );
  }
}