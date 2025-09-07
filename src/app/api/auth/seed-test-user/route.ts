import 'server-only'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'

function randId(prefix = 'FB') {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

export async function POST(request: NextRequest) {
  try {
    const seedKey = process.env.ADMIN_SEED_KEY?.trim()
    const provided = request.headers.get('x-admin-seed-key')?.trim()
    if (!seedKey || !provided || provided !== seedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const body = await request.json().catch(() => ({}))
    const email: string = (body.email || `testuser+${Date.now()}@example.com`).toLowerCase()
    const password: string = body.password || 'TestPassword123!'
    const firstName: string = body.firstName || 'Test'
    const lastName: string = body.lastName || 'User'
    const phone: string = body.phone || '555-555-1234'

    const { createClient } = await import('@supabase/supabase-js')
    const svc = createClient(supabaseUrl, serviceKey)

    // Try to find existing customer to link auth user id
    let authUserId: string | null = null
    let customerId: string | null = null

    const { data: existingCustomer } = await svc
      .from('customers')
      .select('id, auth_user_id')
      .eq('email', email)
      .maybeSingle()

    if (existingCustomer) {
      customerId = existingCustomer.id
      authUserId = existingCustomer.auth_user_id
    }

    // Ensure auth user exists with known password and confirmed email
    if (!authUserId) {
      const { data: created, error: createErr } = await svc.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name: firstName, last_name: lastName, full_name: `${firstName} ${lastName}` },
      })
      if (createErr || !created.user) {
        return NextResponse.json({ error: createErr?.message || 'Failed to create auth user' }, { status: 500 })
      }
      authUserId = created.user.id
    } else {
      // Update password to known test password
      const { error: updateErr } = await svc.auth.admin.updateUserById(authUserId, { password })
      if (updateErr) {
        return NextResponse.json({ error: updateErr.message || 'Failed to set password' }, { status: 500 })
      }
    }

    // Upsert customer record
    const upsertData = {
      auth_user_id: authUserId,
      account_number: randId('FB'),
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      address_line1: 'Seeded Test User',
      city: 'Tacoma',
      state: 'WA',
      zip_code: '98401',
      account_status: 'active',
    }

    let customer
    if (customerId) {
      const { data, error } = await svc
        .from('customers')
        .update(upsertData)
        .eq('id', customerId)
        .select('*')
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      customer = data
    } else {
      const { data, error } = await svc
        .from('customers')
        .insert(upsertData)
        .select('*')
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      customer = data
      customerId = data.id
    }

    // Optionally verify login by generating a session (not setting cookies)
    const { data: authData, error: signInErr } = await svc.auth.signInWithPassword({ email, password })
    if (signInErr) {
      return NextResponse.json({ error: signInErr.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: {
        email,
        password,
        customerId,
        authUserId,
        accountNumber: customer.account_number,
        status: customer.account_status,
      },
      session: {
        access_token: authData.session?.access_token,
        expires_at: authData.session?.expires_at,
      }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

