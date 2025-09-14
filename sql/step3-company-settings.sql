-- Step 3: Create company_settings table
-- Execute this third in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS company_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
    default_test_price DECIMAL(10,2) DEFAULT 150.00,
    default_retest_price DECIMAL(10,2) DEFAULT 75.00,
    default_emergency_price DECIMAL(10,2) DEFAULT 250.00,
    business_hours JSONB DEFAULT '{
        "monday": {"start": "08:00", "end": "17:00", "enabled": true},
        "tuesday": {"start": "08:00", "end": "17:00", "enabled": true},
        "wednesday": {"start": "08:00", "end": "17:00", "enabled": true},
        "thursday": {"start": "08:00", "end": "17:00", "enabled": true},
        "friday": {"start": "08:00", "end": "17:00", "enabled": true},
        "saturday": {"start": "08:00", "end": "12:00", "enabled": false},
        "sunday": {"start": "08:00", "end": "17:00", "enabled": false}
    }',
    timezone VARCHAR(50) DEFAULT 'America/Los_Angeles',
    email_notifications JSONB DEFAULT '{
        "appointment_reminders": true,
        "test_report_completed": true,
        "payment_received": true,
        "low_inventory": false
    }',
    logo_url VARCHAR(500),
    primary_color VARCHAR(7) DEFAULT '#0ea5e9',
    company_tagline TEXT,
    google_calendar_enabled BOOLEAN DEFAULT false,
    stripe_connected BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);