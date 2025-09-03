import { createClient } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.replace(/\s+/g, '').trim()
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s+/g, '').trim()

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' && 
  supabaseAnonKey !== 'your-anon-key-here')

// Browser client for client-side operations
export function createClientComponentClient() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  
  return createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!)
}

// Server client for server-side operations
export async function createServerComponentClient() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured')
  }
  
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // Server components can't set cookies
          }
        },
      },
    }
  )
}

// Route handler client for API routes
export function createRouteHandlerClient(
  request: NextRequest,
  response?: NextResponse
) {
  if (!isSupabaseConfigured) {
    console.warn('⚠️  Supabase not configured - system will use fallback mode')
    console.warn('   Create .env.local with Supabase credentials for full functionality')
    throw new Error('Supabase is not configured')
  }
  
  return createServerClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response?.cookies.set(name, value, options)
          })
        },
      },
    }
  )
}

// Admin client with service role key
export const supabaseAdmin = isSupabaseConfigured && supabaseServiceKey
  ? createClient<Database>(supabaseUrl!, supabaseServiceKey)
  : null

// Legacy client for backwards compatibility
export const supabase = isSupabaseConfigured 
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!)
  : null