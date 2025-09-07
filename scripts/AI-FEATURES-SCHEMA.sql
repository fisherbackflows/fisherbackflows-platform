-- ==========================================
-- AI FEATURES DATABASE SCHEMA
-- ==========================================
-- GPT-5 integration tables for Fisher Backflows
-- Enhanced business intelligence and AI features
-- ==========================================

-- AI Insights Table
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    query TEXT NOT NULL,
    context VARCHAR(50) CHECK (context IN ('revenue', 'customers', 'operations', 'compliance', 'overall business')),
    timeframe VARCHAR(10) DEFAULT '30d',
    insight TEXT NOT NULL,
    key_findings JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
    data_quality JSONB DEFAULT '{}',
    market_context JSONB DEFAULT '{}',
    alerts JSONB DEFAULT '[]',
    generated_by UUID REFERENCES team_users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated Reports Table
CREATE TABLE IF NOT EXISTS generated_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('executive-summary', 'compliance', 'water-district', 'customer-health', 'operational-performance')),
    period VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    sections JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    format VARCHAR(20) DEFAULT 'html' CHECK (format IN ('html', 'markdown', 'pdf-ready')),
    custom_filters JSONB DEFAULT '{}',
    generated_by UUID REFERENCES team_users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Communications Table
CREATE TABLE IF NOT EXISTS customer_communications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id),
    message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('reminder', 'report', 'support', 'follow-up', 'compliance-alert')),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    next_actions JSONB DEFAULT '[]',
    tone VARCHAR(20) DEFAULT 'professional' CHECK (tone IN ('professional', 'friendly', 'urgent')),
    context JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'failed')),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_by UUID REFERENCES team_users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat History Table (for customer support chatbot)
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id),
    session_id VARCHAR(100),
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    response_type VARCHAR(50) DEFAULT 'general',
    context JSONB DEFAULT '{}',
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Logs Table (tracking sent communications)
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    communication_id UUID REFERENCES customer_communications(id),
    customer_id UUID REFERENCES customers(id),
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
    provider VARCHAR(50) DEFAULT 'resend',
    provider_id VARCHAR(255),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Configuration Table
CREATE TABLE IF NOT EXISTS ai_configuration (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_ai_insights_context ON ai_insights(context);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created_at ON ai_insights(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_insights_confidence ON ai_insights(confidence);
CREATE INDEX IF NOT EXISTS idx_ai_insights_generated_by ON ai_insights(generated_by);

CREATE INDEX IF NOT EXISTS idx_generated_reports_type ON generated_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_generated_reports_created_at ON generated_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_generated_reports_generated_by ON generated_reports(generated_by);

CREATE INDEX IF NOT EXISTS idx_customer_communications_customer_id ON customer_communications(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_communications_status ON customer_communications(status);
CREATE INDEX IF NOT EXISTS idx_customer_communications_message_type ON customer_communications(message_type);
CREATE INDEX IF NOT EXISTS idx_customer_communications_scheduled_for ON customer_communications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_customer_communications_created_at ON customer_communications(created_at);

CREATE INDEX IF NOT EXISTS idx_chat_history_customer_id ON chat_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at);

CREATE INDEX IF NOT EXISTS idx_email_logs_customer_id ON email_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);

-- Row Level Security (RLS) Policies
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_configuration ENABLE ROW LEVEL SECURITY;

-- AI Insights Policies
CREATE POLICY "ai_insights_admin_full_access" 
ON ai_insights FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_users 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'manager')
    )
);

CREATE POLICY "ai_insights_service_role" 
ON ai_insights FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- Generated Reports Policies
CREATE POLICY "generated_reports_admin_full_access" 
ON generated_reports FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_users 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'manager')
    )
);

CREATE POLICY "generated_reports_service_role" 
ON generated_reports FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- Customer Communications Policies
CREATE POLICY "customer_communications_admin_full_access" 
ON customer_communications FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_users 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'manager', 'coordinator')
    )
);

CREATE POLICY "customer_communications_customer_read_own" 
ON customer_communications FOR SELECT TO authenticated
USING (
    customer_id IN (
        SELECT id FROM customers 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "customer_communications_service_role" 
ON customer_communications FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- Chat History Policies
CREATE POLICY "chat_history_customer_own_data" 
ON chat_history FOR ALL TO authenticated
USING (
    customer_id IN (
        SELECT id FROM customers 
        WHERE user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM team_users 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'manager', 'coordinator')
    )
);

CREATE POLICY "chat_history_service_role" 
ON chat_history FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- Email Logs Policies  
CREATE POLICY "email_logs_admin_access" 
ON email_logs FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_users 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'manager')
    )
);

CREATE POLICY "email_logs_service_role" 
ON email_logs FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- AI Configuration Policies (Admin only)
CREATE POLICY "ai_configuration_admin_only" 
ON ai_configuration FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_users 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

