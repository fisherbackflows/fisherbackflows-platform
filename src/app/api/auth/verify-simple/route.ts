import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { createRouteHandlerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      const errorUrl = new URL('/portal/verification-error', request.url);
      errorUrl.searchParams.set('error', 'Missing email parameter');
      return NextResponse.redirect(errorUrl);
    }

    console.log('Simple verification for email:', email);

    // Create Supabase client using service role (admin) permissions
    // Note: This bypasses RLS policies to directly update customer records
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Supabase configuration missing');
      const errorUrl = new URL('/portal/verification-error', request.url);
      errorUrl.searchParams.set('error', 'Server configuration error');
      return NextResponse.redirect(errorUrl);
    }

    // Direct database update using service role key
    const response = await fetch(`${supabaseUrl}/rest/v1/customers?email=eq.${encodeURIComponent(email)}&account_status=eq.pending_verification&select=id,email,account_status`, {
      method: 'GET',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    });

    if (!response.ok) {
      console.error('Database query failed:', response.status, response.statusText);
      const errorUrl = new URL('/portal/verification-error', request.url);
      errorUrl.searchParams.set('error', 'Database error');
      return NextResponse.redirect(errorUrl);
    }

    const customers = await response.json();
    
    if (!customers || customers.length === 0) {
      console.log('No pending verification account found for:', email);
      const errorUrl = new URL('/portal/verification-error', request.url);
      errorUrl.searchParams.set('error', 'Account not found or already verified');
      return NextResponse.redirect(errorUrl);
    }

    const customer = customers[0];
    console.log('Found customer:', customer.id);

    // Update customer to active status
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/customers?id=eq.${customer.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        account_status: 'active',
        updated_at: new Date().toISOString()
      })
    });

    if (!updateResponse.ok) {
      console.error('Customer update failed:', updateResponse.status);
      const errorUrl = new URL('/portal/verification-error', request.url);
      errorUrl.searchParams.set('error', 'Failed to activate account');
      return NextResponse.redirect(errorUrl);
    }

    // Update Supabase Auth user as well
    const authUpdateResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${customer.id}`, {
      method: 'PUT',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email_confirm: true
      })
    });

    if (!authUpdateResponse.ok) {
      console.warn('Auth user update failed, but continuing:', authUpdateResponse.status);
      // Continue anyway - customer record is updated
    }

    console.log('✅ Account verified successfully for:', email);
    
    // Redirect to success page
    const successUrl = new URL('/portal/verification-success', request.url);
    return NextResponse.redirect(successUrl);

  } catch (error) {
    console.error('Verification error:', error);
    const errorUrl = new URL('/portal/verification-error', request.url);
    errorUrl.searchParams.set('error', 'Server error during verification');
    return NextResponse.redirect(errorUrl);
  }
}