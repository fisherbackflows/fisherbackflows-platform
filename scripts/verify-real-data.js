#!/usr/bin/env node

/**
 * Verify Real Data Integration
 * Checks actual database data for AI features
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

async function verifyRealData() {
  console.log('🔍 Verifying Real Data Integration');
  console.log('==================================\n');
  
  try {
    // Load environment variables
    require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ Connected to Supabase');
    
    // Check actual data in database
    console.log('\n📊 Database Content Analysis:');
    console.log('─'.repeat(40));
    
    const tables = [
      { name: 'customers', description: 'Customer accounts' },
      { name: 'devices', description: 'Backflow devices' },
      { name: 'appointments', description: 'Service appointments' },
      { name: 'invoices', description: 'Billing invoices' },
      { name: 'test_reports', description: 'Test results' },
      { name: 'team_users', description: 'Team members' }
    ];
    
    let totalRecords = 0;
    const tableStats = {};
    
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${table.name}: Error - ${error.message}`);
          continue;
        }
        
        const recordCount = count || 0;
        totalRecords += recordCount;
        tableStats[table.name] = recordCount;
        
        console.log(`📋 ${table.name.padEnd(20)} | ${recordCount.toString().padStart(4)} records | ${table.description}`);
        
      } catch (err) {
        console.log(`❌ ${table.name}: ${err.message}`);
      }
    }
    
    console.log('─'.repeat(40));
    console.log(`📈 Total Records: ${totalRecords}`);
    
    // Analyze data quality for AI features
    console.log('\n🧠 AI Data Quality Analysis:');
    console.log('─'.repeat(40));
    
    // Customer analysis
    if (tableStats.customers > 0) {
      const { data: customers } = await supabase
        .from('customers')
        .select('id, first_name, email, created_at, status')
        .limit(5);
      
      const customersWithEmail = customers?.filter(c => c.email) || [];
      const activeCustomers = customers?.filter(c => c.status === 'active') || [];
      
      console.log(`👥 Customers: ${tableStats.customers} total`);
      console.log(`   ✓ With email: ${customersWithEmail.length}/${tableStats.customers}`);
      console.log(`   ✓ Active: ${activeCustomers.length}/${tableStats.customers}`);
      
      if (customers && customers.length > 0) {
        console.log(`   ✓ Sample: ${customers[0].first_name} (${customers[0].status})`);
      }
    } else {
      console.log('⚠️  No customers found - AI customer features need data');
    }
    
    // Revenue analysis
    if (tableStats.invoices > 0) {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('total_amount, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      
      const paidInvoices = invoices?.filter(inv => inv.status === 'paid') || [];
      const totalRevenue = paidInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || '0'), 0);
      
      console.log(`💰 Revenue: ${tableStats.invoices} invoices`);
      console.log(`   ✓ Paid: ${paidInvoices.length}/${tableStats.invoices}`);
      console.log(`   ✓ Total Revenue: $${totalRevenue.toLocaleString()}`);
      
      if (invoices && invoices.length > 0) {
        console.log(`   ✓ Latest: $${invoices[0].total_amount} (${invoices[0].status})`);
      }
    } else {
      console.log('⚠️  No invoices found - AI revenue features need data');
    }
    
    // Appointment analysis  
    if (tableStats.appointments > 0) {
      const { data: appointments } = await supabase
        .from('appointments')
        .select('status, created_at, scheduled_date')
        .order('created_at', { ascending: false })
        .limit(10);
      
      const completedAppointments = appointments?.filter(apt => apt.status === 'completed') || [];
      const recentAppointments = appointments?.filter(apt => 
        new Date(apt.created_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ) || [];
      
      console.log(`📅 Appointments: ${tableStats.appointments} total`);
      console.log(`   ✓ Completed: ${completedAppointments.length}/${tableStats.appointments}`);
      console.log(`   ✓ Last 30 days: ${recentAppointments.length}`);
      
      if (appointments && appointments.length > 0) {
        console.log(`   ✓ Latest: ${appointments[0].status} (${appointments[0].scheduled_date})`);
      }
    } else {
      console.log('⚠️  No appointments found - AI scheduling features need data');
    }
    
    // Device analysis
    if (tableStats.devices > 0) {
      const { data: devices } = await supabase
        .from('devices')
        .select('device_type, last_test_date, status')
        .limit(5);
      
      const deviceTypes = [...new Set(devices?.map(d => d.device_type) || [])];
      const testedDevices = devices?.filter(d => d.last_test_date) || [];
      
      console.log(`🔧 Devices: ${tableStats.devices} total`);
      console.log(`   ✓ Types: ${deviceTypes.join(', ')}`);
      console.log(`   ✓ With test data: ${testedDevices.length}/${tableStats.devices}`);
    } else {
      console.log('⚠️  No devices found - AI compliance features need data');
    }
    
    // Data readiness assessment
    console.log('\n🎯 AI Feature Readiness:');
    console.log('─'.repeat(40));
    
    const readiness = {
      customerCommunication: tableStats.customers > 0 ? '✅ Ready' : '❌ Needs customers',
      businessInsights: (tableStats.invoices > 0 && tableStats.appointments > 0) ? '✅ Ready' : '❌ Needs transaction data',
      reportGeneration: (tableStats.customers > 0 && tableStats.appointments > 0) ? '✅ Ready' : '❌ Needs operational data',
      chatSupport: tableStats.customers > 0 ? '✅ Ready' : '❌ Needs customers'
    };
    
    console.log(`🗨️  Customer Communication: ${readiness.customerCommunication}`);
    console.log(`📊 Business Insights: ${readiness.businessInsights}`);
    console.log(`📋 Report Generation: ${readiness.reportGeneration}`);
    console.log(`💬 Chat Support: ${readiness.chatSupport}`);
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    console.log('─'.repeat(40));
    
    if (totalRecords === 0) {
      console.log('🚨 CRITICAL: No data in database');
      console.log('   → Import sample data or create test records');
      console.log('   → Run: npm run db:setup:test (if available)');
    } else if (totalRecords < 10) {
      console.log('⚠️  LOW DATA: Limited records for AI analysis');
      console.log('   → Add more sample data for better insights');
      console.log('   → AI will work but with limited intelligence');
    } else {
      console.log('✅ GOOD: Sufficient data for AI features');
      console.log('   → AI features will use real business data');
      console.log('   → Configure OpenAI API key for full functionality');
    }
    
    console.log('\n🔑 Next Steps:');
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
      console.log('✅ OpenAI API key configured');
      console.log('   → AI features will use real GPT responses');
    } else {
      console.log('⚠️  OpenAI API key not configured');
      console.log('   → Add OPENAI_API_KEY to .env.local for real AI responses');
      console.log('   → Current: Using intelligent mock responses based on real data');
    }
    
    return { success: true, totalRecords, tableStats, readiness };
    
  } catch (error) {
    console.error('💥 Verification failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  verifyRealData()
    .then((result) => {
      if (result.success) {
        console.log('\n✨ Real data verification completed!');
        process.exit(0);
      } else {
        console.log('\n❌ Verification failed.');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { verifyRealData };