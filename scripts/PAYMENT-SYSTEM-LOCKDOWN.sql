-- ==========================================
-- PAYMENT SYSTEM EMERGENCY LOCKDOWN
-- ==========================================
-- Creates bulletproof payment infrastructure
-- Run this immediately after database security lockdown
-- ==========================================

-- Step 1: Create payment audit logs table for compliance
CREATE TABLE IF NOT EXISTS payment_audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    payment_id VARCHAR(255) NOT NULL,
    customer_id UUID,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'processed', 'failed', 'refunded', 'disputed')),
    status VARCHAR(50) NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_audit_logs_payment_id ON payment_audit_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_audit_logs_customer_id ON payment_audit_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_audit_logs_created_at ON payment_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_audit_logs_action ON payment_audit_logs(action);

-- Enable RLS on payment audit logs
ALTER TABLE payment_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view payment audit logs
CREATE POLICY "payment_audit_admin_only" 
ON payment_audit_logs 
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_users 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Service role full access for system operations
CREATE POLICY "payment_audit_service_role" 
ON payment_audit_logs 
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

-- Step 2: Update payments table with additional security fields
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_charge_id VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_id VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_reason TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add indexes for payment processing performance
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_charge_id ON payments(stripe_charge_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);

-- Step 3: Create payment integrity validation function
CREATE OR REPLACE FUNCTION validate_payment_integrity(payment_intent_id VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    payment_count INTEGER;
    status_consistent BOOLEAN;
BEGIN
    -- Check if payment exists in our database
    SELECT COUNT(*) INTO payment_count 
    FROM payments 
    WHERE stripe_payment_intent_id = payment_intent_id;
    
    -- Payment should exist in our system
    IF payment_count = 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Additional integrity checks can be added here
    -- For now, return TRUE if payment exists
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Step 4: Create payment status monitoring view
CREATE OR REPLACE VIEW payment_status_summary AS
SELECT 
    status,
    COUNT(*) as payment_count,
    SUM(CAST(amount AS DECIMAL)) as total_amount,
    AVG(CAST(amount AS DECIMAL)) as average_amount,
    MIN(created_at) as earliest_payment,
    MAX(created_at) as latest_payment
FROM payments 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY status
ORDER BY payment_count DESC;

-- Step 5: Create payment reconciliation function
CREATE OR REPLACE FUNCTION reconcile_payments(start_date DATE DEFAULT CURRENT_DATE - 1)
RETURNS TABLE (
    date_checked DATE,
    total_payments INTEGER,
    successful_payments INTEGER,
    failed_payments INTEGER,
    total_revenue DECIMAL,
    integrity_issues INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        start_date as date_checked,
        COUNT(*)::INTEGER as total_payments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::INTEGER as successful_payments,
        COUNT(CASE WHEN status = 'failed' THEN 1 END)::INTEGER as failed_payments,
        SUM(CASE WHEN status = 'completed' THEN CAST(amount AS DECIMAL) ELSE 0 END) as total_revenue,
        0::INTEGER as integrity_issues -- Placeholder for future integrity checks
    FROM payments 
    WHERE DATE(created_at) = start_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Step 6: Create webhook processing log table
CREATE TABLE IF NOT EXISTS webhook_processing_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    webhook_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    processing_status VARCHAR(50) NOT NULL CHECK (processing_status IN ('received', 'processing', 'completed', 'failed')),
    payload_size INTEGER,
    processing_time_ms INTEGER,
    error_message TEXT,
    stripe_event_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Index for webhook logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_processing_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_processing_logs(processing_status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_processing_logs(created_at);

-- RLS for webhook logs (admin only)
ALTER TABLE webhook_processing_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_logs_admin_only" 
ON webhook_processing_logs 
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_users 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

CREATE POLICY "webhook_logs_service_role" 
ON webhook_processing_logs 
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

-- Step 7: Create payment health monitoring function
CREATE OR REPLACE FUNCTION check_payment_system_health()
RETURNS JSONB AS $$
DECLARE
    health_status JSONB;
    recent_failures INTEGER;
    processing_delays INTEGER;
    total_today INTEGER;
BEGIN
    -- Count recent failures
    SELECT COUNT(*) INTO recent_failures
    FROM payments 
    WHERE status = 'failed' 
    AND created_at >= NOW() - INTERVAL '1 hour';
    
    -- Count processing delays (payments stuck in processing > 10 minutes)
    SELECT COUNT(*) INTO processing_delays
    FROM payments 
    WHERE status = 'processing' 
    AND created_at <= NOW() - INTERVAL '10 minutes';
    
    -- Count total payments today
    SELECT COUNT(*) INTO total_today
    FROM payments 
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- Build health status
    health_status := jsonb_build_object(
        'timestamp', NOW(),
        'status', CASE 
            WHEN recent_failures > 10 OR processing_delays > 5 THEN 'critical'
            WHEN recent_failures > 5 OR processing_delays > 2 THEN 'warning'
            ELSE 'healthy'
        END,
        'recent_failures', recent_failures,
        'processing_delays', processing_delays,
        'total_payments_today', total_today,
        'failure_rate_1h', CASE 
            WHEN total_today > 0 THEN ROUND((recent_failures::DECIMAL / total_today) * 100, 2)
            ELSE 0 
        END
    );
    
    RETURN health_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Step 8: Create payment system configuration table
CREATE TABLE IF NOT EXISTS payment_system_config (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default configurations
INSERT INTO payment_system_config (config_key, config_value, description) VALUES
('max_payment_amount', '999999.00', 'Maximum allowed payment amount in USD'),
('payment_timeout_seconds', '30', 'Payment processing timeout in seconds'),
('max_retry_attempts', '3', 'Maximum retry attempts for failed payments'),
('webhook_timeout_seconds', '10', 'Webhook processing timeout in seconds'),
('daily_transaction_limit', '100000.00', 'Daily transaction limit per customer')
ON CONFLICT (config_key) DO NOTHING;

-- RLS for payment config (admin only)
ALTER TABLE payment_system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_config_admin_only" 
ON payment_system_config 
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_users 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

CREATE POLICY "payment_config_service_role" 
ON payment_system_config 
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

-- Step 9: Create automated payment monitoring triggers
CREATE OR REPLACE FUNCTION monitor_payment_failures()
RETURNS TRIGGER AS $$
BEGIN
    -- If payment failed, log it for monitoring
    IF NEW.status = 'failed' AND (OLD.status IS NULL OR OLD.status != 'failed') THEN
        INSERT INTO audit_logs (table_name, action, details, created_by, created_at)
        VALUES ('payments', 'PAYMENT_FAILED', 
                jsonb_build_object(
                    'payment_id', NEW.id,
                    'customer_id', NEW.customer_id,
                    'amount', NEW.amount,
                    'error_message', NEW.error_message
                ), 
                'system', NOW());
    END IF;
    
    -- If payment succeeded after being failed/pending, log success
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        INSERT INTO audit_logs (table_name, action, details, created_by, created_at)
        VALUES ('payments', 'PAYMENT_SUCCESS', 
                jsonb_build_object(
                    'payment_id', NEW.id,
                    'customer_id', NEW.customer_id,
                    'amount', NEW.amount,
                    'processing_time_ms', EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) * 1000
                ), 
                'system', NOW());
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger for payment monitoring
DROP TRIGGER IF EXISTS trigger_monitor_payment_failures ON payments;
CREATE TRIGGER trigger_monitor_payment_failures
    AFTER UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION monitor_payment_failures();

-- Step 10: Final validation and health check
DO $$
DECLARE
    table_count INTEGER;
    policy_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Count critical tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_name IN ('payment_audit_logs', 'webhook_processing_logs', 'payment_system_config')
    AND table_schema = 'public';
    
    -- Count payment-related policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename IN ('payment_audit_logs', 'webhook_processing_logs', 'payment_system_config');
    
    -- Count security functions
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_name IN ('validate_payment_integrity', 'check_payment_system_health')
    AND routine_schema = 'public';
    
    -- Log installation results
    INSERT INTO audit_logs (table_name, action, details, created_by, created_at)
    VALUES ('PAYMENT_SYSTEM_LOCKDOWN', 'COMPLETED', 
            jsonb_build_object(
                'tables_created', table_count,
                'policies_created', policy_count,
                'functions_created', function_count,
                'status', CASE 
                    WHEN table_count = 3 AND policy_count >= 6 AND function_count = 2 THEN 'SUCCESS'
                    ELSE 'PARTIAL' 
                END
            ), 
            'system', NOW());
END $$;

-- Display final status
SELECT 
    'PAYMENT SYSTEM LOCKDOWN COMPLETED' as status,
    check_payment_system_health() as current_health,
    NOW() as completed_at;

-- Show payment system security status
SELECT 
    'PAYMENT SECURITY STATUS' as title,
    t.table_name,
    CASE WHEN t.row_security = 'YES' THEN '✅ SECURED' ELSE '❌ VULNERABLE' END as rls_status,
    COUNT(p.policyname) as policy_count
FROM information_schema.tables t
LEFT JOIN pg_policies p ON t.table_name = p.tablename
WHERE t.table_schema = 'public' 
AND t.table_name IN ('payments', 'payment_audit_logs', 'webhook_processing_logs', 'payment_system_config')
GROUP BY t.table_name, t.row_security
ORDER BY t.table_name;