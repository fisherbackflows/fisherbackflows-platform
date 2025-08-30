-- =============================================
-- Audit Logs Table Migration
-- Creates comprehensive audit logging infrastructure
-- =============================================

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    entity_type TEXT,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB DEFAULT '{}',
    regulations TEXT[] DEFAULT '{}',
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) NOT NULL DEFAULT 'low',
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    organization_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id) WHERE entity_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);
CREATE INDEX IF NOT EXISTS idx_audit_logs_regulations ON audit_logs USING GIN(regulations);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address) WHERE ip_address IS NOT NULL;

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_timestamp ON audit_logs(entity_type, entity_id, timestamp DESC) WHERE entity_type IS NOT NULL;

-- Add RLS (Row Level Security)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Admins can see all audit logs
CREATE POLICY "Admins can view all audit logs" ON audit_logs
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM team_members 
            WHERE team_members.user_id = auth.uid() 
            AND team_members.role IN ('admin', 'manager')
        )
    );

-- Users can only see their own audit logs
CREATE POLICY "Users can view their own audit logs" ON audit_logs
    FOR SELECT 
    TO authenticated
    USING (user_id = auth.uid());

-- Only system can insert audit logs (via service role)
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT 
    WITH CHECK (true);

-- Only system can update audit logs (via service role)
CREATE POLICY "System can update audit logs" ON audit_logs
    FOR UPDATE 
    USING (true);

-- Create audit log retention policy table
CREATE TABLE IF NOT EXISTS audit_log_retention_policies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type TEXT NOT NULL UNIQUE,
    retention_period_days INTEGER NOT NULL DEFAULT 2555, -- 7 years default
    archive_after_days INTEGER,
    regulations TEXT[] DEFAULT '{}',
    auto_delete BOOLEAN DEFAULT false,
    last_cleanup_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert default retention policies
INSERT INTO audit_log_retention_policies (entity_type, retention_period_days, regulations, auto_delete) VALUES
    ('audit_logs', 2555, ARRAY['SOC2'], false), -- 7 years for SOX compliance
    ('customer', 1095, ARRAY['GDPR', 'CCPA'], false), -- 3 years, manual review required
    ('payment', 2555, ARRAY['PCI_DSS'], false), -- 7 years for financial records
    ('session', 90, ARRAY['GDPR'], true), -- 90 days, auto-delete
    ('system', 1825, ARRAY['SOC2'], false) -- 5 years for system events
ON CONFLICT (entity_type) DO NOTHING;

-- Create audit log statistics view
CREATE OR REPLACE VIEW audit_log_stats AS
SELECT 
    DATE_TRUNC('day', timestamp) as date,
    event_type,
    severity,
    success,
    COUNT(*) as event_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT ip_address) as unique_ips
FROM audit_logs 
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', timestamp), event_type, severity, success
ORDER BY date DESC;

-- Create function to clean up old audit logs based on retention policy
CREATE OR REPLACE FUNCTION cleanup_audit_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    policy_record RECORD;
    deleted_count INTEGER := 0;
    total_deleted INTEGER := 0;
BEGIN
    -- Loop through all retention policies
    FOR policy_record IN 
        SELECT * FROM audit_log_retention_policies WHERE auto_delete = true
    LOOP
        -- Delete records older than retention period
        DELETE FROM audit_logs 
        WHERE entity_type = policy_record.entity_type 
        AND timestamp < NOW() - INTERVAL '1 day' * policy_record.retention_period_days;
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        total_deleted := total_deleted + deleted_count;
        
        -- Update last cleanup timestamp
        UPDATE audit_log_retention_policies 
        SET last_cleanup_at = NOW() 
        WHERE id = policy_record.id;
    END LOOP;
    
    RETURN total_deleted;
END;
$$;

