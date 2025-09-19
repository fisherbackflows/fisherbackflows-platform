import { createClientComponentClient, supabase } from '../supabase'

// Back-compat adapter: some modules import `createClient` from this path.
// It returns a ready Supabase client, preferring the shared instance.
export function createClient() {
  if (supabase) return supabase
  return createClientComponentClient()
}

export { createClientComponentClient, supabase } from '../supabase'
