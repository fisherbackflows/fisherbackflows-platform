const { createRouteHandlerClient } = require('./src/lib/supabase');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

async function testLeadsAPI() {
    try {
        console.log('🧪 Testing leads API functionality...');
        
        // Create the same client the API uses
        const supabase = createRouteHandlerClient();
        
        console.log('📊 Fetching leads from database...');
        
        const { data: leads, error } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (error) {
            console.error('❌ Database error:', error);
            return;
        }
        
        console.log(`✅ Successfully fetched ${leads.length} leads`);
        
        if (leads.length > 0) {
            console.log('\n📋 Sample lead data:');
            const sample = leads[0];
            console.log(`- Name: ${sample.first_name} ${sample.last_name}`);
            console.log(`- Company: ${sample.company_name}`);
            console.log(`- Email: ${sample.email}`);
            console.log(`- Phone: ${sample.phone}`);
            console.log(`- Status: ${sample.status}`);
            console.log(`- Created: ${sample.created_at}`);
            
            // Test different status counts
            const { data: statusCounts, error: statusError } = await supabase
                .from('leads')
                .select('status');
            
            if (!statusError) {
                const counts = statusCounts.reduce((acc, lead) => {
                    acc[lead.status] = (acc[lead.status] || 0) + 1;
                    return acc;
                }, {});
                
                console.log('\n📊 Lead status breakdown:');
                Object.entries(counts).forEach(([status, count]) => {
                    console.log(`- ${status}: ${count}`);
                });
                console.log(`- Total: ${statusCounts.length}`);
            }
        }
        
        console.log('\n🎉 API test completed successfully!');
        
    } catch (err) {
        console.error('❌ API test failed:', err);
    }
}

testLeadsAPI();