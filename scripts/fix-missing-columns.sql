-- FIX MISSING COLUMNS IN EXISTING TABLES
-- Run this BEFORE the security policies script

-- 1. Add missing user_id column to security_logs if it doesn't exist
DO $$
BEGIN
  -- Check if user_id column exists in security_logs
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'security_logs' AND column_name = 'user_id'
  ) THEN
    -- Add the missing column
    ALTER TABLE security_logs ADD COLUMN user_id UUID;

    -- Add index for performance
    CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);

    RAISE NOTICE 'Added user_id column to security_logs table';
  ELSE
    RAISE NOTICE 'user_id column already exists in security_logs table';
  END IF;
END $$;

-- 2. Add missing customer_id column to security_logs if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'security_logs' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE security_logs ADD COLUMN customer_id UUID REFERENCES customers(id);
    CREATE INDEX IF NOT EXISTS idx_security_logs_customer_id ON security_logs(customer_id);
    RAISE NOTICE 'Added customer_id column to security_logs table';
  ELSE
    RAISE NOTICE 'customer_id column already exists in security_logs table';
  END IF;
END $$;

-- 3. Ensure billing_invoices has customer_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'billing_invoices' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE billing_invoices ADD COLUMN customer_id UUID REFERENCES customers(id);
    CREATE INDEX IF NOT EXISTS idx_billing_invoices_customer_id ON billing_invoices(customer_id);
    RAISE NOTICE 'Added customer_id column to billing_invoices table';
  ELSE
    RAISE NOTICE 'customer_id column already exists in billing_invoices table';
  END IF;
END $$;

-- 4. Ensure technician tables have proper structure
DO $$
BEGIN
  -- Check technician_current_location table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'technician_current_location') THEN
    -- Ensure technician_id column exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'technician_current_location' AND column_name = 'technician_id'
    ) THEN
      ALTER TABLE technician_current_location ADD COLUMN technician_id UUID REFERENCES team_users(id);
      CREATE INDEX IF NOT EXISTS idx_technician_current_location_technician_id ON technician_current_location(technician_id);
      RAISE NOTICE 'Added technician_id column to technician_current_location table';
    END IF;
  END IF;

  -- Check technician_locations table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'technician_locations') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'technician_locations' AND column_name = 'technician_id'
    ) THEN
      ALTER TABLE technician_locations ADD COLUMN technician_id UUID REFERENCES team_users(id);
      CREATE INDEX IF NOT EXISTS idx_technician_locations_technician_id ON technician_locations(technician_id);
      RAISE NOTICE 'Added technician_id column to technician_locations table';
    END IF;
  END IF;
END $$;

-- 5. Ensure customers table has auth_user_id for linking to Supabase auth
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE customers ADD COLUMN auth_user_id UUID UNIQUE;
    CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id ON customers(auth_user_id);
    RAISE NOTICE 'Added auth_user_id column to customers table';
  ELSE
    RAISE NOTICE 'auth_user_id column already exists in customers table';
  END IF;
END $$;

-- 6. Ensure team_users table has auth_user_id for linking to Supabase auth
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_users' AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE team_users ADD COLUMN auth_user_id UUID UNIQUE;
    CREATE INDEX IF NOT EXISTS idx_team_users_auth_user_id ON team_users(auth_user_id);
    RAISE NOTICE 'Added auth_user_id column to team_users table';
  ELSE
    RAISE NOTICE 'auth_user_id column already exists in team_users table';
  END IF;
END $$;

-- Show final table structures for verification
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('security_logs', 'billing_invoices', 'technician_current_location', 'customers', 'team_users')
ORDER BY table_name, ordinal_position;