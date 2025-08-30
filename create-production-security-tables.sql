-- Production Security Database Schema
-- Run this in Supabase SQL Editor to add security features

-- 1. Add security columns to team_users table if they don't exist
ALTER TABLE team_users 
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_failed_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS require_password_change BOOLEAN DEFAULT FALSE;

-- 2. Create security_logs table for audit trail
CREATE TABLE IF NOT EXISTS security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    user_email TEXT,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Update team_sessions table for enhanced security
ALTER TABLE team_sessions 
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip_address ON security_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_email ON security_logs(user_email);

CREATE INDEX IF NOT EXISTS idx_team_users_email ON team_users(email);
CREATE INDEX IF NOT EXISTS idx_team_users_failed_attempts ON team_users(failed_login_attempts);
CREATE INDEX IF NOT EXISTS idx_team_users_locked_until ON team_users(account_locked_until);

CREATE INDEX IF NOT EXISTS idx_team_sessions_token ON team_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_team_sessions_expires ON team_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_team_sessions_active ON team_sessions(is_active);

-- 5. Row Level Security (RLS) policies
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access security_logs
CREATE POLICY IF NOT EXISTS "Service role full access to security_logs" ON security_logs
FOR ALL USING (auth.role() = 'service_role');

-- Policy: Users can only see their own sessions
CREATE POLICY IF NOT EXISTS "Users can view own sessions" ON team_sessions
FOR SELECT USING (team_user_id IN (
    SELECT id FROM team_users WHERE email = auth.jwt() ->> 'email'
));

-- Policy: Service role full access to team_sessions
CREATE POLICY IF NOT EXISTS "Service role full access to team_sessions" ON team_sessions
FOR ALL USING (auth.role() = 'service_role');

-- 6. Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM team_sessions 
    WHERE expires_at < NOW() OR is_active = FALSE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to unlock expired account locks
CREATE OR REPLACE FUNCTION unlock_expired_accounts()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE team_users 
    SET account_locked_until = NULL,
        failed_login_attempts = 0
    WHERE account_locked_until < NOW();
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Insert initial security admin user if not exists
INSERT INTO team_users (
    id,
    email, 
    first_name, 
    last_name, 
    role, 
    password_hash,
    is_active,
    created_at,
    updated_at,
    failed_login_attempts,
    require_password_change
) VALUES (
    'admin-security-user-001',
    'admin@fisherbackflows.com',
    'Security',
    'Administrator', 
    'admin',
    '$2b$12$rQJ5qG5qG5qG5qG5qG5qGOXvQ5qG5qG5qG5qG5qG5qG5qG5qG5qG5qG', -- placeholder - needs real hash
    TRUE,
    NOW(),
    NOW(),
    0,
    TRUE -- Force password change on first login
) ON CONFLICT (email) DO NOTHING;

-- 9. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON security_logs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON team_sessions TO service_role;
GRANT SELECT, UPDATE ON team_users TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions() TO service_role;
GRANT EXECUTE ON FUNCTION unlock_expired_accounts() TO service_role;

-- 10. Create trigger to log password changes
CREATE OR REPLACE FUNCTION log_password_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.password_hash != OLD.password_hash THEN
        NEW.password_changed_at = NOW();
        
        INSERT INTO security_logs (
            event_type,
            ip_address,
            user_email,
            user_agent,
            success,
            timestamp,
            metadata
        ) VALUES (
            'password_change',
            'system',
            NEW.email,
            'system',
            TRUE,
            NOW(),
            jsonb_build_object(
                'user_id', NEW.id,
                'changed_by', 'user'
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER IF NOT EXISTS trigger_password_change 
    BEFORE UPDATE ON team_users
    FOR EACH ROW 
    EXECUTE FUNCTION log_password_change();

-- Success message
SELECT 'Production security tables and functions created successfully!' as status;