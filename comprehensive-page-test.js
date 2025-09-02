#!/usr/bin/env node

/**
 * Comprehensive Page Testing - Visibility and Navigation
 * Tests all 69 pages without requiring puppeteer
 */

const fs = require('fs');
const path = require('path');

const ALL_PAGES = [
  // Main Pages (4)
  { path: '/', name: 'Home/Landing Page', category: 'main' },
  { path: '/login', name: 'Login Page', category: 'main' },
  { path: '/maintenance', name: 'Maintenance Page', category: 'main' },
  { path: '/test-navigation', name: 'Test Navigation', category: 'main' },
  
  // Customer Portal (14)
  { path: '/portal', name: 'Portal Login', category: 'portal' },
  { path: '/portal/dashboard', name: 'Portal Dashboard', category: 'portal' },
  { path: '/portal/billing', name: 'Portal Billing', category: 'portal' },
  { path: '/portal/devices', name: 'Portal Devices', category: 'portal' },
  { path: '/portal/reports', name: 'Portal Reports', category: 'portal' },
  { path: '/portal/schedule', name: 'Portal Schedule', category: 'portal' },
  { path: '/portal/pay', name: 'Portal Payment', category: 'portal' },
  { path: '/portal/register', name: 'Portal Registration', category: 'portal' },
  { path: '/portal/forgot-password', name: 'Portal Forgot Password', category: 'portal' },
  { path: '/portal/reset-password', name: 'Portal Reset Password', category: 'portal' },
  { path: '/portal/payment-success', name: 'Payment Success', category: 'portal' },
  { path: '/portal/payment-cancelled', name: 'Payment Cancelled', category: 'portal' },
  { path: '/portal/verification-success', name: 'Verification Success', category: 'portal' },
  { path: '/portal/verification-error', name: 'Verification Error', category: 'portal' },
  
  // Customer Pages (2)
  { path: '/customer', name: 'Customer Landing', category: 'customer' },
  { path: '/customer/feedback', name: 'Customer Feedback', category: 'customer' },
  
  // Field Tech Pages (4)
  { path: '/field', name: 'Field Landing', category: 'field' },
  { path: '/field/login', name: 'Field Login', category: 'field' },
  { path: '/field/dashboard', name: 'Field Dashboard', category: 'field' },
  { path: '/field/test/123', name: 'Field Test Report', category: 'field' },
  
  // Team Portal (30)
  { path: '/team-portal', name: 'Team Portal Landing', category: 'team' },
  { path: '/team-portal/login', name: 'Team Portal Login', category: 'team' },
  { path: '/team-portal/dashboard', name: 'Team Dashboard', category: 'team' },
  { path: '/team-portal/customers', name: 'Team Customers', category: 'team' },
  { path: '/team-portal/customers/new', name: 'New Customer', category: 'team' },
  { path: '/team-portal/customers/database', name: 'Customer Database', category: 'team' },
  { path: '/team-portal/customers/1', name: 'Customer Detail', category: 'team' },
  { path: '/team-portal/customers/1/edit', name: 'Edit Customer', category: 'team' },
  { path: '/team-portal/invoices', name: 'Team Invoices', category: 'team' },
  { path: '/team-portal/invoices/new', name: 'New Invoice', category: 'team' },
  { path: '/team-portal/invoices/1', name: 'Invoice Detail', category: 'team' },
  { path: '/team-portal/invoices/1/edit', name: 'Edit Invoice', category: 'team' },
  { path: '/team-portal/schedule', name: 'Team Schedule', category: 'team' },
  { path: '/team-portal/schedule/new', name: 'New Schedule', category: 'team' },
  { path: '/team-portal/reminders', name: 'Team Reminders', category: 'team' },
  { path: '/team-portal/reminders/new', name: 'New Reminder', category: 'team' },
  { path: '/team-portal/test-report', name: 'Team Test Report', category: 'team' },
  { path: '/team-portal/test-reports/1/submit-district', name: 'Submit District Report', category: 'team' },
  { path: '/team-portal/district-reports', name: 'District Reports', category: 'team' },
  { path: '/team-portal/billing/subscriptions', name: 'Billing Subscriptions', category: 'team' },
  { path: '/team-portal/data-management', name: 'Data Management', category: 'team' },
  { path: '/team-portal/backup', name: 'Team Backup', category: 'team' },
  { path: '/team-portal/export', name: 'Team Export', category: 'team' },
  { path: '/team-portal/import', name: 'Team Import', category: 'team' },
  { path: '/team-portal/labels', name: 'Team Labels', category: 'team' },
  { path: '/team-portal/instagram', name: 'Instagram Integration', category: 'team' },
  { path: '/team-portal/settings', name: 'Team Settings', category: 'team' },
  { path: '/team-portal/help', name: 'Team Help', category: 'team' },
  { path: '/team-portal/more', name: 'Team More Options', category: 'team' },
  { path: '/team-portal/tester', name: 'API Tester', category: 'team' },
  
  // Admin Pages (12)
  { path: '/admin', name: 'Admin Landing', category: 'admin' },
  { path: '/admin/dashboard', name: 'Admin Dashboard', category: 'admin' },
  { path: '/admin/analytics', name: 'Admin Analytics', category: 'admin' },
  { path: '/admin/health', name: 'System Health', category: 'admin' },
  { path: '/admin/search', name: 'Admin Search', category: 'admin' },
  { path: '/admin/unlock-accounts', name: 'Unlock Accounts', category: 'admin' },
  { path: '/admin/audit-logs', name: 'Audit Logs', category: 'admin' },
  { path: '/admin/reports', name: 'Admin Reports', category: 'admin' },
  { path: '/admin/feedback', name: 'Admin Feedback', category: 'admin' },
  { path: '/admin/data-management', name: 'Admin Data Management', category: 'admin' },
  { path: '/admin/route-optimizer', name: 'Route Optimizer', category: 'admin' },
  { path: '/admin/site-navigator', name: 'Site Navigator', category: 'admin' },
  
  // App Pages (2)
  { path: '/app', name: 'App Landing', category: 'app' },
  { path: '/app/dashboard', name: 'App Dashboard', category: 'app' },
  
  // Test Pages (1)
  { path: '/test/error-boundaries', name: 'Error Boundaries Test', category: 'test' }
];

