#!/usr/bin/env node

/**
 * Performance Audit Script
 * Analyzes bundle size, unused code, and performance metrics
 */

const fs = require('fs');
const path = require('path');

class PerformanceAuditor {
  constructor() {
    this.results = {
      bundleSize: {},
      unusedDependencies: [],
      performanceMetrics: {},
      recommendations: []
    };
  }

  async runAudit() {
    console.log('🔍 Starting Performance Audit...\n');
    
    await this.analyzeBundleSize();
    await this.checkUnusedDependencies();
    await this.analyzeImages();
    await this.checkCodeSplitting();
    this.generateRecommendations();
    
    this.printReport();
  }

  async analyzeBundleSize() {
    console.log('📦 Analyzing bundle size...');
    
    try {
      // Check if .next directory exists (after build)
      const buildDir = path.join(process.cwd(), '.next');
      if (!fs.existsSync(buildDir)) {
        this.results.recommendations.push({
          priority: 'medium',
          issue: 'No build found',
          solution: 'Run "npm run build" to analyze bundle size'
        });
        return;
      }

      // Analyze static chunks
      const staticDir = path.join(buildDir, 'static');
      if (fs.existsSync(staticDir)) {
        const jsDir = path.join(staticDir, 'chunks');
        if (fs.existsSync(jsDir)) {
          const chunks = fs.readdirSync(jsDir);
          let totalSize = 0;
          let largeChunks = [];

          chunks.forEach(chunk => {
            if (chunk.endsWith('.js')) {
              const filePath = path.join(jsDir, chunk);
              const stats = fs.statSync(filePath);
              const sizeKB = Math.round(stats.size / 1024);
              totalSize += sizeKB;

              if (sizeKB > 100) {
                largeChunks.push({ name: chunk, size: sizeKB });
              }
            }
          });

          this.results.bundleSize = {
            totalChunks: chunks.length,
            totalSizeKB: totalSize,
            largeChunks
          };

          console.log(`   Total JS size: ${totalSize}KB across ${chunks.length} chunks`);
          
          if (largeChunks.length > 0) {
            console.log(`   ⚠️  Large chunks found: ${largeChunks.length}`);
            this.results.recommendations.push({
              priority: 'medium',
              issue: `${largeChunks.length} large chunks (>100KB)`,
              solution: 'Consider code splitting or dynamic imports'
            });
          }
        }
      }
    } catch (error) {
      console.log(`   ❌ Error analyzing bundle: ${error.message}`);
    }
  }

