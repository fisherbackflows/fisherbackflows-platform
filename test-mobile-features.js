
// Test Mobile Features
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://jvhbqfueutvfepsjmztx.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY'
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
