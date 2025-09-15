#!/usr/bin/env node
/**
 * COMPREHENSIVE PLATFORM AUDIT SCRIPT
 *
 * This script performs a systematic, line-by-line audit of the entire
 * Fisher Backflows platform to ensure 100% launch readiness.
 *
 * Focus Areas:
 * - User Experience & Usability
 * - Code Quality & Security
 * - Performance & Accessibility
 * - Business Logic Completeness
 * - Error Handling & Edge Cases
 * - Mobile Responsiveness
 * - Data Flow & Integration
 *
 * Usage: node scripts/comprehensive-platform-audit.js
 */

const fs = require('fs');
const path = require('path');

class PlatformAuditor {
  constructor() {
    this.auditResults = {
      summary: {
        totalPages: 0,
        pagesAudited: 0,
        criticalIssues: 0,
        warningIssues: 0,
        suggestions: 0,
        startTime: new Date(),
        endTime: null
      },
      pageAudits: [],
      overallRecommendations: []
    };

    this.srcPath = path.join(__dirname, '../src');
    this.currentPageIndex = 0;
  }

  /**
   * MAIN AUDIT EXECUTION
   */
  async executeFullAudit() {
    console.log('🔍 STARTING COMPREHENSIVE PLATFORM AUDIT');
    console.log('==========================================\n');

    // 1. Discover all pages
    const allPages = await this.discoverAllPages();
    this.auditResults.summary.totalPages = allPages.length;

    console.log(`📋 Found ${allPages.length} pages to audit\n`);

    // 2. Audit each page systematically
    for (const page of allPages) {
      await this.auditSinglePage(page);
    }

    // 3. Generate final report
    await this.generateFinalReport();

    console.log('\n✅ AUDIT COMPLETE - Report saved to audit-report.json');
  }

