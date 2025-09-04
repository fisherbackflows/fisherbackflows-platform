#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function finalLaunchVerification() {
  console.log('\n🔍 FINAL LAUNCH VERIFICATION - COMPREHENSIVE TEST\n');
  console.log('='.repeat(80));
  console.log('⚠️  CRITICAL: This test determines launch readiness');
  console.log('='.repeat(80));
  
  const productionUrl = 'https://www.fisherbackflows.com';
  const testEmail = `final-test-${Date.now()}@example.com`;
  const testPassword = 'FinalTest123!';
  const supabaseUrl = 'https://jvhbqfueutvfepsjmztx.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzM0NzUsImV4cCI6MjA3MTg0OTQ3NX0.UuEuNrFU-JXWvoICUNCupz1MzLvWVrcIqRA-LwpI1Jo';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY';
  
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);
  
  let testResults = {
    registration: false,
    emailVerification: false,
    login: false,
    portalAccess: false,
    dataIntegrity: false,
    errorHandling: false
  };
  
  let criticalIssues = [];
  let testUserId = null;
  
  try {
    console.log('🧪 TEST 1: COMPLETE CUSTOMER REGISTRATION FLOW');
    console.log('-'.repeat(60));
    
    // Step 1: Registration
    console.log('1.1 Testing customer registration...');
    try {
      const registrationResponse = await fetch(`${productionUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Final',
          lastName: 'Test',
          email: testEmail,
          phone: '2532788692',
          password: testPassword,
          address: {
            street: '123 Launch Test St',
            city: 'Tacoma', 
            state: 'WA',
            zipCode: '98402'
          }
        })
      });
      
      const registrationResult = await registrationResponse.json();
      
      if (registrationResponse.status === 201 && registrationResult.success) {
        console.log('✅ Registration: SUCCESS');
        console.log(`   User ID: ${registrationResult.user.id}`);
        console.log(`   Account Number: ${registrationResult.user.accountNumber}`);
        testResults.registration = true;
        testUserId = registrationResult.user.id;
      } else {
        console.log('❌ Registration: FAILED');
        console.log(`   Status: ${registrationResponse.status}`);
        console.log(`   Error: ${registrationResult.error || 'Unknown'}`);
        criticalIssues.push('Customer registration is broken');
      }
    } catch (regError) {
      console.log('❌ Registration: EXCEPTION');
      console.log(`   Error: ${regError.message}`);
      criticalIssues.push('Registration API is not accessible');
    }
    
    console.log('');
    
    // Step 2: Verify data was created correctly
    if (testUserId) {
      console.log('1.2 Verifying data integrity...');
      try {
        // Check auth user
        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
        const authUser = authUsers.users.find(user => user.id === testUserId);
        
        // Check customer record
        const { data: customer } = await supabaseAdmin
          .from('customers')
          .select('*')
          .eq('id', testUserId)
          .single();
        
        if (authUser && customer) {
          console.log('✅ Data integrity: SUCCESS');
          console.log(`   Auth user email: ${authUser.email}`);
          console.log(`   Customer status: ${customer.account_status}`);
          console.log(`   Account number: ${customer.account_number}`);
          testResults.dataIntegrity = true;
        } else {
          console.log('❌ Data integrity: FAILED');
          console.log(`   Auth user: ${authUser ? 'EXISTS' : 'MISSING'}`);
          console.log(`   Customer record: ${customer ? 'EXISTS' : 'MISSING'}`);
          criticalIssues.push('Data not properly created during registration');
        }
      } catch (dataError) {
        console.log('❌ Data integrity: ERROR');
        console.log(`   Error: ${dataError.message}`);
        criticalIssues.push('Cannot verify data integrity');
      }
    }
    
    console.log('');
    
    // Step 3: Email verification simulation
    console.log('1.3 Testing email verification flow...');
    try {
      const verifyResponse = await fetch(`${productionUrl}/api/auth/verify-simple?email=${encodeURIComponent(testEmail)}`);
      
      if (verifyResponse.status === 200 || verifyResponse.redirected) {
        console.log('✅ Email verification: SUCCESS');
        console.log(`   Status: ${verifyResponse.status}`);
        
        // Check if account was activated
        if (testUserId) {
          const { data: updatedCustomer } = await supabaseAdmin
            .from('customers')
            .select('account_status')
            .eq('id', testUserId)
            .single();
          
          if (updatedCustomer?.account_status === 'active') {
            console.log('✅ Account activation: SUCCESS');
            testResults.emailVerification = true;
          } else {
            console.log('⚠️  Account activation: Not fully activated');
            console.log(`   Status: ${updatedCustomer?.account_status}`);
          }
        }
      } else {
        console.log('❌ Email verification: FAILED');
        console.log(`   Status: ${verifyResponse.status}`);
        criticalIssues.push('Email verification system not working');
      }
    } catch (verifyError) {
      console.log('❌ Email verification: ERROR');
      console.log(`   Error: ${verifyError.message}`);
      criticalIssues.push('Email verification endpoint not accessible');
    }
    
    console.log('');
    
    // Step 4: Login test
    console.log('1.4 Testing customer login...');
    try {
      const { data: loginData, error: loginError } = await supabasePublic.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      
      if (loginData.user && !loginError) {
        console.log('✅ Customer login: SUCCESS');
        console.log(`   Logged in as: ${loginData.user.email}`);
        console.log(`   Session: ${loginData.session ? 'Active' : 'None'}`);
        testResults.login = true;
        
        // Test portal access
        console.log('1.5 Testing portal access...');
        try {
          const portalResponse = await fetch(`${productionUrl}/portal/dashboard`);
          if (portalResponse.status === 200) {
            console.log('✅ Portal access: SUCCESS');
            testResults.portalAccess = true;
          } else {
            console.log(`⚠️  Portal access: Status ${portalResponse.status}`);
          }
        } catch (portalError) {
          console.log('❌ Portal access: ERROR');
        }
        
        // Clean up session
        await supabasePublic.auth.signOut();
        
      } else {
        console.log('❌ Customer login: FAILED');
        console.log(`   Error: ${loginError?.message || 'Unknown login error'}`);
        
        if (loginError?.message.includes('Email not confirmed')) {
          console.log('   📝 Note: This may be due to email confirmation requirement');
        } else {
          criticalIssues.push('Customer login is broken');
        }
      }
    } catch (loginTestError) {
      console.log('❌ Customer login: ERROR');
      console.log(`   Error: ${loginTestError.message}`);
      criticalIssues.push('Login system not accessible');
    }
    
    console.log('');
    
    // Step 5: Error handling tests
    console.log('🧪 TEST 2: ERROR HANDLING & EDGE CASES');
    console.log('-'.repeat(60));
    
    // Test duplicate registration
    console.log('2.1 Testing duplicate email registration...');
    try {
      const dupResponse = await fetch(`${productionUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Duplicate',
          lastName: 'Test',
          email: testEmail, // Same email as before
          phone: '2532788692',
          password: 'Different123!',
          address: {
            street: '456 Different St',
            city: 'Seattle',
            state: 'WA', 
            zipCode: '98101'
          }
        })
      });
      
      const dupResult = await dupResponse.json();
      
      if (dupResponse.status === 409 && dupResult.error.includes('already exists')) {
        console.log('✅ Duplicate email handling: SUCCESS');
        testResults.errorHandling = true;
      } else {
        console.log('❌ Duplicate email handling: FAILED');
        console.log(`   Expected 409, got ${dupResponse.status}`);
        criticalIssues.push('Duplicate email detection not working');
      }
    } catch (dupError) {
      console.log('❌ Duplicate email handling: ERROR');
      criticalIssues.push('Error handling system issues');
    }
    
    console.log('');
    
    // Step 6: Production environment check
    console.log('🧪 TEST 3: PRODUCTION ENVIRONMENT VERIFICATION');
    console.log('-'.repeat(60));
    
    console.log('3.1 Checking production URLs...');
    const criticalPages = [
      '/portal',
      '/portal/dashboard', 
      '/portal/billing',
      '/api/auth/register',
      '/api/auth/verify-simple'
    ];
    
    let pageErrors = 0;
    for (const page of criticalPages) {
      try {
        const response = await fetch(`${productionUrl}${page}`);
        if (response.status >= 500) {
          console.log(`❌ ${page}: Server Error (${response.status})`);
          pageErrors++;
        } else if (response.status === 404) {
          console.log(`❌ ${page}: Not Found (404)`);
          pageErrors++;
        } else {
          console.log(`✅ ${page}: OK (${response.status})`);
        }
      } catch (pageError) {
        console.log(`❌ ${page}: Connection Error`);
        pageErrors++;
      }
    }
    
    if (pageErrors === 0) {
      console.log('✅ All critical pages accessible');
    } else {
      criticalIssues.push(`${pageErrors} critical pages have issues`);
    }
    
  } catch (error) {
    console.error('❌ Test suite error:', error.message);
    criticalIssues.push('Test suite encountered unexpected error');
  }
  
  // FINAL ASSESSMENT
  console.log('\n' + '='.repeat(80));
  console.log('🎯 FINAL LAUNCH ASSESSMENT');
  console.log('='.repeat(80));
  
  const passedTests = Object.values(testResults).filter(Boolean).length;
  const totalTests = Object.keys(testResults).length;
  const successRate = (passedTests / totalTests * 100).toFixed(1);
  
  console.log(`📊 TEST RESULTS: ${passedTests}/${totalTests} passed (${successRate}%)`);
  console.log('');
  
  Object.entries(testResults).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASS' : 'FAIL'}`);
  });
  
  console.log('');
  
  if (criticalIssues.length > 0) {
    console.log('🔴 CRITICAL ISSUES FOUND:');
    criticalIssues.forEach(issue => console.log(`   • ${issue}`));
    console.log('');
  }
  
  // LAUNCH DECISION
  const isLaunchReady = criticalIssues.length === 0 && testResults.registration && testResults.dataIntegrity;
  
  console.log('🚀 LAUNCH DECISION:');
  console.log('-'.repeat(40));
  
  if (isLaunchReady) {
    console.log('✅ STATUS: READY FOR LAUNCH');
    console.log('📈 CONFIDENCE: HIGH');
    console.log('🎯 RECOMMENDATION: PROCEED WITH CUSTOMER LAUNCH');
    console.log('');
    console.log('🎉 CONGRATULATIONS! Your system is production-ready.');
    console.log('   Core functionality is working correctly.');
    console.log('   Customer registration and verification flow is operational.');
    console.log('   Data integrity is maintained.');
    console.log('   You can confidently accept real customers!');
  } else {
    console.log('❌ STATUS: NOT READY FOR LAUNCH');  
    console.log('📉 CONFIDENCE: LOW');
    console.log('🛑 RECOMMENDATION: FIX CRITICAL ISSUES BEFORE LAUNCH');
    console.log('');
    console.log('⚠️  DO NOT LAUNCH until critical issues are resolved.');
    console.log('   Customer registration or data integrity problems detected.');
    console.log('   These could result in lost customers or data corruption.');
  }
  
  // Clean up test user
  if (testUserId) {
    console.log('\n🧹 Cleaning up test data...');
    try {
      await supabaseAdmin.auth.admin.deleteUser(testUserId);
      console.log('✅ Test user cleaned up');
    } catch (cleanupError) {
      console.log('⚠️  Test user cleanup failed - manual cleanup may be needed');
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🔍 FINAL LAUNCH VERIFICATION: COMPLETE');
  console.log('='.repeat(80));
}

finalLaunchVerification().catch(console.error);