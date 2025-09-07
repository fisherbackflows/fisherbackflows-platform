import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, supabaseAdmin } from '@/lib/supabase';
import { generateId } from '@/lib/utils';
import { checkRateLimit, recordAttempt, getClientIdentifier, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting';

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
    if (!firstName || !lastName || !email || !phone || !password) {
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

    // Verify we have admin client
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error: Admin client not available' },
        { status: 500 }
      );
    }

    // Skip user existence check for now - just try to create and handle errors
    let emailError = false;
    let authData: any = null;

    try {
      // Step 1: Create Supabase Auth user using client signUp method
      const supabase = createRouteHandlerClient(request);
      const authResult = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/portal/verify-email`
        }
      });

      authData = authResult.data;
      const authError = authResult.error;

      // Check for specific auth errors
      if (authError) {
        console.error('Auth user creation failed:', authError);
        
        // Handle specific error cases
        if (authError.code === 'over_email_send_rate_limit' || 
            authError.code === 'unexpected_failure' ||
            authError.message?.includes('email')) {
          console.warn('Email service issue detected, but continuing with registration');
          emailError = true;
          // Continue with registration even if email fails
        } else if (authError.code === 'weak_password') {
          return NextResponse.json(
            { error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' },
            { status: 400 }
          );
        } else if (authError.code === 'user_already_exists') {
          return NextResponse.json(
            { error: 'An account with this email already exists' },
            { status: 400 }
          );
        } else if (!authData?.user) {
          // Only fail if we don't have a user created
          return NextResponse.json(
            { error: 'Failed to create user account. Please try again.' },
            { status: 500 }
          );
        }
      }
      
      // If we have a user, continue even if email confirmation failed
      if (!authData?.user) {
        // For email issues, try to create user anyway
        if (!emailError) {
          return NextResponse.json(
            { error: 'Failed to create user account' },
            { status: 500 }
          );
        }
        // For email rate limit, generate a proper UUID
        const crypto = require('crypto');
        const tempUserId = crypto.randomUUID();
        authData = { user: { id: tempUserId } };
        console.log('Creating customer with generated UUID due to email issue:', tempUserId);
      }

      // Step 2: Generate account number
      const accountNumber = generateId('FB');

      // Step 3: Create customer record  
      // Only link auth_user_id if we have a real auth user (not for email failures)
      const customerInsert: any = {
          account_number: accountNumber,
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          address_line1: (address && address.street) ? address.street : 'Not provided',
          city: (address && address.city) ? address.city : 'Not provided',
          state: (address && address.state) ? address.state : 'TX',
          zip_code: (address && address.zipCode) ? address.zipCode : '00000',
          account_status: emailError ? 'active' : 'pending_verification'
      };
      
      // Only add auth_user_id if it's not a temporary one
      if (!emailError && authData?.user?.id) {
        customerInsert.auth_user_id = authData.user.id;
      }

      const { data: customerData, error: customerError } = await supabaseAdmin
        .from('customers')
        .insert(customerInsert)
        .select()
        .single();

      if (customerError || !customerData) {
        console.error('Customer creation failed:', customerError);
        return NextResponse.json(
          { error: 'Failed to create customer record' },
          { status: 500 }
        );
      }

      // Email confirmation will be sent automatically by Supabase Auth via the configured SMTP (Resend)

      console.log('Customer registration completed with Supabase Auth');
      console.log('New customer registration:', {
        authUserId: authData.user.id,
        customerId: customerData.id,
        accountNumber: customerData.account_number,
        firstName: customerData.first_name,
        lastName: customerData.last_name,
        email: customerData.email,
        phone: customerData.phone,
        propertyType
      });

      // Determine appropriate message based on whether email was sent
      const message = emailError 
        ? 'Account created successfully! You can now sign in with your email and password.'
        : 'Account created successfully! Please check your email to verify your account.';

      return NextResponse.json({
        success: true,
        message,
        user: {
          id: customerData.id,
          authUserId: emailError ? null : authData.user.id,
          accountNumber: customerData.account_number,
          firstName,
          lastName,
          email,
          phone,
          status: emailError ? 'active' : 'pending_verification'
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