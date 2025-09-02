-- 📱 PWA PUSH NOTIFICATIONS DATABASE TABLES
-- Execute in Supabase SQL Editor to enable push notifications

-- Table for storing push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(user_id)
);

-- Table for logging sent notifications
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    sent_by UUID REFERENCES auth.users(id),
    tracking_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for tracking notification interactions
CREATE TABLE IF NOT EXISTS notification_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_id TEXT REFERENCES notification_logs(tracking_id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'displayed', 'clicked', 'dismissed'
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(active);
CREATE INDEX IF NOT EXISTS idx_notification_logs_tracking_id ON notification_logs(tracking_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_by ON notification_logs(sent_by);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_interactions_tracking_id ON notification_interactions(tracking_id);

-- Row Level Security (RLS) Policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_interactions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own push subscriptions
CREATE POLICY "Users can manage own push subscriptions" ON push_subscriptions
    FOR ALL USING (auth.uid() = user_id);

-- Admin users can view notification logs
CREATE POLICY "Team users can view notification logs" ON notification_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_users 
            WHERE email = (SELECT auth.jwt() ->> 'email') 
            AND role IN ('admin', 'manager')
        )
    );

-- Admin users can insert notification logs
CREATE POLICY "Team users can insert notification logs" ON notification_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM team_users 
            WHERE email = (SELECT auth.jwt() ->> 'email') 
            AND role IN ('admin', 'manager')
        )
    );

-- Service workers can insert interaction tracking (relaxed policy for service worker)
CREATE POLICY "Allow notification interaction tracking" ON notification_interactions
    FOR INSERT WITH CHECK (true);

-- Team users can view interaction analytics
CREATE POLICY "Team users can view notification interactions" ON notification_interactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_users 
            WHERE email = (SELECT auth.jwt() ->> 'email') 
            AND role IN ('admin', 'manager')
        )
    );

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_push_subscriptions_updated_at 
    BEFORE UPDATE ON push_subscriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE push_subscriptions IS 'Stores web push notification subscriptions for PWA users';
COMMENT ON TABLE notification_logs IS 'Logs all sent push notifications for analytics and tracking';
COMMENT ON TABLE notification_interactions IS 'Tracks user interactions with push notifications (clicks, dismissals, etc.)';

COMMENT ON COLUMN push_subscriptions.subscription IS 'JSON object containing the push subscription details from browser';
COMMENT ON COLUMN push_subscriptions.active IS 'Whether the subscription is currently active and should receive notifications';
COMMENT ON COLUMN notification_logs.tracking_id IS 'Unique identifier for tracking notification delivery and interactions';
COMMENT ON COLUMN notification_interactions.action IS 'Type of interaction: displayed, clicked, dismissed, view-*, etc.';

-- Sample notification templates (optional)
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    icon TEXT,
    url TEXT,
    actions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default notification templates
INSERT INTO notification_templates (name, title, body, icon, url, actions) VALUES
('appointment_reminder', 'Appointment Reminder', 'You have an appointment scheduled for tomorrow at {time}', '/icons/schedule-96.svg', '/portal/appointments', '[{"action": "view", "title": "View Details"}]'),
('payment_due', 'Payment Due', 'Your invoice #{invoice_number} is due on {due_date}', '/icons/payment-96.svg', '/portal/billing', '[{"action": "pay", "title": "Pay Now"}]'),
('test_complete', 'Test Complete', 'Your backflow test has been completed successfully', '/icons/icon-192x192.svg', '/portal/reports', '[{"action": "view", "title": "View Report"}]'),
('welcome', 'Welcome to Fisher Backflows', 'Thank you for choosing our backflow testing services!', '/icons/icon-192x192.svg', '/portal', '[{"action": "explore", "title": "Explore Portal"}]')
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE notification_templates IS 'Predefined notification templates for common use cases';

-- Enable RLS on templates
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- Team users can view templates
CREATE POLICY "Team users can view notification templates" ON notification_templates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_users 
            WHERE email = (SELECT auth.jwt() ->> 'email')
        )
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON push_subscriptions TO authenticated;
GRANT SELECT, INSERT ON notification_logs TO authenticated;
GRANT INSERT ON notification_interactions TO authenticated, anon;
GRANT SELECT ON notification_templates TO authenticated;

-- Verification query
SELECT 
    'push_subscriptions' as table_name,
    COUNT(*) as row_count
FROM push_subscriptions
UNION ALL
SELECT 
    'notification_logs' as table_name,
    COUNT(*) as row_count  
FROM notification_logs
UNION ALL
SELECT 
    'notification_interactions' as table_name,
    COUNT(*) as row_count
FROM notification_interactions
UNION ALL
SELECT 
    'notification_templates' as table_name,
    COUNT(*) as row_count
FROM notification_templates;