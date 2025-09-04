import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createRouteHandlerClient } from '@/lib/supabase';
import { generateId } from '@/lib/utils';
import { checkRateLimit, recordAttempt, getClientIdentifier, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting';
import { sendEmail, getSimpleVerificationEmailHtml } from '@/lib/resend';

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

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Initialize Supabase client
    const supabase = createRouteHandlerClient(request);

    // Check if customer already exists
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
      // Create user in Supabase Auth WITHOUT sending email (we'll use Resend)
      console.log('Creating user in Supabase Auth...');
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: false, // Don't confirm email yet - we'll handle verification with Resend
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          phone,
          account_type: 'customer'
        }
      });

      if (authError) {
        console.error('Auth creation error:', authError);
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
          id: authUser.user.id,
          account_number: accountNumber,
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          address_line1: address.street,
          city: address.city,
          state: address.state,
          zip_code: address.zipCode,
          account_status: 'pending_verification' // Will be updated when email is verified
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

      // Send verification email via Resend using simple verification
      console.log('Sending verification email via Resend...');
      const emailResult = await sendEmail({
        to: email,
        subject: 'Welcome to Fisher Backflows - Verify Your Email',
        html: getSimpleVerificationEmailHtml(email, `${firstName} ${lastName}`),
        from: 'Fisher Backflows <noreply@mail.fisherbackflows.com>',
        replyTo: 'fisherbackflows@gmail.com'
      });

      if (!emailResult.success) {
        console.error('Failed to send verification email:', emailResult.error);
        return NextResponse.json(
          { error: 'Account created but failed to send verification email. Please contact support.' },
          { status: 500 }
        );
      }

      console.log('Verification email sent successfully via Resend');
      console.log('New customer registration:', {
        id: customer.id,
        accountNumber: customer.account_number,
        firstName: customer.first_name,
        lastName: customer.last_name,
        email: customer.email,
        phone: customer.phone,
        propertyType
      });

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