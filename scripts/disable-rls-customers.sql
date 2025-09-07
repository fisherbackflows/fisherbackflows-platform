-- EMERGENCY: Disable RLS on customers table
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
