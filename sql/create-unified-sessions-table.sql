-- Unified Sessions Table
-- Standardizes authentication across all portals
-- MASTER AUDIT Priority: MEDIUM - Authentication Flow Standardization

-- Drop existing table if it exists
DROP TABLE IF EXISTS unified_sessions CASCADE;

-- Create unified sessions table
CREATE TABLE unified_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    portal TEXT NOT NULL CHECK (portal IN ('customer', 'team', 'field', 'admin')),
    role TEXT NOT NULL,
    organization_id TEXT,
    customer_id TEXT,
    team_user_id TEXT,
    token_hash TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),

    -- Foreign key constraints
    CONSTRAINT fk_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_team_user
        FOREIGN KEY (team_user_id)
        REFERENCES team_users(id)
        ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_unified_sessions_user_id ON unified_sessions(user_id);
CREATE INDEX idx_unified_sessions_portal ON unified_sessions(portal);
CREATE INDEX idx_unified_sessions_customer_id ON unified_sessions(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_unified_sessions_team_user_id ON unified_sessions(team_user_id) WHERE team_user_id IS NOT NULL;
CREATE INDEX idx_unified_sessions_expires_at ON unified_sessions(expires_at);
CREATE INDEX idx_unified_sessions_active ON unified_sessions(user_id, portal, expires_at) WHERE revoked_at IS NULL;

-- Enable Row Level Security
ALTER TABLE unified_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own sessions
CREATE POLICY "unified_sessions_select_own" ON unified_sessions
    FOR SELECT USING (
        user_id = auth.uid()::text
        OR
        customer_id IN (
            SELECT id FROM customers
            WHERE auth_user_id = auth.uid()::text
        )
        OR
        team_user_id IN (
            SELECT id FROM team_users
            WHERE user_id = auth.uid()
        )
    );

-- Only system can insert sessions
CREATE POLICY "unified_sessions_insert_system" ON unified_sessions
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Only system can update sessions
CREATE POLICY "unified_sessions_update_system" ON unified_sessions
    FOR UPDATE USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Users can delete their own sessions (logout)
CREATE POLICY "unified_sessions_delete_own" ON unified_sessions
    FOR DELETE USING (
        user_id = auth.uid()::text
        OR
        customer_id IN (
            SELECT id FROM customers
            WHERE auth_user_id = auth.uid()::text
        )
        OR
        team_user_id IN (
            SELECT id FROM team_users
            WHERE user_id = auth.uid()
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_unified_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER update_unified_sessions_updated_at
    BEFORE UPDATE ON unified_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_unified_sessions_updated_at();

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    UPDATE unified_sessions
    SET revoked_at = NOW()
    WHERE expires_at < NOW()
    AND revoked_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to cleanup expired sessions (requires pg_cron extension)
-- Uncomment if pg_cron is available
-- SELECT cron.schedule('cleanup-expired-sessions', '0 * * * *', 'SELECT cleanup_expired_sessions();');

-- Function to get active session count for user
CREATE OR REPLACE FUNCTION get_active_session_count(p_user_id TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM unified_sessions
        WHERE user_id = p_user_id
        AND revoked_at IS NULL
        AND expires_at > NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Function to revoke all sessions for user
CREATE OR REPLACE FUNCTION revoke_all_user_sessions(p_user_id TEXT)
RETURNS void AS $$
BEGIN
    UPDATE unified_sessions
    SET revoked_at = NOW()
    WHERE user_id = p_user_id
    AND revoked_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE unified_sessions IS 'Unified authentication sessions across all portals (customer, team, field, admin)';
COMMENT ON COLUMN unified_sessions.portal IS 'Portal type: customer, team, field, or admin';
COMMENT ON COLUMN unified_sessions.role IS 'User role: customer, admin, manager, coordinator, technician, inspector, viewer';
COMMENT ON COLUMN unified_sessions.token_hash IS 'Hashed session token for security';
COMMENT ON COLUMN unified_sessions.revoked_at IS 'Timestamp when session was revoked (logout or expired)';
COMMENT ON COLUMN unified_sessions.last_activity_at IS 'Last time this session was active';

-- Grant necessary permissions
GRANT ALL ON unified_sessions TO service_role;
GRANT SELECT ON unified_sessions TO authenticated;

-- Create view for session analytics
CREATE OR REPLACE VIEW session_analytics AS
SELECT
    portal,
    role,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN revoked_at IS NULL AND expires_at > NOW() THEN 1 END) as active_sessions,
    COUNT(CASE WHEN revoked_at IS NOT NULL THEN 1 END) as revoked_sessions,
    COUNT(CASE WHEN expires_at < NOW() AND revoked_at IS NULL THEN 1 END) as expired_sessions,
    AVG(EXTRACT(EPOCH FROM (COALESCE(revoked_at, expires_at) - created_at))/3600)::NUMERIC(10,2) as avg_session_duration_hours
FROM unified_sessions
GROUP BY portal, role;

-- Grant read access to analytics view
GRANT SELECT ON session_analytics TO authenticated;