  async checkUnusedDependencies() {
    console.log('📋 Checking for unused dependencies...');

    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      const srcDir = path.join(process.cwd(), 'src');
      
      // Get all source files
      const sourceFiles = this.getAllFiles(srcDir, ['.ts', '.tsx', '.js', '.jsx']);
      const allSourceCode = sourceFiles.map(file => 
        fs.readFileSync(file, 'utf8')
      ).join('\n');

      const unused = [];
      const used = [];

      Object.keys(dependencies).forEach(dep => {
        // Skip Next.js and React dependencies (likely used)
        if (dep.includes('next') || dep.includes('react') || dep.includes('@types')) {
          used.push(dep);
          return;
        }

        // Check if dependency is imported anywhere
        const importPatterns = [
          new RegExp(`from ['"]${dep}['"]`, 'g'),
          new RegExp(`import ['"]${dep}['"]`, 'g'),
          new RegExp(`require\\(['"]${dep}['"]\\)`, 'g')
        ];

        const isUsed = importPatterns.some(pattern => pattern.test(allSourceCode));
        
        if (isUsed) {
          used.push(dep);
        } else {
          unused.push(dep);
        }
      });

      this.results.unusedDependencies = unused;
      
      console.log(`   ✅ Used dependencies: ${used.length}`);
      console.log(`   ⚠️  Potentially unused: ${unused.length}`);
      
      if (unused.length > 0) {
        console.log(`   Unused: ${unused.slice(0, 5).join(', ')}${unused.length > 5 ? '...' : ''}`);
        this.results.recommendations.push({
          priority: 'low',
          issue: `${unused.length} potentially unused dependencies`,
          solution: 'Review and remove unused packages to reduce bundle size'
        });
      }
    } catch (error) {
      console.log(`   ❌ Error checking dependencies: ${error.message}`);
    }
  }

  async analyzeImages() {
    console.log('🖼️  Analyzing images...');

    try {
      const publicDir = path.join(process.cwd(), 'public');
      const imageFiles = this.getAllFiles(publicDir, ['.jpg', '.jpeg', '.png', '.gif', '.svg']);
      
      let totalImageSize = 0;
      const largeImages = [];
      
      imageFiles.forEach(imgPath => {
        const stats = fs.statSync(imgPath);
        const sizeKB = Math.round(stats.size / 1024);
        totalImageSize += sizeKB;
        
        if (sizeKB > 500) { // Images larger than 500KB
          largeImages.push({
            name: path.basename(imgPath),
            path: path.relative(process.cwd(), imgPath),
            size: sizeKB
          });
        }
      });

      this.results.performanceMetrics.images = {
        totalImages: imageFiles.length,
        totalSizeKB: totalImageSize,
        largeImages
      };

      console.log(`   Total images: ${imageFiles.length} (${totalImageSize}KB)`);
      
      if (largeImages.length > 0) {
        console.log(`   ⚠️  Large images: ${largeImages.length}`);
        this.results.recommendations.push({
          priority: 'high',
          issue: `${largeImages.length} large images (>500KB)`,
          solution: 'Optimize images using next/image or compress manually'
        });
      }
    } catch (error) {
      console.log(`   ❌ Error analyzing images: ${error.message}`);
    }
  }

  async checkCodeSplitting() {
    console.log('⚡ Checking code splitting opportunities...');

    try {
      const srcDir = path.join(process.cwd(), 'src');
      const pageFiles = this.getAllFiles(path.join(srcDir, 'app'), ['.tsx', '.ts']);
      
      let dynamicImports = 0;
      let staticImports = 0;
      const heavyPages = [];

      pageFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        const dynamicMatches = content.match(/import\s*\(/g) || [];
        const staticMatches = content.match(/^import\s+/gm) || [];
        
        dynamicImports += dynamicMatches.length;
        staticImports += staticMatches.length;

        // Check for pages with many imports (potential splitting candidates)
        if (staticMatches.length > 15) {
          heavyPages.push({
            file: path.relative(srcDir, filePath),
            imports: staticMatches.length
          });
        }
      });

      this.results.performanceMetrics.codeSplitting = {
        dynamicImports,
        staticImports,
        heavyPages
      };

      console.log(`   Dynamic imports: ${dynamicImports}`);
      console.log(`   Static imports: ${staticImports}`);
      
      if (heavyPages.length > 0) {
        console.log(`   ⚠️  Pages with many imports: ${heavyPages.length}`);
        this.results.recommendations.push({
          priority: 'medium',
          issue: `${heavyPages.length} pages with many imports`,
          solution: 'Consider lazy loading components with dynamic imports'
        });
      }

      if (dynamicImports < 3) {
        this.results.recommendations.push({
          priority: 'low',
          issue: 'Limited use of dynamic imports',
          solution: 'Consider lazy loading heavy components or libraries'
        });
      }
    } catch (error) {
      console.log(`   ❌ Error checking code splitting: ${error.message}`);
    }
  }

  generateRecommendations() {
    console.log('\n💡 Generating optimization recommendations...');

    // Bundle size recommendations
    if (this.results.bundleSize.totalSizeKB > 1000) {
      this.results.recommendations.push({
        priority: 'high',
        issue: 'Large total bundle size',
        solution: 'Implement aggressive code splitting and tree shaking'
      });
    }

    // General performance recommendations
    this.results.recommendations.push({
      priority: 'medium',
      issue: 'Performance optimization',
      solution: 'Enable Next.js Image optimization and add performance monitoring'
    });

    if (this.results.unusedDependencies.length > 5) {
      this.results.recommendations.push({
        priority: 'medium',
        issue: 'Many unused dependencies',
        solution: 'Regular dependency audit and cleanup'
      });
    }
  }

  getAllFiles(dir, extensions) {
    let files = [];
    
    if (!fs.existsSync(dir)) return files;
    
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files = files.concat(this.getAllFiles(fullPath, extensions));
      } else {
        const ext = path.extname(item).toLowerCase();
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    });
    
    return files;
  }

  printReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PERFORMANCE AUDIT REPORT');
    console.log('='.repeat(60));

    // Bundle Analysis
    if (this.results.bundleSize.totalSizeKB) {
      console.log('\n📦 Bundle Analysis:');
      console.log(`   Total Size: ${this.results.bundleSize.totalSizeKB}KB`);
      console.log(`   Chunks: ${this.results.bundleSize.totalChunks}`);
      
      if (this.results.bundleSize.largeChunks.length > 0) {
        console.log('\n   Large Chunks:');
        this.results.bundleSize.largeChunks.forEach(chunk => {
          console.log(`   - ${chunk.name}: ${chunk.size}KB`);
        });
      }
    }

    // Image Analysis
    if (this.results.performanceMetrics.images) {
      console.log('\n🖼️  Image Analysis:');
      console.log(`   Total Images: ${this.results.performanceMetrics.images.totalImages}`);
      console.log(`   Total Size: ${this.results.performanceMetrics.images.totalSizeKB}KB`);
      
      if (this.results.performanceMetrics.images.largeImages.length > 0) {
        console.log('\n   Large Images:');
        this.results.performanceMetrics.images.largeImages.forEach(img => {
          console.log(`   - ${img.name}: ${img.size}KB`);
        });
      }
    }

    // Code Splitting
    if (this.results.performanceMetrics.codeSplitting) {
      console.log('\n⚡ Code Splitting:');
      console.log(`   Dynamic Imports: ${this.results.performanceMetrics.codeSplitting.dynamicImports}`);
      console.log(`   Static Imports: ${this.results.performanceMetrics.codeSplitting.staticImports}`);
    }

    // Unused Dependencies
    if (this.results.unusedDependencies.length > 0) {
      console.log('\n📋 Potentially Unused Dependencies:');
      this.results.unusedDependencies.slice(0, 10).forEach(dep => {
        console.log(`   - ${dep}`);
      });
      if (this.results.unusedDependencies.length > 10) {
        console.log(`   ... and ${this.results.unusedDependencies.length - 10} more`);
      }
    }

    // Recommendations
    console.log('\n💡 Optimization Recommendations:');
    const highPriority = this.results.recommendations.filter(r => r.priority === 'high');
    const mediumPriority = this.results.recommendations.filter(r => r.priority === 'medium');
    const lowPriority = this.results.recommendations.filter(r => r.priority === 'low');

    if (highPriority.length > 0) {
      console.log('\n   🔴 HIGH PRIORITY:');
      highPriority.forEach(rec => {
        console.log(`   - ${rec.issue}`);
        console.log(`     Solution: ${rec.solution}`);
      });
    }

    if (mediumPriority.length > 0) {
      console.log('\n   🟡 MEDIUM PRIORITY:');
      mediumPriority.forEach(rec => {
        console.log(`   - ${rec.issue}`);
        console.log(`     Solution: ${rec.solution}`);
      });
    }

    if (lowPriority.length > 0) {
      console.log('\n   🟢 LOW PRIORITY:');
      lowPriority.forEach(rec => {
        console.log(`   - ${rec.issue}`);
        console.log(`     Solution: ${rec.solution}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Audit Complete!');
    console.log('💡 Tip: Run this after each major feature to track performance');
    console.log('='.repeat(60));
  }
}

// Run the audit
const auditor = new PerformanceAuditor();
auditor.runAudit().catch(console.error);