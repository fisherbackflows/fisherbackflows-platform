#!/usr/bin/env node

/**
 * Fix Visibility and Navigation Issues
 * Fixes text visibility and navigation problems across all pages
 */

const fs = require('fs');
const path = require('path');

// Pages with visibility issues found in testing
const VISIBILITY_FIXES = [
  // Portal pages with white-on-white issues
  {
    files: [
      'src/app/portal/page.tsx',
      'src/app/portal/pay/page.tsx', 
      'src/app/portal/payment-success/page.tsx',
      'src/app/portal/payment-cancelled/page.tsx',
      'src/app/portal/verification-error/page.tsx'
    ],
    fixes: [
      { 
        find: /text-white.*bg-white|bg-white.*text-white/g,
        replace: 'bg-blue-600 text-white' 
      },
      {
        find: /bg-white border border-slate-200/g,
        replace: 'glass border border-blue-400 glow-blue-sm'
      },
      {
        find: /text-slate-900/g,
        replace: 'text-white'
      },
      {
        find: /text-slate-800/g,
        replace: 'text-blue-200'
      },
      {
        find: /text-slate-700/g,
        replace: 'text-blue-300'
      },
      {
        find: /bg-slate-200/g,
        replace: 'bg-blue-900/30'
      },
      {
        find: /bg-slate-300/g,
        replace: 'bg-blue-800/50'
      },
      {
        find: /border-slate-300/g,
        replace: 'border-blue-400'
      },
      {
        find: /placeholder-slate-700/g,
        replace: 'placeholder-blue-400'
      },
      {
        find: /bg-white\"/g,
        replace: 'bg-blue-950/50"'
      }
    ]
  },
  // Customer pages
  {
    files: [
      'src/app/customer/page.tsx',
      'src/app/customer/feedback/page.tsx'
    ],
    fixes: [
      { 
        find: /text-white.*bg-white|bg-white.*text-white/g,
        replace: 'bg-blue-600 text-white' 
      },
      {
        find: /bg-white border/g,
        replace: 'glass border'
      },
      {
        find: /text-slate-900/g,
        replace: 'text-white'
      }
    ]
  },
  // Admin pages
  {
    files: [
      'src/app/admin/health/page.tsx',
      'src/app/admin/search/page.tsx',
      'src/app/admin/audit-logs/page.tsx',
      'src/app/admin/data-management/page.tsx',
      'src/app/admin/site-navigator/page.tsx'
    ],
    fixes: [
      {
        find: /text-gray-900/g,
        replace: 'text-white'
      },
      {
        find: /text-gray-800/g,
        replace: 'text-gray-200'
      },
      {
        find: /text-gray-700/g,
        replace: 'text-gray-300'
      },
      {
        find: /bg-white border/g,
        replace: 'glass border'
      }
    ]
  }
];

// Navigation fixes for missing dashboard links
const NAVIGATION_FIXES = [
  // Portal pages - add dashboard navigation
  {
    files: [
      'src/app/portal/dashboard/page.tsx',
      'src/app/portal/billing/page.tsx',
      'src/app/portal/devices/page.tsx',
      'src/app/portal/reports/page.tsx',
      'src/app/portal/schedule/page.tsx'
    ],
    addNavigation: true,
    navigationCode: `
      {/* Navigation Header */}
      <header className="glass border-b border-blue-400 glow-blue-sm mb-6">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/portal/dashboard">
              <Button variant="ghost" className="text-blue-300 hover:text-white">
                ← Back to Dashboard
              </Button>
            </Link>
            <nav className="flex space-x-4">
              <Link href="/portal/billing">
                <Button variant="ghost" className="text-blue-300 hover:text-white">Billing</Button>
              </Link>
              <Link href="/portal/devices">
                <Button variant="ghost" className="text-blue-300 hover:text-white">Devices</Button>
              </Link>
              <Link href="/portal/reports">
                <Button variant="ghost" className="text-blue-300 hover:text-white">Reports</Button>
              </Link>
              <Link href="/portal/schedule">
                <Button variant="ghost" className="text-blue-300 hover:text-white">Schedule</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>`
  },
  // Team portal pages - add dashboard navigation
  {
    files: [
      'src/app/team-portal/customers/page.tsx',
      'src/app/team-portal/invoices/page.tsx',
      'src/app/team-portal/schedule/page.tsx',
      'src/app/team-portal/settings/page.tsx'
    ],
    addNavigation: true,
    navigationCode: `
      {/* Navigation Header */}
      <header className="glass border-b border-blue-400 glow-blue-sm mb-6">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/team-portal/dashboard">
              <Button variant="ghost" className="text-blue-300 hover:text-white">
                ← Team Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>`
  },
  // Admin pages - add dashboard navigation
  {
    files: [
      'src/app/admin/analytics/page.tsx',
      'src/app/admin/health/page.tsx',
      'src/app/admin/search/page.tsx',
      'src/app/admin/audit-logs/page.tsx'
    ],
    addNavigation: true,
    navigationCode: `
      {/* Navigation Header */}
      <header className="glass border-b border-blue-400 glow-blue-sm mb-6">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="text-blue-300 hover:text-white">
              ← Admin Dashboard
            </Button>
          </Link>
        </div>
      </header>`
  }
];

