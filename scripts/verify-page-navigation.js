#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Define expected navigation patterns for each section
const NAVIGATION_PATTERNS = {
  'portal': {
    expectedLinks: ['/portal/dashboard', '/portal/appointments', '/portal/devices', '/portal/reports', '/portal/billing'],
    description: 'Customer Portal'
  },
  'team-portal': {
    expectedLinks: ['/team-portal/dashboard', '/team-portal/customers', '/team-portal/invoices', '/team-portal/schedule'],
    description: 'Team Portal'
  },
  'tester-portal': {
    expectedLinks: ['/tester-portal/dashboard', '/tester-portal/schedule', '/tester-portal/reports', '/tester-portal/customers'],
    description: 'Tester Portal'
  },
  'field': {
    expectedLinks: ['/field/dashboard', '/field/appointments', '/field/route', '/field/test-report'],
    description: 'Field Operations'
  },
  'admin': {
    expectedLinks: ['/admin/dashboard', '/admin/bookings'],
    description: 'Admin Panel'
  },
  'business-admin': {
    expectedLinks: ['/business-admin/leads', '/business-admin/lead-generator'],
    description: 'Business Admin'
  }
};

class NavigationVerifier {
  constructor() {
    this.issues = [];
    this.stats = {
      totalPages: 0,
      pagesChecked: 0,
      pagesWithIssues: 0,
      totalLinks: 0,
      brokenLinks: 0,
      missingLinkImports: 0
    };
    this.pageMap = new Map();
  }

