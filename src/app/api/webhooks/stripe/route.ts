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

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      // ONE-TIME PAYMENT EVENTS (for individual backflow tests)
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const customerId = paymentIntent.metadata?.customer_id
        const appointmentId = paymentIntent.metadata?.appointment_id
        const serviceType = paymentIntent.metadata?.service_type

        if (customerId && appointmentId) {
          // Update appointment payment status
          await supabase
            .from('appointments')
            .update({
              payment_status: 'paid',
              payment_intent_id: paymentIntent.id,
              amount_paid: paymentIntent.amount / 100,
              paid_at: new Date().toISOString()
            })
            .eq('id', appointmentId)

          // Create payment record
          await supabase
            .from('payments')
            .insert({
              customer_id: customerId,
              appointment_id: appointmentId,
              stripe_payment_intent_id: paymentIntent.id,
              amount: paymentIntent.amount / 100,
              status: 'completed',
              service_type: serviceType || 'backflow_test',
              payment_method: 'stripe'
            })

          console.log(`✅ One-time payment processed: $${paymentIntent.amount / 100} for appointment ${appointmentId}`)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const customerId = paymentIntent.metadata?.customer_id
        const appointmentId = paymentIntent.metadata?.appointment_id

        if (customerId && appointmentId) {
          // Update appointment payment status
          await supabase
            .from('appointments')
            .update({
              payment_status: 'failed',
              payment_intent_id: paymentIntent.id
            })
            .eq('id', appointmentId)

          // Create failed payment record
          await supabase
            .from('payments')
            .insert({
              customer_id: customerId,
              appointment_id: appointmentId,
              stripe_payment_intent_id: paymentIntent.id,
              amount: paymentIntent.amount / 100,
              status: 'failed',
              service_type: paymentIntent.metadata?.service_type || 'backflow_test',
              payment_method: 'stripe',
              failure_reason: paymentIntent.last_payment_error?.message || 'Payment failed'
            })

          console.log(`❌ One-time payment failed: $${paymentIntent.amount / 100} for appointment ${appointmentId}`)
        }
        break
      }

      // SUBSCRIPTION PAYMENT EVENTS (for testing companies)
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const companyId = session.metadata?.company_id
        const planId = session.metadata?.plan_id

        if (companyId && session.subscription) {
          // Update company with subscription info
          await supabase
            .from('companies')
            .update({
              stripe_subscription_id: session.subscription as string,
              subscription_status: 'active',
              subscription_plan: planId,
              trial_ends_at: null
            })
            .eq('id', companyId)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const companyId = subscription.metadata?.company_id

        if (companyId) {
          await supabase
            .from('companies')
            .update({
              stripe_subscription_id: subscription.id,
              subscription_status: subscription.status,
              subscription_plan: subscription.metadata?.plan_id || 'starter'
            })
            .eq('id', companyId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const companyId = subscription.metadata?.company_id

        if (companyId) {
          await supabase
            .from('companies')
            .update({
              subscription_status: 'canceled',
              stripe_subscription_id: null
            })
            .eq('id', companyId)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscription = invoice.subscription as string
        
        // Get subscription to find company
        const subscriptionData = await stripe.subscriptions.retrieve(subscription)
        const companyId = subscriptionData.metadata?.company_id

        if (companyId) {
          // Record payment in billing_invoices
          await supabase
            .from('billing_invoices')
            .insert({
              company_id: companyId,
              stripe_invoice_id: invoice.id,
              amount: invoice.amount_paid / 100,
              status: 'paid',
              paid_at: new Date(invoice.status_transitions.paid_at! * 1000).toISOString()
            })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscription = invoice.subscription as string
        
        // Get subscription to find company
        const subscriptionData = await stripe.subscriptions.retrieve(subscription)
        const companyId = subscriptionData.metadata?.company_id

        if (companyId) {
          // Update subscription status
          await supabase
            .from('companies')
            .update({
              subscription_status: 'past_due'
            })
            .eq('id', companyId)

          // Record failed payment
          await supabase
            .from('billing_invoices')
            .insert({
              company_id: companyId,
              stripe_invoice_id: invoice.id,
              amount: invoice.amount_due / 100,
              status: 'failed'
            })
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}