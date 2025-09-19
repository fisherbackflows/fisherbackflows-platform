#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function findPageFiles(dir, files = []) {
  const items = await fs.readdir(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.name === 'node_modules' || item.name === '.next' || item.name === '.git') continue;
    
    if (item.isDirectory()) {
      if (item.name !== 'api') await findPageFiles(fullPath, files);
    } else if (item.name === 'page.tsx') {
      files.push(fullPath);
    }
  }
  return files;
}

async function fixFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let modified = false;
    
    // Remove any broken imports
    const brokenPatterns = [
      /import\s+from\s+['"][^'"]*['"];\s*\n/g,
      /import\s+UniformHeader[^;]*from[^;]*;\s*\n/g
    ];
    
    for (const pattern of brokenPatterns) {
      if (pattern.test(content)) {
        content = content.replace(pattern, '');
        modified = true;
      }
    }
    
    // Ensure 'use client' is first
    if (content.includes("'use client'")) {
      content = content.replace(/'use client';\s*\n*/g, '');
      content = "'use client';\n\n" + content;
      modified = true;
    }
    
    // Add uniform header import if not present
    if (!content.includes("import UniformHeader from '@/components/layout/UniformHeader'")) {
      const useClientIndex = content.indexOf("'use client';");
      if (useClientIndex !== -1) {
        const insertIndex = content.indexOf('\n', useClientIndex) + 1;
        content = content.slice(0, insertIndex) + 
                  "\nimport UniformHeader from '@/components/layout/UniformHeader';" +
                  content.slice(insertIndex);
      } else {
        content = "import UniformHeader from '@/components/layout/UniformHeader';\n\n" + content;
      }
      modified = true;
    }
    
    // Ensure UniformHeader is in the JSX
    if (!content.includes('<UniformHeader />')) {
      // Find the return statement
      const returnMatch = content.match(/return\s*\(/);
      if (returnMatch) {
        const afterReturn = content.indexOf(returnMatch[0]) + returnMatch[0].length;
        const firstJSXElement = content.indexOf('<', afterReturn);
        
        if (firstJSXElement !== -1) {
          const nextNewline = content.indexOf('\n', firstJSXElement);
          if (nextNewline !== -1) {
            content = content.slice(0, nextNewline) + 
                      '\n      <UniformHeader />' +
                      content.slice(nextNewline);
            modified = true;
          }
        }
      }
    }
    
    if (modified) {
      await fs.writeFile(filePath, content);
      console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error: ${filePath} - ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔧 Final Header Fix\n');
  
  const srcDir = path.join(process.cwd(), 'src');
  const pageFiles = await findPageFiles(srcDir);
  
  let fixed = 0;
  for (const file of pageFiles) {
    if (await fixFile(file)) fixed++;
  }
  
  console.log(`\n✨ Complete! Fixed ${fixed} files`);
}

main().catch(console.error);