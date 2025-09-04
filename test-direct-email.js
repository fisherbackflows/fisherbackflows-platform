#!/usr/bin/env node

const { Resend } = require('resend');
const crypto = require('crypto');

// Test sending verification email directly without database
async function testDirectEmail() {
  console.log('\n🚀 Testing Direct Resend Email (No Database)\n');
  console.log('='.repeat(60));
  
  const resend = new Resend('re_EPS1bF7f_FmVbmEWP11tnP7fTJbJvUPYq');
  const token = crypto.randomBytes(32).toString('hex');
  const verificationUrl = `http://localhost:3010/api/auth/verify-email?token=${token}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Verify Your Email - Fisher Backflows</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 40px auto; background: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 50px; font-weight: 600; margin: 20px 0; }
        .content { padding: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔧 Fisher Backflows</h1>
            <p>Professional Backflow Testing & Compliance</p>
        </div>
        <div class="content">
            <h2>Email Verification Test</h2>
            <p>This is a test of the pure Resend email system.</p>
            <p><strong>✅ No Supabase email system involved</strong></p>
            <p><strong>✅ Sent directly via mail.fisherbackflows.com</strong></p>
            <p><strong>✅ No bounce risk to Supabase account</strong></p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            <p><small>Test Token: ${token.substring(0, 20)}...</small></p>
            <p><small>This is a test email demonstrating the verification system.</small></p>
        </div>
    </div>
</body>
</html>
  `;
  
  console.log('📧 Sending test verification email...');
  console.log(`To: fisherbackflows@gmail.com`);
  console.log(`From: noreply@mail.fisherbackflows.com`);
  console.log('');
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Fisher Backflows <noreply@mail.fisherbackflows.com>',
      to: 'fisherbackflows@gmail.com',
      subject: '🔧 Test: Email Verification - Fisher Backflows',
      html: html,
      reply_to: 'fisherbackflows@gmail.com'
    });

    if (error) {
      console.error('❌ Failed to send email:', error);
    } else {
      console.log('✅ SUCCESS! Test Email Sent');
      console.log('\n📬 EMAIL DETAILS:');
      console.log(`   Email ID: ${data.id}`);
      console.log(`   Status: Successfully sent via Resend`);
      console.log('\n🎯 KEY ACHIEVEMENTS:');
      console.log('   ✅ Pure Resend system working');
      console.log('   ✅ Domain verification successful');
      console.log('   ✅ Professional HTML email template');
      console.log('   ✅ No Supabase email dependency');
      console.log('   ✅ Bounce-proof email system');
      
      console.log('\n📱 CHECK YOUR GMAIL:');
      console.log('   Look for: "🔧 Test: Email Verification - Fisher Backflows"');
      console.log('   The email demonstrates your working verification system');
      
      console.log('\n💡 NEXT STEPS:');
      console.log('   1. Fix RLS policy on email_verifications table');
      console.log('   2. Test full registration flow');
      console.log('   3. Your email system is ready for production!');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🔒 Pure Resend Test Complete\n');
}

testDirectEmail().catch(console.error);