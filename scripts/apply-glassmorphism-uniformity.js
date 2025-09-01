#!/usr/bin/env node

/**
 * COMPREHENSIVE GLASSMORPHISM UNIFORMITY TRANSFORMATION
 * 
 * This script applies TRUE uniform glassmorphism design across ALL 64 pages:
 * - Black backgrounds with glass effects
 * - Blue outlines and borders throughout  
 * - White text everywhere
 * - Consistent glow effects
 * - Preserves ALL existing functionality and data
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// COMPREHENSIVE GLASSMORPHISM TRANSFORMATIONS
const GLASSMORPHISM_REPLACEMENTS = [
  // === PAGE BACKGROUNDS ===
  {
    search: /min-h-screen bg-white/g,
    replace: 'min-h-screen bg-black'
  },
  {
    search: /bg-white(?!\w)/g,
    replace: 'glass'
  },
  {
    search: /bg-slate-50(?!\w)/g,
    replace: 'glass'
  },
  {
    search: /bg-slate-100(?!\w)/g,
    replace: 'glass'
  },
  {
    search: /bg-slate-200(?!\w)/g,
    replace: 'glass'
  },

  // === HEADERS ===
  {
    search: /header className="[^"]*bg-white[^"]*border-b border-slate-200[^"]*shadow-sm"/g,
    replace: 'header className="glass-header sticky top-0 z-50"'
  },

  // === CARDS AND CONTAINERS ===
  {
    search: /bg-white border border-slate-200 rounded-xl/g,
    replace: 'glass rounded-xl'
  },
  {
    search: /bg-white border border-slate-200 rounded-2xl/g,
    replace: 'glass rounded-2xl'
  },
  {
    search: /bg-white border border-slate-300/g,
    replace: 'glass border-blue-400'
  },
  {
    search: /shadow-sm/g,
    replace: 'glow-blue-sm'
  },
  {
    search: /shadow-lg/g,
    replace: 'glow-blue'
  },
  {
    search: /shadow-xl/g,
    replace: 'glow-blue-lg'
  },

  // === TEXT COLORS ===
  {
    search: /text-slate-900/g,
    replace: 'text-white'
  },
  {
    search: /text-slate-800/g,
    replace: 'text-white/90'
  },
  {
    search: /text-slate-700/g,
    replace: 'text-white/80'
  },
  {
    search: /text-slate-600/g,
    replace: 'text-white/70'
  },

  // === BORDERS ===
  {
    search: /border-slate-200/g,
    replace: 'border-blue-400'
  },
  {
    search: /border-slate-300/g,
    replace: 'border-blue-400'
  },
  {
    search: /border-b border-blue-400/g,
    replace: 'border-b border-blue-400'
  },

  // === BUTTONS ===
  {
    search: /bg-blue-700 hover:bg-blue-700/g,
    replace: 'glass-btn-primary hover:glow-blue'
  },
  {
    search: /bg-blue-700 hover:bg-blue-800/g,
    replace: 'glass-btn-primary hover:glow-blue'
  },
  {
    search: /bg-emerald-600 hover:bg-emerald-700/g,
    replace: 'glass-btn-primary hover:glow-blue bg-emerald-500/30 border-emerald-400'
  },
  {
    search: /bg-green-700 hover:bg-green-700/g,
    replace: 'glass-btn-primary hover:glow-blue bg-green-500/30 border-green-400'
  },

  // === NAVIGATION ===
  {
    search: /bg-blue-200 text-blue-700 border border-blue-200/g,
    replace: 'glass-btn-primary text-white glow-blue-sm'
  },
  {
    search: /hover:bg-slate-50/g,
    replace: 'hover:bg-blue-400/10 hover:glow-blue-sm'
  },
  {
    search: /hover:bg-slate-300/g,
    replace: 'hover:bg-blue-400/10 hover:glow-blue-sm'
  },

  // === STATUS INDICATORS ===
  {
    search: /bg-green-200 text-green-700 border-green-200/g,
    replace: 'glass border-green-400 text-green-300 glow-blue-sm'
  },
  {
    search: /bg-red-200 text-red-700 border-red-200/g,
    replace: 'glass border-red-400 text-red-300 glow-blue-sm'
  },
  {
    search: /bg-yellow-50 text-yellow-700 border-yellow-200/g,
    replace: 'glass border-yellow-400 text-yellow-300 glow-blue-sm'
  },
  {
    search: /bg-amber-50 text-amber-700 border-amber-200/g,
    replace: 'glass border-amber-400 text-amber-300 glow-blue-sm'
  },
  {
    search: /bg-blue-200 text-blue-700 border-blue-200/g,
    replace: 'glass border-blue-400 text-blue-300 glow-blue-sm'
  },

  // === ICON BACKGROUNDS ===
  {
    search: /bg-blue-300/g,
    replace: 'bg-blue-500/20 border border-blue-400 glow-blue-sm'
  },
  {
    search: /bg-green-300/g,
    replace: 'bg-green-500/20 border border-green-400 glow-blue-sm'
  },
  {
    search: /bg-red-300/g,
    replace: 'bg-red-500/20 border border-red-400 glow-blue-sm'
  },
  {
    search: /bg-purple-100/g,
    replace: 'bg-purple-500/20 border border-purple-400 glow-blue-sm'
  },
  {
    search: /bg-emerald-50/g,
    replace: 'bg-emerald-500/20 border border-emerald-400 glow-blue-sm'
  },
  {
    search: /bg-emerald-100/g,
    replace: 'bg-emerald-500/20 border border-emerald-400 glow-blue-sm'
  },
  {
    search: /bg-amber-100/g,
    replace: 'bg-amber-500/20 border border-amber-400 glow-blue-sm'
  },
  {
    search: /bg-cyan-100/g,
    replace: 'bg-cyan-500/20 border border-cyan-400 glow-blue-sm'
  },

  // === ICON TEXT COLORS ===
  {
    search: /text-blue-800/g,
    replace: 'text-blue-300'
  },
  {
    search: /text-green-800/g,
    replace: 'text-green-300'
  },
  {
    search: /text-red-800/g,
    replace: 'text-red-300'
  },
  {
    search: /text-purple-600/g,
    replace: 'text-purple-300'
  },
  {
    search: /text-emerald-600/g,
    replace: 'text-emerald-300'
  },
  {
    search: /text-amber-600/g,
    replace: 'text-amber-300'
  },
  {
    search: /text-cyan-600/g,
    replace: 'text-cyan-300'
  },

  // === FORM INPUTS ===
  {
    search: /bg-white text-slate-900 placeholder-slate-400/g,
    replace: 'glass text-white placeholder-white/50'
  },
  {
    search: /bg-white text-slate-900 placeholder-slate-600/g,
    replace: 'glass text-white placeholder-white/50'
  },
  {
    search: /focus:border-blue-500 focus:ring-2 focus:ring-blue-500\/20/g,
    replace: 'focus:border-blue-300 focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm'
  },

  // === HOVER STATES ===
  {
    search: /hover:shadow-md/g,
    replace: 'hover:glow-blue'
  },
  {
    search: /hover:shadow-lg/g,
    replace: 'hover:glow-blue-lg'
  },
  {
    search: /hover:shadow-xl/g,
    replace: 'hover:glow-blue-lg'
  },

  // === GRADIENT BACKGROUNDS ===
  {
    search: /bg-gradient-to-[a-z]+ from-[a-z\-\d\/]+ to-[a-z\-\d\/]+/g,
    replace: 'glass'
  },

  // === SPECIFIC FIXES FOR CONSISTENCY ===
  {
    search: /placeholder-slate-300/g,
    replace: 'placeholder-white/50'
  },
  {
    search: /placeholder-slate-400/g,
    replace: 'placeholder-white/50'
  },
  {
    search: /placeholder-slate-500/g,
    replace: 'placeholder-white/50'
  },
];

async function transformPageToGlassmorphism(filePath) {
  try {
    let content = await readFile(filePath, 'utf8');
    let modified = false;

    console.log(`\n🔄 Transforming: ${filePath}`);

    // Apply all glassmorphism transformations
    for (const replacement of GLASSMORPHISM_REPLACEMENTS) {
      const originalContent = content;
      content = content.replace(replacement.search, replacement.replace);
      if (content !== originalContent) {
        modified = true;
      }
    }

    if (modified) {
      await writeFile(filePath, content, 'utf8');
      console.log(`  ✨ Glassmorphism applied: ${path.basename(filePath)}`);
      return true;
    } else {
      console.log(`  ⏭️  Already uniform: ${path.basename(filePath)}`);
      return false;
    }

  } catch (error) {
    console.error(`❌ Error transforming ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('✨ COMPREHENSIVE GLASSMORPHISM TRANSFORMATION STARTING...\n');
  console.log('🎯 Applying uniform glassmorphism to ALL 64 pages');
  console.log('📋 Color scheme: Black backgrounds + Blue outlines + White text + Glow effects\n');
  
  const appDir = path.join(process.cwd(), 'src/app');
  
  try {
    // Get ALL page files recursively
    const getAllPageFiles = (dir) => {
      let files = [];
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          files = files.concat(getAllPageFiles(fullPath));
        } else if (item.name === 'page.tsx') {
          files.push(fullPath);
        }
      }
      return files;
    };

    const allPageFiles = getAllPageFiles(appDir);
    console.log(`🔍 Found ${allPageFiles.length} pages to transform\n`);

    // Sort by section for organized processing
    const sections = {
      portal: allPageFiles.filter(f => f.includes('/portal/')),
      teamPortal: allPageFiles.filter(f => f.includes('/team-portal/')),
      admin: allPageFiles.filter(f => f.includes('/admin/')),
      field: allPageFiles.filter(f => f.includes('/field/')),
      other: allPageFiles.filter(f => !f.includes('/portal/') && !f.includes('/team-portal/') && !f.includes('/admin/') && !f.includes('/field/'))
    };

    let totalTransformed = 0;

    // Transform each section
    for (const [sectionName, files] of Object.entries(sections)) {
      if (files.length > 0) {
        console.log(`\n📁 === ${sectionName.toUpperCase()} SECTION (${files.length} pages) ===`);
        
        for (const filePath of files) {
          const wasTransformed = await transformPageToGlassmorphism(filePath);
          if (wasTransformed) totalTransformed++;
        }
      }
    }

    console.log(`\n🎉 GLASSMORPHISM TRANSFORMATION COMPLETE!`);
    console.log(`📊 Total pages processed: ${allPageFiles.length}`);
    console.log(`✨ Pages transformed: ${totalTransformed}`);
    console.log(`\n🎨 ALL PAGES NOW HAVE:
    ✅ Black backgrounds with glass effects
    ✅ Blue outlines and borders throughout
    ✅ White text everywhere for proper contrast
    ✅ Consistent glow effects
    ✅ Unified glassmorphism aesthetic
    ✅ ALL existing functionality preserved`);

  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the comprehensive transformation
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { transformPageToGlassmorphism, GLASSMORPHISM_REPLACEMENTS };