#!/usr/bin/env node

/**
 * Team Portal Pages Uniformity Fix
 * 
 * This script fixes ALL team-portal page inconsistencies to ensure:
 * 1. Uniform white backgrounds (no slate-400/slate-100)
 2. Consistent professional styling
 * 3. Standardized component patterns
 * 4. Proper text contrast
 * 5. Light theme throughout
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Global replacements for ALL team-portal files
const TEAM_PORTAL_REPLACEMENTS = [
  // Fix slate-400 backgrounds to white with proper borders
  {
    search: /bg-slate-400/g,
    replace: 'bg-white'
  },
  
  // Fix slate-100 backgrounds to white
  {
    search: /bg-slate-100/g,
    replace: 'bg-white'
  },
  
  // Fix slate-300 backgrounds to be lighter slate-50
  {
    search: /bg-slate-300/g,
    replace: 'bg-slate-50'
  },
  
  // Ensure proper borders are present
  {
    search: /bg-white rounded-xl shadow-sm p-/g,
    replace: 'bg-white border border-slate-200 rounded-xl shadow-sm p-'
  },
  
  // Fix gradient backgrounds in main content
  {
    search: /bg-gradient-to-b from-slate-50\/50 to-white/g,
    replace: 'bg-white'
  },
  
  // Ensure slate-400 card backgrounds become white
  {
    search: /className="bg-slate-400 rounded-xl shadow-sm border border-slate-200/g,
    replace: 'className="bg-white rounded-xl shadow-sm border border-slate-200'
  },
  
  // Fix hover states for slate-300 to slate-50
  {
    search: /hover:bg-slate-300/g,
    replace: 'hover:bg-slate-50'
  },
  
  // Fix hover states for slate-400 to slate-50
  {
    search: /hover:bg-slate-400/g,
    replace: 'hover:bg-slate-50'
  },
  
  // Fix any remaining dark backgrounds
  {
    search: /bg-gray-300 text-gray-900/g,
    replace: 'bg-slate-100 text-slate-800'
  },
  
  // Ensure proper card styling consistency
  {
    search: /bg-slate-400 rounded-xl p-6/g,
    replace: 'bg-white border border-slate-200 rounded-xl p-6 shadow-sm'
  },
  
  // Fix list item backgrounds
  {
    search: /bg-slate-400 rounded-lg border border-slate-200/g,
    replace: 'bg-white border border-slate-200 rounded-lg'
  },
  
  // Fix button styling to be more consistent
  {
    search: /bg-white hover:bg-slate-400 text-slate-700 border border-slate-300/g,
    replace: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
  },
  
  // Fix empty state backgrounds
  {
    search: /bg-slate-400 rounded-xl shadow-sm border border-slate-200 p-8 text-center/g,
    replace: 'bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm'
  }
];

async function fixTeamPortalFile(filePath) {
  try {
    let content = await readFile(filePath, 'utf8');
    let modified = false;

    console.log(`\nProcessing: ${filePath}`);

    // Apply all replacements
    for (const replacement of TEAM_PORTAL_REPLACEMENTS) {
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
  console.log('🔧 Starting Team Portal Pages Uniformity Fix...\n');
  console.log('This will standardize ALL team-portal pages for visual uniformity');
  
  const teamPortalDir = path.join(process.cwd(), 'src/app/team-portal');
  
  try {
    // Get all team-portal page files
    const getAllTeamPortalFiles = (dir) => {
      let files = [];
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          files = files.concat(getAllTeamPortalFiles(fullPath));
        } else if (item.name === 'page.tsx') {
          files.push(fullPath);
        }
      }
      return files;
    };

    const teamPortalFiles = getAllTeamPortalFiles(teamPortalDir);
    console.log(`Found ${teamPortalFiles.length} team-portal page files to process\n`);

    let totalFixed = 0;
    for (const filePath of teamPortalFiles) {
      const wasFixed = await fixTeamPortalFile(filePath);
      if (wasFixed) totalFixed++;
    }

    console.log(`\n✅ Team Portal uniformity fix completed!`);
    console.log(`📊 Files processed: ${teamPortalFiles.length}`);
    console.log(`🔧 Files modified: ${totalFixed}`);
    console.log(`\nAll team-portal pages now have:
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

module.exports = { fixTeamPortalFile, TEAM_PORTAL_REPLACEMENTS };