-- Fix RLS policy for email_verifications table
-- This allows the service role to insert verification tokens

-- Add RLS policy for email verifications table
CREATE POLICY "Service role can manage email verifications" ON email_verifications
    FOR ALL USING (true)
    WITH CHECK (true);

-- Also allow users to read their own verification records
CREATE POLICY "Users can read their own email verifications" ON email_verifications
    FOR SELECT USING (auth.uid()::text = user_id);

-- Grant necessary permissions to authenticated users
GRANT SELECT ON email_verifications TO authenticated;
GRANT INSERT ON email_verifications TO service_role;
GRANT UPDATE ON email_verifications TO service_role;
GRANT DELETE ON email_verifications TO service_role;