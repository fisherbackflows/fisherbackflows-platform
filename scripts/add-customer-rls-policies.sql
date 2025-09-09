-- Basic RLS Policies for Customer Portal
-- These policies ensure customers can only see their own data

-- 1. Customers table - customers can see their own record
CREATE POLICY "Customers can view own record"
ON customers FOR SELECT
USING (auth.uid() = auth_user_id);

CREATE POLICY "Customers can update own record"
ON customers FOR UPDATE
USING (auth.uid() = auth_user_id);

-- 2. Devices table - customers can see their own devices
CREATE POLICY "Customers can view own devices"
ON devices FOR SELECT
USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

-- 3. Appointments table - customers can see their own appointments
CREATE POLICY "Customers can view own appointments"
ON appointments FOR SELECT
USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

-- 4. Test Reports table - customers can see their own test reports
CREATE POLICY "Customers can view own test reports"
ON test_reports FOR SELECT
USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

-- 5. Invoices table - customers can see their own invoices
CREATE POLICY "Customers can view own invoices"
ON invoices FOR SELECT
USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

-- 6. Payments table - customers can see their own payments
CREATE POLICY "Customers can view own payments"
ON payments FOR SELECT
USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

-- Ensure RLS is enabled on all customer-facing tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;