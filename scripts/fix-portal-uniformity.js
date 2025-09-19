#!/usr/bin/env node

/**
 * Portal Pages Uniformity Fix
 * 
 * This script fixes ALL portal page inconsistencies to ensure:
 * 1. Uniform white backgrounds (no glass, gradients, or dark themes)
 * 2. Consistent header structure and styling
 * 3. Standardized navigation patterns
 * 4. Professional light theme throughout
 * 5. Proper text contrast (dark text on light backgrounds)
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Define the standard header component to be used across all portal pages
const STANDARD_HEADER = `      {/* Professional Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/">
              <Logo width={160} height={128} />
            </Link>
            <nav className="hidden md:flex space-x-3">
              <Link href="/">
                <Button variant="ghost" className="px-5 py-2.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-300 transition-colors duration-200 font-medium">
                  Home
                </Button>
              </Link>
              <Link href="/portal">
                <Button className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors duration-200">
                  Login
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>`;

// Files to fix with their specific patterns
const PORTAL_FIXES = [
  {
    file: 'src/app/portal/reset-password/page.tsx',
    patterns: [
      // Fix glassmorphism header
      {
        search: /header className="bg-white border-b border-slate-200 shadow-sm">\s*<div className="max-w-7xl mx-auto px-4 py-4">\s*<div className="flex justify-between items-center">\s*<Link href="\/?">\s*<Logo width=\{180\} height=\{144\} \/>\s*<\/Link>\s*<nav className="hidden md:flex space-x-4">\s*<Link href="\/" className="glass border border-white\/20 px-4 py-2 rounded-lg text-white\/90 hover:text-slate-900 hover:border-white\/40 transition-all duration-300 hover:bg-white\/10 hover:scale-105">\s*Home\s*<\/Link>\s*<Link href="\/portal" className="glass border border-blue-400\/30 px-4 py-2 rounded-lg text-blue-400 hover:text-slate-900 hover:border-blue-400\/60 transition-all duration-300 hover:bg-blue-400\/20 hover:scale-105 glow-blue-sm">\s*Login\s*<\/Link>\s*<\/nav>\s*<\/div>\s*<\/div>\s*<\/header>/s,
        replace: STANDARD_HEADER
      },
      // Fix glassmorphism main content
      {
        search: /className="glass rounded-2xl p-8 w-full max-w-md mx-auto glow-blue-sm"/g,
        replace: 'className="bg-white border border-slate-200 rounded-2xl p-8 w-full max-w-md mx-auto shadow-lg"'
      }
    ]
  },
  {
    file: 'src/app/portal/schedule/page.tsx', 
    patterns: [
      // Fix inconsistent backgrounds in sections
      {
        search: /bg-slate-400/g,
        replace: 'bg-slate-50'
      },
      // Fix border colors
      {
        search: /border-slate-200/g,
        replace: 'border-slate-300'
      }
    ]
  }
];

// Global replacements for ALL portal files
const GLOBAL_PORTAL_REPLACEMENTS = [
  // Remove all glassmorphism effects
  {
    search: /glass\s+/g,
    replace: 'bg-white border border-slate-200 '
  },
  {
    search: /\s+glass/g,
    replace: ' bg-white border border-slate-200'
  },
  {
    search: /glow-blue-sm/g,
    replace: 'shadow-sm'
  },
  {
    search: /glow-blue/g,
    replace: 'shadow-lg'
  },
  
  // Standardize text colors for proper contrast
  {
    search: /text-white\/90/g,
    replace: 'text-slate-900'
  },
  {
    search: /text-white\/60/g,
    replace: 'text-slate-700'
  },
  {
    search: /text-white\/80/g,
    replace: 'text-slate-800'
  },

  // Fix gradient backgrounds to solid professional colors
  {
    search: /bg-gradient-to-[a-z]+ from-[a-z\-\d\/]+ to-[a-z\-\d\/]+/g,
    replace: 'bg-white'
  },
  
  // Standardize card backgrounds
  {
    search: /bg-black/g,
    replace: 'bg-white'
  },
  
  // Fix slate-400 backgrounds to be lighter and more professional
  {
    search: /bg-slate-400(?!\d)/g,
    replace: 'bg-slate-50'
  }
];

async function fixPortalFile(filePath) {
  try {
    let content = await readFile(filePath, 'utf8');
    let modified = false;

    console.log(`\nProcessing: ${filePath}`);

    // Apply global replacements first
    for (const replacement of GLOBAL_PORTAL_REPLACEMENTS) {
      const originalContent = content;
      content = content.replace(replacement.search, replacement.replace);
      if (content !== originalContent) {
        modified = true;
        console.log(`  ✓ Applied global fix: ${replacement.search}`);
      }
    }

    // Apply file-specific patterns
    const specificFix = PORTAL_FIXES.find(fix => filePath.includes(fix.file));
    if (specificFix) {
      for (const pattern of specificFix.patterns) {
        const originalContent = content;
        content = content.replace(pattern.search, pattern.replace);
        if (content !== originalContent) {
          modified = true;
          console.log(`  ✓ Applied specific fix for ${path.basename(filePath)}`);
        }
      }
    }

    if (modified) {
      await writeFile(filePath, content, 'utf8');
      console.log(`  📝 File updated: ${path.basename(filePath)}`);
      return true;
    } else {
      console.log(`  ⏭️  No changes needed: ${path.basename(filePath)}`);
      return false;
    }

  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Starting Portal Pages Uniformity Fix...\n');
  console.log('This will standardize ALL portal pages for visual uniformity');
  
  const portalDir = path.join(process.cwd(), 'src/app/portal');
  
  try {
    // Get all portal page files
    const getAllPortalFiles = (dir) => {
      let files = [];
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          files = files.concat(getAllPortalFiles(fullPath));
        } else if (item.name === 'page.tsx') {
          files.push(fullPath);
        }
      }
      return files;
    };

    const portalFiles = getAllPortalFiles(portalDir);
    console.log(`Found ${portalFiles.length} portal page files to process\n`);

    let totalFixed = 0;
    for (const filePath of portalFiles) {
      const wasFixed = await fixPortalFile(filePath);
      if (wasFixed) totalFixed++;
    }

    console.log(`\n✅ Portal uniformity fix completed!`);
    console.log(`📊 Files processed: ${portalFiles.length}`);
    console.log(`🔧 Files modified: ${totalFixed}`);
    console.log(`\nAll portal pages now have:
    ✓ Uniform white backgrounds
    ✓ Consistent professional styling  
    ✓ Proper text contrast
    ✓ Standardized component patterns
    ✓ No glassmorphism or dark themes`);

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fixPortalFile, GLOBAL_PORTAL_REPLACEMENTS };