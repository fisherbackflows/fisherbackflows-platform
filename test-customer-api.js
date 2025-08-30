const axios = require('axios');

async function testCustomerAPI() {
  console.log('🧪 Testing Customer API...');
  
  try {
    // First, let's test login to get a session
    const loginResponse = await axios.post('http://localhost:3010/api/team/auth/login', {
      email: 'admin@fisherbackflows.com',
      password: 'admin'
    });
    
    console.log('✅ Login successful');
    
    // Extract session cookie if present
    const sessionCookie = loginResponse.headers['set-cookie']?.[0];
    
    // Test customer API with auth
    const customerResponse = await axios.get('http://localhost:3010/api/customers', {
      headers: {
        'Cookie': sessionCookie || '',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Customer API Response:');
    console.log(`📊 Customer Count: ${customerResponse.data.customers?.length || 0}`);
    console.log(`🎯 Using Mock Data: ${customerResponse.data.usingMockData}`);
    
    if (customerResponse.data.customers && customerResponse.data.customers.length > 0) {
      console.log('\n📋 Sample Customer Data:');
      const sample = customerResponse.data.customers[0];
      console.log(`   Name: ${sample.first_name} ${sample.last_name}`);
      console.log(`   Company: ${sample.company_name}`);
      console.log(`   Account: ${sample.account_number}`);
      console.log(`   Status: ${sample.account_status}`);
      console.log(`   Devices: ${sample.devices?.length || 0} linked`);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error:', error.response.status, error.response.data);
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
}

testCustomerAPI();