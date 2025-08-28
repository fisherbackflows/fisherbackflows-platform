import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    supabase: {
      url: url ? (url === 'https://your-project.supabase.co' ? 'PLACEHOLDER' : 'SET') : 'MISSING',
      anonKey: anonKey ? (anonKey === 'your-anon-key-here' ? 'PLACEHOLDER' : 'SET') : 'MISSING',
      serviceKey: serviceKey ? (serviceKey === 'your-service-role-key-here' ? 'PLACEHOLDER' : 'SET') : 'MISSING',
      urlPreview: url ? url.substring(0, 30) + '...' : 'N/A'
    }
  })
}