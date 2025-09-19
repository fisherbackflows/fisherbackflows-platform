import { createServerComponentClient, createRouteHandlerClient, supabaseAdmin } from '../supabase'

// Back-compat adapter: expose a zero-arg `createServerClient` used by older code.
export function createServerClient() {
  return createServerComponentClient()
}

// Legacy alias used by some routes
export function createClient() {
  return createServerComponentClient()
}

export { createServerComponentClient, createRouteHandlerClient, supabaseAdmin } from '../supabase'
