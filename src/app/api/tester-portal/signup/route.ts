import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
}) : null

// Generate secure API key
function generateApiKey(): string {
  return 'bbapi_' + crypto.randomBytes(32).toString('hex')
}

// Hash API key for storage
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

// Get preview of API key (last 4 chars)
function getApiKeyPreview(key: string): string {
  return '****' + key.slice(-4)
}

// POST /api/tester-portal/signup - Handle new company signup
export async function POST(request: NextRequest) {
  try {
    const {
      company_name,
      first_name,
      last_name,
      email,
      phone,
      website,
      how_did_you_hear,
      plan,
      payment_method_id
    } = await request.json()

    // Validate required fields
    if (!company_name || !first_name || !last_name || !email || !plan) {
      return NextResponse.json({ 
        error: 'Missing required fields: company_name, first_name, last_name, email, plan' 
      }, { status: 400 })
    }

    if (!['starter', 'professional'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
    }

    // Check if company already exists
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingCompany) {
      return NextResponse.json({ 
        error: 'A company with this email already exists' 
      }, { status: 409 })
    }

    // Generate company slug from name
    const baseSlug = company_name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    // Ensure slug is unique
    let slug = baseSlug
    let counter = 1
    while (true) {
      const { data: existingSlug } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', slug)
        .single()

      if (!existingSlug) break
      
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Create Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email: email.toLowerCase(),
      name: company_name,
      phone: phone || undefined,
      metadata: {
        company_name,
        signup_plan: plan,
        how_did_you_hear: how_did_you_hear || ''
      }
    })

    // Attach payment method if provided
    if (payment_method_id) {
      await stripe.paymentMethods.attach(payment_method_id, {
        customer: stripeCustomer.id
      })

      // Set as default payment method
      await stripe.customers.update(stripeCustomer.id, {
        invoice_settings: {
          default_payment_method: payment_method_id
        }
      })
    }

    // Create company record
    const trialEndsAt = new Date(Date.now() + (14 * 24 * 60 * 60 * 1000)) // 14 days from now
    
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: company_name,
        slug: slug,
        email: email.toLowerCase(),
        phone: phone || null,
        website: website || null,
        subscription_plan: plan,
        subscription_status: 'trialing',
        stripe_customer_id: stripeCustomer.id,
        trial_ends_at: trialEndsAt.toISOString(),
        metadata: {
          how_did_you_hear: how_did_you_hear || '',
          signup_plan: plan
        }
      })
      .select()
      .single()

    if (companyError) {
      console.error('Error creating company:', companyError)
      // Clean up Stripe customer if company creation fails
      await stripe.customers.del(stripeCustomer.id)
      return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
    }

    // Generate default password for admin user
    const defaultPassword = crypto.randomBytes(12).toString('base64').slice(0, 12)
    const hashedPassword = await bcrypt.hash(defaultPassword, 12)

    // Create admin team user
    const { data: teamUser, error: userError } = await supabase
      .from('team_users')
      .insert({
        company_id: company.id,
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        first_name,
        last_name,
        role: 'admin',
        is_active: true,
        email_verified: true, // Auto-verify for signups
        phone: phone || null
      })
      .select()
      .single()

    if (userError) {
      console.error('Error creating team user:', userError)
      // Clean up company and Stripe customer
      await supabase.from('companies').delete().eq('id', company.id)
      await stripe.customers.del(stripeCustomer.id)
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 })
    }

    // Generate initial API key
    const apiKey = generateApiKey()
    const keyHash = hashApiKey(apiKey)
    const keyPreview = getApiKeyPreview(apiKey)

    const { error: apiKeyError } = await supabase
      .from('api_keys')
      .insert({
        company_id: company.id,
        name: 'Default API Key',
        key_hash: keyHash,
        key_preview: keyPreview,
        is_active: true,
        rate_limit_per_hour: plan === 'starter' ? 1000 : 5000
      })

    if (apiKeyError) {
      console.error('Error creating API key:', apiKeyError)
    }

    // Create Stripe subscription with trial
    const priceIds = {
      starter: process.env.STRIPE_STARTER_PRICE_ID!,
      professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID!
    }

    const priceId = priceIds[plan as keyof typeof priceIds]

    if (!priceId) {
      return NextResponse.json({ error: 'Plan pricing not configured' }, { status: 500 })
    }

    let clientSecret = null

    try {
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        trial_period_days: 14,
        metadata: {
          company_id: company.id,
          plan: plan
        }
      })

      // Update company with subscription ID
      await supabase
        .from('companies')
        .update({
          stripe_subscription_id: subscription.id,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
        })
        .eq('id', company.id)

      const latestInvoice = subscription.latest_invoice as Stripe.Invoice
      const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent
      clientSecret = paymentIntent?.client_secret

    } catch (stripeError) {
      console.error('Stripe subscription creation failed:', stripeError)
      // Continue without subscription - user can set it up later
    }

    // Log the signup
    await supabase
      .from('audit_logs')
      .insert({
        company_id: company.id,
        user_id: teamUser.id,
        action: 'company_signup',
        resource_type: 'company',
        resource_id: company.id,
        metadata: {
          plan: plan,
          email: email,
          company_name: company_name,
          stripe_customer_id: stripeCustomer.id
        }
      })

    // Send welcome email with login credentials and API key
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        template: 'tester-portal_welcome',
        data: {
          company_name: company_name,
          api_key: apiKey,
          dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/tester-portal/dashboard`,
          docs_url: `${process.env.NEXT_PUBLIC_APP_URL}/tester-portal/docs`,
          trial_ends: trialEndsAt.toLocaleDateString()
        }
      })
    }).catch(error => console.error('Failed to send welcome email:', error))

    return NextResponse.json({
      data: {
        company_id: company.id,
        company_name: company.name,
        plan: plan,
        trial_ends_at: trialEndsAt.toISOString(),
        api_key: apiKey, // Return the API key only once
        login_email: email,
        temporary_password: defaultPassword // They should change this
      },
      client_secret: clientSecret,
      message: 'Company created successfully! Check your email for login details.'
    }, { status: 201 })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 })
  }
}