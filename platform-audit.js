#!/usr/bin/env node

/**
 * Comprehensive Platform Audit Script
 * Tests all pages and generates detailed report
 */

const pages = [
  // Main Pages
  { path: '/', name: 'Home/Landing Page', public: true },
  { path: '/login', name: 'Login Page', public: true },
  { path: '/maintenance', name: 'Maintenance Page', public: true },
  { path: '/test-navigation', name: 'Test Navigation', public: true },
  
  // Customer Portal (11 pages)
  { path: '/portal', name: 'Portal Login', public: true },
  { path: '/portal/dashboard', name: 'Portal Dashboard', auth: 'customer' },
  { path: '/portal/billing', name: 'Portal Billing', auth: 'customer' },
  { path: '/portal/devices', name: 'Portal Devices', auth: 'customer' },
  { path: '/portal/reports', name: 'Portal Reports', auth: 'customer' },
  { path: '/portal/schedule', name: 'Portal Schedule', auth: 'customer' },
  { path: '/portal/pay', name: 'Portal Payment', auth: 'customer' },
  { path: '/portal/register', name: 'Portal Registration', public: true },
  { path: '/portal/forgot-password', name: 'Portal Forgot Password', public: true },
  { path: '/portal/reset-password', name: 'Portal Reset Password', public: true },
  { path: '/portal/payment-success', name: 'Payment Success', auth: 'customer' },
  { path: '/portal/payment-cancelled', name: 'Payment Cancelled', auth: 'customer' },
  { path: '/portal/verification-success', name: 'Verification Success', public: true },
  { path: '/portal/verification-error', name: 'Verification Error', public: true },
  
  // Customer Pages (2 pages)
  { path: '/customer', name: 'Customer Landing', public: true },
  { path: '/customer/feedback', name: 'Customer Feedback', auth: 'customer' },
  
  // Field Tech Pages (4 pages)
  { path: '/field', name: 'Field Landing', public: true },
  { path: '/field/login', name: 'Field Login', public: true },
  { path: '/field/dashboard', name: 'Field Dashboard', auth: 'team' },
  { path: '/field/test/123', name: 'Field Test Report', auth: 'team' },
  
  // Team Portal (24 pages)
  { path: '/team-portal', name: 'Team Portal Landing', public: true },
  { path: '/team-portal/login', name: 'Team Portal Login', public: true },
  { path: '/team-portal/dashboard', name: 'Team Dashboard', auth: 'team' },
  { path: '/team-portal/customers', name: 'Team Customers', auth: 'team' },
  { path: '/team-portal/customers/new', name: 'New Customer', auth: 'team' },
  { path: '/team-portal/customers/database', name: 'Customer Database', auth: 'team' },
  { path: '/team-portal/customers/1', name: 'Customer Detail', auth: 'team' },
  { path: '/team-portal/customers/1/edit', name: 'Edit Customer', auth: 'team' },
  { path: '/team-portal/invoices', name: 'Team Invoices', auth: 'team' },
  { path: '/team-portal/invoices/new', name: 'New Invoice', auth: 'team' },
  { path: '/team-portal/invoices/1', name: 'Invoice Detail', auth: 'team' },
  { path: '/team-portal/invoices/1/edit', name: 'Edit Invoice', auth: 'team' },
  { path: '/team-portal/schedule', name: 'Team Schedule', auth: 'team' },
  { path: '/team-portal/schedule/new', name: 'New Schedule', auth: 'team' },
  { path: '/team-portal/reminders', name: 'Team Reminders', auth: 'team' },
  { path: '/team-portal/reminders/new', name: 'New Reminder', auth: 'team' },
  { path: '/team-portal/test-report', name: 'Team Test Report', auth: 'team' },
  { path: '/team-portal/test-reports/1/submit-district', name: 'Submit District Report', auth: 'team' },
  { path: '/team-portal/district-reports', name: 'District Reports', auth: 'team' },
  { path: '/team-portal/billing/subscriptions', name: 'Billing Subscriptions', auth: 'team' },
  { path: '/team-portal/data-management', name: 'Data Management', auth: 'team' },
  { path: '/team-portal/backup', name: 'Team Backup', auth: 'team' },
  { path: '/team-portal/export', name: 'Team Export', auth: 'team' },
  { path: '/team-portal/import', name: 'Team Import', auth: 'team' },
  { path: '/team-portal/labels', name: 'Team Labels', auth: 'team' },
  { path: '/team-portal/instagram', name: 'Instagram Integration', auth: 'team' },
  { path: '/team-portal/settings', name: 'Team Settings', auth: 'team' },
  { path: '/team-portal/help', name: 'Team Help', auth: 'team' },
  { path: '/team-portal/more', name: 'Team More Options', auth: 'team' },
  { path: '/team-portal/tester', name: 'API Tester', auth: 'team' },
  
  // Admin Pages (11 pages)
  { path: '/admin', name: 'Admin Landing', auth: 'admin' },
  { path: '/admin/dashboard', name: 'Admin Dashboard', auth: 'admin' },
  { path: '/admin/analytics', name: 'Admin Analytics', auth: 'admin' },
  { path: '/admin/health', name: 'System Health', auth: 'admin' },
  { path: '/admin/search', name: 'Admin Search', auth: 'admin' },
  { path: '/admin/unlock-accounts', name: 'Unlock Accounts', auth: 'admin' },
  { path: '/admin/audit-logs', name: 'Audit Logs', auth: 'admin' },
  { path: '/admin/reports', name: 'Admin Reports', auth: 'admin' },
  { path: '/admin/feedback', name: 'Admin Feedback', auth: 'admin' },
  { path: '/admin/data-management', name: 'Admin Data Management', auth: 'admin' },
  { path: '/admin/route-optimizer', name: 'Route Optimizer', auth: 'admin' },
  { path: '/admin/site-navigator', name: 'Site Navigator', auth: 'admin' },
  
  // App Pages (2 pages)
  { path: '/app', name: 'App Landing', public: true },
  { path: '/app/dashboard', name: 'App Dashboard', auth: 'customer' },
  
  // Test Pages (1 page)
  { path: '/test/error-boundaries', name: 'Error Boundaries Test', public: true }
];

