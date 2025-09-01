import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createRouteHandlerClient, supabaseAdmin } from '@/lib/supabase';
import { generateId } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
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
    const saltRounds = 12;
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
      // Create user in Supabase Auth using regular signup
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone,
            account_type: 'customer'
          }
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
          account_status: 'active'
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