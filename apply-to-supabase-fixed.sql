-- ============================================================================
-- COMPLETE SUPABASE SETUP FOR FISHER BACKFLOWS - FIXED VERSION
-- Run this entire script in Supabase SQL Editor
-- This version handles existing tables and dependencies correctly
-- ============================================================================

-- First, ensure we have the necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 1: CREATE CUSTOMERS TABLE FIRST (No dependencies)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  account_number TEXT UNIQUE,
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'inactive')),
  billing_address_same BOOLEAN DEFAULT true,
  billing_address_line1 TEXT,
  billing_address_line2 TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_zip_code TEXT,
  preferred_contact_method TEXT DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'text')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: CREATE DEVICES TABLE (Depends on customers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  device_type TEXT NOT NULL CHECK (device_type IN ('double_check', 'reduced_pressure', 'pressure_vacuum', 'atmospheric_vacuum')),
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT,
  size_inches TEXT NOT NULL,
  location_description TEXT NOT NULL,
  installation_date DATE,
  last_test_date DATE,
  next_test_due DATE,
  device_status TEXT DEFAULT 'active' CHECK (device_status IN ('active', 'inactive', 'removed', 'failed')),
  water_district TEXT,
  permit_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: CREATE LEADS TABLE (References customers for conversion tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company_name TEXT,
  email TEXT,
  phone TEXT NOT NULL,
  address_line1 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  source TEXT CHECK (source IN ('website', 'referral', 'phone', 'email', 'walk_in', 'marketing', 'other')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost')),
  assigned_to UUID, -- Will add foreign key later if team_users exists
  estimated_value DECIMAL(10,2),
  notes TEXT,
  contacted_date TIMESTAMPTZ,
  qualified_date TIMESTAMPTZ,
  converted_date TIMESTAMPTZ,
  converted_customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: CREATE APPOINTMENTS TABLE (Check if team_users exists first)
-- ============================================================================
DO $$
BEGIN
  -- Check if team_users table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_users') THEN
    -- Create with foreign key to team_users
    CREATE TABLE IF NOT EXISTS public.appointments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
      device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
      assigned_technician UUID REFERENCES public.team_users(id) ON DELETE SET NULL,
      appointment_type TEXT DEFAULT 'annual_test' CHECK (appointment_type IN ('annual_test', 'repair', 'installation', 'inspection', 'followup')),
      scheduled_date DATE NOT NULL,
      scheduled_time_start TIME NOT NULL,
      scheduled_time_end TIME,
      actual_start_time TIMESTAMPTZ,
      actual_end_time TIMESTAMPTZ,
      status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
      priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
      estimated_duration INTEGER DEFAULT 45,
      travel_time INTEGER DEFAULT 15,
      special_instructions TEXT,
      customer_notes TEXT,
      technician_notes TEXT,
      completion_notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  ELSE
    -- Create without foreign key to team_users
    CREATE TABLE IF NOT EXISTS public.appointments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
      device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
      assigned_technician UUID, -- No foreign key constraint
      appointment_type TEXT DEFAULT 'annual_test' CHECK (appointment_type IN ('annual_test', 'repair', 'installation', 'inspection', 'followup')),
      scheduled_date DATE NOT NULL,
      scheduled_time_start TIME NOT NULL,
      scheduled_time_end TIME,
      actual_start_time TIMESTAMPTZ,
      actual_end_time TIMESTAMPTZ,
      status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
      priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
      estimated_duration INTEGER DEFAULT 45,
      travel_time INTEGER DEFAULT 15,
      special_instructions TEXT,
      customer_notes TEXT,
      technician_notes TEXT,
      completion_notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END $$;

-- ============================================================================
-- STEP 5: CREATE TEST REPORTS TABLE
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_users') THEN
    CREATE TABLE IF NOT EXISTS public.test_reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
      customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
      device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
      technician_id UUID NOT NULL REFERENCES public.team_users(id),
      test_date DATE NOT NULL,
      test_time TIME NOT NULL,
      test_type TEXT DEFAULT 'annual' CHECK (test_type IN ('annual', 'repair', 'installation', 'retest')),
      test_passed BOOLEAN,
      initial_pressure DECIMAL(5,2),
      final_pressure DECIMAL(5,2),
      pressure_drop DECIMAL(5,2),
      check_valve_1_passed BOOLEAN,
      check_valve_2_passed BOOLEAN,
      relief_valve_passed BOOLEAN,
      overall_condition TEXT CHECK (overall_condition IN ('excellent', 'good', 'fair', 'poor', 'failed')),
      repairs_needed TEXT,
      repairs_completed TEXT,
      certifier_name TEXT NOT NULL,
      certifier_number TEXT NOT NULL,
      photo_url TEXT,
      signature_url TEXT,
      submitted_to_district BOOLEAN DEFAULT false,
      district_submission_date TIMESTAMPTZ,
      district_confirmation_number TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  ELSE
    CREATE TABLE IF NOT EXISTS public.test_reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
      customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
      device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
      technician_id UUID NOT NULL, -- No foreign key constraint
      test_date DATE NOT NULL,
      test_time TIME NOT NULL,
      test_type TEXT DEFAULT 'annual' CHECK (test_type IN ('annual', 'repair', 'installation', 'retest')),
      test_passed BOOLEAN,
      initial_pressure DECIMAL(5,2),
      final_pressure DECIMAL(5,2),
      pressure_drop DECIMAL(5,2),
      check_valve_1_passed BOOLEAN,
      check_valve_2_passed BOOLEAN,
      relief_valve_passed BOOLEAN,
      overall_condition TEXT CHECK (overall_condition IN ('excellent', 'good', 'fair', 'poor', 'failed')),
      repairs_needed TEXT,
      repairs_completed TEXT,
      certifier_name TEXT NOT NULL,
      certifier_number TEXT NOT NULL,
      photo_url TEXT,
      signature_url TEXT,
      submitted_to_district BOOLEAN DEFAULT false,
      district_submission_date TIMESTAMPTZ,
      district_confirmation_number TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END $$;

-- ============================================================================
-- STEP 6: CREATE INVOICES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  test_report_id UUID REFERENCES public.test_reports(id) ON DELETE SET NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(4,2) DEFAULT 0.00,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0.00,
  balance_due DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled')),
  payment_terms TEXT DEFAULT 'net_30',
  sent_date TIMESTAMPTZ,
  viewed_date TIMESTAMPTZ,
  paid_date TIMESTAMPTZ,
  notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 7: CREATE INVOICE LINE ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  item_type TEXT DEFAULT 'service' CHECK (item_type IN ('service', 'product', 'tax', 'discount')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 8: CREATE PAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  payment_date TIMESTAMPTZ NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'check', 'credit_card', 'ach', 'other')),
  transaction_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  check_number TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 9: CREATE WATER DEPARTMENT SUBMISSIONS TABLE
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_users') THEN
    CREATE TABLE IF NOT EXISTS public.water_department_submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      test_report_id UUID NOT NULL REFERENCES public.test_reports(id) ON DELETE CASCADE,
      district_name TEXT NOT NULL,
      submission_date TIMESTAMPTZ NOT NULL,
      submission_method TEXT CHECK (submission_method IN ('online', 'email', 'fax', 'mail', 'in_person')),
      confirmation_number TEXT,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'accepted', 'rejected', 'resubmit')),
      rejection_reason TEXT,
      due_date DATE,
      submitted_by UUID REFERENCES public.team_users(id),
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  ELSE
    CREATE TABLE IF NOT EXISTS public.water_department_submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      test_report_id UUID NOT NULL REFERENCES public.test_reports(id) ON DELETE CASCADE,
      district_name TEXT NOT NULL,
      submission_date TIMESTAMPTZ NOT NULL,
      submission_method TEXT CHECK (submission_method IN ('online', 'email', 'fax', 'mail', 'in_person')),
      confirmation_number TEXT,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'accepted', 'rejected', 'resubmit')),
      rejection_reason TEXT,
      due_date DATE,
      submitted_by UUID, -- No foreign key constraint
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END $$;

