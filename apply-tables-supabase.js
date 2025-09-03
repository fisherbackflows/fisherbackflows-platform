#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;

// Supabase credentials
const SUPABASE_URL = 'https://jvhbqfueutvfepsjmztx.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

async function testConnection() {
    console.log('🔌 Testing database connection...');
    try {
        const { data, error } = await supabase
            .from('customers')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('❌ Connection failed:', error.message);
            return false;
        }
        
        console.log('✅ Connected to Supabase successfully');
        return true;
    } catch (err) {
        console.error('❌ Connection error:', err.message);
        return false;
    }
}

async function checkTableExists(tableName) {
    const { data, error } = await supabase
        .rpc('table_exists', { table_name: tableName })
        .single();
    
    if (error) {
        // Try alternative method
        const { data: tables } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .eq('table_name', tableName)
            .single();
        
        return !!tables;
    }
    
    return data?.exists || false;
}

async function createMobileLocationTables() {
    console.log('\n📍 Creating Mobile Location Tracking Tables...');
    
    // Check if tables already exist
    const locationExists = await checkTableExists('technician_locations');
    const currentExists = await checkTableExists('technician_current_location');
    
    if (locationExists && currentExists) {
        console.log('✅ Location tables already exist');
        return true;
    }
    
    console.log('📝 Tables need to be created manually in Supabase SQL Editor');
    console.log('   Copy the content from: MOBILE_LOCATION_TRACKING_SCHEMA.sql');
    return false;
}

async function createPWATables() {
    console.log('\n📱 Creating PWA Push Notification Tables...');
    
    const pushExists = await checkTableExists('push_subscriptions');
    const logsExists = await checkTableExists('notification_logs');
    
    if (pushExists && logsExists) {
        console.log('✅ PWA tables already exist');
        return true;
    }
    
    console.log('📝 Tables need to be created manually in Supabase SQL Editor');
    console.log('   Copy the content from: PWA_DATABASE_TABLES.sql');
    return false;
}

async function verifyTables() {
    console.log('\n🔍 Verifying Mobile Tables Installation...');
    
    const tablesToCheck = [
        'technician_locations',
        'technician_current_location',
        'push_subscriptions',
        'notification_logs',
        'notification_interactions'
    ];
    
    const results = [];
    
    for (const table of tablesToCheck) {
        const exists = await checkTableExists(table);
        results.push({ table, exists });
        console.log(`   ${exists ? '✅' : '❌'} ${table}`);
    }
    
    return results;
}

async function main() {
    console.log('📱 Mobile Tables Installation Manager');
    console.log('=====================================');
    
    // Test connection
    const connected = await testConnection();
    if (!connected) {
        console.log('\n❌ Cannot connect to database. Please check credentials.');
        process.exit(1);
    }
    
    // Check existing tables
    await createMobileLocationTables();
    await createPWATables();
    
    // Verify installation
    const verification = await verifyTables();
    const allExist = verification.every(v => v.exists);
    
    if (allExist) {
        console.log('\n🎉 All mobile tables are installed and ready!');
        console.log('\n📱 Features Enabled:');
        console.log('   • Real-time GPS tracking');
        console.log('   • Push notifications');
        console.log('   • Offline sync');
        console.log('   • Mobile optimizations');
    } else {
        console.log('\n⚠️ Some tables are missing. Please install them manually:');
        console.log('\n📋 Manual Installation Steps:');
        console.log('1. Open: https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx/sql/new');
        console.log('2. Copy the SQL from these files:');
        console.log('   - MOBILE_LOCATION_TRACKING_SCHEMA.sql');
        console.log('   - PWA_DATABASE_TABLES.sql');
        console.log('3. Paste each file content and click "Run"');
        console.log('\n💡 Tip: Use APPLY_ALL_MOBILE_TABLES.sql for all statements at once');
    }
    
    // Create a simple test query function
    console.log('\n🧪 Creating test functions...');
    await fs.writeFile('test-mobile-features.js', `
// Test Mobile Features
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    '${SUPABASE_URL}',
    '${SUPABASE_SERVICE_KEY}'
);

async function testLocationTracking() {
    console.log('Testing location tracking...');
    
    // Insert test location
    const { data, error } = await supabase
        .from('technician_locations')
        .insert({
            technician_id: 'test-tech-001',
            latitude: 37.7749,
            longitude: -122.4194,
            accuracy: 10,
            recorded_at: new Date().toISOString()
        });
    
    if (error) {
        console.error('Location tracking error:', error);
    } else {
        console.log('✅ Location tracking works!');
    }
}

async function testPushSubscriptions() {
    console.log('Testing push subscriptions...');
    
    // Check push subscriptions
    const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .limit(1);
    
    if (error) {
        console.error('Push subscription error:', error);
    } else {
        console.log('✅ Push subscriptions table accessible!');
    }
}

// Run tests
testLocationTracking();
testPushSubscriptions();
`);
    
    console.log('✅ Created: test-mobile-features.js');
    console.log('\n🔗 Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx');
}

main().catch(console.error);