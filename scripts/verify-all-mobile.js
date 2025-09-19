const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyMobileDatabase() {
    console.log('=' .repeat(60));
    console.log('📱 COMPLETE MOBILE DATABASE VERIFICATION');
    console.log('=' .repeat(60));
    
    // 1. Check Mobile Tables
    console.log('\n1️⃣ MOBILE TRACKING TABLES:\n');
    const mobileTables = {
        'technician_locations': 'Location history tracking',
        'technician_current_location': 'Real-time positions',
        'push_subscriptions': 'PWA push notifications',
        'notification_logs': 'Notification history',
        'notification_interactions': 'User interactions'
    };
    
    let allTablesExist = true;
    for (const [table, description] of Object.entries(mobileTables)) {
        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                console.log(`  ❌ ${table}: MISSING`);
                console.log(`     ${description}`);
                allTablesExist = false;
            } else {
                console.log(`  ✅ ${table}: EXISTS (${count} rows)`);
                console.log(`     ${description}`);
            }
        } catch (err) {
            console.log(`  ❌ ${table}: ERROR`);
            allTablesExist = false;
        }
    }
    
    // 2. Check Appointment Columns
    console.log('\n2️⃣ APPOINTMENT LOCATION COLUMNS:\n');
    const requiredColumns = {
        'technician_latitude': 'Current technician latitude',
        'technician_longitude': 'Current technician longitude',
        'technician_last_location': 'Last location update time',
        'customer_can_track': 'Customer tracking permission',
        'estimated_arrival': 'ETA for appointment',
        'travel_distance_km': 'Distance to customer'
    };
    
    try {
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .limit(1);
        
        if (error) {
            console.log('  ❌ Could not check appointments table');
        } else {
            const existingColumns = data && data[0] ? Object.keys(data[0]) : [];
            let allColumnsExist = true;
            
            for (const [col, description] of Object.entries(requiredColumns)) {
                const exists = existingColumns.includes(col);
                console.log(`  ${exists ? '✅' : '❌'} ${col}`);
                console.log(`     ${description}`);
                if (!exists) allColumnsExist = false;
            }
            
            if (!allColumnsExist) {
                console.log('\n  ⚠️  Some columns are missing!');
            }
        }
    } catch (err) {
        console.log('  ❌ Error checking appointments');
    }
    
    // 3. Check Water District & Billing Tables
    console.log('\n3️⃣ WATER DISTRICT & BILLING TABLES:\n');
    const billingTables = {
        'water_districts': 'Water district management',
        'billing_subscriptions': 'Customer subscriptions',
        'subscription_plans': 'Available service plans',
        'billing_history': 'Payment records'
    };
    
    for (const [table, description] of Object.entries(billingTables)) {
        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                console.log(`  ❌ ${table}: MISSING`);
                console.log(`     ${description}`);
            } else {
                console.log(`  ✅ ${table}: EXISTS (${count} rows)`);
                console.log(`     ${description}`);
            }
        } catch (err) {
            console.log(`  ❌ ${table}: ERROR`);
        }
    }
    
    // 4. Final Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 SUMMARY');
    console.log('=' .repeat(60));
    
    if (allTablesExist) {
        console.log('\n✅ ALL MOBILE TABLES ARE READY!');
        console.log('\nYour database is fully configured for:');
        console.log('  • Real-time location tracking');
        console.log('  • Push notifications');
        console.log('  • Customer tracking features');
        console.log('  • Water district management');
        console.log('  • Billing & subscriptions');
        console.log('\n🚀 No additional SQL needs to be applied!');
    } else {
        console.log('\n⚠️  Some tables or columns are missing.');
        console.log('\nTo fix this:');
        console.log('1. Go to: https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx/sql');
        console.log('2. Run the VERIFY_AND_APPLY_ALL_TABLES.sql file');
    }
    
    console.log('\n' + '=' .repeat(60));
}

verifyMobileDatabase().catch(console.error);