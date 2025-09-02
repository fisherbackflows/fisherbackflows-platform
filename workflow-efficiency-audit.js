#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 WORKFLOW EFFICIENCY AUDIT - QUALITY OF LIFE ANALYSIS\n');

// Analyze all pages for common workflow inefficiencies
const workflowIssues = {
  navigationInefficiencies: [],
  formComplexity: [],
  dataEntryRedundancy: [],
  missingBulkOperations: [],
  lackOfAutomation: [],
  poorDataFlow: [],
  missingShortcuts: [],
  repetitiveActions: []
};

// Helper function to analyze file content
function analyzeFile(filePath, content) {
  const relativePath = filePath.replace(process.cwd() + '/', '');
  const issues = [];

  // Check for navigation inefficiencies
  if (content.includes('onClick={() => window.history.back()}')) {
    workflowIssues.navigationInefficiencies.push({
      file: relativePath,
      issue: 'Using browser back button instead of contextual navigation',
      impact: 'Users lose navigation context and breadcrumb trail'
    });
  }

  // Check for complex forms without auto-save
  if (content.includes('<form') || content.includes('useState')) {
    const hasAutoSave = content.includes('autosave') || content.includes('auto-save');
    const hasMultipleInputs = (content.match(/<input|<select|<textarea/g) || []).length > 5;
    
    if (hasMultipleInputs && !hasAutoSave) {
      workflowIssues.formComplexity.push({
        file: relativePath,
        issue: 'Complex form without auto-save functionality',
        impact: 'Risk of data loss if user navigates away or session expires'
      });
    }
  }

  // Check for missing bulk operations
  if (content.includes('map(') && content.includes('checkbox') && !content.includes('selectAll')) {
    workflowIssues.missingBulkOperations.push({
      file: relativePath,
      issue: 'List with checkboxes but no bulk operations',
      impact: 'Users must perform actions one by one instead of batch processing'
    });
  }

  // Check for repetitive data entry
  if (content.includes('customer') && content.includes('address')) {
    const hasAddressAutocomplete = content.includes('autocomplete') || content.includes('google.maps');
    if (!hasAddressAutocomplete) {
      workflowIssues.dataEntryRedundancy.push({
        file: relativePath,
        issue: 'Address entry without autocomplete or validation',
        impact: 'Manual address entry prone to errors and time-consuming'
      });
    }
  }

  // Check for missing keyboard shortcuts
  if (content.includes('onClick') && !content.includes('onKeyDown') && !content.includes('hotkey')) {
    workflowIssues.missingShortcuts.push({
      file: relativePath,
      issue: 'Interactive elements without keyboard shortcuts',
      impact: 'Power users cannot use keyboard navigation efficiently'
    });
  }

  return issues;
}

// Scan all React components
function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && !file.includes('node_modules')) {
      scanDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf8');
      analyzeFile(filePath, content);
    }
  });
}

console.log('📊 Scanning all components for workflow inefficiencies...\n');
scanDirectory('src');

// Specific workflow analysis for key areas
console.log('🔍 WORKFLOW BOTTLENECK ANALYSIS');
console.log('='.repeat(60));

console.log('\n1. 🚧 NAVIGATION INEFFICIENCIES');
workflowIssues.navigationInefficiencies.forEach((issue, i) => {
  console.log(`   ${i+1}. ${issue.file}`);
  console.log(`      Issue: ${issue.issue}`);
  console.log(`      Impact: ${issue.impact}\n`);
});

console.log('\n2. 📝 FORM COMPLEXITY ISSUES');
workflowIssues.formComplexity.forEach((issue, i) => {
  console.log(`   ${i+1}. ${issue.file}`);
  console.log(`      Issue: ${issue.issue}`);
  console.log(`      Impact: ${issue.impact}\n`);
});

console.log('\n3. 📋 MISSING BULK OPERATIONS');
workflowIssues.missingBulkOperations.forEach((issue, i) => {
  console.log(`   ${i+1}. ${issue.file}`);
  console.log(`      Issue: ${issue.issue}`);
  console.log(`      Impact: ${issue.impact}\n`);
});

console.log('\n4. 🔄 DATA ENTRY REDUNDANCY');
workflowIssues.dataEntryRedundancy.forEach((issue, i) => {
  console.log(`   ${i+1}. ${issue.file}`);
  console.log(`      Issue: ${issue.issue}`);
  console.log(`      Impact: ${issue.impact}\n`);
});

console.log('\n5. ⌨️ MISSING KEYBOARD SHORTCUTS');
const shortcutCount = workflowIssues.missingShortcuts.length;
console.log(`   Found ${shortcutCount} components without keyboard navigation`);
console.log(`   Impact: Reduced efficiency for power users\n`);

// Calculate efficiency scores
const totalIssues = Object.values(workflowIssues).reduce((sum, issues) => sum + issues.length, 0);

console.log('\n📊 WORKFLOW EFFICIENCY SUMMARY');
console.log('='.repeat(60));
console.log(`Navigation Issues: ${workflowIssues.navigationInefficiencies.length}`);
console.log(`Form Complexity: ${workflowIssues.formComplexity.length}`);
console.log(`Missing Bulk Ops: ${workflowIssues.missingBulkOperations.length}`);
console.log(`Data Entry Issues: ${workflowIssues.dataEntryRedundancy.length}`);
console.log(`Missing Shortcuts: ${shortcutCount}`);
console.log(`\nTOTAL EFFICIENCY ISSUES: ${totalIssues}`);

// Priority recommendations
console.log('\n🎯 HIGH PRIORITY QUALITY OF LIFE IMPROVEMENTS');
console.log('='.repeat(60));

const recommendations = [
  {
    priority: 'CRITICAL',
    title: 'Implement Auto-Save for Complex Forms',
    description: 'Add auto-save functionality to prevent data loss',
    effort: 'Medium',
    impact: 'High'
  },
  {
    priority: 'HIGH',
    title: 'Add Bulk Operations to List Views',
    description: 'Enable select-all and batch actions for efficiency',
    effort: 'Medium', 
    impact: 'High'
  },
  {
    priority: 'HIGH',
    title: 'Implement Smart Navigation Breadcrumbs',
    description: 'Replace generic back buttons with contextual navigation',
    effort: 'Low',
    impact: 'Medium'
  },
  {
    priority: 'MEDIUM',
    title: 'Add Address Autocomplete/Validation',
    description: 'Reduce manual data entry errors and time',
    effort: 'High',
    impact: 'Medium'
  },
  {
    priority: 'MEDIUM',
    title: 'Implement Keyboard Shortcuts',
    description: 'Add hotkeys for common actions and navigation',
    effort: 'Medium',
    impact: 'Medium'
  }
];

recommendations.forEach((rec, i) => {
  console.log(`\n${i+1}. [${rec.priority}] ${rec.title}`);
  console.log(`   Description: ${rec.description}`);
  console.log(`   Effort: ${rec.effort} | Impact: ${rec.impact}`);
});

console.log('\n\n🏁 NEXT STEPS:');
console.log('1. Focus on CRITICAL and HIGH priority items first');
console.log('2. Implement auto-save to prevent data loss');
console.log('3. Add bulk operations for list management efficiency');
console.log('4. Improve navigation with contextual breadcrumbs');
console.log('5. Consider user feedback on most painful workflow areas');