#!/usr/bin/env node

async function testRegistration() {
  console.log('\n🧪 Testing Customer Registration with Resend\n');
  console.log('='.repeat(60));
  
  // Generate unique test email
  const timestamp = Date.now();
  const testEmail = `test.customer.${timestamp}@fisherbackflows.com`;
  
  const registrationData = {
    firstName: 'Test',
    lastName: `Customer${timestamp}`,
    email: testEmail,
    phone: '(253) 555-0199',
    password: 'TestPassword123!',
    confirmPassword: 'TestPassword123!',
    address: {
      street: '123 Test Street',
      city: 'Tacoma',
      state: 'WA',
      zipCode: '98401'
    },
    propertyType: 'residential',
    agreeToTerms: true
  };

  console.log('📝 Registration Data:');
  console.log(`   Name: ${registrationData.firstName} ${registrationData.lastName}`);
  console.log(`   Email: ${registrationData.email}`);
  console.log(`   Phone: ${registrationData.phone}`);
  console.log(`   Address: ${registrationData.address.street}, ${registrationData.address.city}, ${registrationData.address.state}`);
  console.log('');

  try {
    console.log('🚀 Sending registration request...\n');
    
    const response = await fetch('http://localhost:3010/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationData)
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Registration successful!');
      console.log('\n📧 Registration Details:');
      console.log(`   User ID: ${result.user.id}`);
      console.log(`   Account Number: ${result.user.accountNumber}`);
      console.log(`   Status: ${result.user.status}`);
      console.log('\n📬 Email Status:');
      console.log('   A verification email has been sent via Resend');
      console.log('   Check the server logs for Resend email confirmation');
      console.log('\n💡 Note: Since this is a test email to @fisherbackflows.com,');
      console.log('   it may not actually deliver unless you have email forwarding set up.');
    } else {
      console.error('❌ Registration failed:', result.error || 'Unknown error');
      if (result.error?.includes('already exists')) {
        console.log('\n💡 Try running the test again - it generates unique emails each time');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n⚠️  Server not running. Start it with: npm run dev');
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Test complete\n');
}

testRegistration().catch(console.error);