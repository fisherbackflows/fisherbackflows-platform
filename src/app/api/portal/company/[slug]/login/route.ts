import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateCustomerToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = params
    const { identifier, password, type } = await request.json()
    
    if (!identifier || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }
    
    // First, verify the company exists and is active
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, slug, name, subscription_status')
      .eq('slug', slug)
      .single()
    
    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }
    
    if (!['active', 'trialing'].includes(company.subscription_status)) {
      return NextResponse.json({ error: 'Company subscription is not active' }, { status: 403 })
    }
    
    // Find customer by email in this company
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, email, password_hash, first_name, last_name, is_active, email_verified')
      .eq('email', identifier.toLowerCase())
      .eq('company_id', company.id)
      .single()
    
    if (customerError || !customer) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }
    
    if (!customer.is_active) {
      return NextResponse.json({ error: 'Account is deactivated. Please contact support.' }, { status: 403 })
    }
    
    if (!customer.email_verified) {
      return NextResponse.json({ 
        error: 'Please verify your email address before logging in. Check your inbox for a verification link.',
        code: 'EMAIL_NOT_VERIFIED'
      }, { status: 403 })
    }
    
    // Verify password
    if (!customer.password_hash) {
      return NextResponse.json({ error: 'Account not properly set up. Please contact support.' }, { status: 403 })
    }
    
    const passwordMatch = await bcrypt.compare(password, customer.password_hash)
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }
    
    // Generate JWT token for this customer
    const token = generateCustomerToken(customer.id, company.id, customer.email)
    
    // Update last login
    await supabase
      .from('customers')
      .update({ last_login: new Date().toISOString() })
      .eq('id', customer.id)
    
    // Log successful login
    await supabase
      .from('security_logs')
      .insert({
        customer_id: customer.id,
        company_id: company.id,
        event_type: 'customer_login',
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        metadata: {
          login_method: 'password',
          company_slug: slug
        }
      })
    
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: customer.id,
        email: customer.email,
        name: `${customer.first_name} ${customer.last_name}`.trim(),
        company_id: company.id,
        company_name: company.name
      },
      redirect: `/portal/company/${slug}/dashboard`
    })
    
  } catch (error) {
    console.error('Company login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}