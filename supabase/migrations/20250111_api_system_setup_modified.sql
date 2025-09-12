-- Migration: API System Setup for Backflow Buddy Plugin (Modified for Single-Tenant)
-- Creates tables for API key management, usage tracking, and webhooks
-- Modified to work with single-tenant customer-based system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create companies table if it doesn't exist (for API compatibility)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default company for single-tenant setup
INSERT INTO companies (name, slug) 
VALUES ('Fisher Backflows', 'fisher-backflows') 
ON CONFLICT (slug) DO NOTHING;

-- Create function to get current company ID (returns the default company)
CREATE OR REPLACE FUNCTION get_current_company_id()
RETURNS UUID AS $$
DECLARE
    company_id UUID;
BEGIN
    SELECT id INTO company_id FROM companies WHERE slug = 'fisher-backflows' LIMIT 1;
    RETURN company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- API Keys table for authentication
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_preview VARCHAR(20) NOT NULL, -- Last 4 chars for display
    is_active BOOLEAN DEFAULT true,
    rate_limit_per_hour INTEGER DEFAULT 1000,
    allowed_ips TEXT[], -- Optional IP whitelist
    scopes TEXT[] DEFAULT ARRAY['read', 'write'], -- API permissions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE -- Optional expiration
);

-- API usage logs for tracking and billing
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    ip_address INET,
    user_agent TEXT,
    request_size INTEGER,
    response_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook endpoints for real-time notifications
CREATE TABLE IF NOT EXISTS webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    secret VARCHAR(255) NOT NULL, -- For signature verification
    events TEXT[] NOT NULL, -- Array of event types to listen for
    is_active BOOLEAN DEFAULT true,
    retry_count INTEGER DEFAULT 3,
    timeout_seconds INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook delivery logs
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'pending', 'delivered', 'failed'
    http_status_code INTEGER,
    response_body TEXT,
    attempt_count INTEGER DEFAULT 1,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API rate limiting table
CREATE TABLE IF NOT EXISTS api_rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    request_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(api_key_id, window_start)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);

