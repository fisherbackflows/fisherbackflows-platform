-- ============================================================================
-- CRITICAL DATABASE UPDATE - PRESERVING ALL PROGRESS
-- Date: September 1, 2025
-- Purpose: Ensure all working APIs have proper database backing
-- MUST RUN THIS TO PRESERVE PROGRESS
-- ============================================================================

-- First, ensure we have the necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CUSTOMERS TABLE - Updated for registration API
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
-- DEVICES TABLE - Required for customer detail API
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
-- APPOINTMENTS TABLE - Critical for booking system
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  assigned_technician UUID,
  appointment_type TEXT DEFAULT 'annual_test' CHECK (appointment_type IN ('annual_test', 'repair', 'installation', 'inspection', 'followup')),
  scheduled_date DATE NOT NULL,
  scheduled_time_start TIME NOT NULL,
  scheduled_time_end TIME,
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  estimated_duration INTEGER DEFAULT 60,
  travel_time INTEGER DEFAULT 15,
  special_instructions TEXT,
  customer_notes TEXT,
  technician_notes TEXT,
  completion_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INVOICES TABLE - Required for invoice detail API
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  test_report_id UUID REFERENCES public.test_reports(id) ON DELETE SET NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tax_rate DECIMAL(4,2) DEFAULT 0.00,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  amount_paid DECIMAL(10,2) DEFAULT 0.00,
  balance_due DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled')),
  payment_terms TEXT DEFAULT 'net_30',
  sent_date TIMESTAMPTZ,
  viewed_date TIMESTAMPTZ,
  paid_date TIMESTAMPTZ,
  notes TEXT,
  internal_notes TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INVOICE LINE ITEMS TABLE - Required for invoice detail API
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
-- TEST REPORTS TABLE - Will be needed soon
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.test_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL,
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

-- ============================================================================
-- PAYMENTS TABLE - Already working from webhook
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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
-- TEAM USERS TABLE - Required for authentication
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.team_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'technician', 'office')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  license_number TEXT,
  hire_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TEAM SESSIONS TABLE - Required for authentication
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.team_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_user_id UUID NOT NULL REFERENCES public.team_users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_account_number ON public.customers(account_number);
CREATE INDEX IF NOT EXISTS idx_devices_customer_id ON public.devices(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON public.appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON public.appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON public.invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON public.payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_team_sessions_token ON public.team_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_team_sessions_expires ON public.team_sessions(expires_at);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES (Service role bypass for API access)
-- ============================================================================
DROP POLICY IF EXISTS "Service role access" ON public.customers;
CREATE POLICY "Service role access" ON public.customers FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role access" ON public.devices;
CREATE POLICY "Service role access" ON public.devices FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role access" ON public.appointments;
CREATE POLICY "Service role access" ON public.appointments FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role access" ON public.invoices;
CREATE POLICY "Service role access" ON public.invoices FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role access" ON public.invoice_line_items;
CREATE POLICY "Service role access" ON public.invoice_line_items FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role access" ON public.payments;
CREATE POLICY "Service role access" ON public.payments FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role access" ON public.test_reports;
CREATE POLICY "Service role access" ON public.test_reports FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role access" ON public.team_users;
CREATE POLICY "Service role access" ON public.team_users FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role access" ON public.team_sessions;
CREATE POLICY "Service role access" ON public.team_sessions FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- INSERT ESSENTIAL TEST DATA TO SUPPORT WORKING APIS
-- ============================================================================

-- Insert admin user for team authentication
INSERT INTO public.team_users (
  email, 
  password_hash, 
  role, 
  first_name, 
  last_name, 
  license_number,
  phone
) VALUES (
  'admin@fisherbackflows.com',
  '$2a$12$rBV2JDeWW3.vKyeQcM8fFO4777l4bVeQgDL6VZkqPqhN9dAMhWGEy', -- password: FisherAdmin2025
  'admin',
  'Admin',
  'User',
  'WA-BF-001',
  '(253) 278-8692'
) ON CONFLICT (email) DO NOTHING;

-- Insert test customers for API testing
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
) VALUES 
(
  'john.smith@example.com',
  'John',
  'Smith',
  '(253) 555-0123',
  '123 Main Street',
  'Tacoma',
  'WA',
  '98402',
  'FB-001'
),
(
  'jane.doe@example.com',
  'Jane',
  'Doe',
  '(253) 555-0124',
  '456 Oak Avenue',
  'Lakewood',
  'WA',
  '98498',
  'FB-002'
) ON CONFLICT (email) DO NOTHING;

-- Insert test devices for customer detail API
INSERT INTO public.devices (
  customer_id,
  device_type,
  manufacturer,
  model,
  size_inches,
  location_description,
  installation_date,
  last_test_date,
  next_test_due
) 
SELECT 
  c.id,
  'reduced_pressure',
  'Watts',
  'Series 909',
  '3/4"',
  'Front yard meter assembly',
  '2023-01-15',
  '2024-01-15',
  '2025-01-15'
FROM public.customers c 
WHERE c.email = 'john.smith@example.com'
ON CONFLICT DO NOTHING;

-- Insert test invoice for invoice detail API
INSERT INTO public.invoices (
  invoice_number,
  customer_id,
  subtotal,
  tax_amount,
  total_amount,
  balance_due,
  status
)
SELECT 
  'INV-2025-001',
  c.id,
  75.00,
  7.33,
  82.33,
  82.33,
  'sent'
FROM public.customers c 
WHERE c.email = 'john.smith@example.com'
ON CONFLICT (invoice_number) DO NOTHING;

-- Insert invoice line items for invoice detail API
INSERT INTO public.invoice_line_items (
  invoice_id,
  description,
  quantity,
  unit_price,
  total_price
)
SELECT 
  i.id,
  'Annual Backflow Preventer Testing',
  1,
  75.00,
  75.00
FROM public.invoices i 
WHERE i.invoice_number = 'INV-2025-001'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Show created tables
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('customers', 'devices', 'appointments', 'invoices', 'invoice_line_items', 
                        'payments', 'test_reports', 'team_users', 'team_sessions') 
    THEN '✅ Core Table'
    ELSE '📦 Additional Table'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Show sample data counts
SELECT 
  'customers' as table_name, COUNT(*) as record_count FROM public.customers
UNION ALL
SELECT 
  'devices' as table_name, COUNT(*) as record_count FROM public.devices
UNION ALL
SELECT 
  'appointments' as table_name, COUNT(*) as record_count FROM public.appointments
UNION ALL
SELECT 
  'invoices' as table_name, COUNT(*) as record_count FROM public.invoices
UNION ALL
SELECT 
  'invoice_line_items' as table_name, COUNT(*) as record_count FROM public.invoice_line_items
UNION ALL
SELECT 
  'payments' as table_name, COUNT(*) as record_count FROM public.payments
UNION ALL
SELECT 
  'team_users' as table_name, COUNT(*) as record_count FROM public.team_users;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
-- This script creates all necessary tables and data to support:
-- ✅ Customer registration API
-- ✅ Appointment booking API with availability checking
-- ✅ Customer detail API with devices
-- ✅ Invoice detail API with line items  
-- ✅ Payment webhook processing
-- ✅ Team authentication system
-- ✅ All existing functionality preservation
-- ============================================================================