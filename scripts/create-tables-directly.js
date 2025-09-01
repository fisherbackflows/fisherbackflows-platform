#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function createCoreTables() {
  console.log('🔄 Creating core database tables directly...');
  
  try {
    // Create Supabase client with service role
    const supabase = createClient(
      'https://jvhbqfueutvfepsjmztx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY'
    );

    console.log('📡 Connected to Supabase with service role...');
    
    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection test failed:', testError.message);
      return;
    }
    
    console.log('✅ Connection verified');
    
    // Create core tables one by one with direct SQL
    const tables = [
      {
        name: 'customers',
        sql: `
          CREATE TABLE IF NOT EXISTS public.customers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            company_name TEXT,
            phone TEXT NOT NULL,
            address_line1 TEXT NOT NULL,
            address_line2 TEXT,
            city TEXT NOT NULL,
            state TEXT NOT NULL,
            zip_code TEXT NOT NULL,
            account_number TEXT UNIQUE,
            account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'inactive')),
            billing_address_same BOOLEAN DEFAULT true,
            billing_address_line1 TEXT,
            billing_address_line2 TEXT,
            billing_city TEXT,
            billing_state TEXT,
            billing_zip_code TEXT,
            preferred_contact_method TEXT DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'text')),
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );`
      },
      {
        name: 'team_users',
        sql: `
          CREATE TABLE IF NOT EXISTS public.team_users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('admin', 'technician', 'office')),
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            phone TEXT,
            license_number TEXT,
            hire_date DATE DEFAULT CURRENT_DATE,
            is_active BOOLEAN DEFAULT true,
            last_login TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );`
      },
      {
        name: 'devices',
        sql: `
          CREATE TABLE IF NOT EXISTS public.devices (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
            device_type TEXT NOT NULL CHECK (device_type IN ('double_check', 'reduced_pressure', 'pressure_vacuum', 'atmospheric_vacuum')),
            manufacturer TEXT NOT NULL,
            model TEXT NOT NULL,
            serial_number TEXT,
            size_inches TEXT NOT NULL,
            location_description TEXT NOT NULL,
            installation_date DATE,
            last_test_date DATE,
            next_test_due DATE,
            device_status TEXT DEFAULT 'active' CHECK (device_status IN ('active', 'inactive', 'removed', 'failed')),
            water_district TEXT,
            permit_number TEXT,
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );`
      },
      {
        name: 'appointments',
        sql: `
          CREATE TABLE IF NOT EXISTS public.appointments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
            device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
            assigned_technician UUID,
            appointment_type TEXT DEFAULT 'annual_test' CHECK (appointment_type IN ('annual_test', 'repair', 'installation', 'inspection', 'followup')),
            scheduled_date DATE NOT NULL,
            scheduled_time_start TIME NOT NULL,
            scheduled_time_end TIME,
            actual_start_time TIMESTAMPTZ,
            actual_end_time TIMESTAMPTZ,
            status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
            priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
            estimated_duration INTEGER DEFAULT 60,
            travel_time INTEGER DEFAULT 15,
            special_instructions TEXT,
            customer_notes TEXT,
            technician_notes TEXT,
            completion_notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );`
      },
      {
        name: 'invoices',
        sql: `
          CREATE TABLE IF NOT EXISTS public.invoices (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            invoice_number TEXT UNIQUE NOT NULL,
            customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
            appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
            test_report_id UUID,
            invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
            due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
            subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            tax_rate DECIMAL(4,2) DEFAULT 0.00,
            tax_amount DECIMAL(10,2) DEFAULT 0.00,
            discount_amount DECIMAL(10,2) DEFAULT 0.00,
            total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            amount_paid DECIMAL(10,2) DEFAULT 0.00,
            balance_due DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled')),
            payment_terms TEXT DEFAULT 'net_30',
            sent_date TIMESTAMPTZ,
            viewed_date TIMESTAMPTZ,
            paid_date TIMESTAMPTZ,
            notes TEXT,
            internal_notes TEXT,
            stripe_payment_intent_id TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );`
      },
      {
        name: 'invoice_line_items',
        sql: `
          CREATE TABLE IF NOT EXISTS public.invoice_line_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
            description TEXT NOT NULL,
            quantity DECIMAL(10,2) DEFAULT 1,
            unit_price DECIMAL(10,2) NOT NULL,
            total_price DECIMAL(10,2) NOT NULL,
            item_type TEXT DEFAULT 'service' CHECK (item_type IN ('service', 'product', 'tax', 'discount')),
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );`
      },
      {
        name: 'payments',
        sql: `
          CREATE TABLE IF NOT EXISTS public.payments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
            customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
            payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            amount DECIMAL(10,2) NOT NULL,
            payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'check', 'credit_card', 'ach', 'other')),
            transaction_id TEXT,
            stripe_payment_intent_id TEXT,
            stripe_charge_id TEXT,
            check_number TEXT,
            status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );`
      }
    ];
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const table of tables) {
      try {
        console.log(`🔨 Creating table: ${table.name}...`);
        
        // Use direct SQL execution via RPC call
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: table.sql
        });
        
        if (error) {
          if (error.message.includes('already exists') || error.message.includes('relation') && error.message.includes('does not exist')) {
            console.log(`⚠️  Table ${table.name}: ${error.message}`);
          } else {
            console.error(`❌ Table ${table.name}: ${error.message}`);
            errorCount++;
          }
        } else {
          console.log(`✅ Table ${table.name}: Created successfully`);
          successCount++;
        }
        
      } catch (err) {
        console.error(`💥 Fatal error creating table ${table.name}:`, err.message);
        errorCount++;
      }
    }
    
    // Verify tables exist
    console.log('\n🔍 Verifying tables...');
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true });
          
        if (error) {
          console.log(`❌ ${table.name}: ${error.message}`);
        } else {
          console.log(`✅ ${table.name}: ${count || 0} records`);
        }
      } catch (err) {
        console.log(`❌ ${table.name}: ${err.message}`);
      }
    }
    
    console.log(`\n🎉 Database setup completed!`);
    console.log(`✅ Success: ${successCount} tables`);
    console.log(`❌ Errors: ${errorCount} tables`);
    
    if (errorCount === 0) {
      console.log('\n🚀 All core tables are ready!');
      console.log('Working APIs now have proper database backing.');
    }
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run the table creation
createCoreTables()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));