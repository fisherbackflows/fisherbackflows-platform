#!/usr/bin/env node

const { config } = require('dotenv');
const path = require('path');

// Load environment variables
config({ path: path.join(__dirname, '..', '.env.local') });

async function testResend() {
  console.log('\n🔧 Fisher Backflows - Resend Email Service Test\n');
  console.log('=' . repeat(60));

  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in environment variables');
    console.log('\n📝 To fix this:');
    console.log('1. Get your API key from https://resend.com/api-keys');
    console.log('2. Add to .env.local:');
    console.log('   RESEND_API_KEY=re_xxxxxxxxxxxx');
    console.log('\n📌 Domain Setup:');
    console.log('1. Go to https://resend.com/domains');
    console.log('2. Add domain: mail.fisherbackflows.com');
    console.log('3. Add these DNS records to your domain provider:');
    console.log('   - TXT record for SPF');
    console.log('   - MX record for bounce handling');
    console.log('4. Click "Verify DNS Records" in Resend dashboard');
    console.log('\n⏰ Note: DNS propagation can take up to 72 hours');
    process.exit(1);
  }

  console.log('✅ Resend API key found');
  console.log('🔑 Key prefix:', process.env.RESEND_API_KEY.substring(0, 10) + '...');

  // Test the API connection
  console.log('\n📧 Testing Resend API connection...\n');

  try {
    const response = await fetch('http://localhost:3010/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'fisherbackflows@gmail.com',
        subject: 'Test Email - Fisher Backflows Platform',
        html: `
          <h2>🎉 Resend Integration Test Successful!</h2>
          <p>This test email confirms that your Resend integration is working.</p>
          <hr>
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>Timestamp: ${new Date().toISOString()}</li>
            <li>Environment: ${process.env.NODE_ENV || 'development'}</li>
            <li>From Domain: mail.fisherbackflows.com</li>
          </ul>
          <hr>
          <p><em>Fisher Backflows Platform - Email Service Test</em></p>
        `
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Email sent successfully!');
      console.log('📬 Check fisherbackflows@gmail.com for the test email');
      if (result.data?.id) {
        console.log('📝 Email ID:', result.data.id);
      }
    } else {
      console.error('❌ Failed to send email:', result.error);
      
      if (result.error?.includes('domain')) {
        console.log('\n⚠️  Domain Verification Issue Detected');
        console.log('Please check: https://resend.com/domains');
        console.log('Ensure mail.fisherbackflows.com is verified');
      }
    }
  } catch (error) {
    console.error('❌ Error testing Resend:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n⚠️  Server not running');
      console.log('Run: npm run dev');
    }
  }

  console.log('\n' + '=' . repeat(60));
  console.log('Test complete\n');
}

// Run the test
testResend().catch(console.error);