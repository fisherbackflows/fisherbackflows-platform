#!/usr/bin/env node

/**
 * EMERGENCY SCRIPT: Disable RLS on customers table
 * 
 * This script creates a SQL migration file that can be executed manually
 * in the Supabase SQL Editor to disable RLS on the customers table.
 */

const fs = require('fs');
const path = require('path');

const sqlContent = `-- EMERGENCY: Disable RLS on customers table
-- Execute this SQL in Supabase SQL Editor

-- Disable RLS on customers table
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- Drop all existing RLS policies on customers table (if any)
DROP POLICY IF EXISTS "customers_policy_select" ON customers;
DROP POLICY IF EXISTS "customers_policy_insert" ON customers;
DROP POLICY IF EXISTS "customers_policy_update" ON customers;
DROP POLICY IF EXISTS "customers_policy_delete" ON customers;
DROP POLICY IF EXISTS "customer_select_own" ON customers;
DROP POLICY IF EXISTS "customer_insert_own" ON customers;
DROP POLICY IF EXISTS "customer_update_own" ON customers;
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON customers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON customers;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON customers;

-- Verify RLS is disabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'customers';

-- The rowsecurity column should show 'f' (false) for customers table
`;

const outputFile = path.join(__dirname, 'disable-rls-customers.sql');

try {
    fs.writeFileSync(outputFile, sqlContent);
    console.log('✅ Emergency SQL file created:', outputFile);
    console.log('\n🚨 MANUAL ACTION REQUIRED:');
    console.log('1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx/sql/new');
    console.log('2. Copy and paste the contents of disable-rls-customers.sql');
    console.log('3. Execute the SQL commands');
    console.log('4. Verify that rowsecurity shows "f" for customers table');
    console.log('\n📄 SQL Content:');
    console.log('================');
    console.log(sqlContent);
} catch (error) {
    console.error('❌ Failed to create SQL file:', error.message);
    process.exit(1);
}