#!/usr/bin/env node

const https = require('https');
const fs = require('fs').promises;

// Direct database connection using Supabase REST API
const SUPABASE_PROJECT_REF = 'jvhbqfueutvfepsjmztx';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY';
const DATABASE_PASSWORD = 'FisherBackflows2025!';

// PostgreSQL connection via pg library
const { Client } = require('pg');

const connectionString = `postgresql://postgres:${DATABASE_PASSWORD}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres`;

async function executeSQLStatements(statements, description) {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        console.log(`\n🔄 ${description}`);
        await client.connect();
        console.log('✅ Connected to database');
        
        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        
        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i].trim();
            if (!stmt || stmt.startsWith('--')) continue;
            
            try {
                process.stdout.write(`   [${i+1}/${statements.length}] Executing... `);
                await client.query(stmt);
                console.log('✅');
                successCount++;
            } catch (err) {
                console.log(`❌ ${err.message}`);
                errorCount++;
                errors.push({ statement: i+1, error: err.message });
            }
        }
        
        if (errorCount === 0) {
            console.log(`✅ Success: All ${successCount} statements executed`);
            return true;
        } else {
            console.log(`⚠️ Partial success: ${successCount} executed, ${errorCount} failed`);
            return false;
        }
        
    } catch (err) {
        console.error('❌ Connection error:', err.message);
        return false;
    } finally {
        await client.end();
    }
}

async function main() {
    console.log('🚀 Direct SQL Execution to Supabase');
    console.log('====================================');
    
    // Step 1: Create tables
    console.log('\n📋 Step 1: Creating Tables...');
    
    const createTablesSQL = [
        // Technician location tables
        `CREATE TABLE IF NOT EXISTS technician_locations (
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
        )`,
        
        `CREATE TABLE IF NOT EXISTS technician_current_location (
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
        )`,
        
        // PWA tables
        `CREATE TABLE IF NOT EXISTS push_subscriptions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            subscription JSONB NOT NULL,
            active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            UNIQUE(user_id)
        )`,
        
        `CREATE TABLE IF NOT EXISTS notification_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            body TEXT NOT NULL,
            sent_count INTEGER DEFAULT 0,
            failed_count INTEGER DEFAULT 0,
            sent_by UUID REFERENCES auth.users(id),
            tracking_id TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        )`,
        
        `CREATE TABLE IF NOT EXISTS notification_interactions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tracking_id TEXT REFERENCES notification_logs(tracking_id) ON DELETE CASCADE,
            action TEXT NOT NULL,
            timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        )`,
        
        // Add columns to appointments
        `ALTER TABLE appointments 
         ADD COLUMN IF NOT EXISTS technician_latitude DECIMAL(10, 8),
         ADD COLUMN IF NOT EXISTS technician_longitude DECIMAL(11, 8),
         ADD COLUMN IF NOT EXISTS technician_last_location TIMESTAMP WITH TIME ZONE,
         ADD COLUMN IF NOT EXISTS customer_can_track BOOLEAN DEFAULT false,
         ADD COLUMN IF NOT EXISTS estimated_arrival TIMESTAMP WITH TIME ZONE,
         ADD COLUMN IF NOT EXISTS travel_distance_km DECIMAL(6, 2)`
    ];
    
    await executeSQLStatements(createTablesSQL, 'Creating Tables');
    
    // Step 2: Create indexes
    console.log('\n📋 Step 2: Creating Indexes...');
    
    const createIndexesSQL = [
        'CREATE INDEX IF NOT EXISTS idx_technician_locations_technician_id ON technician_locations(technician_id)',
        'CREATE INDEX IF NOT EXISTS idx_technician_locations_recorded_at ON technician_locations(recorded_at DESC)',
        'CREATE INDEX IF NOT EXISTS idx_technician_locations_appointment_id ON technician_locations(appointment_id)',
        'CREATE INDEX IF NOT EXISTS idx_technician_current_location_updated ON technician_current_location(last_updated DESC)',
        'CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_notification_logs_tracking_id ON notification_logs(tracking_id)'
    ];
    
    await executeSQLStatements(createIndexesSQL, 'Creating Indexes');
    
    // Step 3: Enable RLS
    console.log('\n📋 Step 3: Enabling Row Level Security...');
    
    const rlsSQL = [
        'ALTER TABLE technician_locations ENABLE ROW LEVEL SECURITY',
        'ALTER TABLE technician_current_location ENABLE ROW LEVEL SECURITY',
        'ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY',
        'ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY',
        'ALTER TABLE notification_interactions ENABLE ROW LEVEL SECURITY'
    ];
    
    await executeSQLStatements(rlsSQL, 'Enabling RLS');
    
    // Step 4: Verify
    console.log('\n🔍 Verifying Installation...');
    
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        await client.connect();
        
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN (
                'technician_locations',
                'technician_current_location', 
                'push_subscriptions',
                'notification_logs',
                'notification_interactions'
            )
        `);
        
        console.log('\n✅ Tables Created:');
        result.rows.forEach(row => {
            console.log(`   • ${row.table_name}`);
        });
        
        if (result.rows.length === 5) {
            console.log('\n🎉 All mobile tables successfully created!');
            console.log('\n📱 Features Now Available:');
            console.log('   • Real-time GPS tracking');
            console.log('   • Push notifications');
            console.log('   • Offline sync');
            console.log('   • Mobile optimizations');
        }
        
    } catch (err) {
        console.error('❌ Verification error:', err.message);
    } finally {
        await client.end();
    }
}

// Check if pg is installed
try {
    require('pg');
    main().catch(console.error);
} catch (err) {
    console.log('📦 Installing PostgreSQL client...');
    const { execSync } = require('child_process');
    execSync('npm install pg', { stdio: 'inherit' });
    console.log('✅ PostgreSQL client installed');
    console.log('🔄 Please run the script again');
}