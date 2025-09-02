import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient(request);

    // Verify the token with Supabase Auth
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type as 'signup' | 'recovery' | 'invite' || 'signup'
    });

    if (error) {
      console.error('Email verification error:', error);
      
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

    // Resend verification email
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/verify`
      }
    });

    if (error) {
      console.error('Resend verification error:', error);
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