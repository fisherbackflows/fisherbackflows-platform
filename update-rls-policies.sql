-- Update RLS policies for customers table to use auth.uid()

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own customer data" ON customers;
DROP POLICY IF EXISTS "Users can update their own customer data" ON customers;
DROP POLICY IF EXISTS "Users can insert their own customer data" ON customers;
DROP POLICY IF EXISTS "Allow service role full access" ON customers;
DROP POLICY IF EXISTS "Service role full access" ON customers;

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

-- Create trigger to sync customer email changes
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