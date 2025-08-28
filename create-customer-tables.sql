-- Create customers table to match API expectations
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_number VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  phone VARCHAR NOT NULL,
  address TEXT NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0.00,
  next_test_date DATE,
  status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Needs Service')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  serial_number VARCHAR UNIQUE NOT NULL,
  size VARCHAR NOT NULL,
  make VARCHAR NOT NULL,
  model VARCHAR NOT NULL,
  install_date DATE NOT NULL,
  last_test_date DATE,
  next_test_date DATE,
  status VARCHAR(20) DEFAULT 'Passed' CHECK (status IN ('Passed', 'Failed', 'Needs Repair')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample customers to match mock data
INSERT INTO customers (id, account_number, name, email, phone, address, balance, next_test_date, status) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'FB001', 'John Smith', 'john.smith@email.com', '555-0123', '123 Main St, City, State 12345', 0.00, '2025-01-15', 'Active'),
('550e8400-e29b-41d4-a716-446655440002', 'FB002', 'ABC Corporation', 'admin@abccorp.com', '555-0456', '456 Business Ave, City, State 12345', 150.00, '2025-03-20', 'Needs Service')
ON CONFLICT (account_number) DO NOTHING;

-- Insert sample devices
INSERT INTO devices (id, customer_id, location, serial_number, size, make, model, install_date, last_test_date, next_test_date, status) VALUES
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '123 Main St - Backyard', 'BF-2023-001', '3/4"', 'Watts', 'Series 909', '2023-01-15', '2024-01-15', '2025-01-15', 'Passed'),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '456 Business Ave - Main Building', 'BF-2023-002', '1"', 'Zurn Wilkins', '350XL', '2023-03-20', '2024-03-20', '2025-03-20', 'Failed')
ON CONFLICT (serial_number) DO NOTHING;