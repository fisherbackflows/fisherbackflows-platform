-- APPLY SECURITY POLICIES - FINAL VERSION
-- Run this after fixing technician_id column type

-- 1. Security logs policies
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

-- 2. Billing invoices policies
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

-- 3. Technician current location policies
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

-- 4. Customer data policies
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

DROP POLICY IF EXISTS "Service role full access customers" ON customers;
CREATE POLICY "Service role full access customers"
ON customers FOR ALL
TO service_role
USING (true);

-- 5. Device policies
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

DROP POLICY IF EXISTS "Service role full access devices" ON devices;
CREATE POLICY "Service role full access devices"
ON devices FOR ALL
TO service_role
USING (true);

-- 6. Appointment policies
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

DROP POLICY IF EXISTS "Service role full access appointments" ON appointments;
CREATE POLICY "Service role full access appointments"
ON appointments FOR ALL
TO service_role
USING (true);

-- 7. Test report policies
DROP POLICY IF EXISTS "Customers can view their own test reports" ON test_reports;
CREATE POLICY "Customers can view their own test reports"
ON test_reports FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Service role full access test_reports" ON test_reports;
CREATE POLICY "Service role full access test_reports"
ON test_reports FOR ALL
TO service_role
USING (true);

-- 8. Team users policies (for company access)
DROP POLICY IF EXISTS "Team users can view their company members" ON team_users;
CREATE POLICY "Team users can view their company members"
ON team_users FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM team_users WHERE auth_user_id = auth.uid()
  ) OR
  auth_user_id = auth.uid()
);

DROP POLICY IF EXISTS "Service role full access team_users" ON team_users;
CREATE POLICY "Service role full access team_users"
ON team_users FOR ALL
TO service_role
USING (true);

-- 9. Fix function security if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    ALTER FUNCTION update_updated_at_column() SET search_path = '';
  END IF;
END $$;

-- 10. Show all created policies
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles,
  SUBSTRING(qual, 1, 100) as policy_condition
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('security_logs', 'billing_invoices', 'technician_current_location', 'customers', 'devices', 'appointments', 'test_reports', 'team_users')
ORDER BY tablename, policyname;