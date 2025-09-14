#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const BASE_URL = 'http://localhost:3010';

async function testEmployeeSystem() {
  console.log('👥 Testing Employee Management System\n');

  // First, login as the company admin we just created
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

  const loginData = await loginResponse.json();

  if (loginResponse.ok) {
    console.log('✅ Admin login successful');
    console.log(`   User: ${loginData.user.first_name} ${loginData.user.last_name}`);
    console.log(`   Role: ${loginData.role}`);
    console.log(`   Session: ${loginData.sessionToken ? 'Active' : 'Cookie-based'}`);

    // Now test employee invitation
    console.log('\n👨‍💼 Testing Employee Invitation...');

    const inviteResponse = await fetch(`${BASE_URL}/api/team/invitations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': loginResponse.headers.get('set-cookie') || ''
      },
      body: JSON.stringify({
        email: 'testemployee@testcompany.com',
        first_name: 'Test',
        last_name: 'Employee',
        role: 'tester'
      })
    });

    const inviteData = await inviteResponse.json();

    if (inviteResponse.ok) {
      console.log('✅ Employee invitation sent successfully!');
      console.log(`   📧 Invitation ID: ${inviteData.invitation.id}`);
      console.log(`   👤 Invitee: ${inviteData.invitation.first_name} ${inviteData.invitation.last_name}`);
      console.log(`   🎯 Role: ${inviteData.invitation.role}`);
      console.log(`   ⏰ Expires: ${new Date(inviteData.invitation.expires_at).toLocaleString()}`);

      console.log('\n🎉 Employee Management System Working!');
      console.log('\n🌐 Manual Testing URLs:');
      console.log(`   Company Admin Login: ${BASE_URL}/team-portal/login`);
      console.log(`   Employee Management: ${BASE_URL}/team-portal/admin/employees`);
      console.log(`   Registration: ${BASE_URL}/team-portal/register-company`);

      console.log('\n🔑 Test Credentials:');
      console.log('   Email: apiadmin@testcompany.com');
      console.log('   Password: APITestPassword123!');

    } else {
      console.log('❌ Employee invitation failed:', inviteData.error);
    }

  } else {
    console.log('❌ Admin login failed:', loginData.error);
  }
}

testEmployeeSystem();