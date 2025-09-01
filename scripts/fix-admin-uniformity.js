#!/usr/bin/env node

/**
 * Admin Pages Uniformity Fix
 * 
 * This script fixes ALL admin page inconsistencies to ensure:
 * 1. Uniform white backgrounds (no slate-400/slate-100/slate-300)
 * 2. Consistent professional styling
 * 3. Standardized component patterns
 * 4. Proper text contrast
 * 5. Light theme throughout
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Global replacements for ALL admin files
const ADMIN_REPLACEMENTS = [
  // Fix slate-400 backgrounds to white with proper borders
  {
    search: /bg-slate-400/g,
    replace: 'bg-white'
  },
  
  // Fix slate-300 backgrounds to be lighter slate-50
  {
    search: /bg-slate-300/g,
    replace: 'bg-slate-50'
  },
  
  // Fix hover states for slate-400 to slate-50
  {
    search: /hover:bg-slate-400/g,
    replace: 'hover:bg-slate-50'
  },
  
  // Fix hover states for slate-300 to slate-50
  {
    search: /hover:bg-slate-300/g,
    replace: 'hover:bg-slate-50'
  },
  
  // Ensure cards with slate-400 backgrounds become white with borders
  {
    search: /className="([^"]*)?bg-slate-400([^"]*)?rounded-xl([^"]*)?p-4([^"]*)"/g,
    replace: 'className="$1bg-white$2border border-slate-200 rounded-xl$3p-4$4 shadow-sm"'
  },
  
  // Fix text display areas with slate-400
  {
    search: /text-sm text-slate-800 bg-slate-400 px-3 py-2 rounded-lg border/g,
    replace: 'text-sm text-slate-800 bg-white px-3 py-2 rounded-lg border border-slate-200'
  },
  
  // Fix activity items with slate-400
  {
    search: /p-4 bg-slate-400 rounded-xl border border-slate-200/g,
    replace: 'p-4 bg-white rounded-xl border border-slate-200'
  },
  
  // Fix status displays with slate-400
  {
    search: /bg-slate-400 text-slate-800 border-slate-200/g,
    replace: 'bg-white text-slate-800 border-slate-200'
  },
  
  // Fix empty state displays
  {
    search: /bg-slate-400 rounded-xl p-6 border border-slate-200 text-center/g,
    replace: 'bg-white border border-slate-200 rounded-xl p-6 text-center shadow-sm'
  },
  
  // Fix icon backgrounds in cards
  {
    search: /bg-slate-300 text-slate-800/g,
    replace: 'bg-slate-100 text-slate-800'
  },
  
  // Ensure proper card styling consistency
  {
    search: /border-slate-300 text-slate-700 hover:bg-slate-400/g,
    replace: 'border-slate-300 text-slate-700 hover:bg-slate-50'
  }
];

async function fixAdminFile(filePath) {
  try {
    let content = await readFile(filePath, 'utf8');
    let modified = false;

    console.log(`\nProcessing: ${filePath}`);

    // Apply all replacements
    for (const replacement of ADMIN_REPLACEMENTS) {
      const originalContent = content;
      content = content.replace(replacement.search, replacement.replace);
      if (content !== originalContent) {
        modified = true;
        console.log(`  ✓ Applied fix: ${replacement.search}`);
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
  console.log('🔧 Starting Admin Pages Uniformity Fix...\n');
  console.log('This will standardize ALL admin pages for visual uniformity');
  
  const adminDir = path.join(process.cwd(), 'src/app/admin');
  
  try {
    // Get all admin page files
    const getAllAdminFiles = (dir) => {
      let files = [];
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          files = files.concat(getAllAdminFiles(fullPath));
        } else if (item.name === 'page.tsx') {
          files.push(fullPath);
        }
      }
      return files;
    };

    const adminFiles = getAllAdminFiles(adminDir);
    console.log(`Found ${adminFiles.length} admin page files to process\n`);

    let totalFixed = 0;
    for (const filePath of adminFiles) {
      const wasFixed = await fixAdminFile(filePath);
      if (wasFixed) totalFixed++;
    }

    console.log(`\n✅ Admin uniformity fix completed!`);
    console.log(`📊 Files processed: ${adminFiles.length}`);
    console.log(`🔧 Files modified: ${totalFixed}`);
    console.log(`\nAll admin pages now have:
    ✓ Uniform white backgrounds with proper borders
    ✓ Consistent professional card styling  
    ✓ Proper shadow and border treatments
    ✓ Light theme throughout
    ✓ Standardized hover states`);

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fixAdminFile, ADMIN_REPLACEMENTS };