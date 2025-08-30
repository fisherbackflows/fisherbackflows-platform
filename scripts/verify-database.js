#!/usr/bin/env node

/**
 * Database Verification Script
 * Tests if all tables were created successfully in Supabase
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function verifyDatabase() {
  console.log(`${colors.cyan}🔍 Fisher Backflows Database Verification${colors.reset}\n`);
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || supabaseUrl === 'your-supabase-url-here') {
    console.log(`${colors.red}❌ Supabase URL not configured in .env.local${colors.reset}`);
    console.log(`   Please update NEXT_PUBLIC_SUPABASE_URL with your actual Supabase URL`);
    return false;
  }
  
  if (!supabaseKey || supabaseKey === 'your-supabase-anon-key-here') {
    console.log(`${colors.red}❌ Supabase key not configured in .env.local${colors.reset}`);
    console.log(`   Please update NEXT_PUBLIC_SUPABASE_ANON_KEY with your actual key`);
    return false;
  }
  
  console.log(`${colors.green}✓ Environment variables configured${colors.reset}`);
  console.log(`  URL: ${supabaseUrl}`);
  console.log(`  Key: ${supabaseKey.substring(0, 20)}...${colors.reset}\n`);
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Tables to verify
  const requiredTables = [
    'customers',
    'devices', 
    'appointments',
    'test_reports',
    'invoices',
    'invoice_line_items',
    'payments',
    'leads',
    'water_department_submissions',
    'audit_logs'
  ];
  
  const existingTables = [
    'team_users',
    'team_sessions',
    'tester_schedules',
    'time_off_requests'
  ];
  
  console.log(`${colors.blue}📊 Checking Required Business Tables:${colors.reset}`);
  
  let allTablesExist = true;
  const tableStatus = {};
  
  // Check each required table
  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count(*)', { count: 'exact', head: true });
      
      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`  ${colors.red}❌ ${table} - NOT FOUND${colors.reset}`);
          tableStatus[table] = false;
          allTablesExist = false;
        } else if (error.message.includes('JWT')) {
          console.log(`  ${colors.yellow}⚠️  ${table} - Auth issue (table might exist)${colors.reset}`);
          tableStatus[table] = 'auth-issue';
        } else {
          console.log(`  ${colors.yellow}⚠️  ${table} - ${error.message}${colors.reset}`);
          tableStatus[table] = 'error';
        }
      } else {
        console.log(`  ${colors.green}✓ ${table} - EXISTS${colors.reset}`);
        tableStatus[table] = true;
      }
    } catch (err) {
      console.log(`  ${colors.red}❌ ${table} - Error: ${err.message}${colors.reset}`);
      tableStatus[table] = false;
      allTablesExist = false;
    }
  }
  
  console.log(`\n${colors.blue}📦 Checking Existing Tables:${colors.reset}`);
  
  // Check existing tables
  for (const table of existingTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count(*)', { count: 'exact', head: true });
      
      if (error && error.message.includes('does not exist')) {
        console.log(`  ${colors.yellow}○ ${table} - Not found${colors.reset}`);
      } else if (error) {
        console.log(`  ${colors.yellow}⚠️  ${table} - ${error.message}${colors.reset}`);
      } else {
        console.log(`  ${colors.green}✓ ${table} - EXISTS${colors.reset}`);
      }
    } catch (err) {
      console.log(`  ${colors.yellow}○ ${table} - ${err.message}${colors.reset}`);
    }
  }
  
  // Test data operations
  console.log(`\n${colors.blue}🧪 Testing Database Operations:${colors.reset}`);
  
  if (tableStatus['customers'] === true) {
    try {
      // Try to fetch test customer
      const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .eq('email', 'test@example.com')
        .limit(1);
      
      if (!error && customers && customers.length > 0) {
        console.log(`  ${colors.green}✓ Test customer found: ${customers[0].first_name} ${customers[0].last_name}${colors.reset}`);
      } else if (!error) {
        console.log(`  ${colors.yellow}○ No test customer found (run INSERT to add one)${colors.reset}`);
      } else {
        console.log(`  ${colors.yellow}⚠️  Could not fetch customers: ${error.message}${colors.reset}`);
      }
    } catch (err) {
      console.log(`  ${colors.red}❌ Database operation failed: ${err.message}${colors.reset}`);
    }
  }
  
  // Summary
  console.log(`\n${colors.cyan}📋 SUMMARY:${colors.reset}`);
  
  const createdTables = Object.keys(tableStatus).filter(t => tableStatus[t] === true);
  const missingTables = Object.keys(tableStatus).filter(t => tableStatus[t] === false);
  const authIssueTables = Object.keys(tableStatus).filter(t => tableStatus[t] === 'auth-issue');
  
  if (createdTables.length > 0) {
    console.log(`${colors.green}✓ Tables created: ${createdTables.length}/${requiredTables.length}${colors.reset}`);
    console.log(`  ${createdTables.join(', ')}`);
  }
  
  if (missingTables.length > 0) {
    console.log(`${colors.red}❌ Missing tables: ${missingTables.length}${colors.reset}`);
    console.log(`  ${missingTables.join(', ')}`);
    console.log(`\n${colors.yellow}To fix: Run the SQL script in Supabase SQL Editor${colors.reset}`);
  }
  
  if (authIssueTables.length > 0) {
    console.log(`${colors.yellow}⚠️  Tables with auth issues: ${authIssueTables.length}${colors.reset}`);
    console.log(`  These tables might exist but need proper RLS policies`);
  }
  
  if (allTablesExist) {
    console.log(`\n${colors.green}🎉 SUCCESS! All tables are ready for use!${colors.reset}`);
    console.log(`${colors.cyan}Your Fisher Backflows platform database is fully configured.${colors.reset}`);
    return true;
  } else {
    console.log(`\n${colors.yellow}⚠️  Some tables are missing. Please run the migration script.${colors.reset}`);
    return false;
  }
}

// Run verification
verifyDatabase().catch(console.error);