-- CRITICAL SECURITY FIXES FOR FISHER BACKFLOWS PLATFORM
-- These policies are REQUIRED before launch

-- 1. Fix billing_invoices table (missing RLS policies)
CREATE POLICY "Users can view their own invoices"
ON billing_invoices FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Service role can manage all invoices"
ON billing_invoices FOR ALL
TO service_role
USING (true);

-- 2. Fix security_logs table (missing RLS policies)
CREATE POLICY "Users can view their own security logs"
ON security_logs FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Service role can manage all security logs"
ON security_logs FOR ALL
TO service_role
USING (true);

-- 3. Fix technician_current_location table (missing RLS policies)
CREATE POLICY "Technicians can manage their own location"
ON technician_current_location FOR ALL
TO authenticated
USING (
  technician_id IN (
    SELECT id FROM team_users WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Service role can manage all locations"
ON technician_current_location FOR ALL
TO service_role
USING (true);

-- 4. Fix technician_locations table (missing RLS policies)
CREATE POLICY "Technicians can manage their own location history"
ON technician_locations FOR ALL
TO authenticated
USING (
  technician_id IN (
    SELECT id FROM team_users WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Service role can manage all location history"
ON technician_locations FOR ALL
TO service_role
USING (true);

-- 5. Fix function security issue
ALTER FUNCTION update_updated_at_column()
SET search_path = '';

-- 6. Additional security for critical customer data
CREATE POLICY "Customers can only access their own data"
ON customers FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

CREATE POLICY "Customers can update their own profile"
ON customers FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- 7. Device access policies
CREATE POLICY "Customers can view their own devices"
ON devices FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Customers can manage their own devices"
ON devices FOR ALL
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

-- 8. Appointment access policies
CREATE POLICY "Customers can view their own appointments"
ON appointments FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Customers can create appointments for their devices"
ON appointments FOR INSERT
TO authenticated
WITH CHECK (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

-- 9. Test report access policies
CREATE POLICY "Customers can view their own test reports"
ON test_reports FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

-- 10. Payment access policies
CREATE POLICY "Customers can view their own payments"
ON payments FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

-- 11. Invoice access policies
CREATE POLICY "Customers can view their own invoices"
ON invoices FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

-- Refresh all RLS policies
SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;