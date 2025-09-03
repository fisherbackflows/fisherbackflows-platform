#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

async function executeSQLFile() {
    try {
        console.log('🚀 Starting table verification and creation...\n');
        
        // Read the SQL file
        const sqlPath = path.join(__dirname, '..', '..', 'VERIFY_AND_APPLY_ALL_TABLES.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
        
        // Split SQL into individual statements (basic splitting, may need refinement)
        const statements = sqlContent
            .split(/;(?=\s*(?:--|CREATE|ALTER|SELECT|INSERT|UPDATE|DELETE|DROP|DO))/i)
            .map(s => s.trim())
            .filter(s => s && !s.startsWith('--'));
        
        console.log(`📋 Found ${statements.length} SQL statements to execute\n`);
        
        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            // Skip pure comment blocks
            if (statement.match(/^--/)) continue;
            
            // Extract a description of what this statement does
            let description = 'Unknown operation';
            if (statement.includes('CREATE TABLE')) {
                const tableName = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/i)?.[1];
                description = `Creating table: ${tableName}`;
            } else if (statement.includes('CREATE INDEX')) {
                const indexName = statement.match(/CREATE INDEX IF NOT EXISTS (\w+)/i)?.[1];
                description = `Creating index: ${indexName}`;
            } else if (statement.includes('ALTER TABLE')) {
                const tableName = statement.match(/ALTER TABLE (\w+)/i)?.[1];
                description = `Altering table: ${tableName}`;
            } else if (statement.includes('CREATE POLICY')) {
                const policyName = statement.match(/CREATE POLICY IF NOT EXISTS "([^"]+)"/i)?.[1];
                description = `Creating policy: ${policyName}`;
            } else if (statement.includes('SELECT')) {
                description = 'Running verification query';
            } else if (statement.includes('DO $$')) {
                description = 'Executing PL/pgSQL block';
            } else if (statement.includes('CREATE OR REPLACE FUNCTION')) {
                description = 'Creating/updating function';
            } else if (statement.includes('CREATE TRIGGER')) {
                description = 'Creating trigger';
            }
            
            process.stdout.write(`[${i + 1}/${statements.length}] ${description}... `);
            
            try {
                // For SELECT statements, use .rpc() or direct query
                if (statement.trim().toUpperCase().startsWith('SELECT')) {
                    const { data, error } = await supabase.rpc('query_exec', {
                        query_text: statement + ';'
                    }).single();
                    
                    if (error) {
                        // If RPC doesn't exist, just skip SELECT statements (they're for verification)
                        if (error.message.includes('function') || error.message.includes('query_exec')) {
                            console.log('⏭️  (verification query skipped)');
                            continue;
                        }
                        throw error;
                    }
                    
                    if (data) {
                        console.log('✅');
                        console.log('   Result:', JSON.stringify(data, null, 2));
                    }
                } else {
                    // For DDL statements, we need to use raw SQL execution
                    // Since Supabase JS client doesn't support raw DDL, we'll use a workaround
                    const { error } = await supabase.rpc('exec_sql', {
                        sql: statement + ';'
                    });
                    
                    if (error) {
                        // If the RPC doesn't exist, we'll note it but continue
                        if (error.message.includes('function') || error.message.includes('exec_sql')) {
                            console.log('⚠️  (needs manual execution)');
                            errors.push({
                                statement: description,
                                error: 'Requires manual execution in Supabase SQL Editor'
                            });
                            errorCount++;
                            continue;
                        }
                        throw error;
                    }
                    
                    console.log('✅');
                }
                
                successCount++;
            } catch (error) {
                console.log('❌');
                errorCount++;
                errors.push({
                    statement: description,
                    error: error.message
                });
            }
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 EXECUTION SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Successful: ${successCount}`);
        console.log(`❌ Failed: ${errorCount}`);
        
        if (errors.length > 0) {
            console.log('\n⚠️  IMPORTANT: Some statements need manual execution');
            console.log('Please copy the VERIFY_AND_APPLY_ALL_TABLES.sql file contents');
            console.log('and run them in the Supabase SQL Editor:');
            console.log('https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx/sql\n');
            
            console.log('Errors encountered:');
            errors.forEach((err, idx) => {
                console.log(`\n${idx + 1}. ${err.statement}`);
                console.log(`   Error: ${err.error}`);
            });
        }
        
        // Now let's verify what tables actually exist
        console.log('\n' + '='.repeat(60));
        console.log('🔍 VERIFYING CRITICAL TABLES');
        console.log('='.repeat(60));
        
        const criticalTables = [
            'technician_locations',
            'technician_current_location', 
            'push_subscriptions',
            'notification_logs',
            'notification_interactions',
            'water_districts',
            'billing_subscriptions',
            'subscription_plans',
            'billing_history'
        ];
        
        for (const table of criticalTables) {
            try {
                const { count, error } = await supabase
                    .from(table)
                    .select('*', { count: 'exact', head: true });
                
                if (error) {
                    console.log(`❌ ${table}: Not found or inaccessible`);
                } else {
                    console.log(`✅ ${table}: Exists (${count || 0} rows)`);
                }
            } catch (err) {
                console.log(`❌ ${table}: Error checking`);
            }
        }
        
    } catch (error) {
        console.error('\n❌ Fatal error:', error.message);
        process.exit(1);
    }
}

// Run the script
executeSQLFile().then(() => {
    console.log('\n✨ Script execution completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Go to: https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx/sql');
    console.log('2. Copy the contents of VERIFY_AND_APPLY_ALL_TABLES.sql');
    console.log('3. Paste and run in the SQL Editor');
    console.log('4. Check the output to verify all tables were created\n');
}).catch(console.error);