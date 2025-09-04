import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createRouteHandlerClient, supabaseAdmin } from '@/lib/supabase';
import { generateId } from '@/lib/utils';
import { checkRateLimit, recordAttempt, getClientIdentifier, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting';
import { sendEmail, getVerificationEmailHtml } from '@/lib/resend';

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

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Initialize Supabase clients
    const supabase = createRouteHandlerClient(request);
    
    // Verify we have admin client for user creation
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error: Admin client not available' },
        { status: 500 }
      );
    }

    // Check if customer already exists (prevent enumeration)
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id, account_status')
      .eq('email', email)
      .single();

    if (existingCustomer) {
      // Don't reveal if account exists - always return success message
      // This prevents email enumeration attacks
      return NextResponse.json({
        success: true,
        message: 'If an account with this email doesn\'t exist, we\'ve created one. Please check your email to verify your account before signing in.',
        user: {
          id: 'hidden',
          accountNumber: 'hidden',
          firstName: 'hidden',
          lastName: 'hidden',
          email: email,
          phone: 'hidden',
          status: 'pending_verification'
        }
      }, { status: 201 });
    }

    // Generate account number
    const accountNumber = generateId('FB');

    try {
      // Create user in Supabase Auth with email verification required
      console.log('Creating user in Supabase Auth...');
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: false, // Require email verification
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          phone,
          account_type: 'customer'
        },
        app_metadata: {
          provider: 'email',
          providers: ['email']
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
      const { data: customer, error: customerError } = await supabaseAdmin
        .from('customers')
        .insert({
          id: authUser.user.id,
          account_number: accountNumber,
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          password_hash: hashedPassword,
          address_line1: address?.street || 'Not provided',
          city: address?.city || 'Not provided',
          state: address?.state || 'Not provided',
          zip_code: address?.zipCode || 'Not provided',
          account_status: 'pending_verification' // Account inactive until email verified
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

      // Send verification email using simple system
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-simple?email=${encodeURIComponent(email)}`;
      const emailResult = await sendEmail({
        to: email,
        subject: 'Verify Your Fisher Backflows Account',
        html: getVerificationEmailHtml(verificationUrl, `${firstName} ${lastName}`)
      });

      if (!emailResult.success) {
        console.error('Failed to send verification email:', emailResult.error);
      }

      console.log('Customer registration completed - email verification required');
      console.log('New customer registration:', {
        id: customer.id,
        accountNumber: customer.account_number,
        firstName: customer.first_name,
        lastName: customer.last_name,
        email: customer.email,
        phone: customer.phone,
        propertyType,
        emailSent: emailResult.success
      });

      return NextResponse.json({
        success: true,
        message: 'Account created successfully! Please check your email to verify your account before signing in.',
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