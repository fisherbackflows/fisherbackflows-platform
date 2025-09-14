#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const BASE_URL = 'http://localhost:3010';

async function testAPIEndpoints() {
  console.log('🔧 Testing Multi-Tenant API Endpoints\n');

  // Test data
  const testCompany = {
    name: 'API Test Company',
    businessType: 'testing_service',
    email: 'api@testcompany.com',
    phone: '555-API-TEST',
    website: 'https://api-test.com',
    addressLine1: '123 API Street',
    addressLine2: 'Suite API',
    city: 'Test City',
    state: 'WA',
    zipCode: '98000',
    licenseNumber: 'API-2025',
    certificationLevel: 'advanced',
    adminFirstName: 'API',
    adminLastName: 'Admin',
    adminEmail: 'apiadmin@testcompany.com',
    adminPassword: 'APITestPassword123!',
    planType: 'professional'
  };

  try {
    console.log('1️⃣ Testing Company Registration API...');

    const registerResponse = await fetch(`${BASE_URL}/api/team/company/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCompany)
    });

    const registerData = await registerResponse.json();

    if (registerResponse.ok) {
      console.log('   ✅ Company registration successful!');
      console.log(`   🏢 Company: ${registerData.company.name} (${registerData.company.slug})`);
      console.log(`   👤 Admin: ${registerData.admin.first_name} ${registerData.admin.last_name}`);
      console.log(`   📧 Email: ${registerData.admin.email}`);
      console.log(`   🎯 Plan: ${registerData.company.plan_type}\n`);

      console.log('2️⃣ Testing Admin Login API...');

      const loginResponse = await fetch(`${BASE_URL}/api/team/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testCompany.adminEmail,
          password: testCompany.adminPassword
        })
      });

      const loginData = await loginResponse.json();

      if (loginResponse.ok) {
        console.log('   ✅ Admin login successful!');
        console.log(`   👤 User: ${loginData.user.first_name} ${loginData.user.last_name}`);
        console.log(`   🛡️ Role: ${loginData.role}`);
        console.log(`   ⏰ Session expires: ${new Date(loginData.sessionExpires).toLocaleString()}\n`);

        console.log('🎉 Multi-tenant system is working perfectly!');
        console.log('\n🌐 Test manually at:');
        console.log(`   Registration: ${BASE_URL}/team-portal/register-company`);
        console.log(`   Login: ${BASE_URL}/team-portal/login`);
        console.log('\n📊 Admin credentials for manual testing:');
        console.log(`   Email: ${testCompany.adminEmail}`);
        console.log(`   Password: ${testCompany.adminPassword}`);

      } else {
        console.log(`   ❌ Admin login failed: ${loginData.error}`);
      }

    } else {
      console.log(`   ❌ Company registration failed: ${registerData.error}`);
      if (registerData.details) {
        console.log(`   📋 Details: ${registerData.details.join(', ')}`);
      }
    }

    console.log('\n=================================');
    console.log('🏁 Multi-Tenant System Test Complete');
    console.log('=================================');

  } catch (error) {
    console.error('❌ API Test Error:', error.message);
    console.log('\n💡 Make sure the dev server is running: npm run dev');
  }
}

testAPIEndpoints();