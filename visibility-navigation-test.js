#!/usr/bin/env node

/**
 * Comprehensive Visibility and Navigation Testing
 * Tests all 69 pages for text visibility and button navigation
 */

const puppeteer = require('puppeteer');

const pages = [
  // Main Pages
  { path: '/', name: 'Home/Landing Page', expectedLinks: ['/portal', '/team-portal', '/field', '/admin'] },
  { path: '/login', name: 'Login Page', expectedLinks: ['/portal', '/team-portal'] },
  { path: '/maintenance', name: 'Maintenance Page', expectedLinks: ['/'] },
  { path: '/test-navigation', name: 'Test Navigation', expectedLinks: [] },
  
  // Customer Portal (14 pages)
  { path: '/portal', name: 'Portal Login', expectedLinks: ['/portal/register', '/portal/forgot-password'] },
  { path: '/portal/dashboard', name: 'Portal Dashboard', expectedLinks: ['/portal/billing', '/portal/devices', '/portal/reports', '/portal/schedule'] },
  { path: '/portal/billing', name: 'Portal Billing', expectedLinks: ['/portal/pay', '/portal/dashboard'] },
  { path: '/portal/devices', name: 'Portal Devices', expectedLinks: ['/portal/dashboard'] },
  { path: '/portal/reports', name: 'Portal Reports', expectedLinks: ['/portal/dashboard'] },
  { path: '/portal/schedule', name: 'Portal Schedule', expectedLinks: ['/portal/dashboard'] },
  { path: '/portal/pay', name: 'Portal Payment', expectedLinks: ['/portal/dashboard'] },
  { path: '/portal/register', name: 'Portal Registration', expectedLinks: ['/portal'] },
  { path: '/portal/forgot-password', name: 'Portal Forgot Password', expectedLinks: ['/portal'] },
  { path: '/portal/reset-password', name: 'Portal Reset Password', expectedLinks: ['/portal'] },
  { path: '/portal/payment-success', name: 'Payment Success', expectedLinks: ['/portal/dashboard'] },
  { path: '/portal/payment-cancelled', name: 'Payment Cancelled', expectedLinks: ['/portal/dashboard'] },
  { path: '/portal/verification-success', name: 'Verification Success', expectedLinks: ['/portal'] },
  { path: '/portal/verification-error', name: 'Verification Error', expectedLinks: ['/portal'] },
  
  // Customer Pages (2 pages)
  { path: '/customer', name: 'Customer Landing', expectedLinks: ['/customer/feedback'] },
  { path: '/customer/feedback', name: 'Customer Feedback', expectedLinks: [] },
  
  // Field Tech Pages (4 pages)
  { path: '/field', name: 'Field Landing', expectedLinks: ['/field/login'] },
  { path: '/field/login', name: 'Field Login', expectedLinks: ['/field/dashboard'] },
  { path: '/field/dashboard', name: 'Field Dashboard', expectedLinks: [] },
  { path: '/field/test/123', name: 'Field Test Report', expectedLinks: ['/field/dashboard'] },
  
  // Team Portal (30 pages)
  { path: '/team-portal', name: 'Team Portal Landing', expectedLinks: ['/team-portal/login'] },
  { path: '/team-portal/login', name: 'Team Portal Login', expectedLinks: [] },
  { path: '/team-portal/dashboard', name: 'Team Dashboard', expectedLinks: ['/team-portal/customers', '/team-portal/invoices', '/team-portal/schedule'] },
  { path: '/team-portal/customers', name: 'Team Customers', expectedLinks: ['/team-portal/customers/new', '/team-portal/dashboard'] },
  { path: '/team-portal/customers/new', name: 'New Customer', expectedLinks: ['/team-portal/customers'] },
  { path: '/team-portal/customers/database', name: 'Customer Database', expectedLinks: ['/team-portal/customers'] },
  { path: '/team-portal/customers/1', name: 'Customer Detail', expectedLinks: ['/team-portal/customers/1/edit', '/team-portal/customers'] },
  { path: '/team-portal/customers/1/edit', name: 'Edit Customer', expectedLinks: ['/team-portal/customers/1', '/team-portal/customers'] },
  { path: '/team-portal/invoices', name: 'Team Invoices', expectedLinks: ['/team-portal/invoices/new', '/team-portal/dashboard'] },
  { path: '/team-portal/invoices/new', name: 'New Invoice', expectedLinks: ['/team-portal/invoices'] },
  { path: '/team-portal/invoices/1', name: 'Invoice Detail', expectedLinks: ['/team-portal/invoices/1/edit', '/team-portal/invoices'] },
  { path: '/team-portal/invoices/1/edit', name: 'Edit Invoice', expectedLinks: ['/team-portal/invoices/1', '/team-portal/invoices'] },
  { path: '/team-portal/schedule', name: 'Team Schedule', expectedLinks: ['/team-portal/schedule/new', '/team-portal/dashboard'] },
  { path: '/team-portal/schedule/new', name: 'New Schedule', expectedLinks: ['/team-portal/schedule'] },
  { path: '/team-portal/reminders', name: 'Team Reminders', expectedLinks: ['/team-portal/reminders/new'] },
  { path: '/team-portal/reminders/new', name: 'New Reminder', expectedLinks: ['/team-portal/reminders'] },
  { path: '/team-portal/test-report', name: 'Team Test Report', expectedLinks: ['/team-portal/dashboard'] },
  { path: '/team-portal/test-reports/1/submit-district', name: 'Submit District Report', expectedLinks: ['/team-portal/district-reports'] },
  { path: '/team-portal/district-reports', name: 'District Reports', expectedLinks: ['/team-portal/dashboard'] },
  { path: '/team-portal/billing/subscriptions', name: 'Billing Subscriptions', expectedLinks: ['/team-portal/dashboard'] },
  { path: '/team-portal/data-management', name: 'Data Management', expectedLinks: ['/team-portal/dashboard'] },
  { path: '/team-portal/backup', name: 'Team Backup', expectedLinks: ['/team-portal/dashboard'] },
  { path: '/team-portal/export', name: 'Team Export', expectedLinks: ['/team-portal/dashboard'] },
  { path: '/team-portal/import', name: 'Team Import', expectedLinks: ['/team-portal/dashboard'] },
  { path: '/team-portal/labels', name: 'Team Labels', expectedLinks: ['/team-portal/dashboard'] },
  { path: '/team-portal/instagram', name: 'Instagram Integration', expectedLinks: ['/team-portal/dashboard'] },
  { path: '/team-portal/settings', name: 'Team Settings', expectedLinks: ['/team-portal/dashboard'] },
  { path: '/team-portal/help', name: 'Team Help', expectedLinks: ['/team-portal/dashboard'] },
  { path: '/team-portal/more', name: 'Team More Options', expectedLinks: ['/team-portal/dashboard'] },
  { path: '/team-portal/tester', name: 'API Tester', expectedLinks: ['/team-portal/dashboard'] },
  
  // Admin Pages (12 pages)
  { path: '/admin', name: 'Admin Landing', expectedLinks: ['/admin/dashboard'] },
  { path: '/admin/dashboard', name: 'Admin Dashboard', expectedLinks: ['/admin/analytics', '/admin/health', '/admin/search'] },
  { path: '/admin/analytics', name: 'Admin Analytics', expectedLinks: ['/admin/dashboard'] },
  { path: '/admin/health', name: 'System Health', expectedLinks: ['/admin/dashboard'] },
  { path: '/admin/search', name: 'Admin Search', expectedLinks: ['/admin/dashboard'] },
  { path: '/admin/unlock-accounts', name: 'Unlock Accounts', expectedLinks: ['/admin/dashboard'] },
  { path: '/admin/audit-logs', name: 'Audit Logs', expectedLinks: ['/admin/dashboard'] },
  { path: '/admin/reports', name: 'Admin Reports', expectedLinks: ['/admin/dashboard'] },
  { path: '/admin/feedback', name: 'Admin Feedback', expectedLinks: ['/admin/dashboard'] },
  { path: '/admin/data-management', name: 'Admin Data Management', expectedLinks: ['/admin/dashboard'] },
  { path: '/admin/route-optimizer', name: 'Route Optimizer', expectedLinks: ['/admin/dashboard'] },
  { path: '/admin/site-navigator', name: 'Site Navigator', expectedLinks: ['/admin/dashboard'] },
  
  // App Pages (2 pages)
  { path: '/app', name: 'App Landing', expectedLinks: ['/app/dashboard'] },
  { path: '/app/dashboard', name: 'App Dashboard', expectedLinks: [] },
  
  // Test Pages (1 page)
  { path: '/test/error-boundaries', name: 'Error Boundaries Test', expectedLinks: [] }
];

