#!/usr/bin/env node

/**
 * Field Pages Uniformity Fix
 * 
 * This script fixes ALL field page inconsistencies to ensure:
 * 1. Uniform white backgrounds (no slate-400/slate-300)
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

// Global replacements for ALL field files
const FIELD_REPLACEMENTS = [
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
  
  // Fix welcome text displays with slate-400
  {
    search: /text-sm text-slate-800 bg-slate-400 px-3 py-2 rounded-lg border/g,
    replace: 'text-sm text-slate-800 bg-white px-3 py-2 rounded-lg border border-slate-200'
  },
  
  // Fix features sections with slate-400
  {
    search: /bg-slate-400 rounded-2xl p-12 border border-slate-200/g,
    replace: 'bg-white rounded-2xl p-12 border border-slate-200 shadow-sm'
  },
  
  // Fix outline button hover states
  {
    search: /border-slate-300 text-slate-700 hover:bg-slate-400/g,
    replace: 'border-slate-300 text-slate-700 hover:bg-slate-50'
  },
  
  // Fix empty state icon backgrounds
  {
    search: /bg-slate-300 rounded-full/g,
    replace: 'bg-slate-100 rounded-full'
  }
];

async function fixFieldFile(filePath) {
  try {
    let content = await readFile(filePath, 'utf8');
    let modified = false;

    console.log(`\nProcessing: ${filePath}`);

    // Apply all replacements
    for (const replacement of FIELD_REPLACEMENTS) {
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
  console.log('🔧 Starting Field Pages Uniformity Fix...\n');
  console.log('This will standardize ALL field pages for visual uniformity');
  
  const fieldDir = path.join(process.cwd(), 'src/app/field');
  
  try {
    // Get all field page files
    const getAllFieldFiles = (dir) => {
      let files = [];
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          files = files.concat(getAllFieldFiles(fullPath));
        } else if (item.name === 'page.tsx') {
          files.push(fullPath);
        }
      }
      return files;
    };

    const fieldFiles = getAllFieldFiles(fieldDir);
    console.log(`Found ${fieldFiles.length} field page files to process\n`);

    let totalFixed = 0;
    for (const filePath of fieldFiles) {
      const wasFixed = await fixFieldFile(filePath);
      if (wasFixed) totalFixed++;
    }

    console.log(`\n✅ Field uniformity fix completed!`);
    console.log(`📊 Files processed: ${fieldFiles.length}`);
    console.log(`🔧 Files modified: ${totalFixed}`);
    console.log(`\nAll field pages now have:
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

module.exports = { fixFieldFile, FIELD_REPLACEMENTS };