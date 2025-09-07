const { createClient } = require('@supabase/supabase-js');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableStructure() {
    console.log('🔍 Checking leads table structure...');
    
    // Try to get one record to see the structure
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .limit(1);
    
    if (error) {
        console.error('❌ Error:', error);
        return;
    }
    
    if (data && data.length > 0) {
        console.log('📋 Existing table columns:');
        Object.keys(data[0]).forEach(col => {
            console.log(`  - ${col}: ${typeof data[0][col]} (${JSON.stringify(data[0][col])})`);
        });
        
        console.log('\n📊 Sample lead data:');
        console.log(JSON.stringify(data[0], null, 2));
    } else {
        console.log('📋 Table is empty, trying to check schema...');
        
        // Try inserting a test record to see what columns are expected
        const testLead = {
            first_name: 'Test',
            last_name: 'Lead',
            company_name: 'Test Company',
            email: 'test@example.com',
            phone: '555-1234',
            source: 'test'
        };
        
        const { data: insertData, error: insertError } = await supabase
            .from('leads')
            .insert([testLead])
            .select();
        
        if (insertError) {
            console.error('❌ Insert test failed:', insertError);
        } else {
            console.log('✅ Test insert successful, columns:');
            if (insertData && insertData.length > 0) {
                Object.keys(insertData[0]).forEach(col => {
                    console.log(`  - ${col}`);
                });
            }
            
            // Clean up test record
            if (insertData && insertData[0] && insertData[0].id) {
                await supabase
                    .from('leads')
                    .delete()
                    .eq('id', insertData[0].id);
                console.log('🧹 Cleaned up test record');
            }
        }
    }
}

checkTableStructure().catch(console.error);