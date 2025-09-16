import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { createRouteHandlerClient } from '@/lib/supabase';
import { checkRateLimit, recordAttempt, getClientIdentifier, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting';

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Rate limiting for password reset attempts
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(clientId, 'passwordReset');

    if (!rateLimitResult.allowed) {
      const retryAfterSeconds = rateLimitResult.blockedUntil
        ? Math.ceil((rateLimitResult.blockedUntil - Date.now()) / 1000)
        : 900;
      return NextResponse.json(
        {
          error: 'Too many password reset attempts. Please try again later.',
          retryAfter: retryAfterSeconds
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfterSeconds.toString(),
          }
        }
      );
    }

    const { identifier, type } = await request.json();
    
    if (!identifier || !type) {
      return NextResponse.json(
        { error: 'Email or phone number is required' },
        { status: 400 }
      );
    }
    
    const supabase = createRouteHandlerClient(request);
    
    // For email type, use Supabase auth password reset
    if (type === 'email') {
      const { error } = await supabase.auth.resetPasswordForEmail(identifier, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/portal/reset-password`
      });
      
      if (error) {
        console.error('Password reset email error:', error);
        // Don't reveal if user exists - always return success for security
      }

      // Record successful password reset attempt
      recordAttempt(clientId, 'passwordReset', true);

      return NextResponse.json({
        success: true,
        message: 'If an account exists with that email, you will receive reset instructions.'
      });
    }
    
    // For phone type, we'll need to implement SMS or use a different approach
    // For now, check if user exists in customers table by phone
    if (type === 'phone') {
      const normalizedPhone = identifier.replace(/\D/g, '');
      
      // Check if customer exists by phone
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('email')
        .eq('phone', identifier)
        .single();
      
      if (customerError || !customer) {
        // Don't reveal if user exists - always return success for security
        return NextResponse.json({
          success: true,
          message: 'If an account exists with that phone number, you will receive reset instructions.'
        });
      }
      
      // Send reset to the associated email
      const { error } = await supabase.auth.resetPasswordForEmail(customer.email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/portal/reset-password`
      });
      
      if (error) {
        console.error('Password reset for phone lookup error:', error);
      }

      // Record successful password reset attempt
      recordAttempt(clientId, 'passwordReset', true);

      return NextResponse.json({
        success: true,
        message: 'If an account exists with that phone number, reset instructions have been sent to your associated email.'
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid reset type' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Password reset error:', error);

    // Record failed attempt
    const clientId = getClientIdentifier(request);
    recordAttempt(clientId, 'passwordReset', false);

    return NextResponse.json(
      { error: 'Failed to process reset request' },
      { status: 500 }
    );
  }
}