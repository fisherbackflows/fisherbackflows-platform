-- Migration to integrate customers table with Supabase Auth
-- This adds auth_user_id column and sets up proper relationships

-- Step 1: Add auth_user_id column to customers table
ALTER TABLE customers 
ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create index for better performance
CREATE INDEX idx_customers_auth_user_id ON customers(auth_user_id);

-- Step 3: Update RLS policies to use auth.uid()
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own customer data" ON customers;
DROP POLICY IF EXISTS "Users can update their own customer data" ON customers;
DROP POLICY IF EXISTS "Allow service role full access" ON customers;

-- Create new policies using auth.uid()
CREATE POLICY "Users can view their own customer data"
  ON customers FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own customer data"
  ON customers FOR UPDATE
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert their own customer data"
  ON customers FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

-- Allow service role full access for admin operations
CREATE POLICY "Service role full access"
  ON customers FOR ALL
  USING (auth.role() = 'service_role');

-- Step 4: Create trigger to sync user email changes
CREATE OR REPLACE FUNCTION sync_customer_email()
RETURNS trigger AS $$
BEGIN
  -- Update customer email when auth user email changes
  UPDATE customers 
  SET email = NEW.email, updated_at = NOW()
  WHERE auth_user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS trigger_sync_customer_email ON auth.users;
CREATE TRIGGER trigger_sync_customer_email
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_customer_email();

-- Step 5: Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- This will be called when a new auth user is created
  -- The application will handle creating the customer record
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create trigger for new user (if needed)
-- DROP TRIGGER IF EXISTS trigger_handle_new_user ON auth.users;
-- CREATE TRIGGER trigger_handle_new_user
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION handle_new_user();

COMMENT ON COLUMN customers.auth_user_id IS 'Links customer to Supabase Auth user';
COMMENT ON FUNCTION sync_customer_email() IS 'Keeps customer email in sync with auth user email';