// Known visibility issues patterns to check
const VISIBILITY_PATTERNS = [
  // White/light text on light backgrounds
  { pattern: /text-white.*bg-gray-[123]00/g, issue: 'White text on light gray background' },
  { pattern: /text-gray-[123]00.*bg-white/g, issue: 'Light gray text on white background' },
  { pattern: /text-gray-[234]00.*bg-gray-[12]00/g, issue: 'Light gray text on light gray background' },
  { pattern: /text-blue-[12]00.*bg-blue-50/g, issue: 'Light blue text on light blue background' },
  { pattern: /text-green-[12]00.*bg-green-50/g, issue: 'Light green text on light green background' },
  
  // Dark text on dark backgrounds
  { pattern: /text-gray-[789]00.*bg-gray-[89]00/g, issue: 'Dark gray text on dark gray background' },
  { pattern: /text-black.*bg-gray-[789]00/g, issue: 'Black text on dark gray background' },
  
  // Specific problematic combinations
  { pattern: /text-white.*bg-white/g, issue: 'White text on white background' },
  { pattern: /text-gray-400.*bg-gray-300/g, issue: 'Gray text on similar gray background' },
  
  // Button visibility issues
  { pattern: /bg-gray-[234]00.*text-white.*button/gi, issue: 'White text on light gray button' },
  { pattern: /bg-white.*text-white.*button/gi, issue: 'White text on white button' }
];

async function fetchPageContent(pageInfo) {
  try {
    const response = await fetch(`http://localhost:3010${pageInfo.path}`, {
      headers: {
        'User-Agent': 'Comprehensive-Page-Test/1.0',
        'Accept': 'text/html'
      }
    });
    
    if (!response.ok) {
      return {
        ...pageInfo,
        status: response.status,
        error: `HTTP ${response.status}`,
        html: null
      };
    }
    
    const html = await response.text();
    return {
      ...pageInfo,
      status: response.status,
      html: html,
      error: null
    };
  } catch (error) {
    return {
      ...pageInfo,
      status: 0,
      error: error.message,
      html: null
    };
  }
}

