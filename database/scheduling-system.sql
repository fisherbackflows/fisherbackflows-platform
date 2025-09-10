-- Scheduling System for Fisher Backflows
-- Handles availability, geographic zones, and smart booking

-- Geographic zones for service areas
CREATE TABLE IF NOT EXISTS geographic_zones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL, -- 'North Puyallup', 'South Puyallup'
    description TEXT,
    -- Polygon or center point for zone
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    radius_miles INTEGER DEFAULT 25,
    -- Days this zone is serviced
    service_days TEXT[], -- ['Saturday', 'Sunday', 'Monday', 'Tuesday'] for North
    color TEXT DEFAULT '#3B82F6', -- For UI display
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Availability templates (recurring weekly schedule)
CREATE TABLE IF NOT EXISTS availability_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    zone_id UUID REFERENCES geographic_zones(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_day CHECK (day_of_week >= 0 AND day_of_week <= 6),
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Specific date overrides (holidays, special availability)
CREATE TABLE IF NOT EXISTS availability_overrides (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL,
    is_available BOOLEAN DEFAULT false, -- false = blocked, true = special availability
    start_time TIME,
    end_time TIME,
    zone_id UUID REFERENCES geographic_zones(id),
    reason TEXT, -- 'Holiday', 'Special Event', etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(date, zone_id)
);

-- Time slots for booking
CREATE TABLE IF NOT EXISTS time_slots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    zone_id UUID REFERENCES geographic_zones(id),
    is_available BOOLEAN DEFAULT true,
    is_booked BOOLEAN DEFAULT false,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    buffer_before INTEGER DEFAULT 15, -- Minutes of travel time before
    buffer_after INTEGER DEFAULT 15, -- Minutes of travel time after
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(date, start_time, zone_id),
    CONSTRAINT valid_slot CHECK (end_time > start_time)
);