  /**
   * DISCOVER ALL PAGES IN THE PLATFORM
   */
  async discoverAllPages() {
    const pages = [];

    // Define all page categories to audit
    const pageCategories = [
      // Landing & Marketing
      { path: 'app/page.tsx', category: 'Landing', priority: 'CRITICAL' },

      // Customer Portal
      { path: 'app/portal/page.tsx', category: 'Customer Portal', priority: 'CRITICAL' },
      { path: 'app/portal/login/page.tsx', category: 'Customer Portal', priority: 'CRITICAL' },
      { path: 'app/portal/register/page.tsx', category: 'Customer Portal', priority: 'CRITICAL' },
      { path: 'app/portal/dashboard/page.tsx', category: 'Customer Portal', priority: 'CRITICAL' },
      { path: 'app/portal/billing/page.tsx', category: 'Customer Portal', priority: 'HIGH' },
      { path: 'app/portal/devices/page.tsx', category: 'Customer Portal', priority: 'HIGH' },
      { path: 'app/portal/reports/page.tsx', category: 'Customer Portal', priority: 'HIGH' },
      { path: 'app/portal/schedule/page.tsx', category: 'Customer Portal', priority: 'HIGH' },
      { path: 'app/portal/profile/page.tsx', category: 'Customer Portal', priority: 'MEDIUM' },

      // Team Portal
      { path: 'app/team-portal/page.tsx', category: 'Team Portal', priority: 'CRITICAL' },
      { path: 'app/team-portal/login/page.tsx', category: 'Team Portal', priority: 'CRITICAL' },
      { path: 'app/team-portal/register-company/page.tsx', category: 'Team Portal', priority: 'CRITICAL' },
      { path: 'app/team-portal/dashboard/page.tsx', category: 'Team Portal', priority: 'CRITICAL' },
      { path: 'app/team-portal/customers/page.tsx', category: 'Team Portal', priority: 'HIGH' },
      { path: 'app/team-portal/schedule/page.tsx', category: 'Team Portal', priority: 'HIGH' },
      { path: 'app/team-portal/invoices/page.tsx', category: 'Team Portal', priority: 'HIGH' },
      { path: 'app/team-portal/test-reports/page.tsx', category: 'Team Portal', priority: 'HIGH' },
      { path: 'app/team-portal/settings/page.tsx', category: 'Team Portal', priority: 'MEDIUM' },
      { path: 'app/team-portal/more/page.tsx', category: 'Team Portal', priority: 'MEDIUM' },

      // Field App
      { path: 'app/field/page.tsx', category: 'Field App', priority: 'HIGH' },
      { path: 'app/field/login/page.tsx', category: 'Field App', priority: 'HIGH' },
      { path: 'app/field/dashboard/page.tsx', category: 'Field App', priority: 'HIGH' },

      // Admin Panel
      { path: 'app/admin/page.tsx', category: 'Admin Panel', priority: 'MEDIUM' },
      { path: 'app/admin/dashboard/page.tsx', category: 'Admin Panel', priority: 'MEDIUM' },

      // API Routes (Critical for functionality)
      { path: 'app/api/auth/login/route.ts', category: 'API', priority: 'CRITICAL' },
      { path: 'app/api/auth/register/route.ts', category: 'API', priority: 'CRITICAL' },
      { path: 'app/api/team/auth/login/route.ts', category: 'API', priority: 'CRITICAL' },
      { path: 'app/api/team/company/register/route.ts', category: 'API', priority: 'CRITICAL' },

      // Layouts (Critical for UX consistency)
      { path: 'app/layout.tsx', category: 'Layout', priority: 'CRITICAL' },
      { path: 'app/portal/layout.tsx', category: 'Layout', priority: 'HIGH' },
      { path: 'app/team-portal/layout.tsx', category: 'Layout', priority: 'HIGH' },

      // Components (UI Foundation)
      { path: 'components/ui/button.tsx', category: 'Components', priority: 'HIGH' },
      { path: 'components/ui/input.tsx', category: 'Components', priority: 'HIGH' },
      { path: 'components/navigation/UnifiedNavigation.tsx', category: 'Components', priority: 'HIGH' }
    ];

    // Check which files actually exist
    for (const page of pageCategories) {
      const fullPath = path.join(this.srcPath, page.path);
      if (fs.existsSync(fullPath)) {
        pages.push({
          ...page,
          fullPath,
          exists: true
        });
      } else {
        pages.push({
          ...page,
          fullPath,
          exists: false
        });
      }
    }

    // Also discover any additional pages we might have missed
    const additionalPages = await this.discoverAdditionalPages();
    pages.push(...additionalPages);

    return pages.sort((a, b) => {
      const priorityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * DISCOVER ADDITIONAL PAGES WE MIGHT HAVE MISSED
   */
  async discoverAdditionalPages() {
    const additionalPages = [];

    // Recursively find all page.tsx and route.ts files
    const findFiles = (dir, pattern) => {
      const files = [];
      const items = fs.readdirSync(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dir, item.name);

        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
          files.push(...findFiles(fullPath, pattern));
        } else if (item.isFile() && pattern.test(item.name)) {
          files.push(fullPath);
        }
      }

      return files;
    };

    const pageFiles = findFiles(this.srcPath, /^(page\.tsx|route\.ts)$/);

    for (const filePath of pageFiles) {
      const relativePath = path.relative(this.srcPath, filePath);

      // Skip if we already have this file
      if (!this.auditResults.pageAudits.find(p => p.path === relativePath)) {
        additionalPages.push({
          path: relativePath,
          category: 'Discovered',
          priority: 'MEDIUM',
          fullPath: filePath,
          exists: true
        });
      }
    }

    return additionalPages;
  }

  /**
   * AUDIT A SINGLE PAGE COMPREHENSIVELY
   */
  async auditSinglePage(page) {
    this.currentPageIndex++;
    console.log(`\n🔍 [${this.currentPageIndex}/${this.auditResults.summary.totalPages}] Auditing: ${page.path}`);
    console.log('─'.repeat(60));

    const audit = {
      path: page.path,
      category: page.category,
      priority: page.priority,
      exists: page.exists,
      timestamp: new Date(),
      issues: {
        critical: [],
        warnings: [],
        suggestions: []
      },
      metrics: {
        linesOfCode: 0,
        complexity: 'UNKNOWN',
        performance: 'UNKNOWN',
        accessibility: 'UNKNOWN',
        security: 'UNKNOWN',
        usability: 'UNKNOWN'
      },
      analysis: {
        purpose: '',
        userFlow: '',
        dependencies: [],
        dataFlow: '',
        errorHandling: '',
        mobileResponsive: false,
        loadingStates: false,
        validation: false
      }
    };

    if (!page.exists) {
      audit.issues.critical.push('File does not exist - missing critical page');
      audit.analysis.purpose = 'MISSING FILE';
    } else {
      // Read and analyze the file
      const content = fs.readFileSync(page.fullPath, 'utf8');
      audit.metrics.linesOfCode = content.split('\n').length;

      // Perform comprehensive analysis
      await this.analyzeCode(content, audit, page);
      await this.analyzeUserExperience(content, audit, page);
      await this.analyzeSecurity(content, audit, page);
      await this.analyzePerformance(content, audit, page);
      await this.analyzeAccessibility(content, audit, page);
      await this.analyzeMobileResponsiveness(content, audit, page);
      await this.analyzeErrorHandling(content, audit, page);
      await this.analyzeDataFlow(content, audit, page);
    }

    // Update summary counters
    this.auditResults.summary.criticalIssues += audit.issues.critical.length;
    this.auditResults.summary.warningIssues += audit.issues.warnings.length;
    this.auditResults.summary.suggestions += audit.issues.suggestions.length;
    this.auditResults.summary.pagesAudited++;

    this.auditResults.pageAudits.push(audit);

    // Print summary for this page
    this.printPageSummary(audit);
  }

  /**
   * ANALYZE CODE QUALITY AND STRUCTURE
   */
  async analyzeCode(content, audit, page) {
    // Check for TypeScript usage
    if (!content.includes('TypeScript') && page.path.endsWith('.tsx')) {
      audit.issues.suggestions.push('Consider adding explicit TypeScript types for better code quality');
    }

    // Check for proper imports
    const hasReactImport = content.includes("import React") || content.includes("'react'");
    if (page.path.endsWith('.tsx') && !hasReactImport) {
      audit.issues.warnings.push('Missing React import - may cause runtime issues');
    }

    // Check for unused imports
    const importLines = content.match(/^import .+$/gm) || [];
    const unusedImports = [];

    for (const importLine of importLines) {
      const matches = importLine.match(/import\s+{([^}]+)}/);
      if (matches) {
        const imports = matches[1].split(',').map(i => i.trim());
        for (const imp of imports) {
          if (!content.includes(imp.replace(/\s+as\s+\w+/, ''))) {
            unusedImports.push(imp);
          }
        }
      }
    }

    if (unusedImports.length > 0) {
      audit.issues.suggestions.push(`Unused imports detected: ${unusedImports.join(', ')}`);
    }

    // Analyze complexity
    const functionCount = (content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length;
    const useStateCount = (content.match(/useState/g) || []).length;
    const useEffectCount = (content.match(/useEffect/g) || []).length;

    if (functionCount > 10) {
      audit.metrics.complexity = 'HIGH';
      audit.issues.warnings.push('High complexity - consider breaking into smaller components');
    } else if (functionCount > 5) {
      audit.metrics.complexity = 'MEDIUM';
    } else {
      audit.metrics.complexity = 'LOW';
    }

    audit.analysis.dependencies = this.extractDependencies(content);
  }

  /**
   * ANALYZE USER EXPERIENCE AND USABILITY
   */
  async analyzeUserExperience(content, audit, page) {
    // Check for loading states
    if (content.includes('loading') || content.includes('isLoading')) {
      audit.analysis.loadingStates = true;
    } else if (page.priority === 'CRITICAL') {
      audit.issues.warnings.push('No loading states detected - poor UX for slow connections');
    }

    // Check for error handling
    if (content.includes('error') || content.includes('catch')) {
      audit.analysis.errorHandling = 'Present';
    } else {
      audit.issues.warnings.push('No error handling detected - users may see crashes');
      audit.analysis.errorHandling = 'Missing';
    }

    // Check for form validation
    if (content.includes('form') || content.includes('input')) {
      if (content.includes('required') || content.includes('validation')) {
        audit.analysis.validation = true;
      } else {
        audit.issues.warnings.push('Forms detected without validation - poor UX');
      }
    }

    // Check for accessibility
    const hasAriaLabels = content.includes('aria-label') || content.includes('aria-');
    const hasAltText = content.includes('alt=');

    if (!hasAriaLabels && !hasAltText) {
      audit.issues.warnings.push('No accessibility attributes detected');
      audit.metrics.accessibility = 'POOR';
    } else {
      audit.metrics.accessibility = 'GOOD';
    }

    // Analyze user flow
    audit.analysis.userFlow = this.analyzeUserFlow(content, page);

    // Check for usability best practices
    this.checkUsabilityBestPractices(content, audit);
  }

  /**
   * ANALYZE SECURITY CONCERNS
   */
  async analyzeSecurity(content, audit, page) {
    const securityIssues = [];

    // Check for potential XSS vulnerabilities
    if (content.includes('dangerouslySetInnerHTML')) {
      securityIssues.push('CRITICAL: dangerouslySetInnerHTML detected - XSS risk');
    }

    // Check for hardcoded secrets
    const secretPatterns = [
      /api[_-]?key[_-]?=["'][\w-]+["']/i,
      /secret[_-]?key[_-]?=["'][\w-]+["']/i,
      /password[_-]?=["'][\w-]+["']/i,
      /token[_-]?=["'][\w-]+["']/i
    ];

    for (const pattern of secretPatterns) {
      if (pattern.test(content)) {
        securityIssues.push('CRITICAL: Hardcoded secrets detected');
        break;
      }
    }

    // Check for proper authentication
    if (page.category.includes('Portal') && !content.includes('auth')) {
      securityIssues.push('WARNING: No authentication detected on protected page');
    }

    // Check for SQL injection risks (in API routes)
    if (page.path.includes('api') && content.includes('query') && !content.includes('parameterized')) {
      securityIssues.push('WARNING: Potential SQL injection risk - use parameterized queries');
    }

    audit.issues.critical.push(...securityIssues.filter(i => i.startsWith('CRITICAL')));
    audit.issues.warnings.push(...securityIssues.filter(i => i.startsWith('WARNING')));

    audit.metrics.security = securityIssues.length === 0 ? 'GOOD' : 'NEEDS_ATTENTION';
  }

  /**
   * ANALYZE PERFORMANCE IMPLICATIONS
   */
  async analyzePerformance(content, audit, page) {
    const performanceIssues = [];

    // Check for large imports
    if (content.includes('import *')) {
      performanceIssues.push('Wildcard imports may hurt bundle size');
    }

    // Check for useEffect without dependencies
    const useEffectMatches = content.match(/useEffect\s*\([^,]+,\s*(\[[^\]]*\])?/g);
    if (useEffectMatches) {
      for (const match of useEffectMatches) {
        if (!match.includes('[') || match.includes('[]')) {
          performanceIssues.push('useEffect may cause unnecessary re-renders');
        }
      }
    }

    // Check for inline styles (can hurt performance)
    if (content.includes('style={{')) {
      performanceIssues.push('Inline styles detected - consider CSS classes');
    }

    // Check for image optimization
    if (content.includes('<img') && !content.includes('next/image')) {
      performanceIssues.push('Use Next.js Image component for optimization');
    }

    audit.issues.suggestions.push(...performanceIssues);
    audit.metrics.performance = performanceIssues.length < 2 ? 'GOOD' : 'NEEDS_OPTIMIZATION';
  }

  /**
   * ANALYZE ACCESSIBILITY
   */
  async analyzeAccessibility(content, audit, page) {
    const a11yIssues = [];

    // Check for missing alt text on images
    if (content.includes('<img') || content.includes('<Image')) {
      if (!content.includes('alt=')) {
        a11yIssues.push('Images missing alt text');
      }
    }

    // Check for proper heading hierarchy
    const headings = content.match(/<h[1-6]/g);
    if (headings && headings.length > 1) {
      // Simple check - should start with h1
      if (!content.includes('<h1')) {
        a11yIssues.push('Missing h1 heading for page structure');
      }
    }

    // Check for form labels
    if (content.includes('<input') && !content.includes('label')) {
      a11yIssues.push('Form inputs missing labels');
    }

    // Check for button text
    if (content.includes('<button') && content.includes('<button>')) {
      a11yIssues.push('Buttons with empty text detected');
    }

    audit.issues.warnings.push(...a11yIssues);
    audit.metrics.accessibility = a11yIssues.length === 0 ? 'GOOD' : 'NEEDS_IMPROVEMENT';
  }

  /**
   * ANALYZE MOBILE RESPONSIVENESS
   */
  async analyzeMobileResponsiveness(content, audit, page) {
    const mobileIndicators = [
      'sm:', 'md:', 'lg:', 'xl:', // Tailwind breakpoints
      'mobile', 'tablet', 'desktop',
      '@media', 'responsive'
    ];

    const hasMobileCSS = mobileIndicators.some(indicator => content.includes(indicator));
    audit.analysis.mobileResponsive = hasMobileCSS;

    if (!hasMobileCSS && page.priority === 'CRITICAL') {
      audit.issues.warnings.push('No mobile responsiveness detected - critical for modern web');
    }
  }

  /**
   * ANALYZE ERROR HANDLING
   */
  async analyzeErrorHandling(content, audit, page) {
    const hasErrorBoundary = content.includes('ErrorBoundary');
    const hasTryCatch = content.includes('try') && content.includes('catch');
    const hasErrorState = content.includes('error') || content.includes('Error');

    if (!hasErrorBoundary && !hasTryCatch && !hasErrorState) {
      audit.issues.warnings.push('No error handling detected');
    }

    // Check for API error handling
    if (content.includes('fetch') || content.includes('axios')) {
      if (!content.includes('.catch') && !hasTryCatch) {
        audit.issues.warnings.push('API calls missing error handling');
      }
    }
  }

  /**
   * ANALYZE DATA FLOW
   */
  async analyzeDataFlow(content, audit, page) {
    const dataFlowElements = [];

    if (content.includes('useState')) dataFlowElements.push('Local State');
    if (content.includes('useContext')) dataFlowElements.push('Context');
    if (content.includes('fetch') || content.includes('axios')) dataFlowElements.push('API Calls');
    if (content.includes('localStorage') || content.includes('sessionStorage')) dataFlowElements.push('Browser Storage');
    if (content.includes('router') || content.includes('navigate')) dataFlowElements.push('Navigation');

    audit.analysis.dataFlow = dataFlowElements.join(', ') || 'Static';
  }

  /**
   * CHECK USABILITY BEST PRACTICES
   */
  checkUsabilityBestPractices(content, audit) {
    // Check for user feedback mechanisms
    if (!content.includes('toast') && !content.includes('alert') && !content.includes('notification')) {
      audit.issues.suggestions.push('Consider adding user feedback (toasts/alerts)');
    }

    // Check for consistent button sizes and spacing
    if (content.includes('button') && !content.includes('class') && !content.includes('className')) {
      audit.issues.suggestions.push('Buttons should have consistent styling');
    }

    // Check for proper contrast (basic check)
    if (content.includes('text-gray-') && content.includes('bg-gray-')) {
      audit.issues.suggestions.push('Verify color contrast meets WCAG guidelines');
    }
  }

  /**
   * ANALYZE USER FLOW FOR THE PAGE
   */
  analyzeUserFlow(content, page) {
    if (page.path.includes('login')) {
      return 'User enters credentials → Validation → Authentication → Redirect to dashboard';
    } else if (page.path.includes('register')) {
      return 'User fills form → Validation → Account creation → Email verification → Login';
    } else if (page.path.includes('dashboard')) {
      return 'User views overview → Navigates to specific features → Performs actions';
    } else if (page.path.includes('api')) {
      return 'Request received → Validation → Business logic → Database operation → Response';
    } else {
      return 'User visits page → Views content → Interacts with elements';
    }
  }

  /**
   * EXTRACT DEPENDENCIES FROM CODE
   */
  extractDependencies(content) {
    const imports = content.match(/^import .+ from ['"][^'"]+['"];?$/gm) || [];
    return imports.map(imp => {
      const match = imp.match(/from ['"]([^'"]+)['"]/);
      return match ? match[1] : '';
    }).filter(Boolean);
  }

  /**
   * PRINT PAGE AUDIT SUMMARY
   */
  printPageSummary(audit) {
    const status = audit.issues.critical.length > 0 ? '🔴 CRITICAL' :
                  audit.issues.warnings.length > 0 ? '🟡 WARNINGS' : '🟢 GOOD';

    console.log(`Status: ${status}`);
    console.log(`Lines of Code: ${audit.metrics.linesOfCode}`);
    console.log(`Complexity: ${audit.metrics.complexity}`);
    console.log(`Issues: ${audit.issues.critical.length} critical, ${audit.issues.warnings.length} warnings, ${audit.issues.suggestions.length} suggestions`);

    if (audit.issues.critical.length > 0) {
      console.log('\n🔴 CRITICAL ISSUES:');
      audit.issues.critical.forEach(issue => console.log(`  • ${issue}`));
    }

    if (audit.issues.warnings.length > 0) {
      console.log('\n🟡 WARNINGS:');
      audit.issues.warnings.slice(0, 3).forEach(issue => console.log(`  • ${issue}`));
      if (audit.issues.warnings.length > 3) {
        console.log(`  • ... and ${audit.issues.warnings.length - 3} more`);
      }
    }
  }

  /**
   * GENERATE FINAL COMPREHENSIVE REPORT
   */
  async generateFinalReport() {
    this.auditResults.summary.endTime = new Date();
    const duration = this.auditResults.summary.endTime - this.auditResults.summary.startTime;

    // Generate overall recommendations
    this.generateOverallRecommendations();

    // Calculate scores
    const totalIssues = this.auditResults.summary.criticalIssues + this.auditResults.summary.warningIssues;
    const launchReadiness = totalIssues === 0 ? 'READY' :
                          this.auditResults.summary.criticalIssues === 0 ? 'NEEDS_MINOR_FIXES' : 'NEEDS_MAJOR_FIXES';

    this.auditResults.summary.launchReadiness = launchReadiness;
    this.auditResults.summary.auditDuration = `${Math.round(duration / 1000)}s`;

    // Save detailed report
    const reportPath = path.join(__dirname, '../audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.auditResults, null, 2));

    // Print executive summary
    this.printExecutiveSummary();
  }

  /**
   * GENERATE OVERALL RECOMMENDATIONS
   */
  generateOverallRecommendations() {
    const recommendations = [];

    // Analyze patterns across all pages
    const criticalPages = this.auditResults.pageAudits.filter(p => p.issues.critical.length > 0);
    const pagesWithoutMobile = this.auditResults.pageAudits.filter(p => !p.analysis.mobileResponsive);
    const pagesWithoutErrorHandling = this.auditResults.pageAudits.filter(p => p.analysis.errorHandling === 'Missing');

    if (criticalPages.length > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Launch Blocker',
        title: 'Fix Critical Issues Before Launch',
        description: `${criticalPages.length} pages have critical issues that must be resolved`,
        pages: criticalPages.map(p => p.path)
      });
    }

    if (pagesWithoutMobile.length > 3) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Mobile Experience',
        title: 'Improve Mobile Responsiveness',
        description: 'Many pages lack mobile-responsive design',
        pages: pagesWithoutMobile.slice(0, 5).map(p => p.path)
      });
    }

    if (pagesWithoutErrorHandling.length > 2) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'User Experience',
        title: 'Add Error Handling',
        description: 'Improve user experience with better error handling',
        pages: pagesWithoutErrorHandling.slice(0, 5).map(p => p.path)
      });
    }

    this.auditResults.overallRecommendations = recommendations;
  }

  /**
   * PRINT EXECUTIVE SUMMARY
   */
  printExecutiveSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 EXECUTIVE SUMMARY');
    console.log('='.repeat(60));

    const { summary } = this.auditResults;

    console.log(`\n🔍 Audit Completed: ${summary.pagesAudited}/${summary.totalPages} pages`);
    console.log(`⏱️  Duration: ${summary.auditDuration}`);
    console.log(`🚀 Launch Readiness: ${summary.launchReadiness}`);

    console.log(`\n📈 Issue Summary:`);
    console.log(`   🔴 Critical Issues: ${summary.criticalIssues}`);
    console.log(`   🟡 Warnings: ${summary.warningIssues}`);
    console.log(`   💡 Suggestions: ${summary.suggestions}`);

    if (summary.launchReadiness === 'READY') {
      console.log('\n✅ PLATFORM IS LAUNCH READY!');
      console.log('All critical issues have been resolved.');
    } else if (summary.launchReadiness === 'NEEDS_MINOR_FIXES') {
      console.log('\n🟡 PLATFORM NEEDS MINOR FIXES');
      console.log('No critical issues, but some warnings should be addressed.');
    } else {
      console.log('\n🔴 PLATFORM NEEDS MAJOR FIXES');
      console.log('Critical issues must be resolved before launch.');
    }

    console.log('\n📋 Top Recommendations:');
    this.auditResults.overallRecommendations.slice(0, 3).forEach((rec, index) => {
      console.log(`   ${index + 1}. [${rec.priority}] ${rec.title}`);
      console.log(`      ${rec.description}`);
    });

    console.log(`\n📄 Full report saved to: audit-report.json`);
    console.log('\n' + '='.repeat(60));
  }
}

// Execute the audit
if (require.main === module) {
  const auditor = new PlatformAuditor();
  auditor.executeFullAudit().catch(console.error);
}

module.exports = PlatformAuditor;