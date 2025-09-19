#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

// Find all page.tsx files
async function findPageFiles(dir, files = []) {
  const items = await fs.readdir(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    // Skip node_modules, .next, and other build directories
    if (item.name === 'node_modules' || 
        item.name === '.next' || 
        item.name === '.git' ||
        item.name === 'dist' ||
        item.name === 'build') {
      continue;
    }
    
    if (item.isDirectory()) {
      // Skip api directories
      if (item.name !== 'api') {
        await findPageFiles(fullPath, files);
      }
    } else if (item.name === 'page.tsx') {
      files.push(fullPath);
    }
  }
  
  return files;
}

async function updatePageWithUniformHeader(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Skip if already using UniformHeader
    if (content.includes('UniformHeader')) {
      console.log(`${colors.blue}✓ Already updated: ${relativePath}${colors.reset}`);
      return false;
    }
    
    // Check if this is the landing page (special case)
    const isLandingPage = filePath.endsWith('src/app/page.tsx');
    
    if (isLandingPage) {
      // For landing page, replace the existing header with UniformHeader
      
      // Add import if not present
      if (!content.includes("import UniformHeader from '@/components/layout/UniformHeader'")) {
        // Find the last import statement
        const lastImportIndex = content.lastIndexOf('import ');
        const endOfLastImport = content.indexOf('\n', lastImportIndex);
        
        content = content.slice(0, endOfLastImport + 1) + 
                  "import UniformHeader from '@/components/layout/UniformHeader';\n" +
                  content.slice(endOfLastImport + 1);
      }
      
      // Replace the entire header section
      const headerStartRegex = /<header[^>]*>/;
      const headerMatch = content.match(headerStartRegex);
      
      if (headerMatch) {
        const headerStart = content.indexOf(headerMatch[0]);
        const headerEnd = content.indexOf('</header>', headerStart) + '</header>'.length;
        
        content = content.slice(0, headerStart) + 
                  '<UniformHeader />' +
                  content.slice(headerEnd);
      }
    } else {
      // For all other pages, ensure they have the uniform header at the top
      
      // Add import if not present
      if (!content.includes("import UniformHeader from '@/components/layout/UniformHeader'")) {
        // Check if there are any imports
        if (content.includes('import ')) {
          const lastImportIndex = content.lastIndexOf('import ');
          const endOfLastImport = content.indexOf('\n', lastImportIndex);
          
          content = content.slice(0, endOfLastImport + 1) + 
                    "import UniformHeader from '@/components/layout/UniformHeader';\n" +
                    content.slice(endOfLastImport + 1);
        } else if (content.startsWith("'use client'")) {
          // Add after 'use client'
          content = content.replace("'use client';", "'use client';\n\nimport UniformHeader from '@/components/layout/UniformHeader';");
        } else {
          // Add at the very beginning
          content = "import UniformHeader from '@/components/layout/UniformHeader';\n\n" + content;
        }
      }
      
      // Find the main return statement and ensure UniformHeader is at the top
      const returnMatch = content.match(/return\s*\(/);
      if (returnMatch) {
        const returnIndex = content.indexOf(returnMatch[0]);
        const afterReturn = returnIndex + returnMatch[0].length;
        
        // Check if there's already a header element
        const headerRegex = /<header[^>]*>[\s\S]*?<\/header>/;
        const existingHeader = content.match(headerRegex);
        
        if (existingHeader) {
          // Replace existing header with UniformHeader
          content = content.replace(headerRegex, '<UniformHeader />');
        } else {
          // Check if UniformHeader is already there
          if (!content.includes('<UniformHeader />')) {
            // Find the first JSX element after return
            let firstElementIndex = content.indexOf('<', afterReturn);
            
            if (firstElementIndex !== -1) {
              // Check if it's a fragment or div
              const elementMatch = content.slice(firstElementIndex).match(/^<(\w+|>)/);
              if (elementMatch) {
                if (elementMatch[1] === '>' || elementMatch[1] === 'div') {
                  // It's a fragment or div, add UniformHeader inside
                  const closingBracket = content.indexOf('>', firstElementIndex);
                  content = content.slice(0, closingBracket + 1) + 
                           '\n      <UniformHeader />' +
                           content.slice(closingBracket + 1);
                }
              }
            }
          }
        }
      }
    }
    
    // Write the updated content
    await fs.writeFile(filePath, content);
    console.log(`${colors.green}✅ Updated: ${relativePath}${colors.reset}`);
    return true;
    
  } catch (error) {
    console.error(`${colors.red}❌ Error updating ${filePath}: ${error.message}${colors.reset}`);
    return false;
  }
}

async function main() {
  console.log(`${colors.blue}🔧 Applying Uniform Header to All Pages${colors.reset}`);
  console.log('=====================================\n');
  
  const srcDir = path.join(process.cwd(), 'src');
  
  try {
    // Find all page.tsx files
    console.log(`${colors.yellow}Searching for page.tsx files...${colors.reset}`);
    const pageFiles = await findPageFiles(srcDir);
    
    console.log(`Found ${pageFiles.length} page files\n`);
    
    // Update each page file
    let updated = 0;
    let skipped = 0;
    
    for (const file of pageFiles) {
      const result = await updatePageWithUniformHeader(file);
      if (result) updated++;
      else skipped++;
    }
    
    console.log('\n=====================================');
    console.log(`${colors.green}✨ Complete!${colors.reset}`);
    console.log(`   Updated: ${updated} files`);
    console.log(`   Skipped: ${skipped} files (already had UniformHeader)`);
    console.log('\nAll pages now have a uniform header!');
    
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);