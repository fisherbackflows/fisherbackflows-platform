const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://jvhbqfueutvfepsjmztx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeRLSImplementation() {
    console.log('🔐 Starting Comprehensive RLS Implementation...');
    
    try {
        // Read the SQL file
        const sql = fs.readFileSync('/mnt/c/users/Fishe/fisherbackflows2/fisherbackflows-platform/comprehensive_rls_implementation.sql', 'utf8');
        
        // Split into individual statements
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
        
        console.log(`📄 Found ${statements.length} SQL statements to execute`);
        
        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            if (!statement) continue;
            
            console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
            
            try {
                const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
                
                if (error) {
                    console.error(`❌ Error in statement ${i + 1}:`, error.message);
                    errors.push({ statement: i + 1, error: error.message });
                    errorCount++;
                } else {
                    console.log(`✅ Statement ${i + 1} executed successfully`);
                    successCount++;
                }
            } catch (err) {
                console.error(`❌ Exception in statement ${i + 1}:`, err.message);
                errors.push({ statement: i + 1, error: err.message });
                errorCount++;
            }
        }
        
        console.log('\n📊 RLS Implementation Summary:');
        console.log(`✅ Successful statements: ${successCount}`);
        console.log(`❌ Failed statements: ${errorCount}`);
        
        if (errors.length > 0) {
            console.log('\n🚨 Errors encountered:');
            errors.forEach(({ statement, error }) => {
                console.log(`Statement ${statement}: ${error}`);
            });
        }
        
        // Verify RLS is enabled
        console.log('\n🔍 Verifying RLS status...');
        const { data: tables } = await supabase.rpc('exec_sql', { 
            sql_query: `
                SELECT 
                    tablename,
                    rowsecurity as rls_enabled,
                    (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
                FROM pg_tables t 
                WHERE schemaname = 'public' 
                ORDER BY tablename;
            `
        });
        
        if (tables) {
            console.log('📋 Table RLS Status:');
            tables.forEach(table => {
                console.log(`  ${table.tablename}: RLS ${table.rls_enabled ? '✅' : '❌'} | Policies: ${table.policy_count}`);
            });
        }
        
        console.log('\n🎉 RLS Implementation Complete!');
        
    } catch (error) {
        console.error('💥 Fatal error during RLS implementation:', error);
    }
}

executeRLSImplementation();