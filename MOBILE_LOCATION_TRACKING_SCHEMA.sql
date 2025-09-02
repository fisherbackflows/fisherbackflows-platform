-- 📍 MOBILE LOCATION TRACKING DATABASE SCHEMA
-- Execute in Supabase SQL Editor to enable real-time location tracking

-- Table for storing technician location history
CREATE TABLE IF NOT EXISTS technician_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technician_id TEXT NOT NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(8, 2), -- GPS accuracy in meters
    heading DECIMAL(5, 2), -- Direction in degrees (0-360)
    speed DECIMAL(6, 2), -- Speed in m/s
    address TEXT, -- Reverse geocoded address
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    synced_offline BOOLEAN DEFAULT false, -- Was this synced from offline storage
    
    UNIQUE(technician_id, recorded_at) -- Prevent duplicate timestamps
);

-- Table for current technician positions (optimized for real-time queries)
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
    battery_level INTEGER, -- Battery percentage (0-100)
    signal_strength TEXT -- GPS signal quality
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_technician_locations_technician_id ON technician_locations(technician_id);
CREATE INDEX IF NOT EXISTS idx_technician_locations_recorded_at ON technician_locations(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_technician_locations_appointment_id ON technician_locations(appointment_id);
CREATE INDEX IF NOT EXISTS idx_technician_locations_technician_time ON technician_locations(technician_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_technician_current_location_updated ON technician_current_location(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_technician_current_location_active ON technician_current_location(is_active);

-- Spatial indexes for location queries (if PostGIS is available)
-- CREATE INDEX IF NOT EXISTS idx_technician_locations_spatial ON technician_locations USING GIST (ST_Point(longitude, latitude));
-- CREATE INDEX IF NOT EXISTS idx_technician_current_spatial ON technician_current_location USING GIST (ST_Point(longitude, latitude));

-- Add location tracking columns to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS technician_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS technician_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS technician_last_location TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS customer_can_track BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS estimated_arrival TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS travel_distance_km DECIMAL(6, 2);

-- Create index for appointment location queries
CREATE INDEX IF NOT EXISTS idx_appointments_location ON appointments(technician_latitude, technician_longitude) 
WHERE technician_latitude IS NOT NULL;

-- Row Level Security (RLS) Policies
ALTER TABLE technician_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_current_location ENABLE ROW LEVEL SECURITY;

-- Team members can view/manage all location data
CREATE POLICY "Team users can manage location data" ON technician_locations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM team_users 
            WHERE email = (SELECT auth.jwt() ->> 'email')
        )
    );

CREATE POLICY "Team users can manage current locations" ON technician_current_location
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM team_users 
            WHERE email = (SELECT auth.jwt() ->> 'email')
        )
    );

-- Customers can view technician location for their appointments (if tracking enabled)
CREATE POLICY "Customers can track their technician" ON technician_current_location
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM appointments a
            JOIN customers c ON a.customer_id = c.id
            WHERE a.technician_id = technician_current_location.technician_id
            AND c.email = (SELECT auth.jwt() ->> 'email')
            AND a.customer_can_track = true
            AND a.appointment_date = CURRENT_DATE
            AND a.status IN ('confirmed', 'in_progress', 'traveling')
        )
    );

