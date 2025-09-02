import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
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
    return NextResponse.json(
      { error: 'Failed to process reset request' },
      { status: 500 }
    );
  }
}