-- Create function to get audit statistics
CREATE OR REPLACE FUNCTION get_audit_statistics(
    p_timeframe TEXT DEFAULT 'week',
    p_user_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    start_date TIMESTAMPTZ;
    result JSON;
    event_stats JSON;
    severity_stats JSON;
    user_stats JSON;
    total_events INTEGER;
    failed_events INTEGER;
    failure_rate NUMERIC;
BEGIN
    -- Calculate start date based on timeframe
    CASE p_timeframe
        WHEN 'day' THEN start_date := NOW() - INTERVAL '1 day';
        WHEN 'week' THEN start_date := NOW() - INTERVAL '1 week';
        WHEN 'month' THEN start_date := NOW() - INTERVAL '1 month';
        ELSE start_date := NOW() - INTERVAL '1 week';
    END CASE;
    
    -- Get total events and failures
    SELECT COUNT(*), COUNT(*) FILTER (WHERE NOT success)
    INTO total_events, failed_events
    FROM audit_logs 
    WHERE timestamp >= start_date
    AND (p_user_id IS NULL OR user_id = p_user_id);
    
    -- Calculate failure rate
    failure_rate := CASE 
        WHEN total_events > 0 THEN (failed_events::NUMERIC / total_events::NUMERIC) * 100
        ELSE 0
    END;
    
    -- Get events by type
    SELECT json_object_agg(event_type, event_count)
    INTO event_stats
    FROM (
        SELECT event_type, COUNT(*) as event_count
        FROM audit_logs 
        WHERE timestamp >= start_date
        AND (p_user_id IS NULL OR user_id = p_user_id)
        GROUP BY event_type
        ORDER BY event_count DESC
        LIMIT 20
    ) t;
    
    -- Get events by severity
    SELECT json_object_agg(severity, event_count)
    INTO severity_stats
    FROM (
        SELECT severity, COUNT(*) as event_count
        FROM audit_logs 
        WHERE timestamp >= start_date
        AND (p_user_id IS NULL OR user_id = p_user_id)
        GROUP BY severity
    ) t;
    
    -- Get top users (only for admin queries)
    IF p_user_id IS NULL THEN
        SELECT json_agg(
            json_build_object(
                'user_id', user_id,
                'event_count', event_count
            ) ORDER BY event_count DESC
        )
        INTO user_stats
        FROM (
            SELECT user_id, COUNT(*) as event_count
            FROM audit_logs 
            WHERE timestamp >= start_date
            AND user_id IS NOT NULL
            GROUP BY user_id
            ORDER BY event_count DESC
            LIMIT 10
        ) t;
    ELSE
        user_stats := '[]'::JSON;
    END IF;
    
    -- Build final result
    result := json_build_object(
        'totalEvents', total_events,
        'failedEvents', failed_events,
        'failureRate', failure_rate,
        'eventsByType', COALESCE(event_stats, '{}'::JSON),
        'eventsBySeverity', COALESCE(severity_stats, '{}'::JSON),
        'topUsers', COALESCE(user_stats, '[]'::JSON),
        'timeframe', p_timeframe,
        'startDate', start_date,
        'endDate', NOW()
    );
    
    RETURN result;
END;
$$;

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER audit_logs_updated_at
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER audit_log_retention_policies_updated_at
    BEFORE UPDATE ON audit_log_retention_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT ON audit_logs TO authenticated;
GRANT SELECT ON audit_log_stats TO authenticated;
GRANT SELECT ON audit_log_retention_policies TO authenticated;
GRANT EXECUTE ON FUNCTION get_audit_statistics TO authenticated;

-- Comments for documentation
COMMENT ON TABLE audit_logs IS 'Comprehensive audit log for all system activities, user actions, and data changes';
COMMENT ON TABLE audit_log_retention_policies IS 'Data retention policies for different types of audit events';
COMMENT ON FUNCTION cleanup_audit_logs() IS 'Automated cleanup of old audit logs based on retention policies';
COMMENT ON FUNCTION get_audit_statistics(TEXT, UUID) IS 'Generate audit statistics for monitoring and compliance reporting';

-- Create scheduled job for automatic cleanup (requires pg_cron extension)
-- This would typically be set up separately in production
-- SELECT cron.schedule('audit-log-cleanup', '0 2 * * *', 'SELECT cleanup_audit_logs();');