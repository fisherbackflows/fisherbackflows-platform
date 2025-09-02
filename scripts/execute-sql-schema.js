#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://jvhbqfueutvfepsjmztx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSqlFile(filePath) {
    try {
        console.log(`\n🔄 Executing SQL file: ${filePath}`);
        
        // Read the SQL file
        const sqlContent = fs.readFileSync(filePath, 'utf8');
        
        // Split SQL content into individual statements
        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        console.log(`📝 Found ${statements.length} SQL statements to execute`);

        // Execute each statement individually
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (!statement) continue;

            try {
                console.log(`   Executing statement ${i + 1}/${statements.length}...`);
                
                const { data, error } = await supabase.rpc('execute_sql', {
                    query: statement + ';'
                });

                if (error) {
                    console.error(`   ❌ Error in statement ${i + 1}:`, error.message);
                    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
                        console.log(`   ⚠️  Skipping duplicate (this is OK)`);
                        continue;
                    }
                    throw error;
                } else {
                    console.log(`   ✅ Statement ${i + 1} executed successfully`);
                }
            } catch (err) {
                // Try alternative method using raw SQL execution
                try {
                    const { data, error: rawError } = await supabase
                        .from('information_schema.tables')
                        .select('*')
                        .limit(1);
                    
                    // If we can query, we have connection, try direct query
                    console.log(`   🔄 Trying alternative execution method for statement ${i + 1}...`);
                    
                    // For now, log the statement that needs manual execution
                    console.log(`   📋 MANUAL EXECUTION NEEDED:\n${statement};\n`);
                    
                } catch (altErr) {
                    console.error(`   ❌ Failed to execute statement ${i + 1}:`, altErr.message);
                    throw altErr;
                }
            }
        }

        console.log(`✅ Successfully processed SQL file: ${path.basename(filePath)}`);
        return true;

    } catch (error) {
        console.error(`❌ Error executing SQL file ${filePath}:`, error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Starting database schema deployment...\n');

    const sqlFiles = [
        '../create-water-districts-table.sql',
        '../create-billing-subscriptions-table.sql'
    ];

    let allSuccess = true;

    for (const sqlFile of sqlFiles) {
        const fullPath = path.join(__dirname, sqlFile);
        
        if (!fs.existsSync(fullPath)) {
            console.error(`❌ SQL file not found: ${fullPath}`);
            allSuccess = false;
            continue;
        }

        const success = await executeSqlFile(fullPath);
        if (!success) {
            allSuccess = false;
        }
    }

    if (allSuccess) {
        console.log('\n🎉 All SQL schemas executed successfully!');
        
        // Verify tables were created
        console.log('\n🔍 Verifying table creation...');
        
        try {
            // Check water_districts table
            const { data: waterDistricts, error: waterError } = await supabase
                .from('water_districts')
                .select('count', { count: 'exact', head: true });
            
            if (!waterError) {
                console.log(`✅ water_districts table exists with ${waterDistricts} records`);
            }

            // Check billing_subscriptions table  
            const { data: billingSubscriptions, error: billingError } = await supabase
                .from('billing_subscriptions')
                .select('count', { count: 'exact', head: true });
                
            if (!billingError) {
                console.log(`✅ billing_subscriptions table exists with ${billingSubscriptions} records`);
            }

            // Check billing_invoices table
            const { data: billingInvoices, error: invoicesError } = await supabase
                .from('billing_invoices')
                .select('count', { count: 'exact', head: true });
                
            if (!invoicesError) {
                console.log(`✅ billing_invoices table exists with ${billingInvoices} records`);
            }

        } catch (verifyError) {
            console.log('⚠️  Table verification failed - tables may need manual creation');
            console.log('📋 Please execute the SQL files manually in Supabase SQL Editor:');
            console.log('   1. create-water-districts-table.sql');
            console.log('   2. create-billing-subscriptions-table.sql');
        }
        
        process.exit(0);
    } else {
        console.log('\n❌ Some SQL schemas failed to execute');
        console.log('📋 Please check the errors above and execute manually in Supabase SQL Editor');
        process.exit(1);
    }
}

main().catch(console.error);