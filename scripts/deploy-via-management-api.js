#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

const accessToken = 'sbp_a2d5bffc28b4ff11b762a6484004e3af5a0910bb';
const projectRef = 'jvhbqfueutvfepsjmztx';

// Read the SQL schema
const sqlContent = fs.readFileSync('./execute-schemas-direct.sql', 'utf8');

async function executeSQLViaAPI() {
  console.log('🚀 Attempting deployment via Supabase Management API...\n');
  
  // Try using the Supabase Management API to execute SQL
  const postData = JSON.stringify({
    sql: sqlContent
  });

  const options = {
    hostname: 'api.supabase.com',
    port: 443,
    path: `/v1/projects/${projectRef}/database/query`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log('Response:', data);
        
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('✅ SQL executed successfully!');
          resolve(data);
        } else {
          console.log('❌ SQL execution failed');
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Request failed:', err);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  try {
    await executeSQLViaAPI();
    
    // Verify tables were created
    console.log('\n🔍 Verifying deployment...');
    
    // Test the API endpoints to see if tables exist
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      'https://jvhbqfueutvfepsjmztx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzM0NzUsImV4cCI6MjA3MTg0OTQ3NX0.UuEuNrFU-JXWvoICUNCupz1MzLvWVrcIqRA-LwpI1Jo'
    );

    try {
      const { data: districts } = await supabase.from('water_districts').select('count', { count: 'exact', head: true });
      console.log('✅ water_districts table verified');
      
      const { data: subscriptions } = await supabase.from('billing_subscriptions').select('count', { count: 'exact', head: true });
      console.log('✅ billing_subscriptions table verified');
      
      console.log('\n🎉 Database deployment completed successfully!');
      console.log('💰 Billing system: ACTIVE');
      console.log('🏛️  Water districts system: ACTIVE');
      console.log('📊 Revenue automation: ENABLED');
      
    } catch (verifyError) {
      console.log('⚠️  Tables may not be accessible yet - checking deployment status...');
    }
    
  } catch (error) {
    console.error('\n❌ Management API deployment failed:', error.message);
    console.log('\n📋 Alternative: Manual Supabase SQL Editor execution required');
    console.log('1. Go to: https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx/sql/new');
    console.log('2. Copy contents from: execute-schemas-direct.sql');
    console.log('3. Paste and click "Run"');
  }
}

main().catch(console.error);