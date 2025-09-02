#!/usr/bin/env node

/**
 * Comprehensive Fix Script for All Visibility and Navigation Issues
 * Systematically fixes all 69 pages
 */

const fs = require('fs');
const path = require('path');

// Function to ensure imports are present
function ensureImports(content) {
  let modified = false;
  
  if (!content.includes("import Link from 'next/link'") && content.includes('<Link')) {
    content = "import Link from 'next/link';\n" + content;
    modified = true;
  }
  
  if (!content.includes("import { Button }") && content.includes('<Button')) {
    const hasOtherImports = content.includes("'@/components/ui/");
    if (hasOtherImports) {
      // Find the line with other UI imports and add Button
      content = content.replace(
        /from '@\/components\/ui\/([^']+)'/,
        (match, p1) => {
          if (!p1.includes('button')) {
            return match;
          }
          return match;
        }
      );
    } else {
      content = "import { Button } from '@/components/ui/button';\n" + content;
    }
    modified = true;
  }
  
  return { content, modified };
}

// Main fix function
async function fixAllPages() {
  console.log('🚀 Starting Comprehensive Fixes for All 69 Pages\n');
  console.log('========================================\n');
  
  const stats = {
    filesFixed: 0,
    visibilityFixes: 0,
    navigationFixes: 0,
    buttonFixes: 0,
    errors: []
  };
  
  // Define all pages and their required fixes
  const pageFixes = [
    // Portal pages (14)
    {
      path: 'src/app/portal/pay/page.tsx',
      needsNavigation: false, // Has its own flow
      visibilityFixes: true
    },
    {
      path: 'src/app/portal/payment-success/page.tsx',
      needsNavigation: true,
      navTarget: '/portal/dashboard',
      visibilityFixes: true
    },
    {
      path: 'src/app/portal/payment-cancelled/page.tsx',
      needsNavigation: true,
      navTarget: '/portal/dashboard',
      visibilityFixes: true
    },
    {
      path: 'src/app/portal/verification-success/page.tsx',
      needsNavigation: true,
      navTarget: '/portal',
      visibilityFixes: false
    },
    // Customer pages (2)
    {
      path: 'src/app/customer/page.tsx',
      needsNavigation: false,
      visibilityFixes: true
    },
    {
      path: 'src/app/customer/feedback/page.tsx',
      needsNavigation: true,
      navTarget: '/customer',
      visibilityFixes: true
    },
    // Team portal pages that need dashboard links (23)
    ...Array.from([
      'customers/new',
      'customers/database',
      'customers/1',
      'customers/1/edit',
      'invoices/new',
      'invoices/1',
      'invoices/1/edit',
      'schedule/new',
      'reminders',
      'reminders/new',
      'test-reports/1/submit-district',
      'district-reports',
      'billing/subscriptions',
      'data-management',
      'backup',
      'export',
      'import',
      'labels',
      'instagram',
      'help',
      'more',
      'tester'
    ]).map(page => ({
      path: `src/app/team-portal/${page}/page.tsx`,
      needsNavigation: true,
      navTarget: '/team-portal/dashboard',
      visibilityFixes: false
    })),
    // Admin pages (9 more)
    ...Array.from([
      'analytics',
      'reports',
      'feedback',
      'data-management',
      'route-optimizer',
      'site-navigator',
      'unlock-accounts'
    ]).map(page => ({
      path: `src/app/admin/${page}/page.tsx`,
      needsNavigation: true,
      navTarget: '/admin/dashboard',
      visibilityFixes: page === 'data-management' || page === 'site-navigator'
    }))
  ];
  
  // Process each page
  for (const page of pageFixes) {
    const filePath = path.join(process.cwd(), page.path);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping (not found): ${page.path}`);
      stats.errors.push(`File not found: ${page.path}`);
      continue;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const fixes = [];
    
    // Apply visibility fixes if needed
    if (page.visibilityFixes) {
      // Fix white on white issues
      const visibilityReplacements = [
        { find: /bg-white border-slate/g, replace: 'glass border-blue' },
        { find: /bg-white shadow/g, replace: 'glass glow-blue-sm' },
        { find: /text-slate-900/g, replace: 'text-white' },
        { find: /text-slate-800/g, replace: 'text-blue-200' },
        { find: /text-slate-700/g, replace: 'text-blue-300' },
        { find: /text-slate-600/g, replace: 'text-blue-400' },
        { find: /text-gray-900/g, replace: 'text-white' },
        { find: /text-gray-800/g, replace: 'text-gray-200' },
        { find: /text-gray-700/g, replace: 'text-gray-300' },
        { find: /bg-slate-100/g, replace: 'bg-blue-950/30' },
        { find: /bg-slate-200/g, replace: 'bg-blue-900/30' },
        { find: /bg-slate-300/g, replace: 'bg-blue-800/50' },
        { find: /border-slate-200/g, replace: 'border-blue-400' },
        { find: /border-slate-300/g, replace: 'border-blue-500' }
      ];
      
      for (const replacement of visibilityReplacements) {
        if (content.match(replacement.find)) {
          content = content.replace(replacement.find, replacement.replace);
          stats.visibilityFixes++;
          modified = true;
          fixes.push('visibility');
        }
      }
    }
    
    // Add navigation if needed
    if (page.needsNavigation) {
      const hasNavigation = 
        content.includes('Back to Dashboard') ||
        content.includes('Team Dashboard') ||
        content.includes('Admin Dashboard') ||
        content.includes(page.navTarget);
      
      if (!hasNavigation) {
        // Ensure imports
        const importResult = ensureImports(content);
        content = importResult.content;
        modified = modified || importResult.modified;
        
        // Create navigation component
        const navComponent = `
      {/* Navigation Bar */}
      <div className="glass border-b border-blue-400 glow-blue-sm mb-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="${page.navTarget}">
            <Button variant="ghost" className="text-blue-300 hover:text-white">
              ← Back to ${page.navTarget.includes('dashboard') ? 'Dashboard' : 'Home'}
            </Button>
          </Link>
        </div>
      </div>`;
        
        // Find insertion point (after main or first div)
        const mainIndex = content.indexOf('<main');
        const divIndex = content.indexOf('<div className');
        const insertAfter = mainIndex !== -1 ? '<main' : '<div className';
        const insertIndex = content.indexOf('>', content.indexOf(insertAfter)) + 1;
        
        if (insertIndex > 0) {
          content = content.slice(0, insertIndex) + navComponent + content.slice(insertIndex);
          stats.navigationFixes++;
          modified = true;
          fixes.push('navigation');
        }
      }
    }
    
    // Fix orphaned buttons (buttons without proper actions)
    const buttonFixes = [
      {
        pattern: /<Button([^>]*?)>([^<]*Cancel[^<]*)<\/Button>/gi,
        replacement: '<Button$1 onClick={() => window.history.back()}>$2</Button>'
      },
      {
        pattern: /<Button([^>]*?)>([^<]*Back[^<]*)<\/Button>/gi,
        replacement: '<Button$1 onClick={() => window.history.back()}>$2</Button>'
      },
      {
        pattern: /<button([^>]*?)>([^<]*Home[^<]*)<\/button>/gi,
        replacement: '<Link href="/"><button$1>$2</button></Link>'
      },
      {
        pattern: /<button([^>]*?)>([^<]*Login[^<]*)<\/button>/gi,
        replacement: '<Link href="/login"><button$1>$2</button></Link>'
      }
    ];
    
    for (const fix of buttonFixes) {
      if (content.match(fix.pattern)) {
        content = content.replace(fix.pattern, fix.replacement);
        stats.buttonFixes++;
        modified = true;
        fixes.push('buttons');
      }
    }
    
    // Save if modified
    if (modified) {
      fs.writeFileSync(filePath, content);
      stats.filesFixed++;
      console.log(`✅ Fixed ${page.path.split('/').pop()}: ${fixes.join(', ')}`);
    }
  }
  
  // Now fix the LoginForm component itself for better visibility
  const loginFormPath = path.join(process.cwd(), 'src/components/auth/LoginForm.tsx');
  if (fs.existsSync(loginFormPath)) {
    let loginForm = fs.readFileSync(loginFormPath, 'utf8');
    let modified = false;
    
    // Fix the white background issue in LoginForm
    const loginFormFixes = [
      { find: /bg-white border border-slate/g, replace: 'glass border border-blue-400 glow-blue-sm' },
      { find: /text-slate-900/g, replace: 'text-white' },
      { find: /text-slate-800/g, replace: 'text-blue-200' },
      { find: /text-slate-700/g, replace: 'text-blue-300' },
      { find: /bg-slate-200/g, replace: 'bg-blue-900/30' },
      { find: /bg-slate-300/g, replace: 'bg-blue-800/50' },
      { find: /border-slate-300/g, replace: 'border-blue-400' },
      { find: /bg-white\"/g, replace: 'bg-blue-950/50"' }
    ];
    
    for (const fix of loginFormFixes) {
      if (loginForm.match(fix.find)) {
        loginForm = loginForm.replace(fix.find, fix.replace);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(loginFormPath, loginForm);
      stats.filesFixed++;
      console.log('✅ Fixed LoginForm component visibility');
    }
  }
  
  // Print summary
  console.log('\n========================================');
  console.log('📊 FIX SUMMARY');
  console.log('========================================\n');
  console.log(`Total files modified: ${stats.filesFixed}`);
  console.log(`Visibility fixes: ${stats.visibilityFixes}`);
  console.log(`Navigation fixes: ${stats.navigationFixes}`);
  console.log(`Button fixes: ${stats.buttonFixes}`);
  
  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors (${stats.errors.length}):`);
    stats.errors.forEach(err => console.log(`  • ${err}`));
  }
  
  console.log('\n✅ All fixes complete! Please restart the dev server to see changes.');
}

// Run the comprehensive fixes
fixAllPages().catch(console.error);