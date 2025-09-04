import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailToken } from '@/lib/verification-tokens';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      const errorUrl = new URL('/portal/verification-error', request.url);
      errorUrl.searchParams.set('error', 'Verification link is invalid or missing token');
      return NextResponse.redirect(errorUrl);
    }

    console.log('Verifying email token:', token.substring(0, 10) + '...');

    // Verify the custom token (NOT Supabase token)
    const result = await verifyEmailToken(token, request);
    
    if (!result.success) {
      console.error('Token verification failed:', result.error);
      const errorUrl = new URL('/portal/verification-error', request.url);
      errorUrl.searchParams.set('error', result.error);
      return NextResponse.redirect(errorUrl);
    }

    console.log('Email verified successfully for user:', result.userId);
    
    // Redirect to success page
    const successUrl = new URL('/portal/verification-success', request.url);
    successUrl.searchParams.set('email', result.email);
    return NextResponse.redirect(successUrl);

  } catch (error) {
    console.error('Email verification error:', error);
    const errorUrl = new URL('/portal/verification-error', request.url);
    errorUrl.searchParams.set('error', 'Verification failed due to server error');
    return NextResponse.redirect(errorUrl);
  }
}