-- Auto-cleanup old location data (keep 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_locations()
RETURNS void AS $$
BEGIN
    DELETE FROM technician_locations 
    WHERE recorded_at < NOW() - INTERVAL '30 days';
    
    -- Keep current locations active only if updated within last 4 hours
    UPDATE technician_current_location 
    SET is_active = false 
    WHERE last_updated < NOW() - INTERVAL '4 hours';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup to run daily (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-locations', '0 2 * * *', 'SELECT cleanup_old_locations();');

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL, lon1 DECIMAL, 
    lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    R CONSTANT DECIMAL := 6371000; -- Earth radius in meters
    dLat DECIMAL;
    dLon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    dLat := radians(lat2 - lat1);
    dLon := radians(lon2 - lon1);
    
    a := sin(dLat/2) * sin(dLat/2) + 
         cos(radians(lat1)) * cos(radians(lat2)) * 
         sin(dLon/2) * sin(dLon/2);
    
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    
    RETURN R * c; -- Distance in meters
END;
$$ LANGUAGE plpgsql;

-- Function to get nearest technician to a location
CREATE OR REPLACE FUNCTION get_nearest_technician(
    target_lat DECIMAL, 
    target_lon DECIMAL,
    max_distance_km DECIMAL DEFAULT 50
) RETURNS TABLE(
    technician_id TEXT,
    distance_meters DECIMAL,
    latitude DECIMAL,
    longitude DECIMAL,
    last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tcl.technician_id,
        calculate_distance(target_lat, target_lon, tcl.latitude, tcl.longitude) as distance_meters,
        tcl.latitude,
        tcl.longitude,
        tcl.last_updated
    FROM technician_current_location tcl
    WHERE tcl.is_active = true
    AND calculate_distance(target_lat, target_lon, tcl.latitude, tcl.longitude) <= (max_distance_km * 1000)
    ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql;

-- Real-time subscriptions setup
-- Enable realtime for location tables
ALTER PUBLICATION supabase_realtime ADD TABLE technician_current_location;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;

-- Comments for documentation
COMMENT ON TABLE technician_locations IS 'Historical location tracking data for technicians';
COMMENT ON TABLE technician_current_location IS 'Current real-time position of active technicians';

COMMENT ON COLUMN technician_locations.accuracy IS 'GPS accuracy radius in meters';
COMMENT ON COLUMN technician_locations.heading IS 'Movement direction in degrees (0-360, where 0=North)';
COMMENT ON COLUMN technician_locations.speed IS 'Movement speed in meters per second';
COMMENT ON COLUMN technician_locations.synced_offline IS 'True if this location was stored offline and synced later';

COMMENT ON COLUMN technician_current_location.is_active IS 'False if technician hasnt updated location recently';
COMMENT ON COLUMN technician_current_location.battery_level IS 'Device battery percentage for power management';

-- Grant permissions
GRANT SELECT, INSERT ON technician_locations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON technician_current_location TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_distance TO authenticated;
GRANT EXECUTE ON FUNCTION get_nearest_technician TO authenticated;

-- Sample queries for testing:

-- Get current positions of all active technicians
/*
SELECT 
    technician_id,
    latitude,
    longitude,
    address,
    last_updated,
    EXTRACT(EPOCH FROM (NOW() - last_updated))/60 as minutes_ago
FROM technician_current_location 
WHERE is_active = true
ORDER BY last_updated DESC;
*/

-- Get location history for a technician today
/*
SELECT 
    latitude,
    longitude,
    accuracy,
    address,
    recorded_at
FROM technician_locations
WHERE technician_id = 'mike-fisher'
AND recorded_at >= CURRENT_DATE
ORDER BY recorded_at DESC;
*/

-- Find nearest technician to a customer location
/*
SELECT * FROM get_nearest_technician(47.2529, -122.4443, 25);
*/

-- Calculate distance traveled by a technician today
/*
WITH locations AS (
    SELECT latitude, longitude, recorded_at
    FROM technician_locations
    WHERE technician_id = 'mike-fisher'
    AND recorded_at >= CURRENT_DATE
    ORDER BY recorded_at
),
distances AS (
    SELECT 
        l1.recorded_at,
        calculate_distance(
            LAG(l1.latitude) OVER (ORDER BY l1.recorded_at),
            LAG(l1.longitude) OVER (ORDER BY l1.recorded_at),
            l1.latitude,
            l1.longitude
        ) as segment_distance
    FROM locations l1
)
SELECT 
    ROUND(SUM(segment_distance)) as total_distance_meters,
    ROUND(SUM(segment_distance)/1000, 2) as total_distance_km
FROM distances
WHERE segment_distance IS NOT NULL;
*/