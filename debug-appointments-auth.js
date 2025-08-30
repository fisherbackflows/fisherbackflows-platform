const axios = require('axios');

async function debugAppointmentsAuth() {
  console.log('🔧 Testing appointments auth...');
  
  try {
    // First login
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post('http://localhost:3010/api/team/auth/login', {
      email: 'admin@fisherbackflows.com',
      password: 'admin'
    });
    
    if (loginResponse.status === 200) {
      console.log('✅ Login successful');
      const sessionCookie = loginResponse.headers['set-cookie']?.[0];
      console.log('🍪 Session cookie:', sessionCookie ? 'present' : 'missing');
      
      // Then try appointments
      console.log('\n2️⃣ Calling appointments API...');
      const appointmentsResponse = await axios.get('http://localhost:3010/api/appointments', {
        headers: {
          'Cookie': sessionCookie || '',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Appointments call successful');
      console.log('Response:', appointmentsResponse.data);
    }
    
  } catch (error) {
    console.log('❌ Failed');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(`   Network Error: ${error.message}`);
    }
  }
}

debugAppointmentsAuth();