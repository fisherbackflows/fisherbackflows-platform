-- ===================================================================
-- FORCE BLOCK ALL ANONYMOUS ACCESS - NUCLEAR OPTION
-- ===================================================================
-- This completely blocks ALL access except authenticated users
-- ===================================================================

-- 1. DROP ALL EXISTING POLICIES (start completely fresh)
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename IN ('devices', 'appointments', 'test_reports', 'invoices', 'payments')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- 2. FORCE ENABLE RLS
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 3. CREATE DENY-ALL POLICIES FIRST (blocks everything by default)
CREATE POLICY "deny_all_anon_devices" ON public.devices
  FOR ALL
  TO anon
  USING (false);

CREATE POLICY "deny_all_anon_appointments" ON public.appointments
  FOR ALL
  TO anon
  USING (false);

CREATE POLICY "deny_all_anon_test_reports" ON public.test_reports
  FOR ALL
  TO anon
  USING (false);

CREATE POLICY "deny_all_anon_invoices" ON public.invoices
  FOR ALL
  TO anon
  USING (false);

CREATE POLICY "deny_all_anon_payments" ON public.payments
  FOR ALL
  TO anon
  USING (false);

-- 4. ALLOW AUTHENTICATED USERS TO SEE THEIR OWN DATA
CREATE POLICY "allow_auth_own_devices" ON public.devices
  FOR ALL
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "allow_auth_own_appointments" ON public.appointments
  FOR ALL
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "allow_auth_own_test_reports" ON public.test_reports
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.devices 
      WHERE id = test_reports.device_id 
      AND customer_id = auth.uid()
    )
  );

CREATE POLICY "allow_auth_own_invoices" ON public.invoices
  FOR ALL
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "allow_auth_own_payments" ON public.payments
  FOR ALL
  TO authenticated
  USING (customer_id = auth.uid());

-- 5. VERIFY
SELECT 
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('devices', 'appointments', 'test_reports', 'invoices', 'payments')
ORDER BY tablename, policyname;

SELECT 'ANONYMOUS ACCESS FORCEFULLY BLOCKED!' as final_status;