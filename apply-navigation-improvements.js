#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 APPLYING NAVIGATION IMPROVEMENTS SYSTEMATICALLY...\n');

// Pages that need navigation improvements
const navigationPages = [
  {
    path: 'src/app/team-portal/schedule/new/page.tsx',
    breadcrumb: [
      { label: 'Team Portal', href: '/team-portal/dashboard' },
      { label: 'Schedule', href: '/team-portal/schedule' },
      { label: 'New Appointment', href: '/team-portal/schedule/new', current: true }
    ],
    title: 'Schedule New Appointment',
    icon: 'Calendar'
  },
  {
    path: 'src/app/team-portal/customers/database/page.tsx',
    breadcrumb: [
      { label: 'Team Portal', href: '/team-portal/dashboard' },
      { label: 'Customers', href: '/team-portal/customers' },
      { label: 'Database', href: '/team-portal/customers/database', current: true }
    ],
    title: 'Customer Database',
    icon: 'Database'
  },
  {
    path: 'src/app/admin/unlock-accounts/page.tsx',
    breadcrumb: [
      { label: 'Admin Dashboard', href: '/admin/dashboard' },
      { label: 'Unlock Accounts', href: '/admin/unlock-accounts', current: true }
    ],
    title: 'Account Unlock Tool',
    icon: 'Shield'
  },
  {
    path: 'src/app/team-portal/export/page.tsx',
    breadcrumb: [
      { label: 'Team Portal', href: '/team-portal/dashboard' },
      { label: 'Data Export', href: '/team-portal/export', current: true }
    ],
    title: 'Export Data',
    icon: 'Download'
  },
  {
    path: 'src/app/team-portal/import/page.tsx',
    breadcrumb: [
      { label: 'Team Portal', href: '/team-portal/dashboard' },
      { label: 'Data Import', href: '/team-portal/import', current: true }
    ],
    title: 'Import Data',
    icon: 'Upload'
  }
];

// Function to update imports
function addImports(content) {
  const lines = content.split('\n');
  let importIndex = -1;
  
  // Find where to insert imports (after existing imports)
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('import') && !lines[i].includes('//')) {
      importIndex = i;
    }
    if (!lines[i].includes('import') && importIndex > -1 && lines[i].trim() !== '') {
      break;
    }
  }
  
  if (importIndex > -1) {
    // Check if SmartBackButton import already exists
    if (!content.includes('SmartBackButton')) {
      lines.splice(importIndex + 1, 0, "import { SmartBackButton } from '@/components/ui/SmartBreadcrumb';");
    }
    // Check if keyboard shortcuts import already exists  
    if (!content.includes('useKeyboardShortcuts')) {
      lines.splice(importIndex + 2, 0, "import { useKeyboardShortcuts, createFormShortcuts } from '@/hooks/useKeyboardShortcuts';");
    }
  }
  
  return lines.join('\n');
}

// Function to replace navigation pattern
function replaceNavigation(content, pageConfig) {
  // Pattern to replace: generic navigation bar with SmartBackButton
  const navPattern = /<!-- Navigation Bar -->\s*<div className="glass border-b border-blue-400 glow-blue-sm mb-6 sticky top-0 z-10">\s*<div className="max-w-7xl mx-auto px-6 py-4">\s*<Link href="[^"]*">\s*<Button[^>]*onClick[^>]*>\s*← Back[^<]*<\/Button>\s*<\/Link>\s*<\/div>\s*<\/div>/g;
  
  const smartNavigation = `{/* Smart Navigation */}
      <SmartBackButton 
        breadcrumb={${JSON.stringify(pageConfig.breadcrumb, null, 10).replace(/"([^"]+)":/g, '$1:')}}
      />`;

  return content.replace(navPattern, smartNavigation);
}

// Apply improvements to each page
navigationPages.forEach(pageConfig => {
  const fullPath = path.join(process.cwd(), pageConfig.path);
  
  if (fs.existsSync(fullPath)) {
    console.log(`📝 Updating: ${pageConfig.path}`);
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Add imports
    content = addImports(content);
    
    // Replace navigation
    content = replaceNavigation(content, pageConfig);
    
    // Write back
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Updated: ${pageConfig.title}`);
  } else {
    console.log(`❌ File not found: ${fullPath}`);
  }
});

console.log('\n🎯 Navigation improvements applied successfully!');
console.log('📋 Next: Apply to remaining pages manually for custom configurations');