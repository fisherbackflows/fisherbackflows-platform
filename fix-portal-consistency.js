const fs = require('fs');
const path = require('path');

// Portal pages that need visual consistency fixes
const portalPages = [
  'src/app/portal/billing/page.tsx',
  'src/app/portal/reports/page.tsx', 
  'src/app/portal/devices/page.tsx',
  'src/app/portal/reset-password/page.tsx',
  'src/app/portal/register/page.tsx',
  'src/app/portal/forgot-password/page.tsx'
];

// Standard replacements for visual consistency
const replacements = [
  // Background consistency - all should be white
  { from: /min-h-screen bg-black/g, to: 'min-h-screen bg-white' },
  { from: /min-h-screen bg-slate-400/g, to: 'min-h-screen bg-white' },
  { from: /min-h-screen bg-gradient-to-br.*?purple-900/g, to: 'min-h-screen bg-white' },
  
  // Remove dark theme background effects
  { from: /\/\* Background Effects \*\/[\s\S]*?<div className="fixed.*?opacity-10.*?\/>\s*<div className="fixed.*?transparent.*?\/>/g, to: '' },
  
  // Header consistency
  { from: /glass border-b border-white\/10 relative z-10/g, to: 'bg-white border-b border-slate-200 shadow-sm' },
  { from: /glass border-b border-slate-200 relative z-10/g, to: 'bg-white border-b border-slate-200 shadow-sm' },
  
  // Button consistency
  { from: /btn-glass/g, to: 'bg-slate-200 hover:bg-slate-300 text-slate-900' },
  
  // Text colors for white backgrounds
  { from: /text-white\/60/g, to: 'text-slate-700' },
  { from: /text-white\/80/g, to: 'text-slate-800' },
  { from: /text-white(?![\/\-])/g, to: 'text-slate-900' },
  { from: /gradient-text/g, to: 'text-slate-900' },
  { from: /placeholder-white\/40/g, to: 'placeholder-slate-500' },
  
  // Card and container styling
  { from: /glass rounded-xl/g, to: 'bg-slate-200 border border-slate-300 rounded-xl' },
  { from: /glass rounded-lg/g, to: 'bg-slate-200 border border-slate-300 rounded-lg' },
  { from: /glass-darker/g, to: 'bg-white border border-slate-200' },
  { from: /glass-blue/g, to: 'bg-blue-200' },
  { from: /card-hover/g, to: 'hover:shadow-md transition-shadow' },
  
  // Input styling
  { from: /input-glass/g, to: 'border border-slate-300 bg-white text-slate-900' },
  
  // Remove z-index issues
  { from: /relative z-10/g, to: '' },
  
  // Dark theme class names to light theme
  { from: /bg-black/g, to: 'bg-slate-200' },
];

function fixPortalPage(filePath) {
  console.log(`🔧 Fixing ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changes = 0;
  
  replacements.forEach(({ from, to }) => {
    const beforeLength = content.length;
    content = content.replace(from, to);
    if (content.length !== beforeLength) {
      changes++;
    }
  });
  
  if (changes > 0) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Applied ${changes} changes to ${path.basename(filePath)}`);
  } else {
    console.log(`ℹ️  No changes needed for ${path.basename(filePath)}`);
  }
}

console.log('🚀 Starting portal page consistency fixes...\n');

portalPages.forEach(fixPortalPage);

console.log('\n✨ Portal page consistency fixes completed!');
console.log('\n📝 Summary:');
console.log('- All pages now use white backgrounds');
console.log('- Headers are consistent with white bg and slate borders');
console.log('- Text colors updated for proper contrast');
console.log('- Buttons use consistent slate/blue styling');
console.log('- Cards and containers use light theme styling');