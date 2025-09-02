import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createRouteHandlerClient, supabaseAdmin } from '@/lib/supabase';
import { generateId } from '@/lib/utils';
import { checkRateLimit, recordAttempt, getClientIdentifier, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting';
import { registrationSchema, validateInput } from '@/lib/input-validation';

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Rate limiting for registration attempts
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(clientId, RATE_LIMIT_CONFIGS.AUTH_REGISTER);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many registration attempts. Please try again later.',
          retryAfter: rateLimitResult.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '3600',
          }
        }
      );
    }
    
    const body = await request.json();
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      password, 
      address, 
      propertyType 
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !password || !address) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Validate phone format (basic)
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      return NextResponse.json(
        { error: 'Please enter a valid phone number' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Hash the password with reduced rounds for faster processing
    const saltRounds = 10;
    const _hashedPassword = await bcrypt.hash(password, saltRounds);

    // Initialize Supabase client
    const supabase = createRouteHandlerClient(request);

    // Note: We'll let Supabase handle checking for existing auth users

    // Check if customer already exists in database
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', email)
      .single();

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Generate account number
    const accountNumber = generateId('FB');

    try {
      // Create user in Supabase Auth with timeout handling
      const authSignupPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify`,
          data: {
            first_name: firstName,
            last_name: lastName,
            phone,
            account_type: 'customer'
          }
        }
      });

      // Add timeout to auth signup (10 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Auth signup timeout')), 10000);
      });

      const { data: authUser, error: authError } = await Promise.race([
        authSignupPromise,
        timeoutPromise
      ]) as any;

      if (authError) {
        console.error('Auth creation error:', authError);
        
        // Handle specific timeout case
        if (authError.message === 'Auth signup timeout') {
          return NextResponse.json(
            { error: 'Registration is taking longer than expected. Please try again in a moment.' },
            { status: 503 }
          );
        }
        
        // Handle rate limiting
        if (authError.message?.includes('rate limit') || authError.message?.includes('too many requests')) {
          return NextResponse.json(
            { error: 'Too many registration attempts. Please wait a few minutes and try again.' },
            { status: 429 }
          );
        }
        
        return NextResponse.json(
          { error: authError.message || 'Failed to create authentication account' },
          { status: 500 }
        );
      }

      if (!authUser.user) {
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        );
      }

      // Create customer record in database
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          id: authUser.user!.id,
          account_number: accountNumber,
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          address_line1: address.street,
          city: address.city,
          state: address.state,
          zip_code: address.zipCode,
          account_status: 'pending_verification'
        })
        .select()
        .single();

      if (customerError) {
        console.error('Customer creation error:', customerError);
        return NextResponse.json(
          { error: 'Failed to create customer record: ' + customerError.message },
          { status: 500 }
        );
      }

      // Log successful registration
      console.log('New customer registration:', {
        id: customer.id,
        accountNumber: customer.account_number,
        firstName: customer.first_name,
        lastName: customer.last_name,
        email: customer.email,
        phone: customer.phone,
        propertyType
      });

      // Send verification email (Supabase will handle this automatically)
      // You can customize email templates in Supabase dashboard

      return NextResponse.json({
        success: true,
        message: 'Account created successfully! Please check your email to verify your account.',
        user: {
          id: customer.id,
          accountNumber: customer.account_number,
          firstName,
          lastName,
          email,
          phone,
          status: 'pending_verification'
        }
      }, { status: 201 });

    } catch (error) {
      console.error('Registration error:', error);
      return NextResponse.json(
        { error: 'Registration failed. Please try again.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}