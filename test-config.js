// Test Supabase configuration detection
console.log('=== SUPABASE CONFIG TEST ===');
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('URL (trimmed):', process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());
console.log('ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 50) + '...');
console.log('SERVICE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 50) + '...');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' && 
  supabaseAnonKey !== 'your-anon-key-here')

console.log('isSupabaseConfigured:', isSupabaseConfigured);
console.log('URL check:', supabaseUrl !== 'https://your-project.supabase.co');
console.log('Key check:', supabaseAnonKey !== 'your-anon-key-here');