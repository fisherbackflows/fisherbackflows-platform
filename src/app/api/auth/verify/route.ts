import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const tokenHash = searchParams.get('token_hash'); // Supabase uses token_hash
    const type = searchParams.get('type');
    
    // Check for either token or token_hash (Supabase uses token_hash)
    const verificationToken = tokenHash || token;
    
    if (!verificationToken) {
      // Return HTML error page instead of JSON for better UX
      const errorUrl = new URL('/portal/verification-error', request.url);
      errorUrl.searchParams.set('error', 'Verification link is invalid or expired');
      return NextResponse.redirect(errorUrl);
    }

    const supabase = createRouteHandlerClient(request);

    console.log('Verifying token:', { 
      hasToken: !!token, 
      hasTokenHash: !!tokenHash, 
      type 
    });

    // Verify the token with Supabase Auth with timeout handling
    const verifyPromise = supabase.auth.verifyOtp({
      token_hash: verificationToken,
      type: type as 'signup' | 'recovery' | 'invite' || 'signup'
    });

    // Add timeout to verification (5 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Token verification timeout')), 5000);
    });

    const { data, error } = await Promise.race([
      verifyPromise,
      timeoutPromise
    ]) as any;

    if (error) {
      console.error('Email verification error:', error);
      
      // Handle timeout cases
      if (error.message === 'Token verification timeout') {
        const errorUrl = new URL('/portal/verification-error', request.url);
        errorUrl.searchParams.set('error', 'Verification took too long. Please try clicking the link again.');
        return NextResponse.redirect(errorUrl);
      }
      
      // Redirect to error page with specific error
      const errorUrl = new URL('/portal/verification-error', request.url);
      errorUrl.searchParams.set('error', error.message);
      return NextResponse.redirect(errorUrl);
    }

    if (!data.user) {
      const errorUrl = new URL('/portal/verification-error', request.url);
      errorUrl.searchParams.set('error', 'Invalid verification token');
      return NextResponse.redirect(errorUrl);
    }

    // Update customer status to active in database
    const { error: updateError } = await supabase
      .from('customers')
      .update({ 
        account_status: 'active',
        email_verified_at: new Date().toISOString()
      })
      .eq('id', data.user.id);

    if (updateError) {
      console.error('Error updating customer status:', updateError);
    }

    // Redirect to success page
    const successUrl = new URL('/portal/verification-success', request.url);
    return NextResponse.redirect(successUrl);

  } catch (error) {
    console.error('Email verification error:', error);
    const errorUrl = new URL('/portal/verification-error', request.url);
    errorUrl.searchParams.set('error', 'Verification failed');
    return NextResponse.redirect(errorUrl);
  }
}

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

    // Resend verification email with timeout handling
    const resendPromise = supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify`
      }
    });

    // Add timeout to resend operation (8 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Resend email timeout')), 8000);
    });

    const { error } = await Promise.race([
      resendPromise,
      timeoutPromise
    ]) as any;

    if (error) {
      console.error('Resend verification error:', error);
      
      // Handle timeout cases
      if (error.message === 'Resend email timeout') {
        return NextResponse.json(
          { error: 'Email resend took too long. Please try again in a moment.' },
          { status: 503 }
        );
      }
      
      // Handle rate limiting
      if (error.message?.includes('rate limit') || error.code === 'over_email_send_rate_limit') {
        return NextResponse.json(
          { error: 'Please wait at least 35 seconds between email resend requests.' },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to resend verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email has been resent. Please check your inbox.'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    );
  }
}