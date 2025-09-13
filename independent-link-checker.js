#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Get all TSX files
const files = glob.sync('src/app/**/*.tsx');
const allPages = glob.sync('src/app/**/page.tsx').map(p => {
  const route = '/' + path.dirname(p).replace(/^src\/app\/?/, '').replace(/\\/g, '/');
  return route === '/' || route === '' ? '/' : route;
});

console.log(`Found ${files.length} TSX files to check`);
console.log(`Found ${allPages.length} pages`);

let brokenLinks = 0;
let totalLinks = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  
  // Find all internal href links
  const linkMatches = content.matchAll(/href=["']([^"']+)["']/g);
  
  for (const match of linkMatches) {
    const href = match[1];
    totalLinks++;
    
    // Skip external links
    if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#') || href === '') {
      continue;
    }
    
    // Clean up dynamic routes
    const normalizedHref = href.split('?')[0].split('#')[0];
    
    // Check if page exists
    const targetExists = allPages.some(page => {
      // Handle dynamic routes
      const pagePattern = page.replace(/\[.*?\]/g, '[id]');
      const hrefPattern = normalizedHref.replace(/\/\d+/g, '/[id]');
      return page === normalizedHref || pagePattern === hrefPattern;
    });
    
    if (!targetExists && !normalizedHref.includes('[')) {
      console.log(`BROKEN: ${normalizedHref} (from ${file})`);
      brokenLinks++;
    }
  }
}

console.log(`\nRESULTS:`);
console.log(`Total links: ${totalLinks}`);
console.log(`Broken links: ${brokenLinks}`);
console.log(`Pages: ${allPages.length}`);

if (brokenLinks === 0) {
  console.log('✅ ALL LINKS WORK!');
} else {
  console.log(`❌ ${brokenLinks} broken links found`);
}