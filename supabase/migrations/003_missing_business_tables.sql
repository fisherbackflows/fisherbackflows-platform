-- Migration: Create missing business tables for Fisher Backflows Platform
-- Date: 2025-08-29
-- Description: Creates leads, payments, and water_department_submissions tables

-- Create leads table for lead generation
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  address TEXT,
  message TEXT,
  source TEXT DEFAULT 'website',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  assigned_to UUID REFERENCES public.team_users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payments table for payment tracking
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID,
  invoice_id UUID,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  payment_method TEXT CHECK (payment_method IN ('card', 'check', 'cash', 'ach', 'other')),
  stripe_payment_id TEXT,
  stripe_charge_id TEXT,
  stripe_refund_id TEXT,
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create water_department_submissions table
CREATE TABLE IF NOT EXISTS public.water_department_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID,
  test_report_id UUID,
  water_district TEXT NOT NULL,
  submission_type TEXT DEFAULT 'annual' CHECK (submission_type IN ('annual', 'repair', 'new_install', 'verification')),
  submission_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'accepted', 'rejected', 'resubmit')),
  confirmation_number TEXT,
  submitted_by UUID REFERENCES public.team_users(id),
  notes TEXT,
  documents JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_date ON public.payments(transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_water_dept_customer_id ON public.water_department_submissions(customer_id);
CREATE INDEX IF NOT EXISTS idx_water_dept_status ON public.water_department_submissions(status);
CREATE INDEX IF NOT EXISTS idx_water_dept_submission_date ON public.water_department_submissions(submission_date DESC);

-- Add update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_water_dept_updated_at BEFORE UPDATE ON public.water_department_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant appropriate permissions (adjust as needed)
GRANT ALL ON public.leads TO authenticated;
GRANT ALL ON public.payments TO authenticated;
GRANT ALL ON public.water_department_submissions TO authenticated;