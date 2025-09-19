#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function findPageFiles(dir, files = []) {
  const items = await fs.readdir(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (['node_modules', '.next', '.git'].includes(item.name)) continue;
    
    if (item.isDirectory()) {
      if (item.name !== 'api') await findPageFiles(fullPath, files);
    } else if (item.name === 'page.tsx') {
      files.push(fullPath);
    }
  }
  return files;
}

async function completelyFixFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Remove all existing broken patterns
    const brokenPatterns = [
      /'use client';\s*\n*(?!$)/g,  // Remove all 'use client' except if it's the only thing
      /import\s+UniformHeader[^;]*;\s*\n*/g,  // Remove all UniformHeader imports
      /<UniformHeader\s*\/>\s*\n*/g,  // Remove all UniformHeader components
      /<\/>\s*\n*/g,  // Remove broken fragment closers
      /^\s*\n/gm  // Remove empty lines at start
    ];
    
    for (const pattern of brokenPatterns) {
      content = content.replace(pattern, '');
    }
    
    // Clean up double newlines
    content = content.replace(/\n\n+/g, '\n\n');
    
    // Ensure proper structure: 'use client' first, then import, then component
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    // Start fresh with proper order
    let newContent = "'use client';\n\n";
    newContent += "import UniformHeader from '@/components/layout/UniformHeader';\n";
    
    // Add other imports
    let inImportSection = true;
    for (const line of lines) {
      if (line.startsWith('import ') && !line.includes('UniformHeader')) {
        newContent += line + '\n';
      } else if (!line.startsWith('import ')) {
        if (inImportSection) {
          newContent += '\n';
          inImportSection = false;
        }
        newContent += line + '\n';
      }
    }
    
    // Find the main return statement and ensure UniformHeader is properly placed
    const returnMatch = newContent.match(/return\s*\(/);
    if (returnMatch) {
      const returnIndex = newContent.indexOf(returnMatch[0]);
      const afterReturn = returnIndex + returnMatch[0].length;
      
      // Find the first JSX element
      let jsxStart = newContent.indexOf('<', afterReturn);
      if (jsxStart !== -1) {
        // Check what kind of element it is
        const elementMatch = newContent.slice(jsxStart).match(/^<(\w+|>)/);
        if (elementMatch) {
          if (elementMatch[1] === '>') {
            // It's a fragment, add header inside
            const fragmentEnd = newContent.indexOf('>', jsxStart) + 1;
            newContent = newContent.slice(0, fragmentEnd) + 
                         '\n      <UniformHeader />' +
                         newContent.slice(fragmentEnd);
          } else if (elementMatch[1] === 'div') {
            // It's a div, wrap with fragment and add header
            newContent = newContent.slice(0, jsxStart) + 
                         '<>\n      <UniformHeader />\n      ' +
                         newContent.slice(jsxStart);
            
            // Find the end of the return and add fragment closer
            let bracketCount = 1;
            let i = afterReturn;
            while (i < newContent.length && bracketCount > 0) {
              if (newContent[i] === '(') bracketCount++;
              if (newContent[i] === ')') bracketCount--;
              i++;
            }
            if (bracketCount === 0) {
              newContent = newContent.slice(0, i-1) + '\n    </>\n' + newContent.slice(i-1);
            }
          }
        }
      }
    }
    
    await fs.writeFile(filePath, newContent);
    console.log(`✅ Cleaned: ${relativePath}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error: ${filePath} - ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🧹 Complete Header Cleanup\n');
  
  const srcDir = path.join(process.cwd(), 'src');
  const pageFiles = await findPageFiles(srcDir);
  
  let fixed = 0;
  for (const file of pageFiles.slice(0, 5)) { // Start with just 5 files for testing
    if (await completelyFixFile(file)) fixed++;
  }
  
  console.log(`\n✨ Cleaned ${fixed}/${pageFiles.slice(0, 5).length} files`);
}

main().catch(console.error);