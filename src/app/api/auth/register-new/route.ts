import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { createRouteHandlerClient } from '@/lib/supabase';
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
          retryAfter: rateLimitResult.blockedUntil ? Math.ceil((rateLimitResult.blockedUntil - Date.now()) / 1000) : 3600 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': (rateLimitResult.blockedUntil ? Math.ceil((rateLimitResult.blockedUntil - Date.now()) / 1000) : 3600).toString(),
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

    try {
      // Step 1: Create Supabase Auth user using client signUp method
      const supabase = createRouteHandlerClient(request);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`
          }
        }
      });

      if (authError || !authData.user) {
        console.error('Auth user creation failed:', authError);
        return NextResponse.json(
          { error: 'Failed to create user account' },
          { status: 500 }
        );
      }

      // Step 2: Generate account number
      const accountNumber = generateId('FB');

      // Step 3: Create customer record linked to auth user  
      const { data: customerData, error: customerError } = await supabaseAdmin
        .from('customers')
        .insert({
          auth_user_id: authData.user.id, // Link to auth user
          account_number: accountNumber,
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          address_line1: (address && address.street) ? address.street : 'Not provided',
          city: (address && address.city) ? address.city : 'Not provided',
          state: (address && address.state) ? address.state : 'TX',
          zip_code: (address && address.zipCode) ? address.zipCode : '00000',
          account_status: 'pending_verification'
        })
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

      return NextResponse.json({
        success: true,
        message: 'Account created successfully! Please check your email to verify your account before signing in.',
        user: {
          id: customerData.id,
          authUserId: authData.user.id,
          accountNumber: customerData.account_number,
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