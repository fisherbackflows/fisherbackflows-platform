-- 🔍 VERIFY MOBILE TABLES INSTALLATION
-- Run this in Supabase SQL Editor to verify all mobile tables were created

-- Check if mobile location tracking tables exist
SELECT 
    'technician_locations' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'technician_locations'
    ) as exists
UNION ALL
SELECT 
    'technician_current_location' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'technician_current_location'
    ) as exists
UNION ALL
-- Check PWA tables
SELECT 
    'push_subscriptions' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'push_subscriptions'
    ) as exists
UNION ALL
SELECT 
    'notification_logs' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notification_logs'
    ) as exists
UNION ALL
SELECT 
    'notification_interactions' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notification_interactions'
    ) as exists;

-- Check if location columns were added to appointments
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'appointments'
AND column_name IN (
    'technician_latitude',
    'technician_longitude', 
    'technician_last_location',
    'customer_can_track',
    'estimated_arrival',
    'travel_distance_km'
)
ORDER BY ordinal_position;

-- Check indexes
SELECT 
    indexname,
    tablename
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname IN (
    'idx_technician_locations_technician_id',
    'idx_technician_locations_recorded_at',
    'idx_technician_current_location_updated',
    'idx_push_subscriptions_user_id',
    'idx_notification_logs_tracking_id'
)
ORDER BY tablename, indexname;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
    'technician_locations',
    'technician_current_location',
    'push_subscriptions',
    'notification_logs',
    'notification_interactions'
)
ORDER BY tablename, policyname;