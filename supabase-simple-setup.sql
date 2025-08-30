-- DROP AND RECREATE TABLES (CAREFUL - THIS WILL DELETE EXISTING DATA)
-- Copy everything below this line and paste into Supabase SQL Editor

-- First, drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS public.water_department_submissions CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.invoice_line_items CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.test_reports CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.devices CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;

-- Now create fresh tables in the correct order

-- 1. Customers table (no dependencies)
CREATE TABLE public.customers (
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
  account_status TEXT DEFAULT 'active',
  billing_address_same BOOLEAN DEFAULT true,
  billing_address_line1 TEXT,
  billing_address_line2 TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_zip_code TEXT,
  preferred_contact_method TEXT DEFAULT 'email',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Devices table
CREATE TABLE public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  device_type TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT,
  size_inches TEXT NOT NULL,
  location_description TEXT NOT NULL,
  installation_date DATE,
  last_test_date DATE,
  next_test_due DATE,
  device_status TEXT DEFAULT 'active',
  water_district TEXT,
  permit_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  assigned_technician UUID,
  appointment_type TEXT DEFAULT 'annual_test',
  scheduled_date DATE NOT NULL,
  scheduled_time_start TIME NOT NULL,
  scheduled_time_end TIME,
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled',
  priority TEXT DEFAULT 'normal',
  estimated_duration INTEGER DEFAULT 45,
  travel_time INTEGER DEFAULT 15,
  special_instructions TEXT,
  customer_notes TEXT,
  technician_notes TEXT,
  completion_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Test reports table
CREATE TABLE public.test_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL,
  test_date DATE NOT NULL,
  test_time TIME NOT NULL,
  test_type TEXT DEFAULT 'annual',
  test_passed BOOLEAN,
  initial_pressure DECIMAL(5,2),
  final_pressure DECIMAL(5,2),
  pressure_drop DECIMAL(5,2),
  check_valve_1_passed BOOLEAN,
  check_valve_2_passed BOOLEAN,
  relief_valve_passed BOOLEAN,
  overall_condition TEXT,
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

-- 5. Invoices table
CREATE TABLE public.invoices (
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
  status TEXT DEFAULT 'draft',
  payment_terms TEXT DEFAULT 'net_30',
  sent_date TIMESTAMPTZ,
  viewed_date TIMESTAMPTZ,
  paid_date TIMESTAMPTZ,
  notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Invoice line items
CREATE TABLE public.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  item_type TEXT DEFAULT 'service',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  payment_date TIMESTAMPTZ NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  check_number TEXT,
  status TEXT DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Leads table
CREATE TABLE public.leads (
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
  source TEXT,
  status TEXT DEFAULT 'new',
  assigned_to UUID,
  estimated_value DECIMAL(10,2),
  notes TEXT,
  contacted_date TIMESTAMPTZ,
  qualified_date TIMESTAMPTZ,
  converted_date TIMESTAMPTZ,
  converted_customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Water department submissions
CREATE TABLE public.water_department_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_report_id UUID NOT NULL REFERENCES public.test_reports(id) ON DELETE CASCADE,
  district_name TEXT NOT NULL,
  submission_date TIMESTAMPTZ NOT NULL,
  submission_method TEXT,
  confirmation_number TEXT,
  status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  due_date DATE,
  submitted_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Audit logs
CREATE TABLE public.audit_logs (
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

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_department_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (allow service role full access)
CREATE POLICY "Service role access" ON public.customers FOR ALL USING (true);
CREATE POLICY "Service role access" ON public.devices FOR ALL USING (true);
CREATE POLICY "Service role access" ON public.appointments FOR ALL USING (true);
CREATE POLICY "Service role access" ON public.test_reports FOR ALL USING (true);
CREATE POLICY "Service role access" ON public.invoices FOR ALL USING (true);
CREATE POLICY "Service role access" ON public.invoice_line_items FOR ALL USING (true);
CREATE POLICY "Service role access" ON public.payments FOR ALL USING (true);
CREATE POLICY "Service role access" ON public.leads FOR ALL USING (true);
CREATE POLICY "Service role access" ON public.water_department_submissions FOR ALL USING (true);
CREATE POLICY "Service role access" ON public.audit_logs FOR ALL USING (true);

-- Insert test customer
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
);

-- Verify tables were created
SELECT COUNT(*) as tables_created FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('customers', 'devices', 'appointments', 'test_reports', 
                   'invoices', 'payments', 'leads', 'water_department_submissions');