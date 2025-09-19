#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function createTables() {
  try {
    const supabase = createClient(
      'https://jvhbqfueutvfepsjmztx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY'
    );

    console.log('🔄 Testing connection...');
    
    // Test by trying to access customers table
    const { data, error } = await supabase
      .from('customers')
      .select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Customers table does not exist, creating tables...');
      
      // Create customers table first (no dependencies)
      const { error: customerError } = await supabase.rpc('exec_sql', {
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
            account_status TEXT DEFAULT 'active',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      });
      
      if (customerError) {
        console.error('❌ Error creating customers table:', customerError.message);
      } else {
        console.log('✅ Customers table created');
      }
      
      // Create team_users table
      const { error: teamError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.team_users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            phone TEXT,
            license_number TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      });
      
      if (teamError) {
        console.error('❌ Error creating team_users table:', teamError.message);
      } else {
        console.log('✅ Team_users table created');
      }
      
      // Create invoices table  
      const { error: invoiceError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.invoices (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            invoice_number TEXT UNIQUE NOT NULL,
            customer_id UUID NOT NULL REFERENCES public.customers(id),
            invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
            due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
            subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            tax_amount DECIMAL(10,2) DEFAULT 0.00,
            total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            status TEXT DEFAULT 'draft',
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      });
      
      if (invoiceError) {
        console.error('❌ Error creating invoices table:', invoiceError.message);
      } else {
        console.log('✅ Invoices table created');
      }
      
      // Create invoice_line_items table
      const { error: lineItemsError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.invoice_line_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
            description TEXT NOT NULL,
            quantity DECIMAL(10,2) DEFAULT 1,
            unit_price DECIMAL(10,2) NOT NULL,
            total_price DECIMAL(10,2) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      });
      
      if (lineItemsError) {
        console.error('❌ Error creating invoice_line_items table:', lineItemsError.message);
      } else {
        console.log('✅ Invoice_line_items table created');
      }
      
    } else {
      console.log(`✅ Connection successful - customers table has ${data?.[0]?.count || 0} records`);
    }
    
    // Insert test data if customers table is empty
    const { count } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
      
    if (count === 0) {
      console.log('🔄 Inserting test data...');
      
      // Insert admin user
      const { error: adminError } = await supabase
        .from('team_users')
        .upsert({
          email: 'admin@fisherbackflows.com',
          password_hash: '$2a$12$rBV2JDeWW3.vKyeQcM8fFO4777l4bVeQgDL6VZkqPqhN9dAMhWGEy',
          role: 'admin',
          first_name: 'Admin',
          last_name: 'User',
          license_number: 'WA-BF-001',
          phone: '(253) 278-8692'
        });
        
      if (adminError) {
        console.error('❌ Error inserting admin user:', adminError.message);
      } else {
        console.log('✅ Admin user created');
      }
      
      // Insert test customer
      const { data: customerData, error: customerInsertError } = await supabase
        .from('customers')
        .upsert({
          email: 'john.smith@example.com',
          first_name: 'John',
          last_name: 'Smith',
          phone: '(253) 555-0123',
          address_line1: '123 Main Street',
          city: 'Tacoma',
          state: 'WA',
          zip_code: '98402',
          account_number: 'FB-001'
        })
        .select()
        .single();
        
      if (customerInsertError) {
        console.error('❌ Error inserting test customer:', customerInsertError.message);
      } else {
        console.log('✅ Test customer created');
        
        // Insert test invoice
        const { data: invoiceData, error: invoiceInsertError } = await supabase
          .from('invoices')
          .upsert({
            invoice_number: 'INV-2025-001',
            customer_id: customerData.id,
            subtotal: 75.00,
            tax_amount: 7.33,
            total_amount: 82.33,
            status: 'sent'
          })
          .select()
          .single();
          
        if (invoiceInsertError) {
          console.error('❌ Error inserting test invoice:', invoiceInsertError.message);
        } else {
          console.log('✅ Test invoice created');
          
          // Insert invoice line item
          const { error: lineItemError } = await supabase
            .from('invoice_line_items')
            .upsert({
              invoice_id: invoiceData.id,
              description: 'Annual Backflow Preventer Testing',
              quantity: 1,
              unit_price: 75.00,
              total_price: 75.00
            });
            
          if (lineItemError) {
            console.error('❌ Error inserting line item:', lineItemError.message);
          } else {
            console.log('✅ Test invoice line item created');
          }
        }
      }
    }
    
    console.log('\n🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

createTables();