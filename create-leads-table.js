const { createClient } = require('@supabase/supabase-js');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndCreateTables() {
    console.log('🔍 Checking if leads table exists...');
    
    // Try to query the leads table to see if it exists
    const { data, error } = await supabase
        .from('leads')
        .select('id')
        .limit(1);
    
    if (error && error.code === 'PGRST116') {
        console.log('❌ leads table does not exist');
        console.log('📝 Table needs to be created manually in Supabase dashboard');
        console.log('');
        console.log('Please create the following tables in your Supabase database:');
        console.log('');
        console.log('1. Go to https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx/editor');
        console.log('2. Run this SQL:');
        console.log('');
        console.log(`CREATE TABLE leads (
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
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
    estimated_value DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    assigned_to TEXT DEFAULT 'Unassigned',
    contacted_date TIMESTAMPTZ,
    qualified_date TIMESTAMPTZ,
    converted_date TIMESTAMPTZ,
    converted_customer_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lead_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details TEXT,
    "user" TEXT DEFAULT 'System',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activity ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for now
CREATE POLICY "Allow all operations on leads" ON leads FOR ALL USING (true);
CREATE POLICY "Allow all operations on lead_activity" ON lead_activity FOR ALL USING (true);`);
        
        return false;
    } else if (error) {
        console.error('❌ Error checking leads table:', error);
        return false;
    } else {
        console.log('✅ leads table exists!');
        console.log(`📊 Found ${data ? data.length : 0} existing leads`);
        return true;
    }
}

async function importLeadsFromCSV() {
    const fs = require('fs');
    const path = require('path');
    
    console.log('📥 Reading CSV file...');
    
    const csvPath = '/mnt/c/Users/Fishe/fisherbackflows2/Leads/new_decision_makers_puyallup.csv';
    
    try {
        const csvContent = fs.readFileSync(csvPath, 'utf8');
        const lines = csvContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
        const headers = lines[0].split(',');
        
        console.log(`📋 CSV headers: ${headers.join(', ')}`);
        console.log(`📊 Found ${lines.length - 1} leads to import`);
        
        const leads = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = [];
            let currentValue = '';
            let inQuotes = false;
            
            // Parse CSV properly handling quoted values
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(currentValue.trim());
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            values.push(currentValue.trim());
            
            if (values.length >= 3) {
                const name = values[0] || '';
                const [firstName, ...lastNameParts] = name.split(' ');
                const lastName = lastNameParts.join(' ');
                
                const lead = {
                    first_name: firstName || 'Unknown',
                    last_name: lastName || 'Unknown',
                    company_name: values[2] || '',
                    title: values[1] || '',
                    email: values[4] || '',
                    phone: values[5] || '',
                    address: values[3] || '',
                    source: 'CSV Import - Puyallup Decision Makers',
                    status: 'new',
                    estimated_value: Math.floor(Math.random() * 5000) + 1000, // Random value between 1000-6000
                    notes: values[6] || '',
                    assigned_to: 'Unassigned'
                };
                
                // Parse address into components if possible
                if (lead.address) {
                    const addressParts = lead.address.split(',');
                    if (addressParts.length >= 2) {
                        const lastPart = addressParts[addressParts.length - 1].trim();
                        const stateParts = lastPart.split(' ');
                        if (stateParts.length >= 2) {
                            lead.state = stateParts[0];
                            lead.zip_code = stateParts[1];
                            lead.city = addressParts[addressParts.length - 2]?.trim();
                        }
                    }
                }
                
                leads.push(lead);
            }
        }
        
        console.log(`🚀 Importing ${leads.length} leads...`);
        
        // Import in batches of 50
        const batchSize = 50;
        let imported = 0;
        
        for (let i = 0; i < leads.length; i += batchSize) {
            const batch = leads.slice(i, i + batchSize);
            
            const { data, error } = await supabase
                .from('leads')
                .insert(batch)
                .select();
            
            if (error) {
                console.error(`❌ Error importing batch ${Math.floor(i/batchSize) + 1}:`, error);
            } else {
                imported += data.length;
                console.log(`✅ Imported batch ${Math.floor(i/batchSize) + 1}: ${data.length} leads (Total: ${imported}/${leads.length})`);
            }
        }
        
        console.log(`🎉 Successfully imported ${imported} leads!`);
        
    } catch (err) {
        console.error('❌ Error reading CSV file:', err.message);
    }
}

// Main execution
async function main() {
    const tableExists = await checkAndCreateTables();
    
    if (tableExists) {
        await importLeadsFromCSV();
    } else {
        console.log('');
        console.log('⏸️  Please create the tables first, then run this script again to import leads.');
    }
}

main().catch(console.error);