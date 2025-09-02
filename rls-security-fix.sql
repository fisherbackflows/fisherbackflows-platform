-- CRITICAL SECURITY FIX: Implement RLS policies for tables with RLS enabled but no policies

-- RLS Policy for billing_invoices table
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.billing_invoices;
CREATE POLICY "Users can view their own invoices" ON public.billing_invoices
  FOR SELECT USING (
    customer_id = (SELECT id FROM customers WHERE email = auth.jwt() ->> 'email')
    OR 
    auth.jwt() ->> 'email' LIKE '%@fisherbackflows.com'
  );

DROP POLICY IF EXISTS "Users can insert their own invoices" ON public.billing_invoices;
CREATE POLICY "Users can insert their own invoices" ON public.billing_invoices
  FOR INSERT WITH CHECK (
    customer_id = (SELECT id FROM customers WHERE email = auth.jwt() ->> 'email')
    OR 
    auth.jwt() ->> 'email' LIKE '%@fisherbackflows.com'
  );

DROP POLICY IF EXISTS "Admin can manage all invoices" ON public.billing_invoices;
CREATE POLICY "Admin can manage all invoices" ON public.billing_invoices
  FOR ALL USING (
    auth.jwt() ->> 'email' LIKE '%@fisherbackflows.com'
  );

-- RLS Policy for security_logs table - Admin only access
DROP POLICY IF EXISTS "Admin can view security logs" ON public.security_logs;
CREATE POLICY "Admin can view security logs" ON public.security_logs
  FOR SELECT USING (
    auth.jwt() ->> 'email' LIKE '%@fisherbackflows.com'
  );

DROP POLICY IF EXISTS "Admin can insert security logs" ON public.security_logs;
CREATE POLICY "Admin can insert security logs" ON public.security_logs
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'email' LIKE '%@fisherbackflows.com'
  );

-- Additional security policies for other critical tables
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
CREATE POLICY "Users can view their own appointments" ON public.appointments
  FOR SELECT USING (
    customer_id = (SELECT id FROM customers WHERE email = auth.jwt() ->> 'email')
    OR 
    auth.jwt() ->> 'email' LIKE '%@fisherbackflows.com'
  );

DROP POLICY IF EXISTS "Users can view their own test reports" ON public.test_reports;
CREATE POLICY "Users can view their own test reports" ON public.test_reports
  FOR SELECT USING (
    customer_id = (SELECT id FROM customers WHERE email = auth.jwt() ->> 'email')
    OR 
    auth.jwt() ->> 'email' LIKE '%@fisherbackflows.com'
  );

-- Enable RLS on critical tables if not already enabled
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Customer data access policy
DROP POLICY IF EXISTS "Users can view their own customer data" ON public.customers;
CREATE POLICY "Users can view their own customer data" ON public.customers
  FOR SELECT USING (
    email = auth.jwt() ->> 'email'
    OR 
    auth.jwt() ->> 'email' LIKE '%@fisherbackflows.com'
  );

DROP POLICY IF EXISTS "Users can update their own customer data" ON public.customers;
CREATE POLICY "Users can update their own customer data" ON public.customers
  FOR UPDATE USING (
    email = auth.jwt() ->> 'email'
    OR 
    auth.jwt() ->> 'email' LIKE '%@fisherbackflows.com'
  );