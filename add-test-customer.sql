-- Add a test customer with login credentials
-- Password: 'test123'

INSERT INTO customers (
  account_number, 
  name, 
  email, 
  phone, 
  address, 
  status,
  balance,
  next_test_date
) VALUES (
  'TEST001',
  'John Smith',
  'test@example.com',
  '555-1234',
  '456 Oak Street, Springfield, IL 62701',
  'Active',
  0.00,
  '2025-12-01'
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address;

-- Also add this customer to Supabase auth.users table for login
-- Note: You'll need to use Supabase Auth to properly register users
-- For now, let's check if the demo login works