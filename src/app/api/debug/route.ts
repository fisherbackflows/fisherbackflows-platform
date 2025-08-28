import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      supabaseConfig: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing', 
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
        urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...', // Show partial URL
        appUrl: process.env.NEXT_PUBLIC_APP_URL
      },
      vercelInfo: {
        region: process.env.VERCEL_REGION,
        deployment: process.env.VERCEL_DEPLOYMENT_ID?.substring(0, 8) + '...',
        env: process.env.VERCEL_ENV
      }
    }

    return NextResponse.json(debugInfo, { status: 200 })

  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}