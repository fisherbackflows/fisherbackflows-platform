-- 🚀 Mobile Tables Installation
-- Generated: 2025-09-03T14:50:21.551Z
-- Missing tables: technician_locations, technician_current_location, push_subscriptions, notification_logs, notification_interactions


-- Location tracking history
CREATE TABLE technician_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technician_id TEXT NOT NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(8, 2),
    heading DECIMAL(5, 2),
    speed DECIMAL(6, 2),
    address TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    synced_offline BOOLEAN DEFAULT false,
    UNIQUE(technician_id, recorded_at)
);

CREATE INDEX idx_technician_locations_technician_id ON technician_locations(technician_id);
CREATE INDEX idx_technician_locations_recorded_at ON technician_locations(recorded_at DESC);
ALTER TABLE technician_locations ENABLE ROW LEVEL SECURITY;

-- Current technician positions
CREATE TABLE technician_current_location (
    technician_id TEXT PRIMARY KEY,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(8, 2),
    heading DECIMAL(5, 2),
    speed DECIMAL(6, 2),
    address TEXT,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    battery_level INTEGER,
    signal_strength TEXT
);

CREATE INDEX idx_technician_current_location_updated ON technician_current_location(last_updated DESC);
ALTER TABLE technician_current_location ENABLE ROW LEVEL SECURITY;

-- PWA push subscriptions
CREATE TABLE push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Notification history
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    sent_by UUID REFERENCES auth.users(id),
    tracking_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_notification_logs_tracking_id ON notification_logs(tracking_id);
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Notification interactions
CREATE TABLE notification_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_id TEXT REFERENCES notification_logs(tracking_id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_notification_interactions_tracking_id ON notification_interactions(tracking_id);
ALTER TABLE notification_interactions ENABLE ROW LEVEL SECURITY;

-- Add location columns to appointments
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS technician_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS technician_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS technician_last_location TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS customer_can_track BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS estimated_arrival TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS travel_distance_km DECIMAL(6, 2);

-- Success check
SELECT 'Mobile tables ready!' as status;
