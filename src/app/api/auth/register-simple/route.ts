import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, supabaseAdmin } from '@/lib/supabase';
import { sendEmail, getVerificationEmailHtml } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Simple Registration - Starting...');

    const body = await request.json();
    const { firstName, lastName, email, phone, password, address } = body;

    // Basic validation
    if (!firstName || !lastName || !email || !password || !phone) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    console.log('📧 Creating customer:', email);

    // Step 1: Create auth user with Supabase Admin (no email confirmation required)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // We'll handle verification ourselves
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
      }
    });

    if (authError || !authData.user) {
      console.error('❌ Auth user creation failed:', authError);
      const message = authError?.message?.includes('already registered')
        ? 'An account with this email already exists'
        : 'Failed to create user account';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.log('✅ Auth user created:', authData.user.id);

    // Step 2: Create customer record
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .insert({
        auth_user_id: authData.user.id,
        account_number: `FB-${Date.now()}`,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        address_line1: address?.street || 'Not provided',
        city: address?.city || 'Not provided',
        state: address?.state || 'WA',
        zip_code: address?.zipCode || '00000',
        account_status: 'pending_verification'
      })
      .select()
      .single();

    if (customerError || !customer) {
      console.error('❌ Customer creation failed:', customerError);
      // Cleanup auth user
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError);
      }
      return NextResponse.json({ error: 'Failed to create customer record' }, { status: 500 });
    }

    console.log('✅ Customer record created:', customer.id);

    // Step 3: Send verification email
    console.log('📧 Sending verification email...');

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-simple?email=${encodeURIComponent(email)}`;

    const emailResult = await sendEmail({
      to: email,
      subject: 'Welcome to Fisher Backflows - Verify Your Email',
      html: getVerificationEmailHtml(verificationUrl, `${firstName} ${lastName}`),
    });

    let emailSent = false;
    if (emailResult.success) {
      console.log('✅ Verification email sent successfully');
      emailSent = true;
    } else {
      console.error('❌ Failed to send verification email:', emailResult.error);
    }

    return NextResponse.json({
      success: true,
      message: emailSent
        ? 'Account created successfully! Please check your email to verify your account.'
        : 'Account created successfully! Please contact support to verify your account.',
      user: {
        id: customer.id,
        authUserId: authData.user.id,
        accountNumber: customer.account_number,
        firstName,
        lastName,
        email,
        phone,
        status: 'pending_verification',
        emailSent
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed due to an unexpected error' },
      { status: 500 }
    );
  }
}