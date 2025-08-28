#!/usr/bin/env node

/**
 * Manual Testing Script for Critical Systems
 * Tests the core functionality we've built to identify failures
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Running Critical Systems Tests...\n');

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    results.passed++;
    results.tests.push({ name, status: 'PASSED' });
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    results.failed++;
    results.tests.push({ name, status: 'FAILED', error: error.message });
  }
}

// Test 1: File Structure Integrity
test('File Structure Integrity', () => {
  const criticalFiles = [
    'src/types/api.ts',
    'src/components/ErrorBoundary.tsx',
    'src/lib/auth/secure-auth.ts',
    'src/lib/payment/stripe.ts',
    'src/lib/file-upload/file-upload-service.ts',
    'src/lib/notifications/notification-service.ts',
    'src/app/api/errors/report/route.ts',
    'supabase/migrations/001_consolidated_schema.sql'
  ];
  
  criticalFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Critical file missing: ${file}`);
    }
  });
});

// Test 2: TypeScript Types Export
test('TypeScript Types Export', () => {
  const typesFile = path.join(__dirname, 'src/types/api.ts');
  const content = fs.readFileSync(typesFile, 'utf8');
  
  const requiredTypes = [
    'Customer',
    'Device', 
    'TestReport',
    'Invoice',
    'Appointment',
    'ApiResponse',
    'CreateCustomerRequest'
  ];
  
  requiredTypes.forEach(type => {
    if (!content.includes(`interface ${type}`) && !content.includes(`type ${type}`)) {
      throw new Error(`Missing type definition: ${type}`);
    }
  });
});

// Test 3: Database Schema Security
test('Database Schema Security', () => {
  const schemaFile = path.join(__dirname, 'supabase/migrations/001_consolidated_schema.sql');
  const content = fs.readFileSync(schemaFile, 'utf8');
  
  // Check that dangerous "ALLOW ALL" policies are not present
  if (content.includes('USING (true)') && content.includes('FOR ALL')) {
    throw new Error('Dangerous "ALLOW ALL" policies found in schema');
  }
  
  // Check that RLS is enabled
  if (!content.includes('ENABLE ROW LEVEL SECURITY')) {
    throw new Error('Row Level Security not enabled');
  }
  
  // Check for proper security functions
  if (!content.includes('current_user_role()') || !content.includes('current_organization_id()')) {
    throw new Error('Security functions not defined');
  }
});

// Test 4: Error Boundary Implementation
test('Error Boundary Implementation', () => {
  const errorBoundaryFile = path.join(__dirname, 'src/components/ErrorBoundary.tsx');
  const content = fs.readFileSync(errorBoundaryFile, 'utf8');
  
  if (!content.includes('componentDidCatch')) {
    throw new Error('Error boundary missing componentDidCatch');
  }
  
  if (!content.includes('reportError')) {
    throw new Error('Error boundary missing error reporting');
  }
  
  if (content.includes(': any')) {
    throw new Error('Error boundary contains any types');
  }
});

// Test 5: Authentication Security
test('Authentication Security', () => {
  const authFile = path.join(__dirname, 'src/lib/auth.ts');
  const content = fs.readFileSync(authFile, 'utf8');
  
  // Check that hardcoded passwords are removed
  if (content.includes("'fisher123'") || content.includes("'admin123'")) {
    throw new Error('Hardcoded passwords still present in auth system');
  }
  
  // Check that localStorage is not used for sensitive data in production
  if (content.includes('localStorage.setItem') && content.includes('password')) {
    throw new Error('Credentials being stored in localStorage');
  }
});

// Test 6: Payment System Security
test('Payment System Security', () => {
  const stripeFile = path.join(__dirname, 'src/lib/payment/stripe.ts');
  const content = fs.readFileSync(stripeFile, 'utf8');
  
  // Check for dummy key being used as fallback (not as security check)
  if (content.includes('|| \'sk_test_dummy_key\'') || content.match(/new Stripe\([^,]*'sk_test_dummy_key'/)) {
    throw new Error('Dummy key fallback found in payment system');
  }
  
  // Check for proper error handling
  if (!content.includes('stripe = null')) {
    throw new Error('Payment system not failing securely');
  }
});

// Test 7: File Upload Security
test('File Upload Security', () => {
  const uploadFile = path.join(__dirname, 'src/lib/file-upload/file-upload-service.ts');
  const content = fs.readFileSync(uploadFile, 'utf8');
  
  // Check that fake virus scanner is replaced
  if (content.includes('return { infected: false, warnings }') && 
      content.includes('Simple signature-based detection for demo')) {
    throw new Error('Fake virus scanner still present');
  }
  
  // Check for real virus scanning providers
  if (!content.includes('ClamAVProvider') || !content.includes('VirusTotalProvider')) {
    throw new Error('Real virus scanning providers not implemented');
  }
});

// Test 8: Notification System
test('Notification System', () => {
  const notificationFile = path.join(__dirname, 'src/lib/notifications/notification-service.ts');
  const content = fs.readFileSync(notificationFile, 'utf8');
  
  // Check that placeholder SMS/push implementations are replaced
  if (content.includes('For now, just log and return true')) {
    throw new Error('Placeholder notification implementations still present');
  }
  
  // Check for real implementations
  if (!content.includes('twilio') && !content.includes('firebase-admin')) {
    throw new Error('Real notification services not implemented');
  }
});

// Test 9: Console.log Cleanup
test('Console.log Statement Cleanup', () => {
  const filesToCheck = [
    'src/app/field/test/[appointmentId]/page.tsx',
    'src/lib/payment/stripe.ts',
    'src/lib/auth/secure-auth.ts'
  ];
  
  filesToCheck.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('console.log') || content.includes('alert(')) {
        throw new Error(`Console.log or alert statements found in ${file}`);
      }
    }
  });
});

// Test 10: TypeScript Any Types
test('TypeScript Any Types Cleanup', () => {
  const filesToCheck = [
    'src/app/api/customers/route.ts',
    'src/app/api/test-reports/complete/route.ts',
    'src/app/api/invoices/route.ts'
  ];
  
  filesToCheck.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const anyMatches = content.match(/:\s*any\b/g);
      if (anyMatches && anyMatches.length > 0) {
        throw new Error(`Any types found in ${file}: ${anyMatches.length} occurrences`);
      }
    }
  });
});

// Test 11: Environment Configuration
test('Environment Configuration Safety', () => {
  const nextConfigFile = path.join(__dirname, 'next.config.js');
  if (fs.existsSync(nextConfigFile)) {
    const content = fs.readFileSync(nextConfigFile, 'utf8');
    if (content.includes('your-secret-key') || content.includes('change-me')) {
      throw new Error('Default secrets found in configuration');
    }
  }
});

// Test 12: API Route Structure
test('API Route Structure', () => {
  const apiRoutes = [
    'src/app/api/customers/route.ts',
    'src/app/api/appointments/route.ts', 
    'src/app/api/test-reports/complete/route.ts',
    'src/app/api/errors/report/route.ts'
  ];
  
  apiRoutes.forEach(route => {
    const filePath = path.join(__dirname, route);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (!content.includes('NextRequest') || !content.includes('NextResponse')) {
        throw new Error(`API route ${route} missing proper Next.js imports`);
      }
    } else {
      throw new Error(`Critical API route missing: ${route}`);
    }
  });
});

console.log('\n📊 Test Results Summary:');
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

if (results.failed > 0) {
  console.log('\n🚨 Failed Tests:');
  results.tests.filter(test => test.status === 'FAILED').forEach(test => {
    console.log(`   - ${test.name}: ${test.error}`);
  });
  process.exit(1);
} else {
  console.log('\n🎉 All critical systems tests passed!');
  process.exit(0);
}