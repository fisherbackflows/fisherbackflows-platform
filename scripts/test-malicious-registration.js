#!/usr/bin/env node

/**
 * MALICIOUS USER SIMULATION - Security Testing
 * Tests what an actual attacker would try against the registration form
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://fisherbackflows.com';

async function makeRequest(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const method = options.method || 'GET';
  
  return new Promise((resolve, reject) => {
    const requestOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        ...options.headers
      }
    };

    const req = (url.startsWith('https') ? https : http).request(url, requestOptions, (res) => {
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

const maliciousTests = [
  {
    name: 'SQL Injection Attempt in Email',
    payload: {
      firstName: 'Test',
      lastName: 'User',
      email: "admin'; DROP TABLE customers; --@evil.com",
      phone: '2535551234',
      password: 'password123',
      address: { street: '123 Test St', city: 'Tacoma', state: 'WA', zipCode: '98401' }
    }
  },
  {
    name: 'XSS Payload in Name Fields',
    payload: {
      firstName: '<script>alert("XSS")</script>',
      lastName: '<img src=x onerror=alert(1)>',
      email: 'test@example.com',
      phone: '2535551234', 
      password: 'password123',
      address: { street: '123 Test St', city: 'Tacoma', state: 'WA', zipCode: '98401' }
    }
  },
  {
    name: 'Command Injection in Address',
    payload: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '2535551234',
      password: 'password123',
      address: { 
        street: '123 Main St; cat /etc/passwd', 
        city: 'Tacoma', 
        state: 'WA', 
        zipCode: '98401' 
      }
    }
  },
  {
    name: 'Extremely Weak Password',
    payload: {
      firstName: 'Test',
      lastName: 'User', 
      email: 'weak@example.com',
      phone: '2535551234',
      password: '1',
      address: { street: '123 Test St', city: 'Tacoma', state: 'WA', zipCode: '98401' }
    }
  },
  {
    name: 'Massive Data Input (DoS Attempt)',
    payload: {
      firstName: 'A'.repeat(10000),
      lastName: 'B'.repeat(10000),
      email: 'huge@example.com',
      phone: '2535551234',
      password: 'password123',
      address: { 
        street: 'C'.repeat(50000), 
        city: 'Tacoma', 
        state: 'WA', 
        zipCode: '98401' 
      }
    }
  },
  {
    name: 'Email Enumeration Test',
    payload: {
      firstName: 'Test',
      lastName: 'User',
      email: 'admin@fisherbackflows.com',
      phone: '2535551234',
      password: 'password123', 
      address: { street: '123 Test St', city: 'Tacoma', state: 'WA', zipCode: '98401' }
    }
  },
  {
    name: 'Invalid Phone Format',
    payload: {
      firstName: 'Test',
      lastName: 'User',
      email: 'phone@example.com', 
      phone: 'javascript:alert(1)',
      password: 'password123',
      address: { street: '123 Test St', city: 'Tacoma', state: 'WA', zipCode: '98401' }
    }
  },
  {
    name: 'Missing Required Fields',
    payload: {
      email: 'incomplete@example.com'
      // Intentionally missing other required fields
    }
  },
  {
    name: 'JSON Injection',
    payload: {
      firstName: 'Test',
      lastName: 'User',
      email: 'json@example.com',
      phone: '2535551234',
      password: 'password123',
      address: { street: '123 Test St', city: 'Tacoma', state: 'WA', zipCode: '98401' },
      malicious: { role: 'admin', permissions: ['all'] }
    }
  }
];

async function runMaliciousTests() {
  console.log('🔥 MALICIOUS USER SIMULATION - Testing Attack Vectors\n');
  
  for (const test of maliciousTests) {
    console.log(`🎯 ${test.name}`);
    
    try {
      const response = await makeRequest('/api/auth/register', {
        method: 'POST',
        body: test.payload
      });
      
      console.log(`   Status: ${response.status}`);
      
      if (response.data?.error) {
        console.log(`   ✅ Blocked: ${response.data.error}`);
      } else if (response.data?.success) {
        console.log(`   ⚠️  Accepted: ${response.data.message}`);
      } else {
        console.log(`   📝 Response: ${typeof response.data === 'string' ? response.data.substring(0, 100) : JSON.stringify(response.data).substring(0, 100)}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
    
    // Rate limiting friendly delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('🔍 Malicious testing complete. Review results for security gaps.');
}

if (require.main === module) {
  runMaliciousTests().catch(console.error);
}

module.exports = { runMaliciousTests };