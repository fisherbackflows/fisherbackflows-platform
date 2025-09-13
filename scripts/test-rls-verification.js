#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = 'https://jvhbqfueutvfepsjmztx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function testRLSImplementation() {
    console.log('🔍 Testing RLS Implementation Status');
    console.log('====================================\n');

    // Test 1: Check if RLS is enabled on core tables
    console.log('1. Checking RLS status on core tables...');
    
    const coreTableStatuses = {};
    const coreTables = ['customers', 'devices', 'appointments', 'test_reports', 'invoices', 'payments'];
    
    for (const table of coreTables) {
        try {
            // Test with anon client (should be blocked if RLS is working)
            const { data: anonData, error: anonError } = await supabaseAnon
                .from(table)
                .select('id')
                .limit(1);
                
            // Test with service role (should always work)
            const { data: serviceData, error: serviceError } = await supabaseService
                .from(table)
                .select('id')
                .limit(1);
            
            coreTableStatuses[table] = {
                rlsWorking: anonData && anonData.length === 0, // RLS working if anon gets empty array
                serviceAccess: serviceData && serviceData.length > 0, // Service role should have access
                anonError: anonError?.message,
                serviceError: serviceError?.message
            };
            
            const status = coreTableStatuses[table];
            if (status.rlsWorking && status.serviceAccess) {
                console.log(`   ✅ ${table}: RLS working correctly`);
            } else if (!status.rlsWorking && status.serviceAccess) {
                console.log(`   ⚠️  ${table}: RLS not implemented (anon can access data)`);
            } else {
                console.log(`   ❌ ${table}: Issues detected - anon error: ${status.anonError}, service error: ${status.serviceError}`);
            }
            
        } catch (err) {
            console.log(`   ❌ ${table}: Test failed - ${err.message}`);
            coreTableStatuses[table] = { error: err.message };
        }
    }
    
    // Test 2: Check if helper functions exist
    console.log('\n2. Checking helper functions...');
    
    try {
        // Try to call a helper function to see if it exists
        const { data, error } = await supabaseService.rpc('is_team_member', { user_id: '00000000-0000-0000-0000-000000000000' });
        
        if (error && error.message.includes('function') && error.message.includes('does not exist')) {
            console.log('   ⚠️  Helper functions (is_team_member, is_admin) not implemented');
        } else {
            console.log('   ✅ Helper functions available');
        }
    } catch (err) {
        console.log('   ⚠️  Helper functions status unknown');
    }
    
    // Test 3: Check customer isolation with mock authentication
    console.log('\n3. Testing customer data isolation...');
    
    try {
        // Get a real customer ID for testing
        const { data: customers } = await supabaseService
            .from('customers')
            .select('id')
            .limit(1);
            
        if (customers && customers.length > 0) {
            const customerId = customers[0].id;
            console.log(`   Using customer ID: ${customerId}`);
            
            // Create a test session for this customer
            const { data: authData, error: authError } = await supabaseAnon.auth.signInAnonymously();
            
            if (authError) {
                console.log(`   ⚠️  Could not create test session: ${authError.message}`);
            } else {
                console.log('   ✅ Test session created');
                
                // Try to access customer data with this session
                const { data: customerData, error: customerError } = await supabaseAnon
                    .from('customers')
                    .select('id')
                    .eq('id', customerId);
                    
                if (customerError) {
                    console.log(`   ✅ Customer data properly isolated: ${customerError.message}`);
                } else if (customerData && customerData.length === 0) {
                    console.log('   ✅ Customer data properly isolated (empty result)');
                } else {
                    console.log('   ⚠️  Customer data not properly isolated');
                }
            }
        } else {
            console.log('   ⚠️  No customers found for testing');
        }
    } catch (err) {
        console.log(`   ❌ Customer isolation test failed: ${err.message}`);
    }
    
    // Summary
    console.log('\n📊 SUMMARY');
    console.log('==========');
    
    const workingRLS = Object.values(coreTableStatuses).filter(s => s.rlsWorking).length;
    const totalTables = coreTables.length;
    
    console.log(`✅ Tables with working RLS: ${workingRLS}/${totalTables}`);
    console.log(`⚠️  Tables needing RLS: ${totalTables - workingRLS}/${totalTables}`);
    
    if (workingRLS === totalTables) {
        console.log('🎉 All core tables have RLS properly implemented!');
    } else {
        console.log('📝 Next steps:');
        console.log('   1. Execute the RLS policies in Supabase SQL Editor');
        console.log('   2. Use the implement-comprehensive-rls.sql script');
        console.log('   3. Re-run this verification after implementation');
    }
    
    return coreTableStatuses;
}

testRLSImplementation().catch(console.error);