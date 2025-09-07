const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function importLeadsFromCSV() {
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
                    values.push(currentValue.trim().replace(/^"|"$/g, ''));
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            values.push(currentValue.trim().replace(/^"|"$/g, ''));
            
            if (values.length >= 3 && values[0]) {
                const name = values[0] || '';
                const [firstName, ...lastNameParts] = name.split(' ');
                const lastName = lastNameParts.join(' ');
                
                // Skip if we can't parse a name
                if (!firstName) continue;
                
                const lead = {
                    first_name: firstName,
                    last_name: lastName || 'Unknown',
                    company_name: values[2] || '',
                    email: values[4] || null,
                    phone: values[5] || null,
                    address_line1: values[3] || null,
                    source: 'CSV Import - Puyallup Decision Makers',
                    status: 'new',
                    estimated_value: Math.floor(Math.random() * 4000) + 1000, // Random value between 1000-5000
                    notes: `Title: ${values[1] || 'Unknown'}. Source: ${values[6] ? values[6].substring(0, 200) + '...' : 'Imported from CSV'}`,
                    assigned_to: 'Unassigned'
                };
                
                // Parse address into components if possible
                if (lead.address_line1) {
                    const addressParts = lead.address_line1.split(',');
                    if (addressParts.length >= 2) {
                        const lastPart = addressParts[addressParts.length - 1].trim();
                        const stateParts = lastPart.split(' ');
                        if (stateParts.length >= 2) {
                            lead.state = stateParts[0];
                            lead.zip_code = stateParts.slice(1).join(' ').replace(/[^\d-]/g, '');
                            if (addressParts.length >= 3) {
                                lead.city = addressParts[addressParts.length - 2]?.trim();
                            }
                        }
                    }
                }
                
                leads.push(lead);
            }
        }
        
        console.log(`🚀 Importing ${leads.length} leads...`);
        console.log(`📋 Sample lead data:`, JSON.stringify(leads[0], null, 2));
        
        // Check for existing leads to avoid duplicates
        const { data: existingLeads, error: existingError } = await supabase
            .from('leads')
            .select('email, phone')
            .not('email', 'is', null)
            .not('phone', 'is', null);
        
        if (existingError) {
            console.warn('⚠️ Warning checking existing leads:', existingError);
        }
        
        const existingEmails = new Set(existingLeads?.map(l => l.email) || []);
        const existingPhones = new Set(existingLeads?.map(l => l.phone) || []);
        
        // Filter out duplicates
        const newLeads = leads.filter(lead => 
            (!lead.email || !existingEmails.has(lead.email)) &&
            (!lead.phone || !existingPhones.has(lead.phone))
        );
        
        console.log(`🔄 Filtered to ${newLeads.length} new leads (${leads.length - newLeads.length} duplicates skipped)`);
        
        if (newLeads.length === 0) {
            console.log('✅ No new leads to import');
            return;
        }
        
        // Import in batches of 25
        const batchSize = 25;
        let imported = 0;
        
        for (let i = 0; i < newLeads.length; i += batchSize) {
            const batch = newLeads.slice(i, i + batchSize);
            
            console.log(`📦 Importing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(newLeads.length/batchSize)} (${batch.length} leads)...`);
            
            const { data, error } = await supabase
                .from('leads')
                .insert(batch)
                .select();
            
            if (error) {
                console.error(`❌ Error importing batch ${Math.floor(i/batchSize) + 1}:`, error);
                console.log('Sample lead causing error:', JSON.stringify(batch[0], null, 2));
            } else {
                imported += data.length;
                console.log(`✅ Imported batch ${Math.floor(i/batchSize) + 1}: ${data.length} leads (Total: ${imported}/${newLeads.length})`);
            }
            
            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`🎉 Successfully imported ${imported} new leads!`);
        
        // Show final stats
        const { data: totalLeads, error: countError } = await supabase
            .from('leads')
            .select('id', { count: 'exact' });
        
        if (!countError) {
            console.log(`📊 Total leads in database: ${totalLeads?.length || 0}`);
        }
        
    } catch (err) {
        console.error('❌ Error reading CSV file:', err.message);
    }
}

importLeadsFromCSV().catch(console.error);