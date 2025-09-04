import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { sendEmail, getVerificationEmailHtml } from '@/lib/resend';
import { generateVerificationToken, storeVerificationToken } from '@/lib/verification-tokens';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient(request);

    console.log('Looking up customer for email:', email);
    
    // Find the customer by email
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'No account found with this email address' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (customer.account_status === 'active') {
      return NextResponse.json(
        { error: 'This email address is already verified' },
        { status: 400 }
      );
    }

    // Generate new verification token
    console.log('Generating new verification token...');
    const verificationToken = generateVerificationToken();
    
    // Store verification token in database
    await storeVerificationToken(customer.id, email, verificationToken, request);
    
    // Generate verification URL with custom token
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${verificationToken}`;
    
    // Send verification email via Resend
    console.log('Sending verification email via Resend...');
    const emailResult = await sendEmail({
      to: email,
      subject: 'Verify Your Email - Fisher Backflows',
      html: getVerificationEmailHtml(verificationUrl, `${customer.first_name} ${customer.last_name}`),
      from: 'Fisher Backflows <noreply@mail.fisherbackflows.com>',
      replyTo: 'fisherbackflows@gmail.com'
    });

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

    console.log('Verification email resent successfully via Resend');

    return NextResponse.json({
      success: true,
      message: 'Verification email has been sent! Please check your inbox.',
      emailSentTo: email
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    );
  }
}