  async findAllPages() {
    const appDir = path.join(process.cwd(), 'src', 'app');
    const pages = [];
    
    async function scanDir(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('api')) {
          await scanDir(fullPath);
        } else if (entry.isFile() && entry.name === 'page.tsx') {
          const relativePath = path.relative(appDir, fullPath);
          const route = '/' + path.dirname(relativePath).replace(/\\/g, '/');
          pages.push({
            file: fullPath,
            route: route === '/.' ? '/' : route,
            section: route.split('/')[1] || 'root'
          });
        }
      }
    }
    
    await scanDir(appDir);
    return pages;
  }

  async analyzePageContent(page) {
    const content = await fs.readFile(page.file, 'utf-8');
    const issues = [];
    const links = [];
    
    // Check for Link import
    const hasLinkImport = /import\s+.*Link.*\s+from\s+['"]next\/link['"]/.test(content) ||
                         /import\s+Link\s+from\s+['"]next\/link['"]/.test(content);
    
    // Find all Link components and their hrefs
    const linkRegex = /<Link\s+(?:[^>]*?\s+)?href=["']([^"']+)["']/g;
    const aTagRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["']/g;
    
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      links.push({
        href: match[1],
        type: 'Link',
        line: content.substring(0, match.index).split('\n').length
      });
    }
    
    // Check for regular anchor tags (potential issues)
    while ((match = aTagRegex.exec(content)) !== null) {
      const href = match[1];
      if (href.startsWith('/') && !href.startsWith('//')) {
        issues.push({
          type: 'anchor-tag',
          message: `Using <a> tag for internal navigation instead of <Link>`,
          href,
          line: content.substring(0, match.index).split('\n').length
        });
      }
      links.push({
        href,
        type: 'a',
        line: content.substring(0, match.index).split('\n').length
      });
    }
    
    // Check if Link is used but not imported
    if (links.some(l => l.type === 'Link') && !hasLinkImport) {
      issues.push({
        type: 'missing-import',
        message: 'Link component used but not imported from next/link'
      });
      this.stats.missingLinkImports++;
    }
    
    // Check for router.push usage
    const routerPushRegex = /router\.push\(['"]([^'"]+)['"]\)/g;
    while ((match = routerPushRegex.exec(content)) !== null) {
      links.push({
        href: match[1],
        type: 'router.push',
        line: content.substring(0, match.index).split('\n').length
      });
    }
    
    return { issues, links, hasLinkImport };
  }

  validateLink(fromPage, link) {
    const issues = [];
    
    // Skip external links, API routes, hash links, and valid external protocols
    if (link.href.startsWith('http') || 
        link.href.startsWith('//') || 
        link.href.startsWith('#') ||
        link.href.startsWith('/api/') ||
        link.href.startsWith('mailto:') ||
        link.href.startsWith('tel:') ||
        link.href.startsWith('sms:') ||
        link.href === '') {
      return issues;
    }
    
    // Normalize the href (remove query params and hash)
    const normalizedHref = link.href.split('?')[0].split('#')[0];
    
    // Check if it's a dynamic route
    const isDynamic = normalizedHref.includes('[');
    
    if (!isDynamic) {
      // Check if the target page exists
      const targetExists = Array.from(this.pageMap.keys()).some(route => {
        // Handle dynamic routes in pageMap
        const routePattern = route.replace(/\[.*?\]/g, '[id]');
        const hrefPattern = normalizedHref.replace(/\/\d+/g, '/[id]');
        return route === normalizedHref || routePattern === hrefPattern;
      });
      
      if (!targetExists && normalizedHref !== '/') {
        issues.push({
          type: 'broken-link',
          message: `Link to non-existent page: ${link.href}`,
          targetHref: link.href,
          line: link.line
        });
        this.stats.brokenLinks++;
      }
    }
    
    // Check navigation consistency based on section
    const section = fromPage.section;
    if (NAVIGATION_PATTERNS[section]) {
      const pattern = NAVIGATION_PATTERNS[section];
      
      // Check if page is missing expected navigation links
      if (fromPage.route.endsWith('/dashboard') || fromPage.route === `/${section}`) {
        const missingLinks = pattern.expectedLinks.filter(
          expectedLink => !fromPage.allLinks.some(l => l.href.startsWith(expectedLink))
        );
        
        if (missingLinks.length > 0) {
          issues.push({
            type: 'missing-navigation',
            message: `Missing expected navigation links: ${missingLinks.join(', ')}`,
            section
          });
        }
      }
    }
    
    return issues;
  }

  async verify() {
    console.log(`${COLORS.cyan}${COLORS.bright}🔍 Navigation Verification Script${COLORS.reset}`);
    console.log(`${COLORS.cyan}${'='.repeat(50)}${COLORS.reset}\n`);
    
    // Find all pages
    const pages = await this.findAllPages();
    this.stats.totalPages = pages.length;
    
    // Build page map for validation
    pages.forEach(page => {
      this.pageMap.set(page.route, page);
    });
    
    console.log(`${COLORS.blue}Found ${pages.length} pages to analyze${COLORS.reset}\n`);
    
    // Analyze each page
    for (const page of pages) {
      const { issues: contentIssues, links, hasLinkImport } = await this.analyzePageContent(page);
      page.issues = contentIssues;
      page.allLinks = links;
      page.hasLinkImport = hasLinkImport;
      
      this.stats.pagesChecked++;
      this.stats.totalLinks += links.length;
      
      // Validate each link
      for (const link of links) {
        const linkIssues = this.validateLink(page, link);
        page.issues.push(...linkIssues);
      }
      
      if (page.issues.length > 0) {
        this.stats.pagesWithIssues++;
        this.issues.push({ page, issues: page.issues });
      }
    }
    
    // Generate report
    this.generateReport(pages);
  }

  generateReport(pages) {
    console.log(`${COLORS.bright}📊 VERIFICATION RESULTS${COLORS.reset}`);
    console.log(`${'='.repeat(50)}\n`);
    
    // Statistics
    console.log(`${COLORS.cyan}Statistics:${COLORS.reset}`);
    console.log(`  Total pages: ${this.stats.totalPages}`);
    console.log(`  Pages checked: ${this.stats.pagesChecked}`);
    console.log(`  Pages with issues: ${this.stats.pagesWithIssues}`);
    console.log(`  Total links found: ${this.stats.totalLinks}`);
    console.log(`  Broken links: ${this.stats.brokenLinks}`);
    console.log(`  Missing Link imports: ${this.stats.missingLinkImports}`);
    console.log();
    
    // Group pages by section
    const sections = {};
    pages.forEach(page => {
      if (!sections[page.section]) {
        sections[page.section] = [];
      }
      sections[page.section].push(page);
    });
    
    // Display pages by section
    console.log(`${COLORS.cyan}Pages by Section:${COLORS.reset}`);
    Object.entries(sections).forEach(([section, sectionPages]) => {
      const sectionDesc = NAVIGATION_PATTERNS[section]?.description || section;
      console.log(`\n  ${COLORS.bright}${sectionDesc}${COLORS.reset} (${sectionPages.length} pages):`);
      sectionPages.forEach(page => {
        const status = page.issues.length > 0 ? `${COLORS.red}✗${COLORS.reset}` : `${COLORS.green}✓${COLORS.reset}`;
        console.log(`    ${status} ${page.route}`);
      });
    });
    
    // Display issues if any
    if (this.issues.length > 0) {
      console.log(`\n${COLORS.red}${COLORS.bright}⚠️  ISSUES FOUND${COLORS.reset}`);
      console.log(`${'='.repeat(50)}\n`);
      
      this.issues.forEach(({ page, issues }) => {
        console.log(`${COLORS.yellow}📄 ${page.route}${COLORS.reset}`);
        issues.forEach(issue => {
          let icon = '❌';
          if (issue.type === 'missing-import') icon = '📦';
          else if (issue.type === 'anchor-tag') icon = '⚠️';
          else if (issue.type === 'missing-navigation') icon = '🔗';
          
          console.log(`  ${icon} ${issue.message}`);
          if (issue.line) {
            console.log(`     Line: ${issue.line}`);
          }
        });
        console.log();
      });
      
      // Summary and recommendations
      console.log(`${COLORS.magenta}${COLORS.bright}💡 RECOMMENDATIONS${COLORS.reset}`);
      console.log(`${'='.repeat(50)}\n`);
      
      if (this.stats.missingLinkImports > 0) {
        console.log(`• Add ${COLORS.cyan}import Link from 'next/link'${COLORS.reset} to pages using Link component`);
      }
      
      if (this.stats.brokenLinks > 0) {
        console.log(`• Fix ${this.stats.brokenLinks} broken link(s) pointing to non-existent pages`);
      }
      
      const anchorTagIssues = this.issues.flatMap(i => i.issues).filter(i => i.type === 'anchor-tag');
      if (anchorTagIssues.length > 0) {
        console.log(`• Replace ${anchorTagIssues.length} <a> tags with <Link> components for internal navigation`);
      }
      
      console.log(`\n${COLORS.yellow}Run 'npm run lint' to auto-fix some issues${COLORS.reset}`);
    } else {
      console.log(`\n${COLORS.green}${COLORS.bright}✅ All pages are properly configured!${COLORS.reset}`);
    }
    
    // Exit with appropriate code
    process.exit(this.issues.length > 0 ? 1 : 0);
  }
}

// Run verification
async function main() {
  try {
    const verifier = new NavigationVerifier();
    await verifier.verify();
  } catch (error) {
    console.error(`${COLORS.red}Error during verification:${COLORS.reset}`, error);
    process.exit(1);
  }
}

main();