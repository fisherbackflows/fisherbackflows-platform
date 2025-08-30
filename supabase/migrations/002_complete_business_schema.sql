-- Fisher Backflows Complete Business Schema
-- This is what actually runs an automated backflow testing company

-- Customers (the foundation)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_number TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT DEFAULT 'CA',
  zip TEXT NOT NULL,
  water_district TEXT,
  balance DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Devices (what we're testing)
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  serial_number TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('RP', 'DC', 'PVB', 'SVB', 'DAA')),
  size TEXT NOT NULL,
  location TEXT NOT NULL,
  install_date DATE,
  last_test_date DATE,
  next_test_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments (scheduled tests)
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  device_id UUID REFERENCES devices(id),
  technician_id UUID REFERENCES team_users(id),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  window_start TIME DEFAULT '08:00',
  window_end TIME DEFAULT '17:00',
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test Reports (the actual test results)
CREATE TABLE IF NOT EXISTS test_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id),
  device_id UUID REFERENCES devices(id),
  technician_id UUID REFERENCES team_users(id),
  test_date DATE NOT NULL,
  test_type TEXT NOT NULL CHECK (test_type IN ('annual', 'repair', 'new_install')),
  
  -- Test results
  initial_pressure DECIMAL(5,2),
  final_pressure DECIMAL(5,2),
  pressure_drop DECIMAL(5,2),
  test_duration INTEGER, -- minutes
  result TEXT NOT NULL CHECK (result IN ('pass', 'fail', 'inconclusive')),
  
  -- Details
  repairs_needed TEXT,
  repairs_completed TEXT,
  technician_notes TEXT,
  customer_signature TEXT, -- base64 signature
  
  -- Compliance
  water_district_submitted BOOLEAN DEFAULT FALSE,
  submitted_date DATE,
  certificate_number TEXT UNIQUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices (billing)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  invoice_number TEXT UNIQUE NOT NULL,
  test_report_id UUID REFERENCES test_reports(id),
  
  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  balance_due DECIMAL(10,2) NOT NULL,
  
  -- Dates
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  paid_date DATE,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'sent', 'paid', 'overdue', 'cancelled')),
  
  -- Payment
  payment_method TEXT CHECK (payment_method IN ('card', 'check', 'cash', 'ach')),
  stripe_payment_intent_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice Line Items
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments (track all payments)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id),
  customer_id UUID REFERENCES customers(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  stripe_payment_id TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications (email/sms tracking)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  type TEXT NOT NULL CHECK (type IN ('reminder', 'confirmation', 'report', 'invoice', 'payment', 'overdue')),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  subject TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'opened')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation Rules (configurable automation)
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('time_based', 'event_based')),
  trigger_config JSONB NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('send_email', 'create_invoice', 'schedule_test', 'update_status')),
  action_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_devices_customer ON devices(customer_id);
CREATE INDEX idx_devices_next_test ON devices(next_test_date);
CREATE INDEX idx_appointments_date ON appointments(scheduled_date);
CREATE INDEX idx_appointments_tech ON appointments(technician_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_test_reports_date ON test_reports(test_date);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due ON invoices(due_date);
CREATE INDEX idx_notifications_customer ON notifications(customer_id);
CREATE INDEX idx_notifications_status ON notifications(status);

-- Create views for common queries
CREATE OR REPLACE VIEW upcoming_tests AS
SELECT 
  d.id as device_id,
  c.id as customer_id,
  c.name as customer_name,
  c.email,
  c.phone,
  d.serial_number,
  d.type as device_type,
  d.location,
  d.next_test_date,
  CASE 
    WHEN d.next_test_date < CURRENT_DATE THEN 'overdue'
    WHEN d.next_test_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'due_soon'
    ELSE 'scheduled'
  END as urgency
FROM devices d
JOIN customers c ON d.customer_id = c.id
WHERE d.status = 'active'
  AND c.status = 'active'
ORDER BY d.next_test_date;

-- RLS Policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Customer can see their own data
CREATE POLICY customers_own_data ON customers FOR ALL USING (auth.uid()::text = id::text);
CREATE POLICY devices_own_data ON devices FOR ALL USING (customer_id IN (SELECT id FROM customers WHERE auth.uid()::text = id::text));
CREATE POLICY appointments_own_data ON appointments FOR ALL USING (customer_id IN (SELECT id FROM customers WHERE auth.uid()::text = id::text));

-- Techs can see all customer data
CREATE POLICY tech_access_all ON customers FOR ALL USING (
  EXISTS (SELECT 1 FROM team_users WHERE id::text = auth.uid()::text AND role IN ('admin', 'tester'))
);

-- Functions for automation
CREATE OR REPLACE FUNCTION update_customer_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE customers 
  SET balance = (
    SELECT COALESCE(SUM(balance_due), 0) 
    FROM invoices 
    WHERE customer_id = NEW.customer_id 
      AND status IN ('pending', 'sent', 'overdue')
  )
  WHERE id = NEW.customer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_balance_on_invoice
AFTER INSERT OR UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION update_customer_balance();

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();