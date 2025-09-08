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
    
    const body = await request.json();
    const { email, password, identifier, type } = body;

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
    
    if (!email || !password) {
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
      email,
      password,
    });

    if (authError || !authData.user) {
      console.error('Authentication failed:', authError?.message);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Step 2: Check if email is confirmed
    if (!authData.user.email_confirmed_at) {
      return NextResponse.json({ 
        error: 'Please verify your email address before signing in. Check your inbox for a verification email.' 
      }, { status: 403 });
    }

    // Step 3: Get customer data using service client by email lookup
    console.log('[EMERGENCY LOGIN] Looking up customer by email:', authData.user.email);
    const { data: customerData, error: customerError } = await serviceClient
      .from('customers')
      .select('*')
      .eq('email', authData.user.email)
      .maybeSingle();

    if (customerError) {
      console.error('Customer lookup failed:', customerError);
      console.error('Auth user ID:', authData.user.id);
      
      // If it's a PGRST116 error (multiple rows), try to handle it gracefully
      if (customerError.code === 'PGRST116') {
        console.error('Multiple customer records found for email:', authData.user.email);
        // Try to get all records and use the most recent one
        const { data: allCustomers, error: allCustomersError } = await serviceClient
          .from('customers')
          .select('*')
          .eq('email', authData.user.email)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (allCustomersError || !allCustomers || allCustomers.length === 0) {
          console.error('Fallback customer lookup failed:', allCustomersError);
          return NextResponse.json({ 
            error: 'Customer account lookup failed. Please contact support.' 
          }, { status: 500 });
        }
        
        // Use the most recent customer record
        const fallbackCustomer = allCustomers[0];
        console.log('Using fallback customer record:', fallbackCustomer.id);
        
        // Continue with the fallback customer
        if (fallbackCustomer.account_status !== 'active') {
          return NextResponse.json({ 
            error: 'Account not active. Please contact support if you believe this is an error.' 
          }, { status: 403 });
        }
        
        // Return successful login response with fallback customer
        return NextResponse.json({
          success: true,
          message: 'Login successful',
          user: {
            id: fallbackCustomer.id,
            authUserId: authData.user.id,
            email: fallbackCustomer.email,
            name: `${fallbackCustomer.first_name} ${fallbackCustomer.last_name}`,
            firstName: fallbackCustomer.first_name,
            lastName: fallbackCustomer.last_name,
            accountNumber: fallbackCustomer.account_number,
            phone: fallbackCustomer.phone,
            role: 'customer',
            status: fallbackCustomer.account_status
          },
          session: {
            access_token: authData.session?.access_token,
            refresh_token: authData.session?.refresh_token,
            expires_at: authData.session?.expires_at,
            expires_in: authData.session?.expires_in
          },
          redirect: '/portal'
        });
      }
      
      return NextResponse.json({ 
        error: 'Customer account not found. Please contact support.' 
      }, { status: 404 });
    }

    if (!customerData) {
      console.warn('No customer data found for email:', authData.user.email, '— attempting self-heal creation');
      // Attempt to create a minimal customer record linked to this auth user
      const meta: any = authData.user.user_metadata || {};
      const firstName = meta.first_name || meta.firstName || 'Customer';
      const lastName = meta.last_name || meta.lastName || 'Account';
      const { data: created, error: createErr } = await serviceClient
        .from('customers')
        .insert({
          account_number: `FB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          name: `${firstName} ${lastName}`,
          email: authData.user.email,
          phone: 'Not provided',
          address: 'Not provided',
          status: 'Active',
        })
        .select('*')
        .single();

      if (createErr || !created) {
        console.error('Self-heal customer creation failed:', createErr);
        return NextResponse.json({ 
          error: 'Customer account not found. Please contact support.' 
        }, { status: 404 });
      }

      customerData = created;
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
        name: customerData.name || authData.user.email || 'Customer',
        firstName: (customerData.name || '').split(' ')[0] || 'Customer',
        lastName: (customerData.name || '').split(' ').slice(1).join(' ') || '',
        accountNumber: customerData.account_number,
        phone: customerData.phone,
        role: 'customer',
        status: customerData.status || 'Active'
      },
      session: {
        access_token: authData.session?.access_token,
        refresh_token: authData.session?.refresh_token,
        expires_at: authData.session?.expires_at,
        expires_in: authData.session?.expires_in
      },
      redirect: '/portal'
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
