const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
    console.log('🚀 Setting up leads database schema...');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync(path.join(__dirname, 'setup-leads-table.sql'), 'utf8');
    
    // Split SQL into individual statements
    const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim()) {
            try {
                console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
                const { data, error } = await supabase.rpc('exec_sql', { 
                    sql: statement + ';' 
                });
                
                if (error) {
                    console.warn(`⚠️  Warning on statement ${i + 1}:`, error.message);
                } else {
                    console.log(`✅ Statement ${i + 1} completed successfully`);
                }
            } catch (err) {
                console.warn(`⚠️  Error on statement ${i + 1}:`, err.message);
            }
        }
    }
    
    // Verify tables were created
    console.log('\n📋 Verifying table creation...');
    
    const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['leads', 'lead_activity']);
    
    if (tablesError) {
        console.error('❌ Error checking tables:', tablesError);
        return;
    }
    
    const tableNames = tables.map(t => t.table_name);
    
    if (tableNames.includes('leads')) {
        console.log('✅ leads table exists');
    } else {
        console.log('❌ leads table not found');
    }
    
    if (tableNames.includes('lead_activity')) {
        console.log('✅ lead_activity table exists');
    } else {
        console.log('❌ lead_activity table not found');
    }
    
    console.log('\n🎉 Database setup completed!');
}

// Alternative approach: Direct table creation
async function createTablesDirectly() {
    console.log('🚀 Creating leads tables directly...');
    
    // Create leads table
    const { error: leadsError } = await supabase.rpc('exec_sql', {
        sql: `
        CREATE TABLE IF NOT EXISTS leads (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            company_name TEXT,
            title TEXT,
            email TEXT,
            phone TEXT,
            address TEXT,
            city TEXT,
            state TEXT,
            zip_code TEXT,
            source TEXT DEFAULT 'imported',
            status TEXT DEFAULT 'new',
            estimated_value DECIMAL(10,2) DEFAULT 0,
            notes TEXT,
            assigned_to TEXT DEFAULT 'Unassigned',
            contacted_date TIMESTAMPTZ,
            qualified_date TIMESTAMPTZ,
            converted_date TIMESTAMPTZ,
            converted_customer_id UUID,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );`
    });
    
    if (leadsError) {
        console.error('❌ Error creating leads table:', leadsError);
    } else {
        console.log('✅ Leads table created successfully');
    }
    
    // Create lead_activity table
    const { error: activityError } = await supabase.rpc('exec_sql', {
        sql: `
        CREATE TABLE IF NOT EXISTS lead_activity (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            lead_id UUID NOT NULL,
            action TEXT NOT NULL,
            details TEXT,
            "user" TEXT DEFAULT 'System',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );`
    });
    
    if (activityError) {
        console.error('❌ Error creating lead_activity table:', activityError);
    } else {
        console.log('✅ Lead activity table created successfully');
    }
}

// Try direct approach first, fallback to RPC if needed
createTablesDirectly()
    .then(() => {
        console.log('🎉 Database setup completed successfully!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Database setup failed:', err);
        console.log('🔄 Trying alternative approach...');
        return setupDatabase();
    })
    .catch(err => {
        console.error('❌ All database setup approaches failed:', err);
        process.exit(1);
    });