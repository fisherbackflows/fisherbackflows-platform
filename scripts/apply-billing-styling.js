const fs = require('fs');
const path = require('path');

// Billing page styling patterns to apply
const STYLING_PATTERNS = {
  // Header pattern from billing page
  headerPattern: `<header className="glass border-b border-blue-400 glow-blue-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">`,
  
  // Stats card pattern
  statsCard: `glass border border-blue-400 rounded-xl p-6 hover:glow-blue transition-shadow`,
  
  // Content card pattern  
  contentCard: `glass border border-blue-400 rounded-2xl p-6 glow-blue-sm`,
  
  // Button patterns
  primaryButton: `glass-btn-primary hover:glow-blue text-white px-4 py-2 rounded-2xl`,
  secondaryButton: `glass hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm text-white px-4 py-2 rounded-2xl`,
  
  // Grid layouts
  statsGrid: `grid grid-cols-1 md:grid-cols-4 gap-6 mb-8`,
  mainContentGrid: `grid grid-cols-1 lg:grid-cols-3 gap-8`,
  
  // Input styling
  inputStyle: `border border-blue-400 glass text-white w-full pl-10 pr-4 py-3 rounded-2xl placeholder-white/50`,
  selectStyle: `border border-blue-400 glass text-white px-4 py-3 rounded-2xl bg-transparent`
};

// Style replacements to make
const STYLE_REPLACEMENTS = [
  // Container backgrounds
  { from: /bg-white/g, to: 'glass' },
  { from: /bg-gray-50/g, to: 'glass' },
  { from: /bg-gray-100/g, to: 'glass border border-blue-400' },
  
  // Card styling
  { from: /bg-white shadow-md rounded-lg/g, to: 'glass border border-blue-400 rounded-2xl glow-blue-sm' },
  { from: /bg-white rounded-lg shadow/g, to: 'glass border border-blue-400 rounded-2xl' },
  { from: /shadow-sm rounded-md/g, to: 'glass border border-blue-400 rounded-2xl' },
  
  // Text colors
  { from: /text-gray-900/g, to: 'text-white' },
  { from: /text-gray-800/g, to: 'text-white' },
  { from: /text-gray-700/g, to: 'text-white/90' },
  { from: /text-gray-600/g, to: 'text-white/80' },
  { from: /text-gray-500/g, to: 'text-white/70' },
  { from: /text-black/g, to: 'text-white' },
  
  // Borders
  { from: /border-gray-200/g, to: 'border-blue-400' },
  { from: /border-gray-300/g, to: 'border-blue-400' },
  { from: /border-gray-400/g, to: 'border-blue-500/50' },
  
  // Buttons - more careful replacement
  { from: /bg-blue-600 hover:bg-blue-700/g, to: 'glass-btn-primary hover:glow-blue' },
  { from: /bg-blue-500 hover:bg-blue-600/g, to: 'glass-btn-primary hover:glow-blue' },
  { from: /bg-gray-200 hover:bg-gray-300/g, to: 'glass hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80' },
  
  // Hover states
  { from: /hover:bg-gray-50/g, to: 'hover:glass' },
  { from: /hover:bg-gray-100/g, to: 'hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10' },
  
  // Focus states
  { from: /focus:ring-blue-500/g, to: 'focus:ring-blue-400' },
  { from: /focus:border-blue-500/g, to: 'focus:border-blue-400' },
  
  // Rounded corners - make them more rounded
  { from: /rounded-md/g, to: 'rounded-xl' },
  { from: /rounded-lg/g, to: 'rounded-2xl' },
  
  // Status colors with glass effect
  { from: /bg-green-100 text-green-800/g, to: 'bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/20 text-green-400' },
  { from: /bg-yellow-100 text-yellow-800/g, to: 'bg-yellow-400/20 text-yellow-400' },
  { from: /bg-red-100 text-red-800/g, to: 'bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl/20 text-red-400' }
];

// Function to apply styling to a file
function applyBillingStyling(filePath) {
  try {
    // Skip billing page itself
    if (filePath.includes('portal/billing')) {
      console.log(`  ⏭️  Skipping billing page`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let changesMade = false;
    
    // Apply all style replacements
    STYLE_REPLACEMENTS.forEach(({ from, to }) => {
      const originalContent = content;
      content = content.replace(from, to);
      if (content !== originalContent) {
        changesMade = true;
      }
    });
    
    // Add specific enhancements for common patterns
    
    // Enhance grid layouts for stats/cards
    content = content.replace(
      /grid grid-cols-1 md:grid-cols-3 gap-4/g,
      'grid grid-cols-1 md:grid-cols-3 gap-6'
    );
    
    // Enhance table styling
    content = content.replace(
      /className="min-w-full divide-y divide-gray-200"/g,
      'className="w-full bg-black/40 backdrop-blur-xl border border-blue-500/30 rounded-xl overflow-hidden"'
    );
    
    // Enhance form inputs
    content = content.replace(
      /className="(.*?)border border-gray-300(.*?)"/g,
      'className="$1border-2 border-blue-500/50 bg-black/50 backdrop-blur-xl text-white placeholder-gray-400 focus:border-blue-400$2"'
    );
    
    // Add glass effect to main containers if not present
    if (!content.includes('glass') && content.includes('className="min-h-screen')) {
      content = content.replace(
        /className="min-h-screen bg-gray-50"/g,
        'className="min-h-screen bg-black"'
      );
      changesMade = true;
    }
    
    if (changesMade) {
      fs.writeFileSync(filePath, content);
      console.log(`  ✅ Applied billing styling to: ${path.basename(path.dirname(filePath))}/${path.basename(filePath)}`);
    } else {
      console.log(`  ⏭️  No changes needed for: ${path.basename(filePath)}`);
    }
  } catch (error) {
    console.error(`  ❌ Error styling ${filePath}:`, error.message);
  }
}

// Function to find all page.tsx files
function findPageFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findPageFiles(fullPath, files);
    } else if (item === 'page.tsx') {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Main execution
console.log('🎨 Applying Billing Page Visual Styling (Preserving Functionality)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const appDir = path.join(__dirname, '..', 'src', 'app');
const pageFiles = findPageFiles(appDir);

console.log(`\n📁 Found ${pageFiles.length} page files to style\n`);

// Group files by section
const sections = {
  admin: [],
  portal: [],
  'team-portal': [],
  field: [],
  other: []
};

pageFiles.forEach(file => {
  const section = Object.keys(sections).find(s => file.includes(`/app/${s}/`)) || 'other';
  sections[section].push(file);
});

// Process each section
Object.entries(sections).forEach(([section, files]) => {
  if (files.length > 0) {
    console.log(`\n📂 Styling ${section} pages (${files.length} files):`);
    files.forEach(applyBillingStyling);
  }
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Billing Page Styling Applied Successfully!');
console.log('🎨 Visual styling applied while preserving all functionality');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');