async function testWithPuppeteer() {
  console.log('🔍 Starting Comprehensive Visibility & Navigation Test...\n');
  console.log('📊 Testing ' + pages.length + ' pages\n');
  console.log('================================\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const issues = {
    visibility: [],
    navigation: [],
    errors: []
  };
  
  for (const pageInfo of pages) {
    console.log(`\nTesting: ${pageInfo.name} (${pageInfo.path})`);
    console.log('-----------------------------------');
    
    const page = await browser.newPage();
    
    try {
      await page.goto(`http://localhost:3010${pageInfo.path}`, {
        waitUntil: 'networkidle2',
        timeout: 10000
      });
      
      // Test 1: Check for visibility issues
      const visibilityIssues = await page.evaluate(() => {
        const issues = [];
        
        // Get all text elements
        const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, a, button, label, td, th, li');
        
        textElements.forEach(el => {
          const styles = window.getComputedStyle(el);
          const bgColor = styles.backgroundColor;
          const textColor = styles.color;
          
          // Parse colors
          const parseColor = (color) => {
            const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (match) {
              return {
                r: parseInt(match[1]),
                g: parseInt(match[2]),
                b: parseInt(match[3])
              };
            }
            return null;
          };
          
          const bg = parseColor(bgColor) || { r: 255, g: 255, b: 255 };
          const text = parseColor(textColor);
          
          if (text) {
            // Calculate contrast ratio
            const getLuminance = (color) => {
              const rgb = [color.r, color.g, color.b].map(val => {
                val = val / 255;
                return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
              });
              return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
            };
            
            const l1 = getLuminance(text);
            const l2 = getLuminance(bg);
            const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
            
            // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
            const isLargeText = parseInt(styles.fontSize) >= 18;
            const minContrast = isLargeText ? 3 : 4.5;
            
            if (contrast < minContrast && el.textContent.trim()) {
              issues.push({
                text: el.textContent.trim().substring(0, 50),
                element: el.tagName.toLowerCase(),
                contrast: contrast.toFixed(2),
                textColor: textColor,
                bgColor: bgColor
              });
            }
          }
        });
        
        return issues;
      });
      
      if (visibilityIssues.length > 0) {
        console.log(`  ⚠️  Found ${visibilityIssues.length} visibility issues`);
        issues.visibility.push({
          page: pageInfo.name,
          path: pageInfo.path,
          issues: visibilityIssues
        });
      } else {
        console.log('  ✅ Text visibility OK');
      }
      
      // Test 2: Check navigation links
      const links = await page.evaluate(() => {
        const allLinks = [];
        
        // Get all clickable elements
        document.querySelectorAll('a, button').forEach(el => {
          const href = el.getAttribute('href') || el.onclick?.toString() || '';
          const text = el.textContent.trim();
          
          if (text && (href || el.onclick)) {
            allLinks.push({
              text: text,
              href: href,
              type: el.tagName.toLowerCase()
            });
          }
        });
        
        return allLinks;
      });
      
      // Check if expected links are present
      const missingLinks = [];
      for (const expectedLink of pageInfo.expectedLinks) {
        const found = links.some(link => 
          link.href.includes(expectedLink) || 
          link.text.toLowerCase().includes(expectedLink.replace(/[/-]/g, ' ').toLowerCase())
        );
        
        if (!found) {
          missingLinks.push(expectedLink);
        }
      }
      
      if (missingLinks.length > 0) {
        console.log(`  ⚠️  Missing ${missingLinks.length} expected navigation links`);
        issues.navigation.push({
          page: pageInfo.name,
          path: pageInfo.path,
          missing: missingLinks,
          found: links
        });
      } else {
        console.log(`  ✅ Navigation links OK (${links.length} links found)`);
      }
      
      // Test 3: Check for broken buttons
      const brokenButtons = await page.evaluate(() => {
        const broken = [];
        
        document.querySelectorAll('button').forEach(button => {
          const text = button.textContent.trim();
          const hasOnClick = button.onclick !== null;
          const hasFormAction = button.form !== null;
          const isDisabled = button.disabled;
          
          if (text && !hasOnClick && !hasFormAction && !isDisabled) {
            broken.push({
              text: text,
              id: button.id,
              className: button.className
            });
          }
        });
        
        return broken;
      });
      
      if (brokenButtons.length > 0) {
        console.log(`  ⚠️  Found ${brokenButtons.length} buttons without actions`);
        issues.navigation.push({
          page: pageInfo.name,
          path: pageInfo.path,
          brokenButtons: brokenButtons
        });
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      issues.errors.push({
        page: pageInfo.name,
        path: pageInfo.path,
        error: error.message
      });
    }
    
    await page.close();
  }
  
  await browser.close();
  
  // Generate detailed report
  console.log('\\n\\n================================');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('================================\\n');
  
  console.log(`Total Pages Tested: ${pages.length}`);
  console.log(`Visibility Issues: ${issues.visibility.length} pages affected`);
  console.log(`Navigation Issues: ${issues.navigation.length} pages affected`);
  console.log(`Errors: ${issues.errors.length} pages\\n`);
  
  if (issues.visibility.length > 0) {
    console.log('\\n⚠️  VISIBILITY ISSUES DETAIL:');
    console.log('--------------------------------');
    for (const issue of issues.visibility) {
      console.log(`\\n${issue.page} (${issue.path}):`);
      for (const vi of issue.issues.slice(0, 3)) {
        console.log(`  • "${vi.text}" - Contrast: ${vi.contrast} (min: 4.5)`);
        console.log(`    Text: ${vi.textColor}, BG: ${vi.bgColor}`);
      }
      if (issue.issues.length > 3) {
        console.log(`  ... and ${issue.issues.length - 3} more issues`);
      }
    }
  }
  
  if (issues.navigation.length > 0) {
    console.log('\\n⚠️  NAVIGATION ISSUES DETAIL:');
    console.log('--------------------------------');
    for (const issue of issues.navigation) {
      console.log(`\\n${issue.page} (${issue.path}):`);
      if (issue.missing) {
        console.log(`  Missing links: ${issue.missing.join(', ')}`);
      }
      if (issue.brokenButtons) {
        console.log(`  Broken buttons: ${issue.brokenButtons.map(b => b.text).join(', ')}`);
      }
    }
  }
  
  if (issues.errors.length > 0) {
    console.log('\\n❌ PAGE ERRORS:');
    console.log('--------------------------------');
    for (const error of issues.errors) {
      console.log(`${error.page}: ${error.error}`);
    }
  }
  
  const totalIssues = issues.visibility.length + issues.navigation.length + issues.errors.length;
  
  if (totalIssues === 0) {
    console.log('\\n✅ ALL TESTS PASSED! No visibility or navigation issues found.');
  } else {
    console.log(`\\n⚠️  Found ${totalIssues} total issues that need fixing.`);
  }
  
  // Save detailed report
  const fs = require('fs');
  fs.writeFileSync('visibility-navigation-report.json', JSON.stringify(issues, null, 2));
  console.log('\\n📄 Detailed report saved to: visibility-navigation-report.json');
}

// Fallback test without Puppeteer
async function testWithFetch() {
  console.log('🔍 Starting Basic Visibility & Navigation Test (without Puppeteer)...\n');
  console.log('📊 Testing ' + pages.length + ' pages\n');
  console.log('================================\n');
  
  const results = [];
  
  for (const pageInfo of pages) {
    process.stdout.write(`Testing ${pageInfo.name}...`);
    
    try {
      const response = await fetch(`http://localhost:3010${pageInfo.path}`);
      const html = await response.text();
      
      // Basic checks
      const hasButtons = html.includes('<button') || html.includes('Button');
      const hasLinks = html.includes('<a ') || html.includes('Link');
      const hasText = html.includes('<p>') || html.includes('<span>') || html.includes('<h1') || html.includes('<h2');
      
      // Check for common visibility issues in the code
      const potentialIssues = [];
      
      // Check for white/light text on light backgrounds
      if (html.includes('text-white') && html.includes('bg-gray-100')) {
        potentialIssues.push('White text on light gray background');
      }
      if (html.includes('text-gray-200') && html.includes('bg-white')) {
        potentialIssues.push('Light gray text on white background');
      }
      if (html.includes('text-gray-300') && html.includes('bg-gray-100')) {
        potentialIssues.push('Light gray text on light background');
      }
      
      // Check for navigation structure
      const hasNavigation = pageInfo.expectedLinks.every(link => 
        html.includes(link) || html.includes(link.replace(/[/-]/g, ' '))
      );
      
      results.push({
        page: pageInfo.name,
        path: pageInfo.path,
        status: response.status,
        hasButtons,
        hasLinks,
        hasText,
        hasNavigation,
        potentialIssues
      });
      
      if (potentialIssues.length > 0) {
        console.log(` ⚠️  (${potentialIssues.length} potential issues)`);
      } else if (!hasNavigation) {
        console.log(' ⚠️  (missing navigation)');
      } else {
        console.log(' ✅');
      }
      
    } catch (error) {
      console.log(` ❌ (${error.message})`);
      results.push({
        page: pageInfo.name,
        path: pageInfo.path,
        error: error.message
      });
    }
  }
  
  // Summary
  console.log('\\n================================');
  console.log('📊 BASIC TEST SUMMARY');
  console.log('================================\\n');
  
  const issuePages = results.filter(r => r.potentialIssues?.length > 0);
  const navIssues = results.filter(r => r.hasNavigation === false);
  
  console.log(`Total Pages: ${pages.length}`);
  console.log(`Potential Visibility Issues: ${issuePages.length} pages`);
  console.log(`Navigation Issues: ${navIssues.length} pages\\n`);
  
  if (issuePages.length > 0) {
    console.log('Pages with potential visibility issues:');
    issuePages.forEach(p => {
      console.log(`  • ${p.page}: ${p.potentialIssues.join(', ')}`);
    });
  }
  
  if (navIssues.length > 0) {
    console.log('\\nPages with navigation issues:');
    navIssues.forEach(p => {
      console.log(`  • ${p.page}`);
    });
  }
  
  console.log('\\n⚠️  Note: This is a basic test. Installing Puppeteer would provide more comprehensive testing.');
}

// Check if puppeteer is available
try {
  require.resolve('puppeteer');
  testWithPuppeteer().catch(console.error);
} catch(e) {
  console.log('⚠️  Puppeteer not installed. Running basic tests...');
  console.log('   To install: npm install puppeteer\\n');
  testWithFetch().catch(console.error);
}