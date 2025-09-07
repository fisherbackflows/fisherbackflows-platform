const { createClient } = require('@supabase/supabase-js');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

async function testDatabase() {
    try {
        console.log('🧪 Testing database connection and leads data...');
        
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing Supabase environment variables');
        }
        
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        console.log('📊 Fetching leads from database...');
        
        // Test basic query
        const { data: leads, error, count } = await supabase
            .from('leads')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (error) {
            console.error('❌ Database error:', error);
            return;
        }
        
        console.log(`✅ Successfully connected to database`);
        console.log(`📊 Total leads in database: ${count}`);
        console.log(`📋 Fetched ${leads.length} sample leads`);
        
        if (leads.length > 0) {
            console.log('\n🔍 Sample leads:');
            leads.forEach((lead, i) => {
                console.log(`${i + 1}. ${lead.first_name} ${lead.last_name} - ${lead.company_name} (${lead.status})`);
            });
            
            // Test status counts
            const { data: statusData } = await supabase
                .from('leads')
                .select('status');
            
            if (statusData) {
                const counts = statusData.reduce((acc, lead) => {
                    acc[lead.status] = (acc[lead.status] || 0) + 1;
                    return acc;
                }, {});
                
                console.log('\n📊 Lead status breakdown:');
                Object.entries(counts).forEach(([status, count]) => {
                    console.log(`- ${status}: ${count} leads`);
                });
            }
        }
        
        console.log('\n🎉 Database test completed successfully!');
        console.log('✅ The lead data is available and the lead management system should work');
        
    } catch (err) {
        console.error('❌ Database test failed:', err);
    }
}

testDatabase();