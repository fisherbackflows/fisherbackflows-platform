import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, recordAttempt, getClientIdentifier, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting';

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Rate limiting for verification attempts
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(clientId, RATE_LIMIT_CONFIGS.AUTH_LOGIN);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.redirect(
        new URL('/portal/verification-error?error=too-many-attempts', request.url)
      );
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/portal/verification-error?error=missing-token', request.url));
    }

    if (!supabaseAdmin) {
      console.error('Supabase admin client not available');
      return NextResponse.redirect(new URL('/portal/verification-error?error=server-error', request.url));
    }

    // Find the verification record
    const { data: verification, error: verificationError } = await supabaseAdmin
      .from('email_verifications')
      .select('*')
      .eq('token', token)
      .single();

    if (verificationError || !verification) {
      console.error('Verification token not found:', verificationError);
      recordAttempt(clientId, false, RATE_LIMIT_CONFIGS.AUTH_LOGIN);
      return NextResponse.redirect(new URL('/portal/verification-error?error=invalid-token', request.url));
    }

    // Check if token has expired
    const expiresAt = new Date(verification.expires_at);
    const now = new Date();
    
    if (now > expiresAt) {
      // Clean up expired token
      await supabaseAdmin
        .from('email_verifications')
        .delete()
        .eq('token', token);
      
      recordAttempt(clientId, false, RATE_LIMIT_CONFIGS.AUTH_LOGIN);
      return NextResponse.redirect(new URL('/portal/verification-error?error=expired-token', request.url));
    }

    // Update customer status to active
    const { error: updateError } = await supabaseAdmin
      .from('customers')
      .update({ 
        account_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', verification.user_id);

    if (updateError) {
      console.error('Failed to update customer status:', updateError);
      recordAttempt(clientId, false, RATE_LIMIT_CONFIGS.AUTH_LOGIN);
      return NextResponse.redirect(new URL('/portal/verification-error?error=update-failed', request.url));
    }

    // Update Supabase Auth user as verified
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
      verification.user_id,
      { email_confirm: true }
    );

    if (authUpdateError) {
      console.error('Failed to update auth status:', authUpdateError);
      // Continue anyway - customer record is updated
    }

    // Clean up verification token
    await supabaseAdmin
      .from('email_verifications')
      .delete()
      .eq('token', token);

    console.log('Email verification completed successfully for user:', verification.user_id);

    // Record successful verification
    recordAttempt(clientId, true, RATE_LIMIT_CONFIGS.AUTH_LOGIN);

    // Redirect to success page
    return NextResponse.redirect(new URL('/portal/verification-success', request.url));

  } catch (error) {
    console.error('Email verification error:', error);
    
    // Record failed verification
    const clientId = getClientIdentifier(request);
    recordAttempt(clientId, false, RATE_LIMIT_CONFIGS.AUTH_LOGIN);
    
    return NextResponse.redirect(new URL('/portal/verification-error?error=server-error', request.url));
  }
}