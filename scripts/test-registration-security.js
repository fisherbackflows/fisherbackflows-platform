#!/usr/bin/env node

/**
 * SECURITY TEST SCRIPT FOR CUSTOMER REGISTRATION
 * Tests the fixed registration flow to ensure all vulnerabilities are addressed
 */

const https = require('https');
const crypto = require('crypto');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010';

// Test utilities
function generateTestEmail() {
  return `test-${crypto.randomUUID().slice(0, 8)}@example.com`;
}

async function makeRequest(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const method = options.method || 'GET';
  
  return new Promise((resolve, reject) => {
    const requestOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Security-Test-Script/1.0',
        ...options.headers
      }
    };

    const req = (url.startsWith('https') ? https : require('http')).request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Security Tests
const securityTests = [
  {
    name: 'Email Enumeration Prevention',
    test: async () => {
      console.log('  Testing email enumeration prevention...');
      
      // Try to register with the same email twice
      const email = generateTestEmail();
      const registerData = {
        firstName: 'Test',
        lastName: 'User',
        email,
        phone: '2535551234',
        password: 'testpassword123',
        address: {
          street: '123 Test St',
          city: 'Tacoma', 
          state: 'WA',
          zipCode: '98401'
        }
      };

      const firstAttempt = await makeRequest('/api/auth/register', {
        method: 'POST',
        body: registerData
      });

      const secondAttempt = await makeRequest('/api/auth/register', {
        method: 'POST', 
        body: registerData
      });

      // Both should return success (preventing enumeration)
      if (firstAttempt.status === 201 && secondAttempt.status === 201) {
        console.log('  ✅ Email enumeration prevention: PASS');
        return true;
      } else {
        console.log('  ❌ Email enumeration prevention: FAIL');
        console.log(`    First attempt: ${firstAttempt.status}`);
        console.log(`    Second attempt: ${secondAttempt.status}`);
        return false;
      }
    }
  },

  {
    name: 'Email Verification Required',
    test: async () => {
      console.log('  Testing email verification requirement...');
      
      // Register a new user
      const email = generateTestEmail();
      const password = 'testpassword123';
      
      const registerResponse = await makeRequest('/api/auth/register', {
        method: 'POST',
        body: {
          firstName: 'Test',
          lastName: 'User', 
          email,
          phone: '2535551234',
          password,
          address: {
            street: '123 Test St',
            city: 'Tacoma',
            state: 'WA', 
            zipCode: '98401'
          }
        }
      });

      if (registerResponse.status !== 201) {
        console.log('  ❌ Registration failed');
        return false;
      }

      // Try to login immediately (should fail)
      const loginResponse = await makeRequest('/api/auth/login', {
        method: 'POST',
        body: {
          identifier: email,
          password,
          type: 'email'
        }
      });

      if (loginResponse.status === 403) {
        console.log('  ✅ Email verification required: PASS');
        return true;
      } else {
        console.log('  ❌ Email verification required: FAIL'); 
        console.log(`    Login status: ${loginResponse.status}`);
        console.log(`    Login response:`, loginResponse.data);
        return false;
      }
    }
  },

  {
    name: 'Rate Limiting',
    test: async () => {
      console.log('  Testing rate limiting...');
      
      const email = generateTestEmail();
      const registerData = {
        firstName: 'Test',
        lastName: 'User',
        email,
        phone: '2535551234', 
        password: 'testpassword123',
        address: {
          street: '123 Test St',
          city: 'Tacoma',
          state: 'WA',
          zipCode: '98401'
        }
      };

      // Make multiple rapid requests
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(makeRequest('/api/auth/register', {
          method: 'POST',
          body: registerData
        }));
      }

      const responses = await Promise.all(promises);
      const rateLimited = responses.some(r => r.status === 429);

      if (rateLimited) {
        console.log('  ✅ Rate limiting: PASS');
        return true;
      } else {
        console.log('  ❌ Rate limiting: FAIL');
        return false;
      }
    }
  },

  {
    name: 'Password Security',
    test: async () => {
      console.log('  Testing password security requirements...');
      
      // Test weak password
      const weakPasswordResponse = await makeRequest('/api/auth/register', {
        method: 'POST',
        body: {
          firstName: 'Test',
          lastName: 'User',
          email: generateTestEmail(),
          phone: '2535551234',
          password: '123', // Weak password
          address: {
            street: '123 Test St',
            city: 'Tacoma',
            state: 'WA',
            zipCode: '98401'
          }
        }
      });

      if (weakPasswordResponse.status === 400) {
        console.log('  ✅ Password security: PASS');
        return true;
      } else {
        console.log('  ❌ Password security: FAIL');
        console.log(`    Weak password status: ${weakPasswordResponse.status}`);
        return false;
      }
    }
  }
];

// Run all tests
async function runSecurityTests() {
  console.log('🔒 Running Customer Registration Security Tests...\n');
  
  const results = [];
  
  for (const test of securityTests) {
    console.log(`📋 ${test.name}`);
    try {
      const result = await test.test();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      console.log(`  ❌ ${test.name}: ERROR - ${error.message}`);
      results.push({ name: test.name, passed: false, error: error.message });
    }
    console.log('');
  }
  
  // Summary
  console.log('📊 SECURITY TEST SUMMARY');
  console.log('========================');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${result.name}`);
    if (result.error) {
      console.log(`    Error: ${result.error}`);
    }
  });
  
  console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🛡️  All security tests passed! Registration flow is secure.');
    process.exit(0);
  } else {
    console.log('⚠️  Some security tests failed. Review the issues above.');
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runSecurityTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runSecurityTests };