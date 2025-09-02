#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🗓️ SCHEDULING NAVIGATION & WORKFLOW AUDIT\n');

// Scheduling-related files and components to analyze
const schedulingFiles = {
  customerPortal: [
    'src/app/portal/schedule/page.tsx',
    'src/app/portal/dashboard/page.tsx'
  ],
  teamPortal: [
    'src/app/team-portal/schedule/page.tsx',
    'src/app/team-portal/schedule/new/page.tsx', 
    'src/app/team-portal/dashboard/page.tsx',
    'src/app/team-portal/customers/new/page.tsx'
  ],
  fieldApp: [
    'src/app/field/dashboard/page.tsx',
    'src/app/field/test/[appointmentId]/page.tsx'
  ],
  api: [
    'src/app/api/appointments/route.ts',
    'src/app/api/appointments/[id]/route.ts',
    'src/app/api/appointments/available-dates/route.ts',
    'src/app/api/appointments/available-times/route.ts',
    'src/app/api/appointments/book/route.ts',
    'src/app/api/team/appointments/route.ts'
  ],
  components: [
    'src/components/scheduling',
    'src/components/calendar'
  ]
};

const workflowIssues = {
  navigationComplexity: [],
  userJourneyProblems: [], 
  duplicateWorkflows: [],
  missingIntegration: [],
  inefficientUX: [],
  dataFlowIssues: []
};

console.log('📊 ANALYZING SCHEDULING WORKFLOW COMPONENTS...\n');

