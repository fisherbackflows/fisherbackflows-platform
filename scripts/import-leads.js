#!/usr/bin/env node

/**
 * Import Leads from CSV to Supabase
 * This script imports the leads from the CSV file into the Supabase leads table
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://jvhbqfueutvfepsjmztx.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Function to parse CSV
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = parseCSVLine(lines[i]);
      const row = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] ? values[index].replace(/"/g, '') : '';
      });
      
      data.push(row);
    }
  }

  return data;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Function to convert CSV lead to database lead format
function convertToLeadFormat(csvLead) {
  // Split name into first and last
  const nameParts = csvLead.Name ? csvLead.Name.split(' ') : ['', ''];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return {
    first_name: firstName,
    last_name: lastName,
    company_name: csvLead.Company || '',
    email: csvLead.Email || '',
    phone: csvLead.Phone || '',
    address_line1: csvLead.Address || '',
    city: 'Puyallup', // Default city based on CSV content
    state: 'WA',      // Default state
    zip_code: '',     // Extract from address if needed
    source: csvLead.Source ? csvLead.Source.substring(0, 255) : 'CSV Import', // Truncate long sources
    status: 'new',
    estimated_value: null, // No estimated value - use real data only
    notes: `Title: ${csvLead.Title || 'N/A'}. Imported from CSV on ${new Date().toISOString().split('T')[0]}`,
    assigned_to: 'Fisher Backflows',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

async function importLeads() {
  try {
    console.log('🚀 Starting lead import process...');
    
    // Read CSV file
    const csvPath = path.join(__dirname, '../../Leads/new_decision_makers_puyallup.csv');
    console.log(`📁 Reading CSV file from: ${csvPath}`);
    
    if (!fs.existsSync(csvPath)) {
      console.error(`❌ CSV file not found at: ${csvPath}`);
      process.exit(1);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const csvLeads = parseCSV(csvContent);
    
    console.log(`📊 Parsed ${csvLeads.length} leads from CSV`);

    // Convert to database format
    const dbLeads = csvLeads.map(convertToLeadFormat);
    
    console.log('🔄 Converting leads to database format...');
    console.log('Sample lead:', JSON.stringify(dbLeads[0], null, 2));

    // Check if leads already exist (prevent duplicates)
    const { data: existingLeads } = await supabase
      .from('leads')
      .select('email')
      .in('email', dbLeads.map(l => l.email).filter(e => e));

    const existingEmails = new Set(existingLeads?.map(l => l.email) || []);
    const newLeads = dbLeads.filter(lead => !existingEmails.has(lead.email) || !lead.email);

    if (newLeads.length === 0) {
      console.log('✅ All leads already exist in database');
      return;
    }

    console.log(`📥 Importing ${newLeads.length} new leads (${dbLeads.length - newLeads.length} duplicates skipped)...`);

    // Insert leads in batches of 20
    const batchSize = 20;
    let totalInserted = 0;
    
    for (let i = 0; i < newLeads.length; i += batchSize) {
      const batch = newLeads.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('leads')
        .insert(batch)
        .select('id');

      if (error) {
        console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error);
        continue;
      }

      totalInserted += data?.length || 0;
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(newLeads.length / batchSize)} (${data?.length || 0} leads)`);
    }

    // Verify import
    const { data: totalLeads, error: countError } = await supabase
      .from('leads')
      .select('id', { count: 'exact' });

    if (countError) {
      console.error('❌ Error counting leads:', countError);
    } else {
      console.log(`🎉 Import complete! Total leads in database: ${totalLeads?.length || 0}`);
      console.log(`📈 Successfully imported ${totalInserted} new leads`);
    }

    // Show sample of imported data
    const { data: sampleLeads } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    console.log('\n📋 Sample of recently imported leads:');
    sampleLeads?.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.first_name} ${lead.last_name} - ${lead.company_name} (${lead.status})`);
    });

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the import
if (require.main === module) {
  importLeads();
}

module.exports = { importLeads };