-- ============================================================================
-- STEP 10: CREATE AUDIT LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 11: ADD FOREIGN KEY TO LEADS IF TEAM_USERS EXISTS
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_users') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'leads_assigned_to_fkey'
    ) THEN
      ALTER TABLE public.leads 
      ADD CONSTRAINT leads_assigned_to_fkey 
      FOREIGN KEY (assigned_to) 
      REFERENCES public.team_users(id) 
      ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- STEP 12: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_account_number ON public.customers(account_number);
CREATE INDEX IF NOT EXISTS idx_devices_customer_id ON public.devices(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON public.appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON public.appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_test_reports_customer_id ON public.test_reports(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- ============================================================================
-- STEP 13: ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_department_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 14: CREATE RLS POLICIES (Service role bypass)
-- ============================================================================
-- Drop existing policies if they exist and recreate
DO $$
BEGIN
  -- Customers
  DROP POLICY IF EXISTS "Service role bypass" ON public.customers;
  CREATE POLICY "Service role bypass" ON public.customers FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  
  -- Devices
  DROP POLICY IF EXISTS "Service role bypass" ON public.devices;
  CREATE POLICY "Service role bypass" ON public.devices FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  
  -- Appointments
  DROP POLICY IF EXISTS "Service role bypass" ON public.appointments;
  CREATE POLICY "Service role bypass" ON public.appointments FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  
  -- Test Reports
  DROP POLICY IF EXISTS "Service role bypass" ON public.test_reports;
  CREATE POLICY "Service role bypass" ON public.test_reports FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  
  -- Invoices
  DROP POLICY IF EXISTS "Service role bypass" ON public.invoices;
  CREATE POLICY "Service role bypass" ON public.invoices FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  
  -- Payments
  DROP POLICY IF EXISTS "Service role bypass" ON public.payments;
  CREATE POLICY "Service role bypass" ON public.payments FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  
  -- Leads
  DROP POLICY IF EXISTS "Service role bypass" ON public.leads;
  CREATE POLICY "Service role bypass" ON public.leads FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  
  -- Water Department Submissions
  DROP POLICY IF EXISTS "Service role bypass" ON public.water_department_submissions;
  CREATE POLICY "Service role bypass" ON public.water_department_submissions FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  
  -- Audit Logs
  DROP POLICY IF EXISTS "Service role bypass" ON public.audit_logs;
  CREATE POLICY "Service role bypass" ON public.audit_logs FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
END $$;

-- ============================================================================
-- STEP 15: INSERT SAMPLE DATA (Optional)
-- ============================================================================
-- Insert a test customer
INSERT INTO public.customers (
  email, 
  first_name, 
  last_name, 
  phone, 
  address_line1, 
  city, 
  state, 
  zip_code,
  account_number
) VALUES (
  'test@example.com',
  'Test',
  'Customer',
  '(555) 123-4567',
  '123 Main Street',
  'Tacoma',
  'WA',
  '98402',
  'CUST-001'
) ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERY - Run this to check what tables were created
-- ============================================================================
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('customers', 'devices', 'appointments', 'test_reports', 
                        'invoices', 'payments', 'leads', 'water_department_submissions',
                        'audit_logs', 'invoice_line_items') 
    THEN '✅ Created'
    ELSE '📦 Existing'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY 
  CASE 
    WHEN table_name IN ('customers', 'devices', 'appointments', 'test_reports', 
                        'invoices', 'payments', 'leads', 'water_department_submissions',
                        'audit_logs', 'invoice_line_items') 
    THEN 0 
    ELSE 1 
  END,
  table_name;

-- ============================================================================
-- SUCCESS!
-- All tables have been created successfully!
-- Your Fisher Backflows database is now ready for use.
-- ============================================================================