import 'server-only';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NODE_ENV: process.env.NODE_ENV,
      runtime: 'nodejs'
    };

    // Try to create supabase clients
    let clientTests = {
      anonClient: false,
      serviceClient: false,
      anonConnection: false,
      serviceConnection: false
    };

    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const anonClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        clientTests.anonClient = true;

        // Test connection
        const { data, error } = await anonClient.from('customers').select('count', { count: 'exact', head: true });
        clientTests.anonConnection = !error;
      }
    } catch (e) {
      console.error('Anon client error:', e);
    }

    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const serviceClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        clientTests.serviceClient = true;

        // Test connection and permissions
        const { data, error } = await serviceClient.from('customers').select('count', { count: 'exact', head: true });
        clientTests.serviceConnection = !error;
      }
    } catch (e) {
      console.error('Service client error:', e);
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envCheck,
      clients: clientTests,
      status: 'diagnostic_complete'
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Diagnostic failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}