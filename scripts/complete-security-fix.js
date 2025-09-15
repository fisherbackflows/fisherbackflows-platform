#!/usr/bin/env node

/**
 * Complete Security Fix Script
 * Categorizes and fixes inappropriate service role usage
 */

const fs = require('fs');
const path = require('path');

// Files that LEGITIMATELY need service role
const LEGITIMATE_SERVICE_ROLE = [
  'src/app/api/admin/unlock-account/route.ts',  // Admin operation
  'src/app/api/stripe/webhook/route.ts',         // System webhook
  'src/app/api/jobs/generate-pdf/route.ts',      // Background job
  'src/lib/auth-security.ts',                    // Session validation
  'src/lib/auth.ts',                            // Auth system functions
  'src/lib/scheduling.ts',                      // System scheduling
  'src/lib/automation.ts',                      // System automation
];

// Files that should NOT use service role
const INAPPROPRIATE_SERVICE_ROLE = [
  'src/app/api/auth/login-new/route.ts',
  'src/app/api/auth/register-new/route.ts',
  'src/app/api/auth/verify/route.ts',
  'src/app/api/debug/simple-register/route.ts',
  'src/app/api/owner/metrics/route.ts',
  'src/app/api/team/auth/login/route.ts',
  'src/app/api/team/company/info/route.ts',
  'src/app/api/team/company/register/route.ts',
  'src/app/api/team/employees/route.ts',
  'src/app/api/team/invitations/route.ts',
  'src/app/api/tester-portal/schedule/route.ts',
  'src/app/api/tester-portal/reports/route.ts',
  'src/app/api/tester-portal/reminders/route.ts',
  'src/app/api/tester-portal/permissions/route.ts',
  'src/app/api/tester-portal/invoices/route.ts',
  'src/app/api/tester-portal/analytics/route.ts',
  'src/app/api/webhooks/resend/route.ts',
];

// Files that need manual review
const NEEDS_REVIEW = [
  'src/lib/db/queries.ts',                      // Mixed usage
  'src/lib/supabase/server.ts',                 // Infrastructure
  'src/lib/auth/unified-auth.ts',               // Auth infrastructure
  'src/lib/auth/registration.ts',               // Registration logic
];

function fixInappropriateUsage(filePath) {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Check if it imports supabaseAdmin
  if (content.includes('import { supabaseAdmin }') ||
      content.includes('import { createRouteHandlerClient, supabaseAdmin }')) {

    // Replace the import
    if (content.includes('import { createRouteHandlerClient, supabaseAdmin }')) {
      content = content.replace(
        /import \{ createRouteHandlerClient, supabaseAdmin \}/g,
        'import { createRouteHandlerClient }'
      );
      modified = true;
    } else if (content.includes('import { supabaseAdmin }')) {
      content = content.replace(
        /import \{ supabaseAdmin \}/g,
        'import { createRouteHandlerClient }'
      );
      modified = true;
    }

    // Replace usage patterns
    // Pattern 1: const supabase = supabaseAdmin
    content = content.replace(
      /const supabase = supabaseAdmin(?!.*\|\|)/g,
      'const supabase = createRouteHandlerClient(request)'
    );

    // Pattern 2: Direct supabaseAdmin usage
    content = content.replace(
      /supabaseAdmin\./g,
      'createRouteHandlerClient(request).'
    );

    // Pattern 3: Conditional with supabaseAdmin first
    content = content.replace(
      /supabaseAdmin \|\| createRouteHandlerClient\(request\)/g,
      'createRouteHandlerClient(request)'
    );

    modified = true;
  }

  if (modified) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }

  console.log(`ℹ️  No changes needed: ${filePath}`);
  return false;
}

function addWarningToLegitimate(filePath) {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Check if warning already exists
  if (content.includes('LEGITIMATE SERVICE ROLE USAGE')) {
    console.log(`ℹ️  Warning already exists: ${filePath}`);
    return false;
  }

  // Add warning comment after imports
  const importMatch = content.match(/(import .* from '@\/lib\/supabase';?)/);
  if (importMatch) {
    const importLine = importMatch[0];
    const warningComment = `${importLine}
// LEGITIMATE SERVICE ROLE USAGE: This operation requires elevated privileges
// Reason: ${getReasonForFile(filePath)}`;

    content = content.replace(importLine, warningComment);
    fs.writeFileSync(fullPath, content);
    console.log(`📝 Added warning to: ${filePath}`);
    return true;
  }

  return false;
}

function getReasonForFile(filePath) {
  const reasons = {
    'admin/unlock-account': 'Admin operation to unlock user accounts',
    'stripe/webhook': 'System webhook with no user context',
    'jobs/generate-pdf': 'Background job processing',
    'auth-security': 'Session validation across all users',
    'auth.ts': 'Core authentication system functions',
    'scheduling': 'System-wide scheduling operations',
    'automation': 'Automated system tasks',
  };

  for (const [key, reason] of Object.entries(reasons)) {
    if (filePath.includes(key)) {
      return reason;
    }
  }
  return 'System operation requiring elevated privileges';
}

console.log('🔒 Starting comprehensive security fix...\n');

// Fix inappropriate usage
console.log('📋 Fixing inappropriate service role usage...\n');
let fixedCount = 0;
for (const file of INAPPROPRIATE_SERVICE_ROLE) {
  try {
    if (fixInappropriateUsage(file)) {
      fixedCount++;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${file}: ${error.message}`);
  }
}

// Add warnings to legitimate usage
console.log('\n📋 Adding warnings to legitimate service role usage...\n');
let warningCount = 0;
for (const file of LEGITIMATE_SERVICE_ROLE) {
  try {
    if (addWarningToLegitimate(file)) {
      warningCount++;
    }
  } catch (error) {
    console.error(`❌ Error adding warning to ${file}: ${error.message}`);
  }
}

// Report files needing review
console.log('\n⚠️  Files needing manual review:\n');
for (const file of NEEDS_REVIEW) {
  console.log(`  - ${file}`);
}

console.log('\n📊 Security Fix Summary:');
console.log(`✅ Fixed inappropriate usage: ${fixedCount} files`);
console.log(`📝 Added warnings: ${warningCount} files`);
console.log(`⚠️  Needs manual review: ${NEEDS_REVIEW.length} files`);

console.log('\n🎯 Next Steps:');
console.log('1. Review the files in NEEDS_REVIEW list');
console.log('2. Test all authentication flows');
console.log('3. Verify admin operations still work');
console.log('4. Check that RLS policies are being enforced');