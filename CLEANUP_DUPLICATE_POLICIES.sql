-- ===================================================================
-- CLEANUP DUPLICATE POLICIES - Keep only the necessary ones
-- ===================================================================

-- For each table, we only need:
-- 1. Customer access policy (customers see their own data)
-- 2. Team member access policy (team members see all data)

-- DEVICES: Remove duplicates, keep the essential ones
DROP POLICY IF EXISTS "devices_auth_only" ON public.devices;
DROP POLICY IF EXISTS "devices_customer_only" ON public.devices;
DROP POLICY IF EXISTS "devices_policy" ON public.devices;
-- Keep: devices_customer_access and devices_team_access (if they exist)

-- APPOINTMENTS: Remove duplicates
DROP POLICY IF EXISTS "appointments_auth_only" ON public.appointments;
DROP POLICY IF EXISTS "appointments_customer_only" ON public.appointments;
DROP POLICY IF EXISTS "appointments_policy" ON public.appointments;
-- Keep: appointments_customer_access and appointments_team_access

-- TEST_REPORTS: Remove duplicates
DROP POLICY IF EXISTS "test_reports_auth_only" ON public.test_reports;
DROP POLICY IF EXISTS "test_reports_customer_only" ON public.test_reports;
DROP POLICY IF EXISTS "test_reports_policy" ON public.test_reports;
-- Keep: test_reports_customer_access and test_reports_team_access

-- INVOICES: Remove duplicates
DROP POLICY IF EXISTS "invoices_auth_only" ON public.invoices;
DROP POLICY IF EXISTS "invoices_customer_only" ON public.invoices;
DROP POLICY IF EXISTS "invoices_policy" ON public.invoices;
-- Keep: invoices_customer_access and invoices_team_access

-- PAYMENTS: Remove duplicates
DROP POLICY IF EXISTS "payments_auth_only" ON public.payments;
DROP POLICY IF EXISTS "payments_customer_only" ON public.payments;
DROP POLICY IF EXISTS "payments_policy" ON public.payments;
-- Keep: payments_customer_access and payments_team_access

-- Now ensure we have the clean, working policies
-- (Only create if they don't exist)

-- DEVICES
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'devices' AND policyname = 'devices_customer_access') THEN
    CREATE POLICY "devices_customer_access" ON public.devices
      FOR ALL TO authenticated
      USING (customer_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'devices' AND policyname = 'devices_team_access') THEN
    CREATE POLICY "devices_team_access" ON public.devices
      FOR ALL TO authenticated
      USING (public.is_team_member());
  END IF;
END $$;

-- APPOINTMENTS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'appointments_customer_access') THEN
    CREATE POLICY "appointments_customer_access" ON public.appointments
      FOR ALL TO authenticated
      USING (customer_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'appointments_team_access') THEN
    CREATE POLICY "appointments_team_access" ON public.appointments
      FOR ALL TO authenticated
      USING (public.is_team_member());
  END IF;
END $$;

-- Show final clean state
SELECT 
  tablename,
  count(*) as policy_count,
  string_agg(policyname, ', ') as policies
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('customers', 'devices', 'appointments', 'test_reports', 'invoices', 'payments')
GROUP BY tablename
ORDER BY tablename;

SELECT 'Cleanup complete - duplicate policies removed' as status;