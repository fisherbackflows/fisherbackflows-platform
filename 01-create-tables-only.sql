-- 📱 STEP 1: CREATE MOBILE TABLES ONLY
-- Run this FIRST in Supabase SQL Editor

-- 1. Mobile Location Tracking Tables
CREATE TABLE IF NOT EXISTS technician_locations (
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

CREATE TABLE IF NOT EXISTS technician_current_location (
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

-- 2. PWA Push Notification Tables
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

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

CREATE TABLE IF NOT EXISTS notification_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_id TEXT REFERENCES notification_logs(tracking_id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Add location columns to appointments (if not exists)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS technician_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS technician_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS technician_last_location TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS customer_can_track BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS estimated_arrival TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS travel_distance_km DECIMAL(6, 2);

-- Success message
SELECT 'Tables created successfully!' as status;