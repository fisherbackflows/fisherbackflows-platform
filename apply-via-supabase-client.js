#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'https://jvhbqfueutvfepsjmztx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQL(sql) {
    // Since Supabase JS client doesn't expose raw SQL execution,
    // we'll use the REST API directly
    const fetch = require('node-fetch');
    
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
        method: 'POST',
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ query: sql })
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
    }
    
    return true;
}

async function checkTablesExist() {
    console.log('\n🔍 Checking existing tables...');
    
    const tablesToCheck = [
        'technician_locations',
        'technician_current_location',
        'push_subscriptions',
        'notification_logs',
        'notification_interactions'
    ];
    
    const existing = [];
    const missing = [];
    
    for (const table of tablesToCheck) {
        try {
            // Try to select from the table
            const { error } = await supabase
                .from(table)
                .select('count')
                .limit(1);
            
            if (!error) {
                existing.push(table);
                console.log(`   ✅ ${table} exists`);
            } else {
                missing.push(table);
                console.log(`   ❌ ${table} missing`);
            }
        } catch (err) {
            missing.push(table);
            console.log(`   ❌ ${table} missing`);
        }
    }
    
    return { existing, missing };
}

async function main() {
    console.log('🚀 Mobile Tables Installation via Supabase Client');
    console.log('================================================');
    
    // Check current status
    const { existing, missing } = await checkTablesExist();
    
    if (missing.length === 0) {
        console.log('\n✅ All tables already exist!');
        console.log('\n📱 Mobile features are ready to use');
        return;
    }
    
    console.log(`\n📊 Status: ${existing.length} exist, ${missing.length} need creation`);
    
    // Since we can't execute raw SQL via JS client, generate SQL for manual execution
    console.log('\n📝 Generating SQL for manual execution...');
    
    const fs = require('fs').promises;
    
    // Generate SQL only for missing tables
    let sql = `-- 🚀 Mobile Tables Installation
-- Generated: ${new Date().toISOString()}
-- Missing tables: ${missing.join(', ')}

`;
    
    if (missing.includes('technician_locations')) {
        sql += `
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
`;
    }
    
    if (missing.includes('technician_current_location')) {
        sql += `
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
`;
    }
    
    if (missing.includes('push_subscriptions')) {
        sql += `
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
`;
    }
    
    if (missing.includes('notification_logs')) {
        sql += `
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
`;
    }
    
    if (missing.includes('notification_interactions')) {
        sql += `
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
`;
    }
    
    // Always add location columns to appointments
    sql += `
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
`;
    
    // Save to file
    const filename = 'EXECUTE_NOW_mobile_tables.sql';
    await fs.writeFile(filename, sql);
    console.log(`✅ SQL file created: ${filename}`);
    
    // Copy to clipboard
    const { exec } = require('child_process');
    exec(`cat ${filename} | clip.exe`, (err) => {
        if (!err) {
            console.log('✅ SQL copied to clipboard!');
        }
    });
    
    console.log('\n📋 NEXT STEPS:');
    console.log('==============');
    console.log('1. SQL is in your clipboard');
    console.log('2. Open Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx/sql/new');
    console.log('3. Paste (Ctrl+V) and click "Run"');
    console.log('');
    console.log(`Missing tables that will be created: ${missing.join(', ')}`);
    
    // Open the SQL editor
    exec('xdg-open https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx/sql/new 2>/dev/null || true');
}

// Check if node-fetch is installed
try {
    require('node-fetch');
} catch {
    console.log('Installing node-fetch...');
    require('child_process').execSync('npm install node-fetch@2', { stdio: 'inherit' });
}

main().catch(console.error);