CREATE INDEX IF NOT EXISTS idx_api_keys_company_id ON api_keys(company_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_api_key_id ON api_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_company_id ON api_usage_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_endpoint ON api_usage_logs(endpoint);

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_company_id ON webhook_endpoints(company_id);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_active ON webhook_endpoints(is_active);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_endpoint_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at ON webhook_deliveries(created_at);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_api_key_window ON api_rate_limits(api_key_id, window_start);

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS policies for companies (allow all authenticated users to read)
CREATE POLICY "Authenticated users can read companies"
    ON companies FOR SELECT
    USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- RLS policies for API keys
CREATE POLICY "Companies can manage their own API keys"
    ON api_keys FOR ALL
    USING (company_id = get_current_company_id());

CREATE POLICY "Service role can manage all API keys"
    ON api_keys FOR ALL
    USING (auth.role() = 'service_role');

-- RLS policies for API usage logs
CREATE POLICY "Companies can view their own API usage logs"
    ON api_usage_logs FOR SELECT
    USING (company_id = get_current_company_id());

CREATE POLICY "Service role can insert API usage logs"
    ON api_usage_logs FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all API usage logs"
    ON api_usage_logs FOR ALL
    USING (auth.role() = 'service_role');

-- RLS policies for webhook endpoints
CREATE POLICY "Companies can manage their own webhook endpoints"
    ON webhook_endpoints FOR ALL
    USING (company_id = get_current_company_id());

CREATE POLICY "Service role can manage all webhook endpoints"
    ON webhook_endpoints FOR ALL
    USING (auth.role() = 'service_role');

-- RLS policies for webhook deliveries
CREATE POLICY "Companies can view their own webhook deliveries"
    ON webhook_deliveries FOR SELECT
    USING (
        webhook_endpoint_id IN (
            SELECT id FROM webhook_endpoints WHERE company_id = get_current_company_id()
        )
    );

CREATE POLICY "Service role can manage webhook deliveries"
    ON webhook_deliveries FOR ALL
    USING (auth.role() = 'service_role');

-- RLS policies for API rate limits
CREATE POLICY "Service role can manage API rate limits"
    ON api_rate_limits FOR ALL
    USING (auth.role() = 'service_role');

-- Function to generate API key
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
BEGIN
    RETURN 'bbapi_' || encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to hash API key
CREATE OR REPLACE FUNCTION hash_api_key(key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(digest(key, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to get API key preview (last 4 characters)
CREATE OR REPLACE FUNCTION get_api_key_preview(key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN '****' || right(key, 4);
END;
$$ LANGUAGE plpgsql;

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_api_key_id UUID,
    p_limit INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    current_window TIMESTAMP WITH TIME ZONE;
    current_count INTEGER;
BEGIN
    -- Get current hour window
    current_window := date_trunc('hour', NOW());
    
    -- Get current count for this window
    SELECT COALESCE(request_count, 0) INTO current_count
    FROM api_rate_limits
    WHERE api_key_id = p_api_key_id 
    AND window_start = current_window;
    
    -- Check if under limit
    IF current_count < p_limit THEN
        -- Increment counter
        INSERT INTO api_rate_limits (api_key_id, window_start, request_count)
        VALUES (p_api_key_id, current_window, 1)
        ON CONFLICT (api_key_id, window_start)
        DO UPDATE SET request_count = api_rate_limits.request_count + 1;
        
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to queue webhook delivery
CREATE OR REPLACE FUNCTION queue_webhook_delivery(
    p_company_id UUID,
    p_event_type TEXT,
    p_payload JSONB
)
RETURNS VOID AS $$
BEGIN
    -- Insert webhook deliveries for all active endpoints subscribed to this event
    INSERT INTO webhook_deliveries (webhook_endpoint_id, event_type, payload, status)
    SELECT 
        id,
        p_event_type,
        p_payload,
        'pending'
    FROM webhook_endpoints
    WHERE company_id = p_company_id
    AND is_active = true
    AND p_event_type = ANY(events);
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys;
CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_webhook_endpoints_updated_at ON webhook_endpoints;
CREATE TRIGGER update_webhook_endpoints_updated_at
    BEFORE UPDATE ON webhook_endpoints
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for API usage analytics
CREATE OR REPLACE VIEW api_usage_analytics AS
SELECT 
    api_key_id,
    company_id,
    endpoint,
    method,
    DATE(created_at) as usage_date,
    COUNT(*) as request_count,
    AVG(response_time_ms) as avg_response_time,
    COUNT(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 END) as success_count,
    COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
FROM api_usage_logs
GROUP BY api_key_id, company_id, endpoint, method, DATE(created_at);

-- Comments for documentation
COMMENT ON TABLE companies IS 'Companies table for multi-tenant API support';
COMMENT ON TABLE api_keys IS 'API keys for authenticating external integrations';
COMMENT ON TABLE api_usage_logs IS 'Logs of all API requests for analytics and billing';
COMMENT ON TABLE webhook_endpoints IS 'Webhook endpoints for real-time event notifications';
COMMENT ON TABLE webhook_deliveries IS 'Log of webhook delivery attempts';
COMMENT ON TABLE api_rate_limits IS 'Rate limiting tracking per API key';

COMMENT ON FUNCTION get_current_company_id() IS 'Returns the default company ID for single-tenant setup';
COMMENT ON FUNCTION generate_api_key() IS 'Generates a new secure API key with bbapi_ prefix';
COMMENT ON FUNCTION hash_api_key(TEXT) IS 'Hashes an API key for secure storage';
COMMENT ON FUNCTION check_rate_limit(UUID, INTEGER) IS 'Checks and updates rate limit for an API key';
COMMENT ON FUNCTION queue_webhook_delivery(UUID, TEXT, JSONB) IS 'Queues webhook deliveries for an event';