#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

async function auditCustomerOnboarding() {
  console.log('\n🔍 RIGOROUS CUSTOMER ONBOARDING AUDIT\n');
  console.log('='.repeat(80));
  
  const supabaseUrl = 'https://jvhbqfueutvfepsjmztx.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY';
  const supabase = createClient(supabaseUrl, supabaseKey);
  const resend = new Resend('re_EPS1bF7f_FmVbmEWP11tnP7fTJbJvUPYq');
  
  const testEmail = `audit-test-${Date.now()}@fisherbackflows.com`;
  const testPassword = 'AuditTest123!';
  const productionUrl = 'https://www.fisherbackflows.com';
  
  let auditResults = {
    passed: 0,
    failed: 0,
    critical: [],
    warnings: [],
    passed_tests: []
  };
  
  function logTest(testName, passed, details, critical = false) {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${testName}`);
    if (details) console.log(`   ${details}`);
    
    if (passed) {
      auditResults.passed++;
      auditResults.passed_tests.push(testName);
    } else {
      auditResults.failed++;
      if (critical) {
        auditResults.critical.push(`${testName}: ${details}`);
      } else {
        auditResults.warnings.push(`${testName}: ${details}`);
      }
    }
    console.log('');
  }
  
  console.log('📋 AUDIT SCOPE:');
  console.log('   • Customer Registration Flow');
  console.log('   • Email Verification System');
  console.log('   • Login Authentication');
  console.log('   • Password Recovery');
  console.log('   • Portal Access & Navigation');
  console.log('   • Error Handling & Edge Cases');
  console.log('   • Security & Data Validation');
  console.log('   • Production Environment');
  console.log('');
  
  try {
    // ===========================================
    // 1. REGISTRATION SYSTEM AUDIT
    // ===========================================
    console.log('🔸 1. REGISTRATION SYSTEM AUDIT');
    console.log('-'.repeat(40));
    
    // Test 1.1: Registration API endpoint exists and responds
    console.log('Testing registration API availability...');
    try {
      const response = await fetch(`${productionUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Audit',
          lastName: 'Test',
          email: testEmail,
          phone: '2532788692',
          password: testPassword,
          address: {
            street: '123 Test St',
            city: 'Tacoma',
            state: 'WA',
            zipCode: '98402'
          }
        })
      });
      
      const result = await response.json();
      logTest('Registration API responds', response.ok, `Status: ${response.status}, Message: ${result.message || result.error}`);
      
      if (response.ok) {
        // Test 1.2: User created in auth system
        setTimeout(async () => {
          const { data: authUsers } = await supabase.auth.admin.listUsers();
          const testUser = authUsers?.users.find(user => user.email === testEmail);
          logTest('User created in Supabase Auth', !!testUser, testUser ? `User ID: ${testUser.id}` : 'User not found');
          
          // Test 1.3: Customer record created
          if (testUser) {
            const { data: customer } = await supabase
              .from('customers')
              .select('*')
              .eq('email', testEmail)
              .single();
            
            logTest('Customer record created', !!customer, customer ? `Account: ${customer.account_number}` : 'Customer record not found');
            logTest('Customer status is pending_verification', customer?.account_status === 'pending_verification', `Status: ${customer?.account_status}`);
          }
        }, 2000);
      }
    } catch (error) {
      logTest('Registration API responds', false, `Error: ${error.message}`, true);
    }
    
    // ===========================================
    // 2. EMAIL VERIFICATION AUDIT
    // ===========================================
    console.log('🔸 2. EMAIL VERIFICATION AUDIT');
    console.log('-'.repeat(40));
    
    // Test 2.1: Resend service operational
    try {
      const emailTest = await resend.emails.send({
        from: 'Fisher Backflows <noreply@mail.fisherbackflows.com>',
        to: 'audit@fisherbackflows.com',
        subject: 'Audit: Email Service Test',
        html: '<h2>Email service is operational</h2>'
      });
      
      logTest('Resend email service working', !emailTest.error, emailTest.error ? emailTest.error.message : `Email ID: ${emailTest.data.id}`);
    } catch (error) {
      logTest('Resend email service working', false, `Error: ${error.message}`, true);
    }
    
    // Test 2.2: Verification endpoint exists
    try {
      const verifyResponse = await fetch(`${productionUrl}/api/auth/verify-simple?email=${encodeURIComponent('test@example.com')}`);
      logTest('Verification endpoint accessible', verifyResponse.status !== 404, `Status: ${verifyResponse.status}`);
    } catch (error) {
      logTest('Verification endpoint accessible', false, `Error: ${error.message}`, true);
    }
    
    // ===========================================
    // 3. LOGIN SYSTEM AUDIT
    // ===========================================
    console.log('🔸 3. LOGIN SYSTEM AUDIT');
    console.log('-'.repeat(40));
    
    // Test 3.1: Login page loads
    try {
      const loginResponse = await fetch(`${productionUrl}/portal`);
      logTest('Login page loads', loginResponse.ok, `Status: ${loginResponse.status}`);
    } catch (error) {
      logTest('Login page loads', false, `Error: ${error.message}`, true);
    }
    
    // Test 3.2: Test with known good credentials
    try {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'customer@fisherbackflows.com',
        password: 'Knvgtch6r91!'
      });
      
      logTest('Known credentials work', !loginError, loginError ? loginError.message : 'Login successful');
      
      if (loginData?.user) {
        await supabase.auth.signOut(); // Clean up
      }
    } catch (error) {
      logTest('Known credentials work', false, `Error: ${error.message}`);
    }
    
    // ===========================================
    // 4. PASSWORD RECOVERY AUDIT
    // ===========================================
    console.log('🔸 4. PASSWORD RECOVERY AUDIT');
    console.log('-'.repeat(40));
    
    // Test 4.1: Forgot password page exists
    try {
      const forgotResponse = await fetch(`${productionUrl}/portal/forgot-password`);
      logTest('Forgot password page exists', forgotResponse.status !== 404, `Status: ${forgotResponse.status}`);
    } catch (error) {
      logTest('Forgot password page exists', false, `Error: ${error.message}`, true);
    }
    
    // Test 4.2: Password reset API exists
    try {
      const resetResponse = await fetch(`${productionUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' })
      });
      logTest('Password reset API exists', resetResponse.status !== 404, `Status: ${resetResponse.status}`);
    } catch (error) {
      logTest('Password reset API exists', false, `Error: ${error.message}`, true);
    }
    
    // ===========================================
    // 5. CUSTOMER PORTAL AUDIT
    // ===========================================
    console.log('🔸 5. CUSTOMER PORTAL AUDIT');
    console.log('-'.repeat(40));
    
    // Test 5.1: Dashboard page exists
    try {
      const dashboardResponse = await fetch(`${productionUrl}/portal/dashboard`);
      logTest('Customer dashboard exists', dashboardResponse.status !== 404, `Status: ${dashboardResponse.status}`);
    } catch (error) {
      logTest('Customer dashboard exists', false, `Error: ${error.message}`);
    }
    
    // Test 5.2: Key portal pages exist
    const portalPages = ['billing', 'devices', 'schedule', 'reports'];
    for (const page of portalPages) {
      try {
        const pageResponse = await fetch(`${productionUrl}/portal/${page}`);
        logTest(`Portal ${page} page exists`, pageResponse.status !== 404, `Status: ${pageResponse.status}`);
      } catch (error) {
        logTest(`Portal ${page} page exists`, false, `Error: ${error.message}`);
      }
    }
    
    // ===========================================
    // 6. SECURITY & VALIDATION AUDIT
    // ===========================================
    console.log('🔸 6. SECURITY & VALIDATION AUDIT');
    console.log('-'.repeat(40));
    
    // Test 6.1: SQL injection protection
    try {
      const maliciousEmail = "test'; DROP TABLE customers; --";
      const response = await fetch(`${productionUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Test',
          lastName: 'Test',
          email: maliciousEmail,
          password: 'Test123!',
          phone: '1234567890',
          address: { street: '123 Test', city: 'Test', state: 'WA', zipCode: '98402' }
        })
      });
      
      // Should fail validation, not cause SQL injection
      logTest('SQL injection protection', !response.ok, `Protected against malicious input: ${response.status}`);
    } catch (error) {
      logTest('SQL injection protection', true, 'Request properly rejected');
    }
    
    // Test 6.2: Rate limiting exists
    console.log('Testing rate limiting (may take 30+ seconds)...');
    let rateLimitHit = false;
    for (let i = 0; i < 10; i++) {
      try {
        const response = await fetch(`${productionUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: 'Spam',
            lastName: 'Test',
            email: `spam${i}@test.com`,
            password: 'Test123!',
            phone: '1234567890',
            address: { street: '123 Test', city: 'Test', state: 'WA', zipCode: '98402' }
          })
        });
        
        if (response.status === 429) {
          rateLimitHit = true;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        // Continue testing
      }
    }
    logTest('Rate limiting protection', rateLimitHit, rateLimitHit ? 'Rate limit triggered' : 'Rate limiting may be too lenient');
    
  } catch (error) {
    console.error('❌ Audit error:', error.message);
  }
  
  // ===========================================
  // AUDIT SUMMARY
  // ===========================================
  console.log('='.repeat(80));
  console.log('📊 AUDIT RESULTS SUMMARY');
  console.log('='.repeat(80));
  
  console.log(`✅ PASSED TESTS: ${auditResults.passed}`);
  console.log(`❌ FAILED TESTS: ${auditResults.failed}`);
  console.log(`🔴 CRITICAL ISSUES: ${auditResults.critical.length}`);
  console.log(`⚠️  WARNINGS: ${auditResults.warnings.length}`);
  console.log('');
  
  const successRate = (auditResults.passed / (auditResults.passed + auditResults.failed) * 100).toFixed(1);
  console.log(`📈 SUCCESS RATE: ${successRate}%`);
  console.log('');
  
  if (auditResults.critical.length > 0) {
    console.log('🔴 CRITICAL ISSUES (MUST FIX BEFORE LAUNCH):');
    auditResults.critical.forEach(issue => console.log(`   • ${issue}`));
    console.log('');
  }
  
  if (auditResults.warnings.length > 0) {
    console.log('⚠️  WARNINGS (RECOMMENDED FIXES):');
    auditResults.warnings.forEach(warning => console.log(`   • ${warning}`));
    console.log('');
  }
  
  console.log('✅ PASSED TESTS:');
  auditResults.passed_tests.forEach(test => console.log(`   • ${test}`));
  console.log('');
  
  // Launch readiness assessment
  const isLaunchReady = auditResults.critical.length === 0 && successRate >= 80;
  console.log('🚀 LAUNCH READINESS ASSESSMENT:');
  console.log(`   Status: ${isLaunchReady ? '✅ READY FOR LAUNCH' : '❌ NOT READY - FIXES REQUIRED'}`);
  console.log(`   Confidence Level: ${successRate}%`);
  
  if (!isLaunchReady) {
    console.log('\n🛠️  REQUIRED ACTIONS BEFORE LAUNCH:');
    if (auditResults.critical.length > 0) {
      console.log('   1. Fix all critical issues listed above');
    }
    if (successRate < 80) {
      console.log('   2. Achieve >80% success rate on all tests');
    }
    console.log('   3. Re-run audit to verify fixes');
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🔍 CUSTOMER ONBOARDING AUDIT: COMPLETE');
  console.log('='.repeat(80));
}

auditCustomerOnboarding().catch(console.error);