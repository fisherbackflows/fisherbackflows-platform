import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { sendEmail, getVerificationEmailHtml } from '@/lib/resend';

// This endpoint can be used to manually trigger verification emails with Resend
// while still using Supabase's token system
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

    // Use Supabase to generate a proper verification token
    console.log('Generating verification token via Supabase...');
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/portal/verification-success`
      }
    });

    if (resendError) {
      console.error('Supabase resend error:', resendError);
      return NextResponse.json(
        { error: 'Failed to send verification email: ' + resendError.message },
        { status: 500 }
      );
    }

    // Note: For now, we're using Supabase's built-in email system
    // because it properly generates the token_hash needed for verification
    // Resend will be used for other transactional emails

    return NextResponse.json({
      success: true,
      message: 'Verification email has been sent. Please check your inbox.',
      note: 'Email sent via Supabase Auth (includes proper verification token)'
    });

  } catch (error) {
    console.error('Send verification error:', error);
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    );
  }
}