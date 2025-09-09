const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jvhbqfueutvfepsjmztx.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY'
);

async function checkSchema() {
  // Get table information
  const { data, error } = await supabase.rpc('run_sql', {
    query: `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'devices'
      ORDER BY ordinal_position;
    `
  }).single();
  
  if (error) {
    // Fallback: try to get existing devices
    const { data: devices, error: devError } = await supabase
      .from('devices')
      .select('*')
      .limit(1);
    
    if (devices && devices.length > 0) {
      console.log('Sample device columns:', Object.keys(devices[0]));
    } else {
      console.log('No devices found in table');
    }
  } else {
    console.log('Devices table columns:', data);
  }
}

checkSchema();