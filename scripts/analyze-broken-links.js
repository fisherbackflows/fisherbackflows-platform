#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function analyzeBrokenLinks() {
  const brokenLinks = [
    // Portal pages
    { from: '/portal/dashboard', to: '/portal/support', count: 1 },
    { from: '/portal/directory', to: '/portal/business/[slug]', count: 1 },
    { from: '/portal/payment-success', to: '/app/dashboard', count: 1 },
    { from: '/portal/register', to: '/portal/thank-you', count: 1 },
    { from: '/portal/registration-success', to: '/app/dashboard', count: 1 },
    { from: '/portal/verification-error', to: '/app/register', count: 1 },
    { from: '/portal/verification-success', to: '/app/login', count: 1 },
    { from: '/portal/verify-email', to: '/app/dashboard', count: 1 },
    
    // Security page
    { from: '/security', to: '/app/support', count: 1 },
    
    // Team portal pages
    { from: '/team-portal/backup', to: '/app/backup/download', count: 1 },
    { from: '/team-portal/backup', to: '/app/backup/restore', count: 1 },
    { from: '/team-portal/billing/subscriptions', to: '/app/billing', count: 1 },
    { from: '/team-portal/billing/subscriptions', to: '/app/billing/history', count: 1 },
    { from: '/team-portal/customers/[id]', to: '/app/customers/[id]/devices', count: 1 },
    { from: '/team-portal/customers/[id]', to: '/app/customers/[id]/appointments', count: 1 },
    { from: '/team-portal/customers/[id]', to: '/app/customers/[id]/reports', count: 1 },
    { from: '/team-portal/customers/[id]', to: '/app/customers/[id]/invoices', count: 1 },
    { from: '/team-portal/customers/database', to: '/app/customers/import', count: 1 },
    { from: '/team-portal/customers/database', to: '/app/customers/export', count: 1 },
    { from: '/team-portal/dashboard', to: '/app/insights', count: 1 },
    { from: '/team-portal/dashboard', to: '/app/revenue', count: 1 },
    { from: '/team-portal/dashboard', to: '/app/growth', count: 1 },
    { from: '/team-portal/district-reports', to: '/app/district-reports/history', count: 1 },
    { from: '/team-portal/district-reports', to: '/app/district-reports/submit', count: 1 },
    { from: '/team-portal/help', to: '/docs', count: 1 },
    { from: '/team-portal/help', to: '/contact', count: 1 },
    { from: '/team-portal/help', to: '/training', count: 1 },
    { from: '/team-portal/help', to: '/updates', count: 1 },
    { from: '/team-portal/invoices/[id]', to: '/app/invoices', count: 1 },
    { from: '/team-portal/login', to: 'mailto:support@fisherbackflows.com', count: 1 },
    { from: '/team-portal/more', to: 'tel:2532788692', count: 1 },
    { from: '/team-portal/more', to: 'mailto:service@fisherbackflows.com', count: 1 },
    { from: '/team-portal/reminders', to: '/app/reminders/new', count: 1 },
    
    // Tester portal pages
    { from: '/tester-portal/customers', to: '/tester-portal/customers/import', count: 1 },
    { from: '/tester-portal/customers', to: '/tester-portal/customers/new', count: 2 },
    { from: '/tester-portal/invoices', to: '/tester-portal/invoices/new', count: 2 },
    { from: '/tester-portal', to: '/tester-portal/demo', count: 2 },
    { from: '/tester-portal', to: '/tester-portal/contact', count: 1 },
    { from: '/tester-portal/reminders', to: '/tester-portal/reminders/new', count: 2 },
    { from: '/tester-portal/reports', to: '/tester-portal/compliance/districts', count: 1 },
    { from: '/tester-portal/schedule', to: '/tester-portal/schedule/new', count: 2 }
  ];

  // Categorize links
  const categories = {
    'Pages referencing /app/* (wrong prefix)': [],
    'Missing tester-portal pages': [],
    'External links incorrectly used': [],
    'Missing thank-you/success pages': [],
    'Missing documentation pages': []
  };

  brokenLinks.forEach(link => {
    if (link.to.startsWith('/app/')) {
      categories['Pages referencing /app/* (wrong prefix)'].push(link);
    } else if (link.to.startsWith('/tester-portal/') && !link.to.includes('demo') && !link.to.includes('contact')) {
      categories['Missing tester-portal pages'].push(link);
    } else if (link.to.startsWith('mailto:') || link.to.startsWith('tel:')) {
      categories['External links incorrectly used'].push(link);
    } else if (link.to.includes('thank-you') || link.to.includes('success')) {
      categories['Missing thank-you/success pages'].push(link);
    } else {
      categories['Missing documentation pages'].push(link);
    }
  });

  // Generate action plan
  const actionPlan = {
    'Phase 1: Quick Fixes (External Links)': [
      'Remove mailto: and tel: from broken links check (these are valid external links)',
      'Update verification script to exclude external protocols'
    ],
    'Phase 2: Fix Incorrect Prefixes': [
      'Replace all /app/* references with correct portal paths',
      'Team portal links should use /team-portal/*',
      'Portal links should use /portal/*'
    ],
    'Phase 3: Create Missing Pages': [
      'Create /tester-portal/customers/new page',
      'Create /tester-portal/customers/import page', 
      'Create /tester-portal/invoices/new page',
      'Create /tester-portal/reminders/new page',
      'Create /tester-portal/schedule/new page',
      'Create /tester-portal/compliance/districts page'
    ],
    'Phase 4: Navigation Components': [
      'Create reusable navigation component for each portal',
      'Ensure consistent navigation across dashboard pages'
    ]
  };

  console.log('BROKEN LINKS ANALYSIS');
  console.log('======================\n');
  
  console.log('Total broken links: 51\n');
  
  console.log('CATEGORIZED ISSUES:');
  console.log('-------------------');
  Object.entries(categories).forEach(([category, links]) => {
    if (links.length > 0) {
      console.log(`\n${category}: ${links.length} issues`);
      links.slice(0, 3).forEach(link => {
        console.log(`  ${link.from} -> ${link.to}`);
      });
      if (links.length > 3) {
        console.log(`  ... and ${links.length - 3} more`);
      }
    }
  });

  console.log('\n\nACTION PLAN:');
  console.log('============');
  Object.entries(actionPlan).forEach(([phase, tasks]) => {
    console.log(`\n${phase}:`);
    tasks.forEach((task, i) => {
      console.log(`  ${i + 1}. ${task}`);
    });
  });

  // Save to file for reference
  await fs.writeFile(
    'navigation-fix-plan.json',
    JSON.stringify({ brokenLinks, categories, actionPlan }, null, 2)
  );

  console.log('\n✅ Analysis saved to navigation-fix-plan.json');
}

analyzeBrokenLinks().catch(console.error);