-- Booking requests (temporary holds while customer completes booking)
CREATE TABLE IF NOT EXISTS booking_holds (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    time_slot_id UUID REFERENCES time_slots(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
    status TEXT DEFAULT 'held', -- 'held', 'confirmed', 'expired'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(time_slot_id)
);

-- Add zone information to existing tables
ALTER TABLE customers ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES geographic_zones(id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES geographic_zones(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS time_slot_id UUID REFERENCES time_slots(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_slots_date ON time_slots(date);
CREATE INDEX IF NOT EXISTS idx_time_slots_zone ON time_slots(zone_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_available ON time_slots(is_available, is_booked);
CREATE INDEX IF NOT EXISTS idx_availability_templates_day ON availability_templates(day_of_week);
CREATE INDEX IF NOT EXISTS idx_booking_holds_expires ON booking_holds(expires_at);
CREATE INDEX IF NOT EXISTS idx_customers_zone ON customers(zone_id);

-- Function to generate time slots for a date range
CREATE OR REPLACE FUNCTION generate_time_slots(
    start_date DATE,
    end_date DATE
) RETURNS void AS $$
DECLARE
    current_date DATE;
    template RECORD;
    zone RECORD;
    slot_start TIMESTAMPTZ;
    slot_end TIMESTAMPTZ;
BEGIN
    current_date := start_date;
    
    WHILE current_date <= end_date LOOP
        -- For each zone
        FOR zone IN SELECT * FROM geographic_zones WHERE true LOOP
            -- Check if this day is serviced in this zone
            IF to_char(current_date, 'Day')::TEXT = ANY(zone.service_days) THEN
                -- Get templates for this day
                FOR template IN 
                    SELECT * FROM availability_templates 
                    WHERE day_of_week = EXTRACT(DOW FROM current_date)::INTEGER
                    AND (zone_id = zone.id OR zone_id IS NULL)
                    AND is_active = true
                LOOP
                    -- Generate 1-hour time slots
                    slot_start := current_date + template.start_time;
                    WHILE slot_start < (current_date + template.end_time) LOOP
                        slot_end := slot_start + INTERVAL '1 hour';
                        IF slot_end > (current_date + template.end_time) THEN
                            slot_end := current_date + template.end_time;
                        END IF;
                        
                        -- Insert slot if it doesn't exist
                        INSERT INTO time_slots (date, start_time, end_time, zone_id)
                        VALUES (current_date, slot_start, slot_end, zone.id)
                        ON CONFLICT (date, start_time, zone_id) DO NOTHING;
                        
                        slot_start := slot_end;
                    END LOOP;
                END LOOP;
            END IF;
        END LOOP;
        
        current_date := current_date + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired booking holds
CREATE OR REPLACE FUNCTION cleanup_expired_holds() RETURNS void AS $$
BEGIN
    UPDATE booking_holds 
    SET status = 'expired' 
    WHERE expires_at < NOW() AND status = 'held';
    
    UPDATE time_slots 
    SET is_booked = false 
    WHERE id IN (
        SELECT time_slot_id 
        FROM booking_holds 
        WHERE status = 'expired'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get available slots for a customer
CREATE OR REPLACE FUNCTION get_available_slots(
    customer_lat DECIMAL,
    customer_lon DECIMAL,
    start_date DATE,
    end_date DATE
) RETURNS TABLE (
    slot_id UUID,
    slot_date DATE,
    slot_start TIMESTAMPTZ,
    slot_end TIMESTAMPTZ,
    zone_name TEXT,
    zone_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ts.id,
        ts.date,
        ts.start_time,
        ts.end_time,
        gz.name,
        gz.id
    FROM time_slots ts
    JOIN geographic_zones gz ON ts.zone_id = gz.id
    WHERE ts.date BETWEEN start_date AND end_date
    AND ts.is_available = true
    AND ts.is_booked = false
    AND ts.start_time > NOW() + INTERVAL '2 hours' -- Minimum 2 hour notice
    -- Check if customer is within zone radius
    AND (
        gz.latitude IS NULL OR 
        gz.longitude IS NULL OR
        (
            -- Haversine formula for distance
            3959 * acos(
                cos(radians(customer_lat)) * 
                cos(radians(gz.latitude)) * 
                cos(radians(gz.longitude) - radians(customer_lon)) + 
                sin(radians(customer_lat)) * 
                sin(radians(gz.latitude))
            ) <= gz.radius_miles
        )
    )
    ORDER BY ts.date, ts.start_time;
END;
$$ LANGUAGE plpgsql;

-- Insert default zones
INSERT INTO geographic_zones (name, description, latitude, longitude, service_days) VALUES
('North Puyallup', 'Areas north of Puyallup including Tacoma, Federal Way, Auburn', 47.2851, -122.3851, 
 ARRAY['Saturday', 'Sunday', 'Monday', 'Tuesday']),
('South Puyallup', 'Areas south of Puyallup including Spanaway, Parkland, Lakewood', 47.1051, -122.4451,
 ARRAY['Wednesday', 'Thursday', 'Friday']);

-- Insert availability templates
-- Monday-Friday 5pm-10pm
INSERT INTO availability_templates (day_of_week, start_time, end_time) VALUES
(1, '17:00', '22:00'), -- Monday
(2, '17:00', '22:00'), -- Tuesday
(3, '17:00', '22:00'), -- Wednesday
(4, '17:00', '22:00'), -- Thursday
(5, '17:00', '22:00'); -- Friday

-- Saturday-Sunday 7am-7pm
INSERT INTO availability_templates (day_of_week, start_time, end_time) VALUES
(0, '07:00', '19:00'), -- Sunday
(6, '07:00', '19:00'); -- Saturday

-- Generate initial time slots for next 60 days
SELECT generate_time_slots(CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days');

-- Enable RLS
ALTER TABLE geographic_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_holds ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can view zones
CREATE POLICY "Zones are viewable by everyone" ON geographic_zones
    FOR SELECT USING (true);

-- Only admins can modify zones
CREATE POLICY "Only admins can modify zones" ON geographic_zones
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM team_users
            WHERE team_users.id = auth.uid()
            AND team_users.role = 'admin'
        )
    );

-- Everyone can view available time slots
CREATE POLICY "Time slots are viewable by everyone" ON time_slots
    FOR SELECT USING (is_available = true);

-- Customers can create booking holds for themselves
CREATE POLICY "Customers can create their own booking holds" ON booking_holds
    FOR INSERT WITH CHECK (
        customer_id = auth.uid() OR
        customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    );

-- Customers can view their own booking holds
CREATE POLICY "Customers can view their own booking holds" ON booking_holds
    FOR SELECT USING (
        customer_id = auth.uid() OR
        customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    );