import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, supabaseAdmin } from '@/lib/supabase';
import { generateId } from '@/lib/utils';
import { checkRateLimit, recordAttempt, getClientIdentifier, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting';
import { sendEmail, getVerificationEmailHtml } from '@/lib/resend';
import { hashPassword } from '@/lib/simple-hash';

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

    // Hash the password using simple SHA-256 - EXTREME DEBUGGING
    console.log('=== HASH DEBUG START ===');
    console.log('Input password:', password);
    
    let hashedPassword: string;
    try {
      console.log('About to call hashPassword...');
      hashedPassword = await hashPassword(password);
      console.log('Hash result:', hashedPassword);
      console.log('Hash length:', hashedPassword?.length);
      console.log('Hash first 10 chars:', hashedPassword?.substring(0, 10));
    } catch (hashError) {
      console.error('Password hashing failed:', hashError);
      hashedPassword = 'HASH_ERROR:' + password;
      console.log('Using hash error fallback');
    }
    
    if (!hashedPassword) {
      console.error('Hash is null or undefined!');
      hashedPassword = 'NULL_ERROR:' + password;
    }
    
    console.log('Final hash to insert:', hashedPassword);
    console.log('=== HASH DEBUG END ===');

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
      // Generate UUID for customer
      const customerId = crypto.randomUUID();
      console.log('Creating customer record only (no Supabase Auth)...');

      // Create customer record in database using direct API call
      console.log('Inserting customer with hash length:', hashedPassword?.length);
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvhbqfueutvfepsjmztx.supabase.co';
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY';
      
      const customerData = {
        id: customerId,
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
        account_status: 'pending_verification'
      };
      
      console.log('=== DATABASE INSERT DEBUG ===');
      console.log('customerData.password_hash:', customerData.password_hash);
      console.log('customerData keys:', Object.keys(customerData));
      console.log('JSON.stringify customerData:', JSON.stringify(customerData));
      console.log('=== DATABASE INSERT DEBUG END ===');
      
      const response = await fetch(`${supabaseUrl}/rest/v1/customers`, {
        method: 'POST',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(customerData)
      });
      
      console.log('=== DATABASE RESPONSE DEBUG ===');
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Customer creation failed:', response.status, errorText);
        return NextResponse.json(
          { error: 'Failed to create customer record' },
          { status: 500 }
        );
      }
      
      const responseText = await response.text();
      console.log('Raw response body:', responseText);
      
      let customers;
      try {
        customers = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        return NextResponse.json({ error: 'Response parse error' }, { status: 500 });
      }
      
      const customer = Array.isArray(customers) ? customers[0] : customers;
      console.log('Parsed customer data:', customer);
      console.log('Customer password_hash from response:', customer?.password_hash);
      
      if (!customer) {
        return NextResponse.json(
          { error: 'Failed to create customer record' },
          { status: 500 }
        );
      }
      
      console.log('=== DATABASE RESPONSE DEBUG END ===');

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