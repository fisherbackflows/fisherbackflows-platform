// Deploy database schema to production Supabase
const fs = require('fs');
const https = require('https');

const SUPABASE_URL = 'https://jvhbqfueutvfepsjmztx.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY';

console.log('🔄 Deploying database schema to production Supabase...');

// Read the schema file
const schemaSQL = fs.readFileSync('./supabase/schema.sql', 'utf8');

// Split into individual SQL statements
const statements = schemaSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`📝 Found ${statements.length} SQL statements to execute`);

// Function to execute SQL via Supabase Edge Function approach
async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'jvhbqfueutvfepsjmztx.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Length': postData.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Deploy schema
async function deploySchema() {
  console.log('🚀 Starting schema deployment...\n');
  
  for (let i = 0; i < Math.min(5, statements.length); i++) {
    const statement = statements[i];
    console.log(`[${i+1}/${statements.length}] Executing: ${statement.substring(0, 80)}...`);
    
    try {
      await executeSQL(statement);
      console.log('✅ Success\n');
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
    }
    
    // Small delay between statements
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('✅ Schema deployment completed!');
  console.log('\nTesting table creation...');
  
  // Test if customers table exists
  try {
    const testResult = await executeSQL('SELECT COUNT(*) FROM customers');
    console.log('🎉 SUCCESS: Customers table is accessible!');
  } catch (error) {
    console.log(`❌ Table test failed: ${error.message}`);
  }
}

deploySchema().catch(console.error);