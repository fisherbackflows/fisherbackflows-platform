import 'server-only';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('[simple-register] Starting simple registration test');
    
    // Environment check
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        error: 'Missing environment variables',
        details: {
          url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      }, { status: 500 });
    }

    const body = await request.json();
    const { email, password, firstName, lastName, phone } = body;

    console.log('[simple-register] Creating clients');
    
    // Create both clients
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('[simple-register] Creating auth user with anon client');

    // Step 1: Create auth user
    const { data: signUpData, error: signUpError } = await supabaseAnon.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      console.error('[simple-register] Auth signup failed:', signUpError);
      return NextResponse.json({
        error: 'Auth signup failed',
        details: signUpError.message
      }, { status: 400 });
    }

    if (!signUpData.user?.id) {
      return NextResponse.json({
        error: 'No user ID returned from auth signup'
      }, { status: 500 });
    }

    console.log('[simple-register] Auth user created:', signUpData.user.id);
    console.log('[simple-register] Creating customer record with admin client');

    // Step 2: Create customer record using admin client
    const { data: customerData, error: customerError } = await supabaseAdmin
      .from('customers')
      .insert({
        auth_user_id: signUpData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        account_number: `FB${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        account_status: 'active',
      })
      .select()
      .single();

    if (customerError) {
      console.error('[simple-register] Customer creation failed:', customerError);
      return NextResponse.json({
        error: 'Customer creation failed',
        details: customerError.message,
        code: customerError.code
      }, { status: 500 });
    }

    console.log('[simple-register] Customer created:', customerData.id);

    return NextResponse.json({
      success: true,
      message: 'Simple registration successful',
      user: {
        id: customerData.id,
        authUserId: signUpData.user.id,
        email: customerData.email,
        accountNumber: customerData.account_number,
        status: customerData.account_status
      }
    });

  } catch (error) {
    console.error('[simple-register] Unexpected error:', error);
    return NextResponse.json({
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}