async function testPage(page) {
  try {
    const response = await fetch(`http://localhost:3010${page.path}`, {
      headers: {
        'User-Agent': 'Platform-Audit/1.0'
      }
    });
    
    const status = response.status;
    const isOk = status >= 200 && status < 400;
    
    return {
      ...page,
      status,
      accessible: isOk,
      error: isOk ? null : `HTTP ${status}`
    };
  } catch (error) {
    return {
      ...page,
      status: 0,
      accessible: false,
      error: error.message
    };
  }
}

async function runAudit() {
  console.log('🔍 Starting Platform Audit...\n');
  console.log('📊 Total Pages Found: ' + pages.length);
  console.log('================================\n');
  
  const results = [];
  const categories = {
    public: [],
    customer: [],
    team: [],
    admin: [],
    app: []
  };
  
  for (const page of pages) {
    process.stdout.write(`Testing ${page.name}...`);
    const result = await testPage(page);
    results.push(result);
    
    // Categorize
    if (page.public) {
      categories.public.push(result);
    } else if (page.auth === 'admin') {
      categories.admin.push(result);
    } else if (page.auth === 'team') {
      categories.team.push(result);
    } else if (page.auth === 'customer') {
      categories.customer.push(result);
    } else if (page.path.startsWith('/app')) {
      categories.app.push(result);
    }
    
    if (result.accessible) {
      console.log(' ✅');
    } else {
      console.log(` ❌ (${result.error})`);
    }
  }
  
  // Generate Report
  console.log('\n================================');
  console.log('📊 AUDIT REPORT');
  console.log('================================\n');
  
  console.log('SUMMARY:');
  console.log(`Total Pages: ${pages.length}`);
  console.log(`Accessible: ${results.filter(r => r.accessible).length}`);
  console.log(`Errors: ${results.filter(r => !r.accessible).length}\n`);
  
  console.log('BY CATEGORY:');
  console.log(`Public Pages: ${categories.public.length}`);
  console.log(`Customer Portal: ${categories.customer.length}`);
  console.log(`Team Portal: ${categories.team.length}`);
  console.log(`Admin Pages: ${categories.admin.length}`);
  console.log(`App Pages: ${categories.app.length}\n`);
  
  console.log('PAGE BREAKDOWN:');
  console.log('---------------');
  
  const sections = [
    { name: 'Public Pages', pages: categories.public },
    { name: 'Customer Portal', pages: categories.customer },
    { name: 'Team Portal', pages: categories.team },
    { name: 'Admin Pages', pages: categories.admin },
    { name: 'App Pages', pages: categories.app }
  ];
  
  for (const section of sections) {
    console.log(`\n${section.name} (${section.pages.length}):`);
    for (const page of section.pages) {
      const icon = page.accessible ? '✅' : '❌';
      const error = page.error ? ` - ${page.error}` : '';
      console.log(`  ${icon} ${page.name}${error}`);
    }
  }
  
  // Error Summary
  const errors = results.filter(r => !r.accessible);
  if (errors.length > 0) {
    console.log('\n❌ PAGES WITH ERRORS:');
    console.log('---------------------');
    for (const page of errors) {
      console.log(`  ${page.name}: ${page.error}`);
    }
  }
  
  console.log('\n================================');
  console.log('✅ Audit Complete!');
  console.log(`📅 Generated: ${new Date().toISOString()}`);
}

// Run the audit
runAudit().catch(console.error);