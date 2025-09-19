#!/usr/bin/env node

/**
 * Cleanup Test Data Script
 * Removes all test customers and their associated data
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupTestData() {
  try {
    console.log('🧹 Starting test data cleanup...');

    // First, get all test customer IDs
    const { data: testCustomers, error: customerError } = await supabase
      .from('customers')
      .select('id, email, first_name, last_name')
      .like('email', '%example.com');

    if (customerError) {
      throw new Error(`Failed to fetch test customers: ${customerError.message}`);
    }

    if (!testCustomers || testCustomers.length === 0) {
      console.log('✅ No test customers found. Database is clean.');
      return;
    }

    console.log(`📋 Found ${testCustomers.length} test customers:`);
    testCustomers.forEach(customer => {
      console.log(`   - ${customer.first_name} ${customer.last_name} (${customer.email})`);
    });

    const customerIds = testCustomers.map(c => c.id);

    // Delete in correct order due to foreign key constraints
    console.log('\n🗑️  Deleting associated records...');

    // 1. Delete payments (references invoices)
    const { error: paymentsError } = await supabase
      .from('payments')
      .delete()
      .in('customer_id', customerIds);

    if (paymentsError) {
      console.warn(`⚠️  Warning deleting payments: ${paymentsError.message}`);
    } else {
      console.log('   ✅ Payments deleted');
    }

    // 2. Delete invoices
    const { error: invoicesError } = await supabase
      .from('invoices')
      .delete()
      .in('customer_id', customerIds);

    if (invoicesError) {
      console.warn(`⚠️  Warning deleting invoices: ${invoicesError.message}`);
    } else {
      console.log('   ✅ Invoices deleted');
    }

    // 3. Delete appointments
    const { error: appointmentsError } = await supabase
      .from('appointments')
      .delete()
      .in('customer_id', customerIds);

    if (appointmentsError) {
      console.warn(`⚠️  Warning deleting appointments: ${appointmentsError.message}`);
    } else {
      console.log('   ✅ Appointments deleted');
    }

    // 4. Delete devices
    const { error: devicesError } = await supabase
      .from('devices')
      .delete()
      .in('customer_id', customerIds);

    if (devicesError) {
      console.warn(`⚠️  Warning deleting devices: ${devicesError.message}`);
    } else {
      console.log('   ✅ Devices deleted');
    }

    // 5. Delete from Supabase Auth
    console.log('\n🔐 Deleting from Supabase Auth...');
    for (const customer of testCustomers) {
      try {
        const { error: authError } = await supabase.auth.admin.deleteUser(customer.id);
        if (authError) {
          console.warn(`⚠️  Warning deleting auth user ${customer.email}: ${authError.message}`);
        } else {
          console.log(`   ✅ Auth user deleted: ${customer.email}`);
        }
      } catch (err) {
        console.warn(`⚠️  Warning deleting auth user ${customer.email}: ${err.message}`);
      }
    }

    // 6. Finally delete customers
    const { error: customersError } = await supabase
      .from('customers')
      .delete()
      .in('id', customerIds);

    if (customersError) {
      throw new Error(`Failed to delete customers: ${customersError.message}`);
    }

    console.log('   ✅ Customer records deleted');

    console.log('\n🎉 Test data cleanup completed successfully!');
    console.log('📊 Ready for fresh customer testing');

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

// Run cleanup
cleanupTestData();