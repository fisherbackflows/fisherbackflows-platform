#!/usr/bin/env node

const { Client } = require('pg');

// Use Supabase pooler connection (supports IPv4)
const connectionString = 'postgresql://postgres.jvhbqfueutvfepsjmztx:FisherBackflows2025!@aws-0-us-west-1.pooler.supabase.com:5432/postgres';

async function executeSQLBatch(statements, description) {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        console.log(`\n🔄 ${description}...`);
        await client.connect();
        console.log('✅ Connected to Supabase');
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i].trim();
            if (!stmt || stmt.startsWith('--')) continue;
            
            const preview = stmt.substring(0, 40).replace(/\n/g, ' ');
            process.stdout.write(`   [${i+1}/${statements.length}] ${preview}... `);
            
            try {
                await client.query(stmt);
                console.log('✅');
                successCount++;
            } catch (err) {
                if (err.message.includes('already exists')) {
                    console.log('⏭️ (already exists)');
                    successCount++;
                } else {
                    console.log(`❌ ${err.message.substring(0, 50)}`);
                    errorCount++;
                }
            }
        }
        
        console.log(`   Result: ${successCount} successful, ${errorCount} failed`);
        return errorCount === 0;
        
    } catch (err) {
        console.error(`❌ Connection failed: ${err.message}`);
        return false;
    } finally {
        await client.end();
    }
}

async function main() {
    console.log('🚀 Applying Mobile Tables via Supabase Pooler');
    console.log('==============================================');
    
    // Phase 1: Create Tables
    const createTables = [
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
        
        `ALTER TABLE appointments 
         ADD COLUMN IF NOT EXISTS technician_latitude DECIMAL(10, 8)`,
        `ALTER TABLE appointments 
         ADD COLUMN IF NOT EXISTS technician_longitude DECIMAL(11, 8)`,
        `ALTER TABLE appointments 
         ADD COLUMN IF NOT EXISTS technician_last_location TIMESTAMP WITH TIME ZONE`,
        `ALTER TABLE appointments 
         ADD COLUMN IF NOT EXISTS customer_can_track BOOLEAN DEFAULT false`,
        `ALTER TABLE appointments 
         ADD COLUMN IF NOT EXISTS estimated_arrival TIMESTAMP WITH TIME ZONE`,
        `ALTER TABLE appointments 
         ADD COLUMN IF NOT EXISTS travel_distance_km DECIMAL(6, 2)`
    ];
    
    const tablesCreated = await executeSQLBatch(createTables, 'Phase 1: Creating Tables');
    
    // Phase 2: Create Indexes
    const createIndexes = [
        'CREATE INDEX IF NOT EXISTS idx_technician_locations_technician_id ON technician_locations(technician_id)',
        'CREATE INDEX IF NOT EXISTS idx_technician_locations_recorded_at ON technician_locations(recorded_at DESC)',
        'CREATE INDEX IF NOT EXISTS idx_technician_locations_appointment_id ON technician_locations(appointment_id)',
        'CREATE INDEX IF NOT EXISTS idx_technician_current_location_updated ON technician_current_location(last_updated DESC)',
        'CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(active)',
        'CREATE INDEX IF NOT EXISTS idx_notification_logs_tracking_id ON notification_logs(tracking_id)',
        'CREATE INDEX IF NOT EXISTS idx_notification_interactions_tracking_id ON notification_interactions(tracking_id)'
    ];
    
    const indexesCreated = await executeSQLBatch(createIndexes, 'Phase 2: Creating Indexes');
    
    // Phase 3: Enable RLS
    const enableRLS = [
        'ALTER TABLE technician_locations ENABLE ROW LEVEL SECURITY',
        'ALTER TABLE technician_current_location ENABLE ROW LEVEL SECURITY',
        'ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY',
        'ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY',
        'ALTER TABLE notification_interactions ENABLE ROW LEVEL SECURITY'
    ];
    
    const rlsEnabled = await executeSQLBatch(enableRLS, 'Phase 3: Enabling Security');
    
    // Verify Installation
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
            ORDER BY table_name
        `);
        
        if (result.rows.length > 0) {
            console.log('\n✅ Tables Successfully Created:');
            result.rows.forEach(row => {
                console.log(`   • ${row.table_name}`);
            });
        }
        
        // Check columns on appointments
        const colResult = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'appointments'
            AND column_name IN (
                'technician_latitude',
                'technician_longitude',
                'customer_can_track'
            )
        `);
        
        if (colResult.rows.length > 0) {
            console.log('\n✅ Location Columns Added to Appointments:');
            colResult.rows.forEach(row => {
                console.log(`   • ${row.column_name}`);
            });
        }
        
        if (result.rows.length === 5) {
            console.log('\n🎉 SUCCESS! All Mobile Features Installed!');
            console.log('\n📱 Features Now Available:');
            console.log('   • Real-time GPS tracking for technicians');
            console.log('   • Customer appointment tracking');
            console.log('   • PWA push notifications');
            console.log('   • Offline data sync');
            console.log('   • Mobile-optimized queries');
            console.log('\n🔗 Test in your app at:');
            console.log('   https://www.fisherbackflows.com/');
        } else {
            console.log(`\n⚠️ Only ${result.rows.length}/5 tables created`);
        }
        
    } catch (err) {
        console.error('❌ Verification error:', err.message);
    } finally {
        await client.end();
    }
}

main().catch(err => {
    console.error('❌ Fatal error:', err.message);
    console.log('\n💡 Try running this script again or apply manually in Supabase SQL Editor');
});