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

async function findPageFiles(dir, files = []) {
  const items = await fs.readdir(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.name === 'node_modules' || 
        item.name === '.next' || 
        item.name === '.git' ||
        item.name === 'dist' ||
        item.name === 'build') {
      continue;
    }
    
    if (item.isDirectory()) {
      if (item.name !== 'api') {
        await findPageFiles(fullPath, files);
      }
    } else if (item.name === 'page.tsx') {
      files.push(fullPath);
    }
  }
  
  return files;
}

async function fixPageSyntax(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Fix common syntax issues
    let modified = false;
    
    // Fix duplicate or misplaced UniformHeader imports
    const importRegex = /import UniformHeader from ['"]@\/components\/layout\/UniformHeader['"];?\n?/g;
    const imports = content.match(importRegex);
    if (imports && imports.length > 1) {
      // Remove all UniformHeader imports
      content = content.replace(importRegex, '');
      // Add a single clean import at the right place
      if (content.includes("'use client'")) {
        content = content.replace("'use client';", "'use client';\n\nimport UniformHeader from '@/components/layout/UniformHeader';");
      } else {
        // Find the first import
        const firstImportIndex = content.indexOf('import ');
        if (firstImportIndex !== -1) {
          content = "import UniformHeader from '@/components/layout/UniformHeader';\n" + content;
        } else {
          content = "import UniformHeader from '@/components/layout/UniformHeader';\n\n" + content;
        }
      }
      modified = true;
    }
    
    // Fix malformed imports (UniformHeader in wrong place)
    if (content.includes('import {\nimport UniformHeader')) {
      content = content.replace(/import \{\nimport UniformHeader.*?\n/g, 'import {\n');
      // Re-add the import properly
      if (!content.includes("import UniformHeader from '@/components/layout/UniformHeader'")) {
        const firstImportIndex = content.indexOf('import ');
        if (firstImportIndex !== -1) {
          content = "import UniformHeader from '@/components/layout/UniformHeader';\n" + content;
        }
      }
      modified = true;
    }
    
    // Fix if UniformHeader ended up inside another import statement
    const malformedImportRegex = /import\s*{[^}]*UniformHeader[^}]*}/g;
    if (malformedImportRegex.test(content)) {
      content = content.replace(/UniformHeader[,\s]*/g, '');
      // Re-add the import properly if not present
      if (!content.includes("import UniformHeader from '@/components/layout/UniformHeader'")) {
        const firstImportIndex = content.indexOf('import ');
        if (firstImportIndex !== -1) {
          content = "import UniformHeader from '@/components/layout/UniformHeader';\n" + content;
        }
      }
      modified = true;
    }
    
    // Clean up any remaining syntax issues with imports
    content = content.replace(/import\s*{\s*,/g, 'import {');
    content = content.replace(/,\s*,/g, ',');
    content = content.replace(/{\s*}/g, '{}');
    
    // Ensure there's only one UniformHeader component in the return
    const uniformHeaderCount = (content.match(/<UniformHeader\s*\/>/g) || []).length;
    if (uniformHeaderCount > 1) {
      // Keep only the first one
      let firstFound = false;
      content = content.replace(/<UniformHeader\s*\/>/g, (match) => {
        if (!firstFound) {
          firstFound = true;
          return match;
        }
        return '';
      });
      modified = true;
    }
    
    if (modified) {
      await fs.writeFile(filePath, content);
      console.log(`${colors.green}✅ Fixed: ${relativePath}${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.blue}✓ Clean: ${relativePath}${colors.reset}`);
      return false;
    }
    
  } catch (error) {
    console.error(`${colors.red}❌ Error fixing ${filePath}: ${error.message}${colors.reset}`);
    return false;
  }
}

async function main() {
  console.log(`${colors.blue}🔧 Fixing Header Syntax Issues${colors.reset}`);
  console.log('=====================================\n');
  
  const srcDir = path.join(process.cwd(), 'src');
  
  try {
    console.log(`${colors.yellow}Searching for page.tsx files...${colors.reset}`);
    const pageFiles = await findPageFiles(srcDir);
    
    console.log(`Found ${pageFiles.length} page files\n`);
    
    let fixed = 0;
    let clean = 0;
    
    for (const file of pageFiles) {
      const result = await fixPageSyntax(file);
      if (result) fixed++;
      else clean++;
    }
    
    console.log('\n=====================================');
    console.log(`${colors.green}✨ Complete!${colors.reset}`);
    console.log(`   Fixed: ${fixed} files`);
    console.log(`   Clean: ${clean} files`);
    
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

main().catch(console.error);