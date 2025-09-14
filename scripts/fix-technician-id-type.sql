-- FIX technician_current_location.technician_id column type
-- It's currently TEXT but needs to be UUID to reference team_users(id)

-- Step 1: Check if there's any data and back it up
SELECT COUNT(*) as current_records FROM technician_current_location;

-- Step 2: Create a backup table
CREATE TABLE IF NOT EXISTS technician_current_location_backup AS
SELECT * FROM technician_current_location;

-- Step 3: Drop and recreate the table with correct column types
DROP TABLE IF EXISTS technician_current_location;

CREATE TABLE technician_current_location (
  technician_id UUID PRIMARY KEY REFERENCES team_users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(6, 2),
  heading DECIMAL(5, 2),
  speed DECIMAL(6, 2),
  address TEXT,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  battery_level INTEGER,
  signal_strength TEXT
);

-- Step 4: Enable RLS
ALTER TABLE technician_current_location ENABLE ROW LEVEL SECURITY;

-- Step 5: Create index for performance
CREATE INDEX idx_technician_current_location_technician_id ON technician_current_location(technician_id);
CREATE INDEX idx_technician_current_location_last_updated ON technician_current_location(last_updated);

-- Note: If you had data in the old table, you would need to manually migrate it
-- since we can't automatically convert TEXT to UUID without knowing the mapping