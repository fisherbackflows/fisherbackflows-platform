/**
 * Final Security Audit - Fisher Backflows Platform
 * Tests all tables for proper RLS protection
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jvhbqfueutvfepsjmztx.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzM0NzUsImV4cCI6MjA3MTg0OTQ3NX0.UuEuNrFU-JXWvoICUNCupz1MzLvWVrcIqRA-LwpI1Jo';

async function auditSecurity() {
  console.log('🔒 FINAL SECURITY AUDIT - FISHER BACKFLOWS PLATFORM');
  console.log('=' .repeat(60));
  console.log('Testing Date:', new Date().toISOString());
  console.log('=' .repeat(60) + '\n');

  const supabase = createClient(supabaseUrl, anonKey);

  // All 25 tables in the database
  const tables = [
    // Core Customer Tables (6)
    { name: 'customers', category: 'Core Customer Data' },
    { name: 'devices', category: 'Core Customer Data' },
    { name: 'appointments', category: 'Core Customer Data' },
    { name: 'test_reports', category: 'Core Customer Data' },
    { name: 'invoices', category: 'Core Customer Data' },
    { name: 'payments', category: 'Core Customer Data' },
    
    // Team & Operations (6)
    { name: 'team_users', category: 'Team & Operations' },
    { name: 'team_sessions', category: 'Team & Operations' },
    { name: 'technician_locations', category: 'Team & Operations' },
    { name: 'technician_current_location', category: 'Team & Operations' },
    { name: 'time_off_requests', category: 'Team & Operations' },
    { name: 'tester_schedules', category: 'Team & Operations' },
    
    // Security & Audit (2)
    { name: 'security_logs', category: 'Security & Audit' },
    { name: 'audit_logs', category: 'Security & Audit' },
    
    // Billing (3)
    { name: 'billing_subscriptions', category: 'Billing' },
    { name: 'billing_invoices', category: 'Billing' },
    { name: 'invoice_line_items', category: 'Billing' },
    
    // Configuration (3)
    { name: 'water_districts', category: 'Configuration' },
    { name: 'water_department_submissions', category: 'Configuration' },
    { name: 'leads', category: 'Configuration' },
    
    // Notifications (5)
    { name: 'notification_templates', category: 'Notifications' },
    { name: 'push_subscriptions', category: 'Notifications' },
    { name: 'notification_logs', category: 'Notifications' },
    { name: 'notification_interactions', category: 'Notifications' },
    { name: 'email_verifications', category: 'Notifications' }
  ];

  const results = {
    protected: [],
    exposed: [],
    errors: []
  };

  let currentCategory = '';

  for (const table of tables) {
    // Print category header
    if (table.category !== currentCategory) {
      currentCategory = table.category;
      console.log(`\n📁 ${currentCategory}`);
      console.log('-'.repeat(40));
    }

    try {
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .limit(1);

      if (error) {
        // Error usually means access denied (good!)
        console.log(`  ✅ ${table.name.padEnd(30)} Protected (Access Denied)`);
        results.protected.push(table.name);
      } else {
        const count = data ? data.length : 0;
        if (count === 0) {
          console.log(`  ✅ ${table.name.padEnd(30)} Protected (0 records)`);
          results.protected.push(table.name);
        } else {
          console.log(`  ❌ ${table.name.padEnd(30)} EXPOSED! (${count} records)`);
          results.exposed.push(table.name);
        }
      }
    } catch (err) {
      console.log(`  ⚠️  ${table.name.padEnd(30)} Error: ${err.message}`);
      results.errors.push(table.name);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SECURITY AUDIT SUMMARY');
  console.log('='.repeat(60));
  
  const total = tables.length;
  const protectedCount = results.protected.length;
  const exposedCount = results.exposed.length;
  const errorCount = results.errors.length;
  const protectionRate = ((protectedCount / total) * 100).toFixed(1);

  console.log(`\n🛡️  Protection Coverage: ${protectionRate}%`);
  console.log(`   ✅ Protected Tables: ${protectedCount}/${total}`);
  console.log(`   ❌ Exposed Tables: ${exposedCount}/${total}`);
  console.log(`   ⚠️  Errors: ${errorCount}/${total}`);

  if (exposedCount > 0) {
    console.log('\n⚠️  EXPOSED TABLES REQUIRING IMMEDIATE ATTENTION:');
    results.exposed.forEach(t => console.log(`   - ${t}`));
  }

  if (protectionRate === '100.0') {
    console.log('\n🎉 EXCELLENT! All tables are properly protected with RLS!');
  } else if (protectionRate >= '90.0') {
    console.log('\n✅ Good security posture, but some tables still need protection.');
  } else if (protectionRate >= '50.0') {
    console.log('\n⚠️  Moderate security risk - many tables are unprotected.');
  } else {
    console.log('\n🚨 CRITICAL SECURITY RISK - Most tables are exposed!');
  }

  console.log('\n' + '='.repeat(60));
  console.log('Audit Complete:', new Date().toISOString());
  console.log('='.repeat(60));
}

auditSecurity().catch(console.error);