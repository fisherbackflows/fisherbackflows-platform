import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { createRouteHandlerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Step 1: Authenticate with Supabase Auth
    const { data: authData, error: authError } = await createRouteHandlerClient(request).auth.signInWithPassword({
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

    // Step 3: Get customer data using auth user ID
    const supabase = createRouteHandlerClient(request);
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (customerError || !customerData) {
      console.error('Customer lookup failed:', customerError);
      return NextResponse.json({ 
        error: 'Customer account not found. Please contact support.' 
      }, { status: 404 });
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
        name: `${customerData.first_name} ${customerData.last_name}`,
        firstName: customerData.first_name,
        lastName: customerData.last_name,
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