function analyzeVisibility(html) {
  const issues = [];
  
  for (const check of VISIBILITY_PATTERNS) {
    const matches = html.match(check.pattern);
    if (matches && matches.length > 0) {
      issues.push({
        issue: check.issue,
        occurrences: matches.length,
        samples: matches.slice(0, 2)
      });
    }
  }
  
  // Check for specific class combinations that cause issues
  if (html.includes('text-white') && html.includes('bg-gray-200')) {
    issues.push({ issue: 'Potential white text on light background', occurrences: 1 });
  }
  
  return issues;
}

function analyzeNavigation(html, pageInfo) {
  const issues = [];
  const foundLinks = [];
  
  // Extract all links
  const linkMatches = html.match(/<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*)</g) || [];
  const buttonMatches = html.match(/<button[^>]*>([^<]*)</g) || [];
  
  linkMatches.forEach(match => {
    const hrefMatch = match.match(/href=["']([^"']+)["']/);
    const textMatch = match.match(/>([^<]*)</);
    if (hrefMatch && textMatch) {
      foundLinks.push({
        href: hrefMatch[1],
        text: textMatch[1].trim()
      });
    }
  });
  
  // Check for buttons that should navigate
  buttonMatches.forEach(match => {
    const textMatch = match.match(/>([^<]*)</);
    if (textMatch) {
      const buttonText = textMatch[1].trim().toLowerCase();
      
      // Common navigation button texts
      const navButtonTexts = ['dashboard', 'back', 'home', 'login', 'register', 'submit', 'save', 'cancel', 'next', 'previous'];
      
      if (navButtonTexts.some(text => buttonText.includes(text))) {
        // Check if button has onClick or is in a form
        const hasOnClick = match.includes('onClick') || match.includes('onclick');
        const isSubmit = match.includes('type="submit"');
        
        if (!hasOnClick && !isSubmit) {
          issues.push({
            type: 'button',
            text: buttonText,
            problem: 'Navigation button without action'
          });
        }
      }
    }
  });
  
  // Check for expected navigation based on page type
  if (pageInfo.category === 'portal' && pageInfo.path !== '/portal') {
    if (!foundLinks.some(link => link.href.includes('/portal/dashboard'))) {
      issues.push({
        type: 'missing',
        expected: '/portal/dashboard',
        problem: 'Missing dashboard link'
      });
    }
  }
  
  if (pageInfo.category === 'team' && pageInfo.path !== '/team-portal' && pageInfo.path !== '/team-portal/login') {
    if (!foundLinks.some(link => link.href.includes('/team-portal/dashboard'))) {
      issues.push({
        type: 'missing',
        expected: '/team-portal/dashboard',
        problem: 'Missing team dashboard link'
      });
    }
  }
  
  if (pageInfo.category === 'admin' && pageInfo.path !== '/admin') {
    if (!foundLinks.some(link => link.href.includes('/admin/dashboard'))) {
      issues.push({
        type: 'missing',
        expected: '/admin/dashboard',
        problem: 'Missing admin dashboard link'
      });
    }
  }
  
  return { issues, foundLinks };
}

