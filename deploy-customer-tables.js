const https = require('https');
const fs = require('fs');

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY';

// Create customers table using REST API insert
async function createCustomerTables() {
  console.log('Creating customer tables...');
  
  // Create customers via direct insert (tables will be created automatically)
  const customers = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      account_number: 'FB001',
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '555-0123',
      address: '123 Main St, City, State 12345',
      balance: 0.00,
      next_test_date: '2025-01-15',
      status: 'Active'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002', 
      account_number: 'FB002',
      name: 'ABC Corporation',
      email: 'admin@abccorp.com',
      phone: '555-0456',
      address: '456 Business Ave, City, State 12345',
      balance: 150.00,
      next_test_date: '2025-03-20',
      status: 'Needs Service'
    }
  ];

  // Test if customers table exists by trying to select from it
  try {
    const response = await fetch('https://jvhbqfueutvfepsjmztx.supabase.co/rest/v1/customers?limit=1', {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    });
    
    if (response.ok) {
      console.log('✅ Customers table already exists');
      const data = await response.json();
      console.log('Existing customers:', data.length);
      return;
    }
  } catch (error) {
    console.log('Customers table does not exist, will create...');
  }
  
  console.log('❌ Cannot create tables via REST API - need SQL access');
  console.log('Please run the SQL manually in Supabase dashboard:');
  console.log(fs.readFileSync('./create-customer-tables.sql', 'utf8'));
}

createCustomerTables().catch(console.error);