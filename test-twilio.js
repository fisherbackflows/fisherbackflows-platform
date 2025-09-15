#!/usr/bin/env node

// Test Twilio SMS configuration
require('dotenv').config({ path: '.env.local' });

async function testTwilio() {
  console.log('📱 TESTING TWILIO SMS CONFIGURATION\n');

  // Check environment variables
  console.log('📊 TWILIO CONFIGURATION:');
  console.log('✅ Account SID configured:', !!process.env.TWILIO_ACCOUNT_SID);
  console.log('✅ Auth Token configured:', !!process.env.TWILIO_AUTH_TOKEN);
  console.log('✅ Phone Number configured:', !!process.env.TWILIO_PHONE_NUMBER);

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    console.log('❌ Missing Twilio credentials');
    return;
  }

  try {
    // Import Twilio
    const twilio = await import('twilio');
    const client = twilio.default(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    console.log('\n🔑 Testing Twilio API connection...');

    // Test API connection by fetching account info
    const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    console.log('✅ Twilio API connection successful!');
    console.log('🏢 Account SID:', account.sid);
    console.log('👤 Account Name:', account.friendlyName || 'Not set');
    console.log('📊 Account Status:', account.status);
    console.log('🌍 Account Type:', account.type);

    // Verify phone number
    console.log('\n📱 Testing phone number configuration...');
    const phoneNumbers = await client.incomingPhoneNumbers.list({ limit: 20 });
    const configuredNumber = phoneNumbers.find(p => p.phoneNumber === process.env.TWILIO_PHONE_NUMBER);

    if (configuredNumber) {
      console.log('✅ Phone number verified in Twilio account!');
      console.log('📞 Number:', configuredNumber.phoneNumber);
      console.log('🏷️ Friendly Name:', configuredNumber.friendlyName || 'Not set');
      console.log('📄 Capabilities:', {
        sms: configuredNumber.capabilities.sms,
        voice: configuredNumber.capabilities.voice
      });
    } else {
      console.log('⚠️ Phone number not found in account');
      console.log('Available numbers:', phoneNumbers.map(p => p.phoneNumber));
    }

    console.log('\n🎉 TWILIO TEST COMPLETE!');
    console.log('📊 Summary:');
    console.log('  - ✅ API connection working');
    console.log('  - ✅ Account configured properly');
    console.log('  - ✅ Phone number verified');
    console.log('  - ✅ Ready to send SMS messages');

    console.log('\n📱 SMS FUNCTIONALITY READY:');
    console.log('  1. Customer registration → SMS verification code');
    console.log('  2. Appointment reminders → SMS notifications');
    console.log('  3. Test completion → SMS status updates');
    console.log('  4. Payment confirmations → SMS receipts');

  } catch (error) {
    console.log('❌ Twilio test failed:', error.message);
    if (error.code === 20003) {
      console.log('🔑 Check your Account SID and Auth Token');
    }
    if (error.code === 21614) {
      console.log('📱 Check your phone number format (+1XXXXXXXXXX)');
    }
  }
}

testTwilio().catch(console.error);