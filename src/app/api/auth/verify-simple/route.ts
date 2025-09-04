import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      const errorUrl = new URL('/portal/verification-error', request.url);
      errorUrl.searchParams.set('error', 'Verification link is invalid or missing email');
      return NextResponse.redirect(errorUrl);
    }

    console.log('Verifying account for email:', email);

    const supabase = createRouteHandlerClient(request);

    // Find and activate the customer account
    const { data: customer, error: findError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .single();

    if (findError || !customer) {
      console.error('Customer not found:', findError);
      const errorUrl = new URL('/portal/verification-error', request.url);
      errorUrl.searchParams.set('error', 'Account not found');
      return NextResponse.redirect(errorUrl);
    }

    // Update customer status to active
    const { error: updateError } = await supabase
      .from('customers')
      .update({ 
        account_status: 'active'
      })
      .eq('email', email);

    if (updateError) {
      console.error('Failed to activate account:', updateError);
      const errorUrl = new URL('/portal/verification-error', request.url);
      errorUrl.searchParams.set('error', 'Failed to activate account');
      return NextResponse.redirect(errorUrl);
    }

    // Also update the auth user to confirmed if needed
    const { error: confirmError } = await supabase.auth.admin.updateUserById(
      customer.id,
      { email_confirm: true }
    );

    if (confirmError) {
      console.warn('Warning: Could not confirm auth email:', confirmError);
      // Don't fail - customer record is already activated
    }

    console.log('Account verified and activated successfully for:', email);
    
    // Redirect to success page
    const successUrl = new URL('/portal/verification-success', request.url);
    successUrl.searchParams.set('email', email);
    return NextResponse.redirect(successUrl);

  } catch (error) {
    console.error('Email verification error:', error);
    const errorUrl = new URL('/portal/verification-error', request.url);
    errorUrl.searchParams.set('error', 'Verification failed due to server error');
    return NextResponse.redirect(errorUrl);
  }
}