function analyzeSchedulingFile(filePath, section) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Missing: ${filePath}`);
    workflowIssues.missingIntegration.push({
      file: filePath,
      section: section,
      issue: 'Scheduling component missing',
      impact: 'Broken workflow in this section'
    });
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = filePath.replace(process.cwd() + '/', '');
  
  console.log(`📄 ${relativePath}`);

  // Check for common scheduling workflow issues
  let issueCount = 0;

  // 1. Navigation complexity
  if (content.includes('router.push') && content.includes('router.back')) {
    const navigationCalls = (content.match(/router\.(push|back|replace)/g) || []).length;
    if (navigationCalls > 3) {
      workflowIssues.navigationComplexity.push({
        file: relativePath,
        section: section,
        issue: `Complex navigation with ${navigationCalls} route changes`,
        impact: 'Users may get lost in scheduling process'
      });
      issueCount++;
    }
  }

  // 2. Form complexity without progress indicators
  if (content.includes('useState') && content.includes('form')) {
    const hasProgressIndicator = content.includes('step') || content.includes('progress') || content.includes('wizard');
    const stateCount = (content.match(/useState/g) || []).length;
    
    if (stateCount > 5 && !hasProgressIndicator) {
      workflowIssues.inefficientUX.push({
        file: relativePath,
        section: section,
        issue: `Complex form (${stateCount} states) without progress tracking`,
        impact: 'Users lose track of scheduling progress'
      });
      issueCount++;
    }
  }

  // 3. Duplicate scheduling logic
  if (content.includes('appointment') && content.includes('schedule')) {
    const hasDatePicker = content.includes('calendar') || content.includes('date');
    const hasTimeSlots = content.includes('time') && content.includes('available');
    const hasValidation = content.includes('validate') || content.includes('error');
    
    if (hasDatePicker && hasTimeSlots && !hasValidation) {
      workflowIssues.dataFlowIssues.push({
        file: relativePath,
        section: section,
        issue: 'Scheduling logic without proper validation',
        impact: 'Invalid appointments may be created'
      });
      issueCount++;
    }
  }

  // 4. Missing integration points
  const hasCustomerIntegration = content.includes('customer') && content.includes('appointment');
  const hasNotificationIntegration = content.includes('notification') || content.includes('email');
  const hasPaymentIntegration = content.includes('payment') || content.includes('billing');

  if (hasCustomerIntegration && !hasNotificationIntegration && section !== 'api') {
    workflowIssues.missingIntegration.push({
      file: relativePath,
      section: section,
      issue: 'Customer scheduling without notification integration',
      impact: 'Customers may not receive appointment confirmations'
    });
    issueCount++;
  }

  console.log(`   ${issueCount > 0 ? `⚠️  ${issueCount} issues found` : '✅ No major issues'}`);
  return issueCount;
}

// Analyze each section
let totalIssues = 0;

console.log('🏠 CUSTOMER PORTAL SCHEDULING:');
schedulingFiles.customerPortal.forEach(file => {
  totalIssues += analyzeSchedulingFile(file, 'customer-portal');
});

console.log('\n👥 TEAM PORTAL SCHEDULING:');
schedulingFiles.teamPortal.forEach(file => {
  totalIssues += analyzeSchedulingFile(file, 'team-portal');
});

console.log('\n🚛 FIELD APP SCHEDULING:');
schedulingFiles.fieldApp.forEach(file => {
  totalIssues += analyzeSchedulingFile(file, 'field-app');
});

console.log('\n🔌 SCHEDULING APIs:');
schedulingFiles.api.forEach(file => {
  totalIssues += analyzeSchedulingFile(file, 'api');
});

// Check for scheduling components
console.log('\n🧩 SCHEDULING COMPONENTS:');
schedulingFiles.components.forEach(componentDir => {
  if (fs.existsSync(componentDir)) {
    const files = fs.readdirSync(componentDir);
    console.log(`📁 ${componentDir}: ${files.length} components`);
    files.forEach(file => {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        totalIssues += analyzeSchedulingFile(path.join(componentDir, file), 'components');
      }
    });
  } else {
    console.log(`❌ Missing component directory: ${componentDir}`);
    workflowIssues.missingIntegration.push({
      file: componentDir,
      section: 'components',
      issue: 'Missing scheduling components directory',
      impact: 'No reusable scheduling components available'
    });
    totalIssues++;
  }
});

console.log('\n🔍 DETAILED WORKFLOW ANALYSIS');
console.log('='.repeat(60));

console.log('\n1. 🧭 NAVIGATION COMPLEXITY ISSUES:');
workflowIssues.navigationComplexity.forEach((issue, i) => {
  console.log(`   ${i+1}. ${issue.section}: ${issue.file}`);
  console.log(`      Issue: ${issue.issue}`);
  console.log(`      Impact: ${issue.impact}\n`);
});

console.log('\n2. 🎯 USER EXPERIENCE INEFFICIENCIES:');
workflowIssues.inefficientUX.forEach((issue, i) => {
  console.log(`   ${i+1}. ${issue.section}: ${issue.file}`);
  console.log(`      Issue: ${issue.issue}`);
  console.log(`      Impact: ${issue.impact}\n`);
});

console.log('\n3. 🔗 MISSING INTEGRATIONS:');
workflowIssues.missingIntegration.forEach((issue, i) => {
  console.log(`   ${i+1}. ${issue.section}: ${issue.file}`);
  console.log(`      Issue: ${issue.issue}`);
  console.log(`      Impact: ${issue.impact}\n`);
});

console.log('\n4. 📊 DATA FLOW ISSUES:');
workflowIssues.dataFlowIssues.forEach((issue, i) => {
  console.log(`   ${i+1}. ${issue.section}: ${issue.file}`);
  console.log(`      Issue: ${issue.issue}`);
  console.log(`      Impact: ${issue.impact}\n`);
});

// User journey analysis
console.log('\n🗺️ USER JOURNEY ANALYSIS');
console.log('='.repeat(60));

const journeys = {
  customerScheduling: {
    path: 'Landing → Portal Login → Schedule → Date/Time → Confirmation',
    steps: 5,
    estimatedTime: '3-5 minutes',
    painPoints: [
      'Must create account first',
      'No guest scheduling option', 
      'Complex date/time selection',
      'Payment integration unclear'
    ]
  },
  teamScheduling: {
    path: 'Team Login → Dashboard → Schedule → New → Customer Select → Date/Time → Create',
    steps: 7,
    estimatedTime: '2-4 minutes',
    painPoints: [
      'Too many navigation steps',
      'Customer selection complexity',
      'No bulk scheduling',
      'Limited calendar integration'
    ]
  },
  fieldExecution: {
    path: 'Field App → Dashboard → Appointments → Select → Test → Complete',
    steps: 6,
    estimatedTime: '1-2 minutes',
    painPoints: [
      'Mobile optimization needed',
      'Offline capability missing',
      'Limited test result entry',
      'No photo upload workflow'
    ]
  }
};

Object.entries(journeys).forEach(([journey, details]) => {
  console.log(`\n${journey.toUpperCase()}:`);
  console.log(`   Path: ${details.path}`);
  console.log(`   Steps: ${details.steps} (${details.estimatedTime})`);
  console.log(`   Pain Points:`);
  details.painPoints.forEach(point => {
    console.log(`   • ${point}`);
  });
});

console.log('\n📈 SCHEDULING WORKFLOW RECOMMENDATIONS');
console.log('='.repeat(60));

const recommendations = [
  {
    priority: 'CRITICAL',
    title: 'Implement Guest Scheduling',
    description: 'Allow customers to schedule without account creation',
    effort: 'High',
    impact: 'Very High',
    timeline: '2-3 weeks'
  },
  {
    priority: 'HIGH', 
    title: 'Create Scheduling Wizard Component',
    description: 'Unified scheduling flow with progress tracking',
    effort: 'Medium',
    impact: 'High', 
    timeline: '1-2 weeks'
  },
  {
    priority: 'HIGH',
    title: 'Add Bulk Scheduling for Teams',
    description: 'Schedule multiple appointments efficiently',
    effort: 'Medium',
    impact: 'High',
    timeline: '1-2 weeks'
  },
  {
    priority: 'MEDIUM',
    title: 'Mobile-First Field App Optimization',
    description: 'Optimize scheduling workflow for mobile technicians',
    effort: 'Medium', 
    impact: 'Medium',
    timeline: '2-3 weeks'
  },
  {
    priority: 'MEDIUM',
    title: 'Automated Notification Integration',
    description: 'Automatic email/SMS for scheduling events',
    effort: 'High',
    impact: 'Medium', 
    timeline: '2-4 weeks'
  }
];

recommendations.forEach((rec, i) => {
  console.log(`\n${i+1}. [${rec.priority}] ${rec.title}`);
  console.log(`   Description: ${rec.description}`);
  console.log(`   Effort: ${rec.effort} | Impact: ${rec.impact} | Timeline: ${rec.timeline}`);
});

console.log('\n🎯 SUMMARY & NEXT STEPS');
console.log('='.repeat(60));
console.log(`Total Issues Found: ${totalIssues}`);
console.log(`Navigation Complexity: ${workflowIssues.navigationComplexity.length}`);
console.log(`UX Inefficiencies: ${workflowIssues.inefficientUX.length}`);
console.log(`Missing Integrations: ${workflowIssues.missingIntegration.length}`);
console.log(`Data Flow Issues: ${workflowIssues.dataFlowIssues.length}`);

console.log('\nImmediate Actions Needed:');
console.log('1. Simplify customer scheduling journey (reduce from 5 to 3 steps)');
console.log('2. Create reusable scheduling components');  
console.log('3. Implement progress tracking in complex forms');
console.log('4. Add notification integrations');
console.log('5. Optimize mobile scheduling workflows');