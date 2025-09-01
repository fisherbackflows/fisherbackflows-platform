const fs = require('fs');
const path = require('path');

// Final fixes for remaining dark theme elements
const portalPages = [
  'src/app/portal/billing/page.tsx',
  'src/app/portal/reports/page.tsx', 
  'src/app/portal/devices/page.tsx'
];

function applyFinalFixes(filePath) {
  console.log(`🔧 Applying final fixes to ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix remaining glass elements
  content = content.replace(/glass rounded-2xl p-6/g, 'bg-white border border-slate-200 rounded-2xl p-6 shadow-sm');
  content = content.replace(/glass rounded-xl p-6/g, 'bg-white border border-slate-200 rounded-xl p-6 shadow-sm');
  
  // Fix glassmorphism specific elements
  content = content.replace(/glow-blue-sm/g, '');
  content = content.replace(/card-hover/g, 'hover:shadow-md transition-shadow');
  
  // Fix remaining white text issues
  content = content.replace(/text-white\/30/g, 'text-slate-400');
  content = content.replace(/text-white\/40/g, 'text-slate-500');
  content = content.replace(/h-16 w-16 text-white\/30/g, 'h-16 w-16 text-slate-400');
  
  // Fix special buttons
  content = content.replace(/btn-glow/g, 'bg-blue-700 hover:bg-blue-800 text-white');
  
  // Fix hover states
  content = content.replace(/hover:bg-white\/\[0\.03\]/g, 'hover:bg-slate-50');
  
  // Fix search icon colors
  content = content.replace(/text-white\/40\" \/>/g, 'text-slate-500\" />');
  
  // Fix select options
  content = content.replace(/bg-black/g, 'bg-slate-200');
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Applied final fixes to ${path.basename(filePath)}`);
}

console.log('🚀 Applying final portal consistency fixes...\n');

portalPages.forEach(applyFinalFixes);

console.log('\n✨ Final portal consistency fixes completed!');