CREATE POLICY "ai_configuration_service_role" 
ON ai_configuration FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- Insert Default AI Configuration
INSERT INTO ai_configuration (config_key, config_value, description) VALUES
('gpt5_model', 'gpt-4', 'Current GPT model to use (will update to gpt-5 when available)'),
('max_tokens_default', '2000', 'Default maximum tokens for AI responses'),
('temperature_insights', '0.2', 'Temperature setting for business insights (lower = more factual)'),
('temperature_communications', '0.3', 'Temperature setting for customer communications'),
('chat_session_timeout', '3600', 'Chat session timeout in seconds'),
('max_daily_insights', '50', 'Maximum AI insights generated per day'),
('max_daily_communications', '100', 'Maximum AI communications per day')
ON CONFLICT (config_key) DO NOTHING;

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Apply triggers to tables with updated_at columns
DROP TRIGGER IF EXISTS update_ai_insights_updated_at ON ai_insights;
CREATE TRIGGER update_ai_insights_updated_at
    BEFORE UPDATE ON ai_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_generated_reports_updated_at ON generated_reports;
CREATE TRIGGER update_generated_reports_updated_at
    BEFORE UPDATE ON generated_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customer_communications_updated_at ON customer_communications;
CREATE TRIGGER update_customer_communications_updated_at
    BEFORE UPDATE ON customer_communications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_configuration_updated_at ON ai_configuration;
CREATE TRIGGER update_ai_configuration_updated_at
    BEFORE UPDATE ON ai_configuration
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- AI Usage Analytics View
CREATE OR REPLACE VIEW ai_usage_analytics AS
SELECT 
    'insights' as feature_type,
    COUNT(*) as usage_count,
    AVG(confidence) as avg_confidence,
    DATE_TRUNC('day', created_at) as usage_date
FROM ai_insights
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)

UNION ALL

SELECT 
    'reports' as feature_type,
    COUNT(*) as usage_count,
    NULL as avg_confidence,
    DATE_TRUNC('day', created_at) as usage_date
FROM generated_reports
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)

UNION ALL

SELECT 
    'communications' as feature_type,
    COUNT(*) as usage_count,
    NULL as avg_confidence,
    DATE_TRUNC('day', created_at) as usage_date
FROM customer_communications
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)

ORDER BY usage_date DESC, feature_type;

-- AI Performance Summary View
CREATE OR REPLACE VIEW ai_performance_summary AS
SELECT 
    (SELECT COUNT(*) FROM ai_insights WHERE created_at >= NOW() - INTERVAL '24 hours') as insights_24h,
    (SELECT COUNT(*) FROM generated_reports WHERE created_at >= NOW() - INTERVAL '24 hours') as reports_24h,
    (SELECT COUNT(*) FROM customer_communications WHERE status = 'sent' AND created_at >= NOW() - INTERVAL '24 hours') as communications_24h,
    (SELECT AVG(confidence) FROM ai_insights WHERE created_at >= NOW() - INTERVAL '7 days') as avg_confidence_7d,
    (SELECT COUNT(*) FROM chat_history WHERE created_at >= NOW() - INTERVAL '24 hours') as chat_interactions_24h,
    (SELECT COUNT(*) FROM email_logs WHERE status = 'sent' AND created_at >= NOW() - INTERVAL '24 hours') as emails_sent_24h;

-- Final validation and status
DO $$
DECLARE
    table_count INTEGER;
    policy_count INTEGER;
    view_count INTEGER;
BEGIN
    -- Count AI-related tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_name IN ('ai_insights', 'generated_reports', 'customer_communications', 'chat_history', 'email_logs', 'ai_configuration')
    AND table_schema = 'public';
    
    -- Count AI-related policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename IN ('ai_insights', 'generated_reports', 'customer_communications', 'chat_history', 'email_logs', 'ai_configuration');
    
    -- Count AI views
    SELECT COUNT(*) INTO view_count
    FROM information_schema.views
    WHERE view_name IN ('ai_usage_analytics', 'ai_performance_summary')
    AND table_schema = 'public';
    
    -- Log installation results
    INSERT INTO audit_logs (table_name, action, details, created_by, created_at)
    VALUES ('AI_FEATURES_SCHEMA', 'SCHEMA_INSTALLED', 
            jsonb_build_object(
                'tables_created', table_count,
                'policies_created', policy_count,
                'views_created', view_count,
                'status', CASE 
                    WHEN table_count = 6 AND policy_count >= 12 AND view_count = 2 THEN 'SUCCESS'
                    ELSE 'PARTIAL' 
                END
            ), 
            'system', NOW());
END $$;

-- Display final status
SELECT 
    'AI FEATURES SCHEMA INSTALLED' as status,
    NOW() as completed_at,
    'GPT-5 Integration Ready' as ai_status;

-- Show AI security status
SELECT 
    'AI SECURITY STATUS' as title,
    t.table_name,
    CASE WHEN t.row_security = 'YES' THEN '✅ SECURED' ELSE '❌ VULNERABLE' END as rls_status,
    COUNT(p.policyname) as policy_count
FROM information_schema.tables t
LEFT JOIN pg_policies p ON t.table_name = p.tablename
WHERE t.table_schema = 'public' 
AND t.table_name IN ('ai_insights', 'generated_reports', 'customer_communications', 'chat_history', 'email_logs', 'ai_configuration')
GROUP BY t.table_name, t.row_security
ORDER BY t.table_name;