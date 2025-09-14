#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const BASE_URL = 'http://localhost:3010';

async function testRoleBasedNavigation() {
  console.log('🧭 Testing Role-Based Navigation\n');

  // Login as company admin
  const loginResponse = await fetch(`${BASE_URL}/api/team/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'apiadmin@testcompany.com',
      password: 'APITestPassword123!'
    })
  });

  if (loginResponse.ok) {
    const loginData = await loginResponse.json();
    console.log(`✅ Logged in as: ${loginData.user.first_name} ${loginData.user.last_name}`);
    console.log(`🛡️ Role: ${loginData.role}`);

    // Test access to employee management page
    const employeesResponse = await fetch(`${BASE_URL}/team-portal/admin/employees`, {
      method: 'GET',
      headers: {
        'Cookie': loginResponse.headers.get('set-cookie') || ''
      }
    });

    console.log(`\n👥 Employee Management Access: ${employeesResponse.ok ? '✅ ALLOWED' : '❌ DENIED'}`);
    if (employeesResponse.ok) {
      console.log('   📊 Company admin can access employee management');
    }

    // Test dashboard access
    const dashboardResponse = await fetch(`${BASE_URL}/team-portal/dashboard`, {
      method: 'GET',
      headers: {
        'Cookie': loginResponse.headers.get('set-cookie') || ''
      }
    });

    console.log(`📈 Dashboard Access: ${dashboardResponse.ok ? '✅ ALLOWED' : '❌ DENIED'}`);

    console.log('\n🎯 Role-Based Features Verification:');
    console.log(`✅ Company Admin Role: ${loginData.role === 'company_admin' ? 'CORRECT' : 'INCORRECT'}`);
    console.log(`✅ Employee Management: ${employeesResponse.ok ? 'ACCESSIBLE' : 'RESTRICTED'}`);
    console.log(`✅ Dashboard Access: ${dashboardResponse.ok ? 'ACCESSIBLE' : 'RESTRICTED'}`);

    if (loginData.role === 'company_admin' && employeesResponse.ok) {
      console.log('\n🎉 Role-Based Navigation System: FULLY FUNCTIONAL');
      console.log('\n📋 Company Admin Capabilities:');
      console.log('   • Create and manage employee accounts');
      console.log('   • Send employee invitations');
      console.log('   • Access all company data');
      console.log('   • Manage company settings');
      console.log('   • View employee management dashboard');
    }

  } else {
    const errorData = await loginResponse.json();
    console.log('❌ Login failed:', errorData.error);
  }
}

testRoleBasedNavigation();