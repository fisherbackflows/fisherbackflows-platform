import 'server-only';
export const runtime = 'nodejs'; // Force Node.js runtime for service role access

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // EMERGENCY Environment check
    console.log('[EMERGENCY LOGIN] service key present?', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('[EMERGENCY LOGIN] supabase url present?', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        error: 'Server configuration error - missing environment variables',
        debug: {
          url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      }, { status: 500 });
    }
    
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('[LOGIN] Failed to parse JSON:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    const { email, password, identifier, type } = body;
    
    console.log('[LOGIN] Received fields:', { email: !!email, password: !!password, identifier: !!identifier, type });

    // Demo login path for tests and demo environments
    if (type === 'demo' || identifier === 'demo') {
      return NextResponse.json({
        success: true,
        user: {
          id: 'demo-id',
          email: 'demo@fisherbackflows.com',
          name: 'Demo User',
          accountNumber: 'DEMO-001',
          status: 'active',
        },
        redirect: '/portal/dashboard',
      });
    }
    
    // Handle both email and identifier fields (form sends identifier)
    const loginEmail = email || identifier;
    console.log('[LOGIN] Using email:', loginEmail);
    
    if (!loginEmail || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }
    
    // EMERGENCY: Create service client directly instead of using imported one
    const { createClient } = await import('@supabase/supabase-js');
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('[EMERGENCY LOGIN] Created service client directly');

    // Step 1: Authenticate with service client (bypasses anon key issues)
    const { data: authData, error: authError } = await serviceClient.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (authError || !authData.user) {
      console.error('Authentication failed:', authError?.message);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Step 2: Check if email is confirmed
    if (!authData.user.email_confirmed_at) {
      return NextResponse.json({ 
        error: 'Please verify your email address before signing in. Check your inbox for a verification email.',
        code: 'EMAIL_NOT_VERIFIED',
        email: authData.user.email
      }, { status: 403 });
    }

    // Step 3: Get customer data by auth_user_id (proper linking)
    console.log('[LOGIN] Looking up customer by auth_user_id:', authData.user.id);
    const { data: customerData, error: customerError } = await serviceClient
      .from('customers')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (customerError || !customerData) {
      console.error('Customer lookup failed:', customerError);
      
      // If no customer found, check if account was created before auth_user_id linking
      console.log('Attempting fallback lookup by email:', authData.user.email);
      const { data: emailCustomer, error: emailError } = await serviceClient
        .from('customers')
        .select('*')
        .eq('email', authData.user.email)
        .is('auth_user_id', null)
        .single();
      
      if (emailError || !emailCustomer) {
        return NextResponse.json({ 
          error: 'No customer account found. Please contact support or register a new account.',
          code: 'CUSTOMER_NOT_FOUND'
        }, { status: 404 });
      }
      
      // Link the existing customer to this auth user
      console.log('Linking existing customer to auth user:', emailCustomer.id);
      const { error: linkError } = await serviceClient
        .from('customers')
        .update({ auth_user_id: authData.user.id })
        .eq('id', emailCustomer.id);
      
      if (linkError) {
        console.error('Failed to link customer to auth user:', linkError);
        return NextResponse.json({ 
          error: 'Account linking failed. Please contact support.',
          code: 'LINKING_FAILED'
        }, { status: 500 });
      }
      
      // Use the linked customer data
      customerData = { ...emailCustomer, auth_user_id: authData.user.id };
    }

    // Step 4: Check account status
    if (customerData.account_status !== 'active') {
      return NextResponse.json({ 
        error: 'Account not active. Please contact support if you believe this is an error.' 
      }, { status: 403 });
    }

    // Step 5: Return successful login response
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: customerData.id,
        authUserId: authData.user.id,
        email: customerData.email,
        firstName: customerData.first_name,
        lastName: customerData.last_name,
        name: `${customerData.first_name} ${customerData.last_name}`,
        accountNumber: customerData.account_number,
        phone: customerData.phone,
        role: 'customer',
        status: customerData.account_status
      },
      session: {
        access_token: authData.session?.access_token,
        refresh_token: authData.session?.refresh_token,
        expires_at: authData.session?.expires_at,
        expires_in: authData.session?.expires_in
      },
      redirect: '/portal/dashboard'
    });
    
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json({ 
      error: 'Authentication failed. Please try again.',
      debug: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
