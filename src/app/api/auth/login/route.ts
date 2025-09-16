import 'server-only';
export const runtime = 'nodejs'; // Force Node.js runtime for service role access

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, getServiceRoleClient } from '@/lib/supabase';
import { checkRateLimit, recordAttempt, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limiting';

export async function POST(request: NextRequest) {
  const clientId = getClientIdentifier(request);

  try {
    // Step 1: Check rate limiting first
    const rateCheck = checkRateLimit(clientId, 'login');
    if (!rateCheck.allowed) {
      const headers = getRateLimitHeaders(
        rateCheck.remainingAttempts,
        rateCheck.resetTime,
        rateCheck.blockedUntil
      );

      return NextResponse.json({
        error: 'Too many login attempts. Please try again later.',
        rateLimited: true,
        retryAfter: rateCheck.blockedUntil ? Math.ceil((rateCheck.blockedUntil - Date.now()) / 1000) : undefined
      }, {
        status: 429,
        headers
      });
    }

    // Environment validation (simplified logging)
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      recordAttempt(clientId, 'login', false);
      return NextResponse.json({
        error: 'Authentication service temporarily unavailable'
      }, { status: 503 });
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
    
    // Input validation logging (sanitized)
    console.log('[LOGIN] Processing login request');

    
    // Handle both email and identifier fields (form sends identifier)
    const loginEmail = email || identifier;
    
    if (!loginEmail || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }
    
    // Create a proper client with anon key for authentication
    const authClient = createRouteHandlerClient(request);
    if (!authClient) {
      recordAttempt(clientId, 'login', false);
      return NextResponse.json({
        error: 'Authentication service unavailable'
      }, { status: 503 });
    }

    // Step 1: Authenticate with anon key client (respects RLS)
    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (authError || !authData.user) {
      console.error('Authentication failed:', authError?.message);
      recordAttempt(clientId, 'login', false);
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
    // For customer lookup, we need service role to handle legacy data
    const serviceClient = getServiceRoleClient('customer-auth-linking');
    let { data: customerData, error: customerError } = await serviceClient
      .from('customers')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (customerError || !customerData) {
      console.error('Customer lookup failed:', customerError);
      
      // If no customer found, check if account was created before auth_user_id linking
      if (!authData.user.email) {
        return NextResponse.json({
          error: 'User email not available',
          code: 'EMAIL_MISSING'
        }, { status: 400 });
      }

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

    // Step 5: Set secure session cookies and return safe response
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: customerData.id,
        email: customerData.email,
        firstName: customerData.first_name,
        lastName: customerData.last_name,
        name: `${customerData.first_name} ${customerData.last_name}`,
        accountNumber: customerData.account_number,
        phone: customerData.phone,
        role: 'customer',
        status: customerData.account_status
      },
      redirect: '/portal/dashboard'
    });

    // Set secure HTTP-only cookies for session management
    if (authData.session?.access_token) {
      response.cookies.set('fb_access_token', authData.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: authData.session.expires_in || 3600, // 1 hour default
        path: '/'
      });
    }

    if (authData.session?.refresh_token) {
      response.cookies.set('fb_refresh_token', authData.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      });
    }

    // Set user session cookie for client-side access
    response.cookies.set('fb_user_session', JSON.stringify({
      id: customerData.id,
      email: customerData.email,
      role: 'customer',
      expires_at: authData.session?.expires_at
    }), {
      httpOnly: false, // Accessible to client for UI state
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: authData.session?.expires_in || 3600,
      path: '/'
    });

    // Record successful login to reset rate limiting
    recordAttempt(clientId, 'login', true);

    return response;
    
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json({
      error: 'Authentication service temporarily unavailable. Please try again.'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
