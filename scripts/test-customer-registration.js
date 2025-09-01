#!/usr/bin/env node

const fetch = require('node-fetch');

async function testCustomerRegistration() {
  console.log('🧪 Testing customer registration API...');
  
  const testCustomer = {
    firstName: 'Test',
    lastName: 'Customer',
    email: `test${Date.now()}@gmail.com`,
    phone: '(253) 555-9999',
    password: 'TestPassword123!',
    address: {
      street: '123 Test Street',
      city: 'Tacoma',
      state: 'WA',
      zipCode: '98402'
    },
    propertyType: 'residential'
  };
  
  try {
    console.log('📤 Registering customer:');
    console.log(`  Name: ${testCustomer.firstName} ${testCustomer.lastName}`);
    console.log(`  Email: ${testCustomer.email}`);
    console.log(`  Phone: ${testCustomer.phone}`);
    
    const response = await fetch('http://localhost:3010/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCustomer)
    });
    
    console.log(`\n📥 Response status: ${response.status}`);
    
    const data = await response.text();
    console.log('📥 Response body:', data);
    
    if (response.ok) {
      console.log('\n✅ Customer registration API is working!');
      const result = JSON.parse(data);
      if (result.user) {
        console.log(`  ✅ Account Number: ${result.user.accountNumber}`);
        console.log(`  ✅ User ID: ${result.user.id}`);
        console.log(`  ✅ Status: ${result.user.status}`);
      }
    } else {
      console.log('\n❌ Customer registration failed');
      try {
        const errorData = JSON.parse(data);
        console.log(`  Error: ${errorData.error}`);
      } catch (e) {
        console.log(`  Raw error: ${data}`);
      }
    }
    
  } catch (error) {
    console.error('💥 Test error:', error.message);
  }
}

testCustomerRegistration();