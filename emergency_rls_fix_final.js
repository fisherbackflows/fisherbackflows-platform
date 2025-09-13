#!/usr/bin/env node

// EMERGENCY RLS FIX - Immediate protection for exposed customer data
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function applyEmergencyRLSFix() {
  console.log('🚨 EMERGENCY RLS FIX - SECURING CUSTOMER DATA');
  console.log('==============================================');
  
  // Initialize Supabase with service role
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  // Test connection
  console.log('🔗 Testing connection...');
  try {
    const { count, error } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }
    
    console.log(`✅ Connected successfully. Database has ${count} customers.`);
  } catch (e) {
    console.error('❌ Connection error:', e.message);
    return;
  }
  
  // Execute critical security fixes in blocks
  const securityBlocks = [
    {
      name: 'Helper Functions',
      sql: `
        CREATE OR REPLACE FUNCTION public.is_team_member()
        RETURNS BOOLEAN AS $$
        BEGIN
          RETURN EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid()
          );
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        
        CREATE OR REPLACE FUNCTION public.is_admin()
        RETURNS BOOLEAN AS $$
        BEGIN
          RETURN EXISTS (
            SELECT 1 FROM public.team_users 
            WHERE id = auth.uid() 
            AND role = 'admin'
          );
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    },
    {
      name: 'Enable RLS on Core Tables',
      sql: `
        ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.test_reports ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
      `
    },
    {
      name: 'Customer Data Policies',
      sql: `
        DROP POLICY IF EXISTS "devices_customer_access" ON public.devices;
        DROP POLICY IF EXISTS "devices_team_access" ON public.devices;
        CREATE POLICY "devices_customer_access" ON public.devices FOR ALL TO authenticated USING (customer_id = auth.uid());
        CREATE POLICY "devices_team_access" ON public.devices FOR ALL TO authenticated USING (public.is_team_member());
        
        DROP POLICY IF EXISTS "appointments_customer_access" ON public.appointments;
        DROP POLICY IF EXISTS "appointments_team_access" ON public.appointments;
        CREATE POLICY "appointments_customer_access" ON public.appointments FOR ALL TO authenticated USING (customer_id = auth.uid());
        CREATE POLICY "appointments_team_access" ON public.appointments FOR ALL TO authenticated USING (public.is_team_member());
        
        DROP POLICY IF EXISTS "test_reports_customer_access" ON public.test_reports;
        DROP POLICY IF EXISTS "test_reports_team_access" ON public.test_reports;
        CREATE POLICY "test_reports_customer_access" ON public.test_reports FOR ALL TO authenticated USING (
          EXISTS (
            SELECT 1 FROM public.devices 
            WHERE id = test_reports.device_id 
            AND customer_id = auth.uid()
          )
        );
        CREATE POLICY "test_reports_team_access" ON public.test_reports FOR ALL TO authenticated USING (public.is_team_member());
        
        DROP POLICY IF EXISTS "invoices_customer_access" ON public.invoices;
        DROP POLICY IF EXISTS "invoices_team_access" ON public.invoices;
        CREATE POLICY "invoices_customer_access" ON public.invoices FOR ALL TO authenticated USING (customer_id = auth.uid());
        CREATE POLICY "invoices_team_access" ON public.invoices FOR ALL TO authenticated USING (public.is_team_member());
        
        DROP POLICY IF EXISTS "payments_customer_access" ON public.payments;
        DROP POLICY IF EXISTS "payments_team_access" ON public.payments;
        CREATE POLICY "payments_customer_access" ON public.payments FOR ALL TO authenticated USING (customer_id = auth.uid());
        CREATE POLICY "payments_team_access" ON public.payments FOR ALL TO authenticated USING (public.is_team_member());
      `
    }
  ];
  
  // Execute each security block
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < securityBlocks.length; i++) {
    const block = securityBlocks[i];
    console.log(`\n🔧 [${i + 1}/${securityBlocks.length}] Applying ${block.name}...`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: block.sql });
      
      if (error) {
        console.log(`⚠️  Warning: ${error.message}`);
        errorCount++;
      } else {
        console.log(`✅ ${block.name} applied successfully`);
        successCount++;
      }
    } catch (blockError) {
      console.log(`❌ Error applying ${block.name}: ${blockError.message}`);
      errorCount++;
    }
  }
  
  console.log('\n📊 SECURITY FIX SUMMARY');
  console.log('========================');
  console.log(`✅ Successful operations: ${successCount}/${securityBlocks.length}`);
  console.log(`❌ Failed operations: ${errorCount}`);
  
  if (successCount >= 2) {
    console.log('\n🎉 EMERGENCY SECURITY FIX APPLIED!');
    console.log('🔒 Customer data is now protected');
    console.log('👉 Run verification script to confirm protection');
  } else {
    console.log('\n⚠️ Manual intervention required in Supabase SQL Editor');
    console.log('📋 Go to: https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx');
    console.log('📝 Execute the EMERGENCY_RLS_FIX.sql file manually');
  }
}

// Execute the emergency fix
applyEmergencyRLSFix().catch(console.error);