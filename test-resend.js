#!/usr/bin/env node

// Simple test script to verify Resend API key works
require('dotenv').config({ path: '.env.local' });

async function testResend() {
  console.log('🧪 Testing Resend API Configuration...\n');

  // Check if API key is configured
  const apiKey = process.env.RESEND_API_KEY;
  console.log('API Key configured:', !!apiKey);
  console.log('API Key starts with:', apiKey ? apiKey.substring(0, 8) + '...' : 'NONE');

  if (!apiKey) {
    console.log('❌ No RESEND_API_KEY found in environment');
    return;
  }

  try {
    // Import Resend
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);

    console.log('\n📧 Attempting to send test email...');

    const { data, error } = await resend.emails.send({
      from: 'Fisher Backflows <onboarding@resend.dev>',
      to: 'fisherbackflows@gmail.com',
      subject: '🧪 Test Email - Fisher Backflows Platform',
      html: `
        <h2>✅ Resend Test Successful!</h2>
        <p>This test email was sent from the Fisher Backflows platform.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>Test Result:</strong> Resend API integration is working correctly!</p>
      `
    });

    if (error) {
      console.log('❌ Resend API Error:', error);
      return;
    }

    console.log('✅ Email sent successfully!');
    console.log('📧 Email ID:', data.id);
    console.log('📧 From:', data.from);
    console.log('📧 To:', data.to);

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testResend().catch(console.error);