const axios = require('axios');

async function debugCookie() {
  console.log('🔧 Testing cookie handling...');
  
  try {
    // First login and capture all details
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post('http://localhost:3010/api/team/auth/login', {
      email: 'admin@fisherbackflows.com',
      password: 'admin'
    });
    
    if (loginResponse.status === 200) {
      console.log('✅ Login successful');
      console.log('🍪 All cookies:', loginResponse.headers['set-cookie']);
      
      const sessionCookie = loginResponse.headers['set-cookie']?.[0];
      console.log('🍪 Session cookie raw:', sessionCookie);
      
      // Parse the cookie to see what's in it
      if (sessionCookie) {
        const cookieParts = sessionCookie.split(';');
        console.log('🍪 Cookie parts:', cookieParts);
        
        const sessionValue = cookieParts[0].split('=')[1];
        console.log('🍪 Session value:', sessionValue);
      }
      
      // Check mock sessions in memory (if this were server-side)
      console.log('🔍 This would check global.mockTeamSessions on server');
      
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

debugCookie();