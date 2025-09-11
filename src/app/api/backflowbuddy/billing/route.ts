import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/auth'
import Stripe from 'stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

// GET /api/backflowbuddy/billing - Get billing information
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(['admin'])(request)
    if (user instanceof NextResponse) return user

    // Get company ID from team user
    const { data: teamUser } = await supabase
      .from('team_users')
      .select('company_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!teamUser?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get company billing information
    const { data: company } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        subscription_plan,
        subscription_status,
        stripe_customer_id,
        trial_ends_at,
        current_period_start,
        current_period_end
      `)
      .eq('id', teamUser.company_id)
      .single()

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get current month's API usage
    const currentMonth = new Date()
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

    const { data: usageData } = await supabase
      .from('api_usage_logs')
      .select('id')
      .eq('company_id', company.id)
      .gte('created_at', firstDay.toISOString())
      .lte('created_at', lastDay.toISOString())

    const currentUsage = usageData?.length || 0

    // Get plan limits
    const planLimits = {
      starter: { customers: 500, api_calls: 10000, price: 99 },
      professional: { customers: 2000, api_calls: 50000, price: 299 },
      enterprise: { customers: -1, api_calls: -1, price: 0 } // Unlimited
    }

    const currentPlan = planLimits[company.subscription_plan as keyof typeof planLimits] || planLimits.starter

    // Get Stripe subscription details if available
    let stripeSubscription = null
    if (company.stripe_customer_id) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: company.stripe_customer_id,
          status: 'active',
          limit: 1
        })
        
        if (subscriptions.data.length > 0) {
          stripeSubscription = subscriptions.data[0]
        }
      } catch (error) {
        console.error('Error fetching Stripe subscription:', error)
      }
    }

    return NextResponse.json({
      data: {
        company: {
          name: company.name,
          plan: company.subscription_plan,
          status: company.subscription_status,
          trial_ends_at: company.trial_ends_at,
          current_period_start: company.current_period_start,
          current_period_end: company.current_period_end
        },
        usage: {
          current_month_api_calls: currentUsage,
          plan_limit: currentPlan.api_calls,
          usage_percentage: currentPlan.api_calls > 0 ? (currentUsage / currentPlan.api_calls * 100) : 0
        },
        plan_details: currentPlan,
        stripe_subscription: stripeSubscription ? {
          id: stripeSubscription.id,
          status: stripeSubscription.status,
          current_period_start: new Date(stripeSubscription.current_period_start * 1000),
          current_period_end: new Date(stripeSubscription.current_period_end * 1000),
          cancel_at_period_end: stripeSubscription.cancel_at_period_end
        } : null
      }
    })

  } catch (error) {
    console.error('Billing API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/backflowbuddy/billing - Create or update subscription
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(['admin'])(request)
    if (user instanceof NextResponse) return user

    const { plan, payment_method_id } = await request.json()

    if (!['starter', 'professional'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
    }

    // Get company ID from team user
    const { data: teamUser } = await supabase
      .from('team_users')
      .select('company_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!teamUser?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get company information
    const { data: company } = await supabase
      .from('companies')
      .select('id, name, email, stripe_customer_id')
      .eq('id', teamUser.company_id)
      .single()

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId = company.stripe_customer_id
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: company.email,
        name: company.name,
        metadata: {
          company_id: company.id
        }
      })
      
      stripeCustomerId = customer.id
      
      // Update company with Stripe customer ID
      await supabase
        .from('companies')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', company.id)
    }

    // Attach payment method if provided
    if (payment_method_id) {
      await stripe.paymentMethods.attach(payment_method_id, {
        customer: stripeCustomerId
      })

      // Set as default payment method
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: payment_method_id
        }
      })
    }

    // Get the appropriate price ID based on plan
    const priceIds = {
      starter: process.env.STRIPE_STARTER_PRICE_ID!,
      professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID!
    }

    const priceId = priceIds[plan as keyof typeof priceIds]

    if (!priceId) {
      return NextResponse.json({ error: 'Plan pricing not configured' }, { status: 500 })
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      trial_period_days: 14, // 14-day free trial
      metadata: {
        company_id: company.id,
        plan: plan
      }
    })

    // Update company subscription status
    await supabase
      .from('companies')
      .update({
        subscription_plan: plan,
        subscription_status: 'trialing',
        stripe_subscription_id: subscription.id,
        trial_ends_at: new Date(Date.now() + (14 * 24 * 60 * 60 * 1000)).toISOString(),
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
      })
      .eq('id', company.id)

    // Log the subscription creation
    await supabase
      .from('audit_logs')
      .insert({
        company_id: company.id,
        user_id: user.id,
        action: 'subscription_created',
        resource_type: 'subscription',
        resource_id: subscription.id,
        metadata: {
          plan: plan,
          stripe_subscription_id: subscription.id
        }
      })

    const latestInvoice = subscription.latest_invoice as Stripe.Invoice
    const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent

    return NextResponse.json({
      data: {
        subscription_id: subscription.id,
        client_secret: paymentIntent?.client_secret,
        status: subscription.status
      },
      message: 'Subscription created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Subscription creation error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create subscription' 
    }, { status: 500 })
  }
}