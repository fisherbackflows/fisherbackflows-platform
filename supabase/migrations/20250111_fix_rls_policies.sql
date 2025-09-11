-- Critical RLS Security Fixes for Backflow Buddy
-- Fixing tables with RLS enabled but no policies

-- 1. Security Logs RLS Policies
CREATE POLICY "security_logs_admin_all" ON security_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_users
      WHERE team_users.auth_user_id = auth.uid()
      AND team_users.role = 'admin'
    )
  );

CREATE POLICY "security_logs_own_read" ON security_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2. Billing Invoices RLS Policies  
CREATE POLICY "billing_invoices_company_access" ON billing_invoices
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM billing_subscriptions
      WHERE billing_subscriptions.id = billing_invoices.subscription_id
      AND billing_subscriptions.company_id IN (
        SELECT company_id FROM team_users WHERE auth_user_id = auth.uid()
        UNION
        SELECT company_id FROM customers WHERE auth_user_id = auth.uid()
      )
    )
  );

-- 3. Technician Current Location RLS Policies
CREATE POLICY "tech_location_company_access" ON technician_current_location
  FOR ALL
  TO authenticated
  USING (
    technician_id IN (
      SELECT id FROM team_users 
      WHERE company_id IN (
        SELECT company_id FROM team_users WHERE auth_user_id = auth.uid()
      )
    )
  );

-- 4. Technician Locations History RLS Policies
CREATE POLICY "tech_locations_company_access" ON technician_locations
  FOR ALL
  TO authenticated
  USING (
    technician_id IN (
      SELECT id FROM team_users 
      WHERE company_id IN (
        SELECT company_id FROM team_users WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Add function search_path fix
ALTER FUNCTION update_updated_at_column() SET search_path = public;