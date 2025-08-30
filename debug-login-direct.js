const axios = require('axios');

async function debugLoginDirect() {
  console.log('🔧 Testing direct login with different passwords...');
  
  const passwords = ['admin', 'password', 'fisherbackflows'];
  
  for (const password of passwords) {
    try {
      console.log(`\n🔐 Trying password: "${password}"`);
      const loginResponse = await axios.post('http://localhost:3010/api/team/auth/login', {
        email: 'admin@fisherbackflows.com',
        password: password
      });
      
      if (loginResponse.status === 200) {
        console.log(`✅ Success with password: "${password}"`);
        console.log('Response:', loginResponse.data);
        break;
      }
    } catch (error) {
      console.log(`❌ Failed with password: "${password}"`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Error: ${JSON.stringify(error.response.data)}`);
      } else {
        console.log(`   Network Error: ${error.message}`);
      }
    }
  }
}

debugLoginDirect();