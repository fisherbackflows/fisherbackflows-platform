import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
}) : null

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// POST /api/tester-portal/webhooks/stripe - Handle Stripe webhooks
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('Processing Stripe webhook:', event.type)

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const companyId = subscription.metadata.company_id
    if (!companyId) {
      console.error('No company_id in subscription metadata')
      return
    }

    // Determine subscription status
    let status: string
    switch (subscription.status) {
      case 'trialing':
        status = 'trialing'
        break
      case 'active':
        status = 'active'
        break
      case 'past_due':
        status = 'past_due'
        break
      case 'canceled':
      case 'unpaid':
        status = 'cancelled'
        break
      default:
        status = 'inactive'
    }

    // Get plan from subscription metadata or price ID
    const plan = subscription.metadata.plan || 'starter'

    // Update company subscription
    const { error } = await supabase
      .from('companies')
      .update({
        subscription_status: status,
        subscription_plan: plan,
        stripe_subscription_id: subscription.id,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
      })
      .eq('id', companyId)

    if (error) {
      console.error('Error updating company subscription:', error)
      return
    }

    // Log subscription update
    await supabase
      .from('audit_logs')
      .insert({
        company_id: companyId,
        action: 'subscription_updated',
        resource_type: 'subscription',
        resource_id: subscription.id,
        metadata: {
          status: status,
          plan: plan,
          stripe_subscription_id: subscription.id
        }
      })

    console.log(`Updated subscription for company ${companyId}: ${status}`)

  } catch (error) {
    console.error('Error handling subscription update:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const companyId = subscription.metadata.company_id
    if (!companyId) {
      console.error('No company_id in subscription metadata')
      return
    }

    // Update company to cancelled status
    const { error } = await supabase
      .from('companies')
      .update({
        subscription_status: 'cancelled',
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
      })
      .eq('id', companyId)

    if (error) {
      console.error('Error updating company subscription:', error)
      return
    }

    // Deactivate all API keys for this company
    await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('company_id', companyId)

    // Log subscription cancellation
    await supabase
      .from('audit_logs')
      .insert({
        company_id: companyId,
        action: 'subscription_cancelled',
        resource_type: 'subscription',
        resource_id: subscription.id,
        metadata: {
          stripe_subscription_id: subscription.id,
          cancelled_at: new Date().toISOString()
        }
      })

    console.log(`Cancelled subscription for company ${companyId}`)

  } catch (error) {
    console.error('Error handling subscription deletion:', error)
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = invoice.subscription as string
    if (!subscriptionId) return

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const companyId = subscription.metadata.company_id

    if (!companyId) {
      console.error('No company_id in subscription metadata')
      return
    }

    // Create billing invoice record
    await supabase
      .from('billing_invoices')
      .insert({
        company_id: companyId,
        stripe_invoice_id: invoice.id,
        amount: invoice.amount_paid / 100, // Convert from cents
        currency: invoice.currency,
        status: 'paid',
        invoice_date: new Date(invoice.created * 1000).toISOString(),
        paid_date: new Date().toISOString(),
        metadata: {
          subscription_id: subscriptionId,
          period_start: new Date(invoice.period_start! * 1000).toISOString(),
          period_end: new Date(invoice.period_end! * 1000).toISOString()
        }
      })

    // Log payment success
    await supabase
      .from('audit_logs')
      .insert({
        company_id: companyId,
        action: 'payment_succeeded',
        resource_type: 'invoice',
        resource_id: invoice.id,
        metadata: {
          amount: invoice.amount_paid / 100,
          stripe_invoice_id: invoice.id
        }
      })

    console.log(`Payment succeeded for company ${companyId}: $${invoice.amount_paid / 100}`)

  } catch (error) {
    console.error('Error handling payment success:', error)
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = invoice.subscription as string
    if (!subscriptionId) return

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const companyId = subscription.metadata.company_id

    if (!companyId) {
      console.error('No company_id in subscription metadata')
      return
    }

    // Update company status to past_due
    await supabase
      .from('companies')
      .update({ subscription_status: 'past_due' })
      .eq('id', companyId)

    // Create billing invoice record
    await supabase
      .from('billing_invoices')
      .insert({
        company_id: companyId,
        stripe_invoice_id: invoice.id,
        amount: invoice.amount_due / 100, // Convert from cents
        currency: invoice.currency,
        status: 'failed',
        invoice_date: new Date(invoice.created * 1000).toISOString(),
        metadata: {
          subscription_id: subscriptionId,
          failure_reason: 'Payment failed'
        }
      })

    // Log payment failure
    await supabase
      .from('audit_logs')
      .insert({
        company_id: companyId,
        action: 'payment_failed',
        resource_type: 'invoice',
        resource_id: invoice.id,
        metadata: {
          amount: invoice.amount_due / 100,
          stripe_invoice_id: invoice.id
        }
      })

    // Send payment failed notification email
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: company.email,
        template: 'payment_failed',
        data: {
          company_name: company.name,
          amount: (invoice.amount_due / 100).toFixed(2),
          invoice_url: invoice.hosted_invoice_url,
          dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/tester-portal/dashboard`
        }
      })
    }).catch(error => console.error('Failed to send payment failed email:', error))

    console.log(`Payment failed for company ${companyId}: $${invoice.amount_due / 100}`)

  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  try {
    const companyId = subscription.metadata.company_id
    if (!companyId) {
      console.error('No company_id in subscription metadata')
      return
    }

    // Get company details for notification
    const { data: company } = await supabase
      .from('companies')
      .select('name, email')
      .eq('id', companyId)
      .single()

    if (!company) {
      console.error('Company not found:', companyId)
      return
    }

    // Log trial ending
    await supabase
      .from('audit_logs')
      .insert({
        company_id: companyId,
        action: 'trial_will_end',
        resource_type: 'subscription',
        resource_id: subscription.id,
        metadata: {
          trial_end: new Date(subscription.trial_end! * 1000).toISOString(),
          company_name: company.name
        }
      })

    // Send trial ending notification email
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: company.email,
        template: 'trial_ending',
        data: {
          company_name: company.name,
          trial_end_date: new Date(subscription.trial_end! * 1000).toLocaleDateString(),
          dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/tester-portal/dashboard`,
          billing_url: `${process.env.NEXT_PUBLIC_APP_URL}/tester-portal/billing`
        }
      })
    }).catch(error => console.error('Failed to send trial ending email:', error))

    console.log(`Trial will end for company ${companyId}: ${company.name}`)

  } catch (error) {
    console.error('Error handling trial will end:', error)
  }
}