// Fix button actions
const BUTTON_ACTION_FIXES = [
  {
    find: /<Button([^>]*?)>([^<]*Home[^<]*)<\/Button>/gi,
    replace: '<Link href="/"><Button$1>$2</Button></Link>'
  },
  {
    find: /<Button([^>]*?)>([^<]*Dashboard[^<]*)<\/Button>/gi,
    replace: '<Link href="./dashboard"><Button$1>$2</Button></Link>'
  },
  {
    find: /<Button([^>]*?)>([^<]*Cancel[^<]*)<\/Button>/gi,
    replace: '<Button$1 onClick={() => window.history.back()}>$2</Button>'
  },
  {
    find: /<Button([^>]*?)>([^<]*Back[^<]*)<\/Button>/gi,
    replace: '<Button$1 onClick={() => window.history.back()}>$2</Button>'
  }
];

async function applyFixes() {
  console.log('🔧 Applying Visibility and Navigation Fixes...\n');
  
  let fixedFiles = 0;
  let totalFixes = 0;
  
  // Apply visibility fixes
  console.log('📝 Fixing visibility issues...');
  for (const group of VISIBILITY_FIXES) {
    for (const file of group.files) {
      const filePath = path.join(process.cwd(), file);
      
      if (!fs.existsSync(filePath)) {
        console.log(`  ⚠️  File not found: ${file}`);
        continue;
      }
      
      let content = fs.readFileSync(filePath, 'utf8');
      let changesMade = false;
      
      for (const fix of group.fixes) {
        const matches = content.match(fix.find);
        if (matches) {
          content = content.replace(fix.find, fix.replace);
          changesMade = true;
          totalFixes += matches.length;
        }
      }
      
      if (changesMade) {
        fs.writeFileSync(filePath, content);
        fixedFiles++;
        console.log(`  ✅ Fixed: ${file}`);
      }
    }
  }
  
  // Apply navigation fixes
  console.log('\n🔗 Fixing navigation issues...');
  for (const group of NAVIGATION_FIXES) {
    for (const file of group.files) {
      const filePath = path.join(process.cwd(), file);
      
      if (!fs.existsSync(filePath)) {
        console.log(`  ⚠️  File not found: ${file}`);
        continue;
      }
      
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Check if navigation already exists
      if (!content.includes('Back to Dashboard') && !content.includes('Team Dashboard') && !content.includes('Admin Dashboard')) {
        // Add imports if needed
        if (!content.includes("import Link from 'next/link'")) {
          content = "import Link from 'next/link';\n" + content;
        }
        if (!content.includes("import { Button }")) {
          content = "import { Button } from '@/components/ui/button';\n" + content;
        }
        
        // Add navigation after the first div or main tag
        const insertPosition = content.indexOf('<main') !== -1 ? 
          content.indexOf('>', content.indexOf('<main')) + 1 :
          content.indexOf('>', content.indexOf('<div')) + 1;
        
        if (insertPosition > 0 && group.navigationCode) {
          content = content.slice(0, insertPosition) + '\n' + group.navigationCode + '\n' + content.slice(insertPosition);
          fs.writeFileSync(filePath, content);
          fixedFiles++;
          totalFixes++;
          console.log(`  ✅ Added navigation: ${file}`);
        }
      }
    }
  }
  
  // Apply button action fixes
  console.log('\n🔘 Fixing button actions...');
  const buttonFiles = [
    'src/app/portal/**/*.tsx',
    'src/app/team-portal/**/*.tsx',
    'src/app/admin/**/*.tsx'
  ];
  
  // This would need glob package to work properly
  // For now, manually list key files
  const keyFiles = [
    'src/app/portal/page.tsx',
    'src/app/portal/register/page.tsx',
    'src/app/portal/forgot-password/page.tsx',
    'src/app/team-portal/customers/new/page.tsx',
    'src/app/team-portal/invoices/new/page.tsx'
  ];
  
  for (const file of keyFiles) {
    const filePath = path.join(process.cwd(), file);
    
    if (!fs.existsSync(filePath)) {
      continue;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let changesMade = false;
    
    for (const fix of BUTTON_ACTION_FIXES) {
      const matches = content.match(fix.find);
      if (matches) {
        content = content.replace(fix.find, fix.replace);
        changesMade = true;
        totalFixes += matches.length;
      }
    }
    
    if (changesMade) {
      // Ensure Link import exists
      if (!content.includes("import Link from 'next/link'")) {
        content = "import Link from 'next/link';\n" + content;
      }
      
      fs.writeFileSync(filePath, content);
      fixedFiles++;
      console.log(`  ✅ Fixed buttons: ${file}`);
    }
  }
  
  console.log('\n========================================');
  console.log('✅ FIXES COMPLETE');
  console.log('========================================');
  console.log(`Files modified: ${fixedFiles}`);
  console.log(`Total fixes applied: ${totalFixes}`);
  console.log('\n📝 Changes made:');
  console.log('  • Fixed white text on white backgrounds');
  console.log('  • Updated color scheme for better contrast');
  console.log('  • Added navigation links to dashboard pages');
  console.log('  • Fixed button actions for navigation');
  console.log('\n⚠️  Please rebuild the application to see changes.');
}

// Run the fixes
applyFixes().catch(console.error);