#!/usr/bin/env node

/**
 * EMERGENCY RLS FIX - CRITICAL SECURITY VULNERABILITY PATCH
 * This script immediately protects the exposed customer data tables
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyEmergencyRLSFix() {
  console.log('🚨 APPLYING EMERGENCY RLS FIX');
  console.log('=============================');
  console.log('⚠️  CRITICAL SECURITY VULNERABILITY DETECTED');
  console.log('🔧 Immediately protecting exposed customer data...\n');

  try {
    // Read the emergency RLS fix SQL
    const sqlContent = fs.readFileSync('./EMERGENCY_RLS_FIX.sql', 'utf8');
    
    // Split into individual statements (rough approach)
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.includes('==='));

    console.log(`📄 Executing ${statements.length} SQL statements...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.length < 10) continue; // Skip tiny statements
      
      try {
        console.log(`🔧 [${i+1}/${statements.length}] Executing statement...`);
        
        // Use the sql template literal function
        const { data, error } = await supabase.sql`${statement}`;
        
        if (error) {
          console.log(`❌ Error: ${error.message}`);
          errorCount++;
        } else {
          console.log(`✅ Success`);
          successCount++;
          
          // If this looks like a verification query, show results
          if (data && data.length > 0 && (statement.includes('SELECT') || statement.includes('status'))) {
            console.log('   Results:', data);
          }
        }
      } catch (err) {
        console.log(`❌ Exception: ${err.message}`);
        errorCount++;
      }
      
      console.log(''); // Empty line for readability
    }

    console.log('📊 EXECUTION SUMMARY');
    console.log('-------------------');
    console.log(`✅ Successful operations: ${successCount}`);
    console.log(`❌ Failed operations: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 EMERGENCY RLS FIX COMPLETED SUCCESSFULLY!');
      console.log('🔒 Customer data is now protected');
    } else {
      console.log('\n⚠️ Some operations failed. Manual intervention may be required.');
    }

  } catch (error) {
    console.error('❌ Failed to apply emergency RLS fix:', error.message);
    
    // Fallback: Apply individual critical protections
    console.log('\n🔄 Attempting fallback individual table protection...');
    await applyFallbackProtection();
  }
}

async function applyFallbackProtection() {
  const tables = ['devices', 'appointments', 'test_reports', 'invoices', 'payments'];
  
  for (const table of tables) {
    try {
      console.log(`🔧 Enabling RLS on ${table}...`);
      
      const { error } = await supabase.sql`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`;
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: RLS enabled`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
}

// Execute the fix
applyEmergencyRLSFix().catch(console.error);