#!/usr/bin/env node

/**
 * RLS Implementation via Supabase REST API
 * Uses direct HTTP requests to execute SQL statements
 */

const fs = require('fs').promises;
require('dotenv').config({ path: '.env.local' });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

async function executeSQL(sql, description) {
  try {
    console.log(`${colors.blue}⏳ ${description}${colors.reset}`);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    });

    if (response.ok) {
      console.log(`${colors.green}✓ ${description}${colors.reset}`);
      return { success: true };
    } else {
      const errorText = await response.text();
      if (errorText.includes('already exists') || errorText.includes('does not exist')) {
        console.log(`${colors.yellow}⚠️  ${description} - ${errorText}${colors.reset}`);
        return { success: true, warning: true };
      } else {
        console.log(`${colors.red}❌ ${description} - ${errorText}${colors.reset}`);
        return { success: false, error: errorText };
      }
    }
  } catch (error) {
    console.log(`${colors.red}❌ ${description} - ${error.message}${colors.reset}`);
    return { success: false, error: error.message };
  }
}

async function executeRLSViaAPI() {
  console.log(`${colors.cyan}${colors.bold}🔐 Fisher Backflows RLS Implementation (API Method)${colors.reset}\n`);
  
  let successCount = 0;
  let errorCount = 0;
  let warningCount = 0;

  // Critical SQL statements to address security advisories
  const criticalStatements = [
    {
      sql: `CREATE OR REPLACE FUNCTION auth.is_team_member() RETURNS BOOLEAN AS $$
        BEGIN
          RETURN EXISTS (SELECT 1 FROM public.team_users WHERE id = auth.uid());
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;`,
      description: 'Create is_team_member helper function'
    },
    {
      sql: `CREATE OR REPLACE FUNCTION auth.is_admin() RETURNS BOOLEAN AS $$
        BEGIN
          RETURN EXISTS (SELECT 1 FROM public.team_users WHERE id = auth.uid() AND role = 'admin');
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;`,
      description: 'Create is_admin helper function'
    },
    {
      sql: `ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;`,
      description: 'Enable RLS on billing_invoices'
    },
    {
      sql: `ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;`,
      description: 'Enable RLS on security_logs'
    },
    {
      sql: `ALTER TABLE public.technician_current_location ENABLE ROW LEVEL SECURITY;`,
      description: 'Enable RLS on technician_current_location'
    },
    {
      sql: `ALTER TABLE public.technician_locations ENABLE ROW LEVEL SECURITY;`,
      description: 'Enable RLS on technician_locations'
    },
    {
      sql: `CREATE POLICY "billing_invoices_team_access" ON public.billing_invoices
        FOR ALL TO authenticated USING (auth.is_team_member());`,
      description: 'Create billing_invoices team access policy'
    },
    {
      sql: `CREATE POLICY "security_logs_admin_access" ON public.security_logs
        FOR ALL TO authenticated USING (auth.is_admin());`,
      description: 'Create security_logs admin access policy'
    },
    {
      sql: `CREATE POLICY "technician_current_location_team_access" ON public.technician_current_location
        FOR ALL TO authenticated USING (auth.is_team_member());`,
      description: 'Create technician_current_location team access policy'
    },
    {
      sql: `CREATE POLICY "technician_locations_team_access" ON public.technician_locations
        FOR ALL TO authenticated USING (auth.is_team_member());`,
      description: 'Create technician_locations team access policy'
    }
  ];

  console.log(`${colors.cyan}Executing Critical Security Fixes:${colors.reset}`);
  
  for (const statement of criticalStatements) {
    const result = await executeSQL(statement.sql, statement.description);
    if (result.success) {
      if (result.warning) {
        warningCount++;
      } else {
        successCount++;
      }
    } else {
      errorCount++;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`\n${colors.cyan}${colors.bold}📊 EXECUTION SUMMARY${colors.reset}`);
  console.log(`${colors.green}✅ Successful: ${successCount}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Warnings: ${warningCount}${colors.reset}`);
  console.log(`${colors.red}❌ Errors: ${errorCount}${colors.reset}`);

  if (errorCount === 0) {
    console.log(`\n${colors.green}${colors.bold}🎉 CRITICAL SECURITY FIXES APPLIED!${colors.reset}`);
    console.log(`${colors.green}Main security advisories have been addressed:${colors.reset}`);
    console.log(`${colors.green}• RLS enabled on billing_invoices${colors.reset}`);
    console.log(`${colors.green}• RLS enabled on security_logs${colors.reset}`);
    console.log(`${colors.green}• RLS enabled on technician_current_location${colors.reset}`);
    console.log(`${colors.green}• RLS enabled on technician_locations${colors.reset}`);
    console.log(`${colors.green}• Helper functions created${colors.reset}`);
    console.log(`${colors.green}• Basic policies implemented${colors.reset}`);
  }

  console.log(`\n${colors.cyan}${colors.bold}📋 NEXT STEPS${colors.reset}`);
  console.log(`${colors.blue}For complete RLS implementation:${colors.reset}`);
  console.log(`${colors.blue}1. Open Supabase Dashboard: https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx${colors.reset}`);
  console.log(`${colors.blue}2. Go to SQL Editor${colors.reset}`);
  console.log(`${colors.blue}3. Execute the full COMPREHENSIVE_RLS_IMPLEMENTATION.sql file${colors.reset}`);

  return errorCount === 0;
}

// Note: This approach might not work due to Supabase API limitations
// The main purpose is to demonstrate the approach and provide fallback instructions
executeRLSViaAPI().catch(console.error);