async function testAllPages() {
  console.log('🔍 Comprehensive Page Testing - Visibility & Navigation');
  console.log('========================================================\n');
  console.log(`📊 Testing ${ALL_PAGES.length} pages for:
  • Text visibility issues (contrast, color combinations)
  • Navigation functionality (buttons, links)
  • Page accessibility\n`);
  
  const results = {
    total: ALL_PAGES.length,
    accessible: 0,
    visibilityIssues: [],
    navigationIssues: [],
    errors: [],
    summary: {}
  };
  
  // Test each page
  for (let i = 0; i < ALL_PAGES.length; i++) {
    const page = ALL_PAGES[i];
    process.stdout.write(`[${i+1}/${ALL_PAGES.length}] Testing ${page.name}...`);
    
    const pageData = await fetchPageContent(page);
    
    if (pageData.error) {
      console.log(` ❌ Error: ${pageData.error}`);
      results.errors.push(pageData);
      continue;
    }
    
    results.accessible++;
    
    // Analyze visibility
    const visibilityIssues = analyzeVisibility(pageData.html);
    if (visibilityIssues.length > 0) {
      results.visibilityIssues.push({
        ...page,
        issues: visibilityIssues
      });
      process.stdout.write(` ⚠️ Visibility (${visibilityIssues.length})`);
    }
    
    // Analyze navigation
    const { issues: navIssues, foundLinks } = analyzeNavigation(pageData.html, page);
    if (navIssues.length > 0) {
      results.navigationIssues.push({
        ...page,
        issues: navIssues,
        linksFound: foundLinks.length
      });
      process.stdout.write(` ⚠️ Navigation (${navIssues.length})`);
    }
    
    if (visibilityIssues.length === 0 && navIssues.length === 0) {
      process.stdout.write(' ✅');
    }
    
    console.log('');
  }
  
  // Generate detailed report
  console.log('\n========================================================');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('========================================================\n');
  
  console.log(`Total Pages Tested: ${results.total}`);
  console.log(`Accessible Pages: ${results.accessible}`);
  console.log(`Pages with Visibility Issues: ${results.visibilityIssues.length}`);
  console.log(`Pages with Navigation Issues: ${results.navigationIssues.length}`);
  console.log(`Pages with Errors: ${results.errors.length}\n`);
  
  // Detailed visibility issues
  if (results.visibilityIssues.length > 0) {
    console.log('⚠️  VISIBILITY ISSUES BY PAGE:');
    console.log('--------------------------------');
    
    results.visibilityIssues.forEach(page => {
      console.log(`\n${page.name} (${page.path}):`);
      page.issues.forEach(issue => {
        console.log(`  • ${issue.issue} (${issue.occurrences} occurrences)`);
      });
    });
  }
  
  // Detailed navigation issues
  if (results.navigationIssues.length > 0) {
    console.log('\n⚠️  NAVIGATION ISSUES BY PAGE:');
    console.log('--------------------------------');
    
    results.navigationIssues.forEach(page => {
      console.log(`\n${page.name} (${page.path}):`);
      console.log(`  Found ${page.linksFound} links total`);
      page.issues.forEach(issue => {
        if (issue.type === 'button') {
          console.log(`  • Button "${issue.text}": ${issue.problem}`);
        } else if (issue.type === 'missing') {
          console.log(`  • Missing: ${issue.problem}`);
        }
      });
    });
  }
  
  // Category breakdown
  console.log('\n📈 ISSUES BY CATEGORY:');
  console.log('----------------------');
  
  const categories = ['main', 'portal', 'customer', 'field', 'team', 'admin', 'app', 'test'];
  categories.forEach(cat => {
    const catPages = ALL_PAGES.filter(p => p.category === cat);
    const catVis = results.visibilityIssues.filter(p => p.category === cat);
    const catNav = results.navigationIssues.filter(p => p.category === cat);
    
    console.log(`\n${cat.toUpperCase()} (${catPages.length} pages):`);
    console.log(`  Visibility issues: ${catVis.length}`);
    console.log(`  Navigation issues: ${catNav.length}`);
  });
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.total,
      accessible: results.accessible,
      visibilityIssues: results.visibilityIssues.length,
      navigationIssues: results.navigationIssues.length,
      errors: results.errors.length
    },
    visibilityIssues: results.visibilityIssues,
    navigationIssues: results.navigationIssues,
    errors: results.errors
  };
  
  fs.writeFileSync('page-test-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Detailed report saved to: page-test-report.json');
  
  if (results.visibilityIssues.length > 0 || results.navigationIssues.length > 0) {
    console.log('\n⚠️  Issues found! Ready to fix visibility and navigation problems.');
  } else {
    console.log('\n✅ All pages passed visibility and navigation tests!');
  }
  
  return report;
}

// Run the test
testAllPages().catch(console.error);