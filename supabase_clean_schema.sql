-- Complete Business Schema for Fisher Backflows Platform
-- Clean version without decorative comments for Supabase SQL Editor

-- CUSTOMERS TABLE
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

-- DEVICES TABLE (Backflow Prevention Devices)
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

-- APPOINTMENTS TABLE
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

-- TEST REPORTS TABLE
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
  cv1_initial DECIMAL(5,2),
  cv1_final DECIMAL(5,2),
  cv1_drop DECIMAL(5,2),
  cv1_passed BOOLEAN,
  cv2_initial DECIMAL(5,2),
  cv2_final DECIMAL(5,2),
  cv2_drop DECIMAL(5,2),
  cv2_passed BOOLEAN,
  rv_initial DECIMAL(5,2),
  rv_final DECIMAL(5,2),
  rv_drop DECIMAL(5,2),
  rv_passed BOOLEAN,
  overall_result TEXT CHECK (overall_result IN ('pass', 'fail', 'repair_required')),
  repairs_needed TEXT,
  recommendations TEXT,
  next_test_due DATE,
  water_district_notified BOOLEAN DEFAULT false,
  notification_date DATE,
  compliance_status TEXT DEFAULT 'pending' CHECK (compliance_status IN ('pending', 'submitted', 'approved', 'rejected')),
  report_generated BOOLEAN DEFAULT false,
  report_sent_date DATE,
  report_file_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INVOICES TABLE
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  test_report_id UUID REFERENCES public.test_reports(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,4) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  amount_due DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded')),
  payment_terms TEXT DEFAULT 'net_30' CHECK (payment_terms IN ('due_on_receipt', 'net_15', 'net_30', 'net_60')),
  description TEXT,
  line_items JSONB DEFAULT '[]',
  sent_date DATE,
  viewed_date DATE,
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENTS TABLE
DROP TABLE IF EXISTS public.payments;
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('card', 'check', 'cash', 'ach', 'wire', 'other')),
  payment_type TEXT DEFAULT 'payment' CHECK (payment_type IN ('payment', 'refund', 'partial')),
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  stripe_refund_id TEXT,
  external_reference TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  description TEXT,
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEADS TABLE
DROP TABLE IF EXISTS public.leads;
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  source TEXT DEFAULT 'website' CHECK (source IN ('website', 'referral', 'google', 'facebook', 'phone', 'email', 'other')),
  lead_type TEXT DEFAULT 'test_inquiry' CHECK (lead_type IN ('test_inquiry', 'new_installation', 'repair', 'quote_request', 'general')),
  message TEXT,
  urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'urgent')),
  estimated_value DECIMAL(10,2),
  assigned_to UUID REFERENCES public.team_users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'quoted', 'converted', 'lost', 'closed')),
  first_contact_date DATE,
  last_contact_date DATE,
  converted_date DATE,
  converted_customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  notes TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WATER DEPARTMENT SUBMISSIONS TABLE
DROP TABLE IF EXISTS public.water_department_submissions;
CREATE TABLE public.water_department_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  test_report_id UUID NOT NULL REFERENCES public.test_reports(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  water_district TEXT NOT NULL,
  district_contact_name TEXT,
  district_contact_email TEXT,
  district_contact_phone TEXT,
  submission_type TEXT DEFAULT 'annual' CHECK (submission_type IN ('annual', 'repair', 'new_install', 'retest', 'verification')),
  submission_date DATE NOT NULL,
  submission_method TEXT DEFAULT 'email' CHECK (submission_method IN ('email', 'portal', 'mail', 'fax', 'hand_delivery')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'acknowledged', 'approved', 'rejected', 'resubmit_required')),
  confirmation_number TEXT,
  acknowledged_date DATE,
  approved_date DATE,
  rejection_reason TEXT,
  documents JSONB DEFAULT '[]',
  report_file_url TEXT,
  submitted_by UUID NOT NULL REFERENCES public.team_users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_account_number ON public.customers(account_number);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_devices_customer_id ON public.devices(customer_id);
CREATE INDEX IF NOT EXISTS idx_devices_next_test_due ON public.devices(next_test_due);
CREATE INDEX IF NOT EXISTS idx_devices_status ON public.devices(device_status);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON public.appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_technician ON public.appointments(assigned_technician);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_test_reports_customer_id ON public.test_reports(customer_id);
CREATE INDEX IF NOT EXISTS idx_test_reports_device_id ON public.test_reports(device_id);
CREATE INDEX IF NOT EXISTS idx_test_reports_test_date ON public.test_reports(test_date DESC);
CREATE INDEX IF NOT EXISTS idx_test_reports_technician ON public.test_reports(technician_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_date ON public.payments(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_water_dept_customer_id ON public.water_department_submissions(customer_id);
CREATE INDEX IF NOT EXISTS idx_water_dept_status ON public.water_department_submissions(status);
CREATE INDEX IF NOT EXISTS idx_water_dept_submission_date ON public.water_department_submissions(submission_date DESC);

-- UPDATE TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON public.devices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_test_reports_updated_at BEFORE UPDATE ON public.test_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_water_dept_updated_at BEFORE UPDATE ON public.water_department_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- AUTO-GENERATION FUNCTIONS
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                         LPAD((SELECT COUNT(*) + 1 FROM public.invoices 
                               WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW()))::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_invoice_number_trigger BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

CREATE OR REPLACE FUNCTION generate_account_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.account_number IS NULL THEN
    NEW.account_number := 'FB-' || LPAD((SELECT COUNT(*) + 1 FROM public.customers)::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_account_number_trigger BEFORE INSERT ON public.customers
  FOR EACH ROW EXECUTE FUNCTION generate_account_number();

-- PERMISSIONS
GRANT ALL ON public.customers TO authenticated;
GRANT ALL ON public.devices TO authenticated;
GRANT ALL ON public.appointments TO authenticated;
GRANT ALL ON public.test_reports TO authenticated;
GRANT ALL ON public.invoices TO authenticated;
GRANT ALL ON public.payments TO authenticated;
GRANT ALL ON public.leads TO authenticated;
GRANT ALL ON public.water_department_submissions TO authenticated;

-- SAMPLE DATA FOR TESTING
INSERT INTO public.customers (
  email, first_name, last_name, company_name, phone,
  address_line1, city, state, zip_code
) VALUES (
  'john.doe@example.com', 'John', 'Doe', 'Doe Industries',
  '(555) 123-4567', '123 Main St', 'San Francisco', 'CA', '94105'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO public.team_users (
  email, password_hash, role, first_name, last_name, license_number, phone
) VALUES (
  'tech@fisherbackflows.com', '$2b$10$example.hash', 'tester', 
  'Mike', 'Johnson', 'BT-12345', '(555) 987-6543'
) ON CONFLICT (email) DO NOTHING;