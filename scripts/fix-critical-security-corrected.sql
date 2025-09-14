-- CORRECTED CRITICAL SECURITY FIXES FOR FISHER BACKFLOWS PLATFORM
-- These policies are REQUIRED before launch

-- 1. Fix billing_invoices table (missing RLS policies)
-- Based on actual table structure with customer_id column
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
-- Note: security_logs has user_id column in the schema
CREATE POLICY "Users can view their own security logs"
ON security_logs FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

CREATE POLICY "Service role can manage all security logs"
ON security_logs FOR ALL
TO service_role
USING (true);

-- 3. Fix technician_current_location table (missing RLS policies)
-- Based on actual table structure with technician_id referencing team_users
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
-- Check if this table exists first
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'technician_locations') THEN
    -- Create policies for technician_locations if it exists
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

-- 6. Additional security for critical customer data
-- Only create if policies don't already exist
DO $$
BEGIN
  -- Check if customer policies exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'customers'
    AND policyname = 'Customers can only access their own data'
  ) THEN
    CREATE POLICY "Customers can only access their own data"
    ON customers FOR SELECT
    TO authenticated
    USING (auth_user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'customers'
    AND policyname = 'Customers can update their own profile'
  ) THEN
    CREATE POLICY "Customers can update their own profile"
    ON customers FOR UPDATE
    TO authenticated
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());
  END IF;
END $$;

-- 7. Device access policies (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'devices'
    AND policyname = 'Customers can view their own devices'
  ) THEN
    CREATE POLICY "Customers can view their own devices"
    ON devices FOR SELECT
    TO authenticated
    USING (
      customer_id IN (
        SELECT id FROM customers WHERE auth_user_id = auth.uid()
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'devices'
    AND policyname = 'Customers can manage their own devices'
  ) THEN
    CREATE POLICY "Customers can manage their own devices"
    ON devices FOR ALL
    TO authenticated
    USING (
      customer_id IN (
        SELECT id FROM customers WHERE auth_user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- 8. Appointment access policies (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'appointments'
    AND policyname = 'Customers can view their own appointments'
  ) THEN
    CREATE POLICY "Customers can view their own appointments"
    ON appointments FOR SELECT
    TO authenticated
    USING (
      customer_id IN (
        SELECT id FROM customers WHERE auth_user_id = auth.uid()
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'appointments'
    AND policyname = 'Customers can create appointments for their devices'
  ) THEN
    CREATE POLICY "Customers can create appointments for their devices"
    ON appointments FOR INSERT
    TO authenticated
    WITH CHECK (
      customer_id IN (
        SELECT id FROM customers WHERE auth_user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- 9. Test report access policies (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'test_reports'
    AND policyname = 'Customers can view their own test reports'
  ) THEN
    CREATE POLICY "Customers can view their own test reports"
    ON test_reports FOR SELECT
    TO authenticated
    USING (
      customer_id IN (
        SELECT id FROM customers WHERE auth_user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- 10. Payment access policies (only if not exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'payments'
      AND policyname = 'Customers can view their own payments'
    ) THEN
      CREATE POLICY "Customers can view their own payments"
      ON payments FOR SELECT
      TO authenticated
      USING (
        customer_id IN (
          SELECT id FROM customers WHERE auth_user_id = auth.uid()
        )
      );
    END IF;
  END IF;
END $$;

-- 11. Invoice access policies (only if not exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'invoices'
      AND policyname = 'Customers can view their own invoices'
    ) THEN
      CREATE POLICY "Customers can view their own invoices"
      ON invoices FOR SELECT
      TO authenticated
      USING (
        customer_id IN (
          SELECT id FROM customers WHERE auth_user_id = auth.uid()
        )
      );
    END IF;
  END IF;
END $$;