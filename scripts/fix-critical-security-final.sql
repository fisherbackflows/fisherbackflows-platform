-- FINAL CRITICAL SECURITY FIXES FOR FISHER BACKFLOWS PLATFORM
-- Run this AFTER running fix-missing-columns.sql

-- 1. Fix billing_invoices table (missing RLS policies)
DROP POLICY IF EXISTS "Users can view their own invoices" ON billing_invoices;
CREATE POLICY "Users can view their own invoices"
ON billing_invoices FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Service role can manage all invoices" ON billing_invoices;
CREATE POLICY "Service role can manage all invoices"
ON billing_invoices FOR ALL
TO service_role
USING (true);

-- 2. Fix security_logs table (missing RLS policies)
-- Now that user_id column exists
DROP POLICY IF EXISTS "Users can view their own security logs" ON security_logs;
CREATE POLICY "Users can view their own security logs"
ON security_logs FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Service role can manage all security logs" ON security_logs;
CREATE POLICY "Service role can manage all security logs"
ON security_logs FOR ALL
TO service_role
USING (true);

-- 3. Fix technician_current_location table (missing RLS policies)
DROP POLICY IF EXISTS "Technicians can manage their own location" ON technician_current_location;
CREATE POLICY "Technicians can manage their own location"
ON technician_current_location FOR ALL
TO authenticated
USING (
  technician_id IN (
    SELECT id FROM team_users WHERE auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Service role can manage all locations" ON technician_current_location;
CREATE POLICY "Service role can manage all locations"
ON technician_current_location FOR ALL
TO service_role
USING (true);

-- 4. Fix technician_locations table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'technician_locations') THEN
    -- Drop existing policies first
    DROP POLICY IF EXISTS "Technicians can manage their own location history" ON technician_locations;
    DROP POLICY IF EXISTS "Service role can manage all location history" ON technician_locations;

    -- Create new policies
    EXECUTE 'CREATE POLICY "Technicians can manage their own location history"
    ON technician_locations FOR ALL
    TO authenticated
    USING (
      technician_id IN (
        SELECT id FROM team_users WHERE auth_user_id = auth.uid()
      )
    )';

    EXECUTE 'CREATE POLICY "Service role can manage all location history"
    ON technician_locations FOR ALL
    TO service_role
    USING (true)';
  END IF;
END $$;

-- 5. Fix function security issue (if function exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    ALTER FUNCTION update_updated_at_column() SET search_path = '';
  END IF;
END $$;

-- 6. Customer data access policies
DROP POLICY IF EXISTS "Customers can only access their own data" ON customers;
CREATE POLICY "Customers can only access their own data"
ON customers FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Customers can update their own profile" ON customers;
CREATE POLICY "Customers can update their own profile"
ON customers FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- 7. Device access policies
DROP POLICY IF EXISTS "Customers can view their own devices" ON devices;
CREATE POLICY "Customers can view their own devices"
ON devices FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Customers can manage their own devices" ON devices;
CREATE POLICY "Customers can manage their own devices"
ON devices FOR ALL
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

-- 8. Appointment access policies
DROP POLICY IF EXISTS "Customers can view their own appointments" ON appointments;
CREATE POLICY "Customers can view their own appointments"
ON appointments FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Customers can create appointments for their devices" ON appointments;
CREATE POLICY "Customers can create appointments for their devices"
ON appointments FOR INSERT
TO authenticated
WITH CHECK (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

-- 9. Test report access policies
DROP POLICY IF EXISTS "Customers can view their own test reports" ON test_reports;
CREATE POLICY "Customers can view their own test reports"
ON test_reports FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

-- 10. Payment access policies (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
    DROP POLICY IF EXISTS "Customers can view their own payments" ON payments;
    EXECUTE 'CREATE POLICY "Customers can view their own payments"
    ON payments FOR SELECT
    TO authenticated
    USING (
      customer_id IN (
        SELECT id FROM customers WHERE auth_user_id = auth.uid()
      )
    )';
  END IF;
END $$;

-- 11. Invoice access policies (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
    DROP POLICY IF EXISTS "Customers can view their own invoices" ON invoices;
    EXECUTE 'CREATE POLICY "Customers can view their own invoices"
    ON invoices FOR SELECT
    TO authenticated
    USING (
      customer_id IN (
        SELECT id FROM customers WHERE auth_user_id = auth.uid()
      )
    )';
  END IF;
END $$;

-- 12. Service role policies for all tables
CREATE POLICY "Service role full access customers"
ON customers FOR ALL
TO service_role
USING (true);

CREATE POLICY "Service role full access devices"
ON devices FOR ALL
TO service_role
USING (true);

CREATE POLICY "Service role full access appointments"
ON appointments FOR ALL
TO service_role
USING (true);

CREATE POLICY "Service role full access test_reports"
ON test_reports FOR ALL
TO service_role
USING (true);

-- Show created policies for verification
SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('security_logs', 'billing_invoices', 'technician_current_location', 'customers', 'devices', 'appointments', 'test_reports')
ORDER BY tablename, policyname;