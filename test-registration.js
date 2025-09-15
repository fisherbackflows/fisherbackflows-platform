#!/usr/bin/env node

// Test customer registration with email verification
require('dotenv').config({ path: '.env.local' });

async function testRegistration() {
  console.log('🧪 Testing Customer Registration Flow...\n');

  const testUser = {
    email: 'test+' + Date.now() + '@fisherbackflows.com',
    password: 'TestPassword123!',
    fullName: 'Test Customer',
    phone: '2531234567',
    address: '123 Test St, Tacoma, WA 98401'
  };

  console.log('📋 Test Registration Data:');
  console.log('Email:', testUser.email);
  console.log('Full Name:', testUser.fullName);
  console.log('Phone:', testUser.phone);

  try {
    console.log('\n📡 Sending registration request...');

    const response = await fetch('http://localhost:3010/api/auth/register-with-resend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });

    const result = await response.json();

    console.log('\n📊 Registration Response:');
    console.log('Status:', response.status);
    console.log('Success:', result.success);
    console.log('Message:', result.message);

    if (result.error) {
      console.log('❌ Error:', result.error);
    }

    if (result.success) {
      console.log('✅ Registration successful!');
      console.log('🔍 Check email for verification link');
    } else {
      console.log('❌ Registration failed');
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('💡 Make sure the dev server is running: npm run dev');
  }
}

console.log('🚀 Starting registration test...');
console.log('💡 Make sure dev server is running first!');
console.log('📝 This will create a test customer account\n');

testRegistration().catch(console.error);