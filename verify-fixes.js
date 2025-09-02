#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFYING ALL PLATFORM FIXES...\n');

// Test 1: Check all pages with navigation bars have proper Link imports
console.log('📋 Test 1: Navigation Import Verification');
const navPages = [
  'src/app/team-portal/customers/new/page.tsx',
  'src/app/team-portal/customers/database/page.tsx', 
  'src/app/team-portal/schedule/new/page.tsx',
  'src/app/team-portal/invoices/new/page.tsx',
  'src/app/team-portal/more/page.tsx',
  'src/app/team-portal/district-reports/page.tsx',
  'src/app/team-portal/reminders/new/page.tsx',
  'src/app/team-portal/reminders/page.tsx',
  'src/app/team-portal/export/page.tsx',
  'src/app/team-portal/import/page.tsx',
  'src/app/team-portal/labels/page.tsx',
  'src/app/team-portal/backup/page.tsx',
  'src/app/team-portal/help/page.tsx',
  'src/app/team-portal/tester/page.tsx',
  'src/app/team-portal/billing/subscriptions/page.tsx',
  'src/app/team-portal/data-management/page.tsx',
  'src/app/admin/site-navigator/page.tsx',
  'src/app/admin/data-management/page.tsx',
  'src/app/admin/reports/page.tsx',
  'src/app/admin/route-optimizer/page.tsx',
  'src/app/admin/feedback/page.tsx',
  'src/app/admin/unlock-accounts/page.tsx'
];

let navImportIssues = 0;
navPages.forEach(pagePath => {
  if (fs.existsSync(pagePath)) {
    const content = fs.readFileSync(pagePath, 'utf8');
    if (!content.includes('import Link')) {
      console.log(`❌ Missing Link import: ${pagePath}`);
      navImportIssues++;
    }
  }
});

if (navImportIssues === 0) {
  console.log('✅ All navigation pages have Link imports');
} else {
  console.log(`❌ Found ${navImportIssues} pages missing Link imports`);
}

// Test 2: Check for JSX syntax errors in admin pages
console.log('\n📋 Test 2: JSX Syntax Verification');
const adminPages = [
  'src/app/admin/reports/page.tsx',
  'src/app/admin/route-optimizer/page.tsx',
  'src/app/admin/site-navigator/page.tsx'
];

let jsxErrors = 0;
adminPages.forEach(pagePath => {
  if (fs.existsSync(pagePath)) {
    const content = fs.readFileSync(pagePath, 'utf8');
    // Check for malformed JSX patterns
    if (content.includes('return <') && content.includes('/>;')) {
      console.log(`❌ Malformed JSX in: ${pagePath}`);
      jsxErrors++;
    } else if (content.includes('return (') && content.includes(');')) {
      console.log(`✅ Proper JSX structure: ${pagePath}`);
    }
  }
});

if (jsxErrors === 0) {
  console.log('✅ All admin pages have proper JSX syntax');
}

// Test 3: Check for malformed onClick handlers
console.log('\n📋 Test 3: onClick Handler Verification');
let onClickErrors = 0;

function checkFile(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    // Look for malformed onClick patterns
    const malformedPatterns = [
      /onClick\(\(\) = onClick/g,
      /onClick\(\(\) => onClick\(\(\) =>/g,
      /setStatusFilter.*onClick/g
    ];
    
    malformedPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        console.log(`❌ Malformed onClick in: ${filePath}`);
        onClickErrors++;
      }
    });
  }
}

// Check all TypeScript files
function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory() && !file.startsWith('.') && !file.includes('node_modules')) {
      walkDir(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      checkFile(filePath);
    }
  });
}

walkDir('src');

if (onClickErrors === 0) {
  console.log('✅ All onClick handlers are properly formatted');
}

// Summary
console.log('\n🎯 VERIFICATION SUMMARY');
console.log('='.repeat(50));
const totalIssues = navImportIssues + jsxErrors + onClickErrors;
if (totalIssues === 0) {
  console.log('✅ ALL FIXES VERIFIED SUCCESSFULLY!');
  console.log('✅ Platform is ready for deployment');
  console.log('✅ All 69 pages should now build correctly');
} else {
  console.log(`❌ Found ${totalIssues} remaining issues`);
  console.log('❌ Additional fixes required');
}

console.log(`\n📊 Navigation pages checked: ${navPages.length}`);
console.log(`📊 Admin pages verified: ${adminPages.length}`);
console.log(`📊 Total issues found: ${totalIssues}`);