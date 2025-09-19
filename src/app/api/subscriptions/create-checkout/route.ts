import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy'
const stripe = stripeKey !== 'sk_test_dummy' ? new Stripe(stripeKey, {
  apiVersion: '2024-12-18.acacia'
}) : null

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PRICE_IDS = {
  starter_monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || 'price_starter_monthly',
  starter_yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || 'price_starter_yearly',
  professional_monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY || 'price_professional_monthly',
  professional_yearly: process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY || 'price_professional_yearly',
  enterprise_monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly',
  enterprise_yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || 'price_enterprise_yearly'
}

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured. Please add STRIPE_SECRET_KEY to environment variables.' }, { status: 503 })
    }
    const { companyId, planId, billingCycle, userId } = await request.json()

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Create or retrieve Stripe customer
    let customerId = company.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        name: company.name,
        metadata: {
          company_id: companyId,
          user_id: userId
        }
      })
      customerId = customer.id

      // Update company with Stripe customer ID
      await supabase
        .from('companies')
        .update({ stripe_customer_id: customerId })
        .eq('id', companyId)
    }

    // Get the price ID for the selected plan
    const priceKey = `${planId}_${billingCycle}` as keyof typeof PRICE_IDS
    const priceId = PRICE_IDS[priceKey]

    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan or billing cycle' }, { status: 400 })
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/team-portal/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/team-portal/billing?canceled=true`,
      metadata: {
        company_id: companyId,
        plan_id: planId,
        billing_cycle: billingCycle
      },
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          company_id: companyId,
          plan_id: planId
        }
      }
    })

    return NextResponse.json({ 
      checkoutUrl: session.url,
      sessionId: session.id 
    })
  } catch (error: any) {
    console.error('Subscription checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}