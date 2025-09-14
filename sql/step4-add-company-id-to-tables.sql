-- Step 4: Add company_id to core business tables
-- Execute this fourth in Supabase SQL Editor

-- Add company_id to core business tables
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE test_reports ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_devices_company_id ON devices(company_id);
CREATE INDEX IF NOT EXISTS idx_appointments_company_id ON appointments(company_id);
CREATE INDEX IF NOT EXISTS idx_test_reports_company_id ON test_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON invoices(company_id);