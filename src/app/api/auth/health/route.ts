import 'server-only'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()

  const env = {
    NEXT_PUBLIC_SUPABASE_URL: Boolean(supabaseUrl),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(anonKey),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(serviceKey),
    NEXT_PUBLIC_APP_URL: Boolean(appUrl),
  }

  let db = { connected: false as boolean, error: undefined as string | undefined }

  // Attempt a minimal DB call using the service role (no sensitive data returned)
  if (supabaseUrl && serviceKey) {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const serviceClient = createClient(supabaseUrl, serviceKey)
      const { error } = await serviceClient.from('customers').select('id', { count: 'exact', head: true })
      if (error) {
        db = { connected: false, error: error.message }
      } else {
        db = { connected: true, error: undefined }
      }
    } catch (e: any) {
      db = { connected: false, error: e?.message || 'unknown error' }
    }
  }

  return NextResponse.json({ ok: true, env, db })
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

