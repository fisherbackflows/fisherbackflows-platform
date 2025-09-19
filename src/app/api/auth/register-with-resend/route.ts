import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { createRouteHandlerClient } from '@/lib/supabase';
import { sendEmail, getVerificationEmailHtml } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, phone, address } = body;

    // Validate required fields
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient(request);

    // Step 1: Create user in Supabase Auth
    console.log('Creating user in Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify`
      }
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Step 2: Create customer record
    console.log('Creating customer record...');
    const { error: customerError } = await supabase
      .from('customers')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        phone: phone || null,
        address: address || null,
        account_status: 'pending',
        created_at: new Date().toISOString()
      });

    if (customerError) {
      console.error('Customer creation error:', customerError);
      // Don't return error - user is created but customer record failed
      // This can be fixed manually
    }

    // Step 3: Send verification email using Resend
    console.log('Sending verification email via Resend...');
    
    // Generate verification URL
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${authData.session?.access_token || ''}&type=signup`;
    
    const emailResult = await sendEmail({
      to: email,
      subject: 'Welcome to Fisher Backflows - Verify Your Email',
      html: getVerificationEmailHtml(verificationUrl, fullName),
      from: 'Fisher Backflows <noreply@mail.fisherbackflows.com>',
      replyTo: 'fisherbackflows@gmail.com'
    });

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      
      // Try Supabase fallback
      console.log('Attempting Supabase email fallback...');
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });
      
      if (resendError) {
        console.error('Supabase email also failed:', resendError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      user: {
        id: authData.user.id,
        email: authData.user.email
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}