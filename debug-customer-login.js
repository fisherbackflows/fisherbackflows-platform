#!/usr/bin/env node

async function debugCustomerLogin() {
  console.log('\n🔍 DEBUG CUSTOMER LOGIN ISSUE\n');
  console.log('='.repeat(60));
  
  const productionUrl = 'https://www.fisherbackflows.com';
  const customerEmail = 'customer@fisherbackflows.com';
  const customerPassword = 'Knvgtch6r91!';
  
  console.log('🧪 Testing customer login step by step...\n');
  
  // Step 1: Test validation
  console.log('1. TESTING INPUT VALIDATION:');
  const loginPayload = {
    identifier: customerEmail,
    password: customerPassword,
    type: 'email'
  };
  console.log(`   Request payload: ${JSON.stringify(loginPayload)}`);
  console.log(`   Email format: ${/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`   Password length: ${customerPassword.length} chars`);
  console.log('');
  
  // Step 2: Test login API with detailed error handling
  console.log('2. TESTING LOGIN API:');
  try {
    const response = await fetch(`${productionUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Login Debug Test'
      },
      body: JSON.stringify(loginPayload)
    });
    
    console.log(`   Response Status: ${response.status} ${response.statusText}`);
    console.log(`   Response Headers:`, [...response.headers.entries()].slice(0, 5));
    
    const responseText = await response.text();
    console.log(`   Response Body: ${responseText}`);
    
    if (response.status === 500) {
      console.log('\n   🚨 SERVER ERROR DETECTED - Checking possible causes:');
      console.log('   • Supabase authentication failure');
      console.log('   • Database connection issue'); 
      console.log('   • Customer record not found');
      console.log('   • Field mapping error in customer data');
      console.log('   • Environment variable missing');
    }
    
  } catch (error) {
    console.log(`   ❌ API Request Failed: ${error.message}`);
  }
  
  console.log('');
  
  // Step 3: Test if customer exists by trying registration
  console.log('3. TESTING CUSTOMER EXISTENCE:');
  try {
    const regResponse = await fetch(`${productionUrl}/api/auth/register`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'Customer',
        email: customerEmail,
        phone: '2531234567',
        password: 'TestPassword123!',
        address: {
          street: '123 Test St',
          city: 'Tacoma', 
          state: 'WA',
          zipCode: '98402'
        }
      })
    });
    
    const regResult = await regResponse.json();
    console.log(`   Registration Status: ${regResponse.status}`);
    console.log(`   Registration Response: ${regResult.error || regResult.message}`);
    
    if (regResult.error && regResult.error.includes('already registered')) {
      console.log('   ✅ Customer account exists in database');
    } else if (regResponse.status === 200) {
      console.log('   ⚠️ Customer account did NOT exist (just created)');  
    }
    
  } catch (regError) {
    console.log(`   ❌ Registration test failed: ${regError.message}`);
  }
  
  console.log('');
  
  // Step 4: Expected behavior analysis
  console.log('4. EXPECTED LOGIN FLOW:');
  console.log('   • Input validation ✅ (now fixed)');
  console.log('   • Supabase auth.signInWithPassword()');
  console.log('   • Customer lookup in database');
  console.log('   • Data mapping (first_name + last_name -> name)');
  console.log('   • Role determination');
  console.log('   • Success response with user object');
  
  console.log('\n' + '='.repeat(60));
  console.log('🔍 CUSTOMER LOGIN DEBUG: COMPLETE');
  console.log('='.repeat(60));
}

debugCustomerLogin().catch(console.error);
