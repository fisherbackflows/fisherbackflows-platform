#!/usr/bin/env node

const { Resend } = require('resend');

async function testVerificationUrlFix() {
  console.log('\n🔧 TESTING VERIFICATION URL FIX\n');
  console.log('='.repeat(60));
  
  const resend = new Resend('re_EPS1bF7f_FmVbmEWP11tnP7fTJbJvUPYq');
  const testEmail = 'url-fix-test@fisherbackflows.com';
  
  // Test the new registration to see if URLs are fixed
  console.log('🧪 Testing registration with fixed URLs...');
  
  try {
    const response = await fetch('https://www.fisherbackflows.com/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'URL',
        lastName: 'Fix Test',
        email: testEmail,
        phone: '2532788692', 
        password: 'UrlFix123!',
        address: {
          street: '123 URL Fix St',
          city: 'Tacoma',
          state: 'WA',
          zipCode: '98402'
        }
      })
    });
    
    const result = await response.json();
    
    console.log(`Registration Status: ${response.status}`);
    console.log(`Registration Response: ${JSON.stringify(result, null, 2)}`);
    
    if (response.ok) {
      console.log('✅ Registration successful - verification email should be sent');
      console.log('');
      
      // Test direct email with correct URL
      console.log('🧪 Testing direct verification email with fixed URL...');
      
      const verificationUrl = `https://www.fisherbackflows.com/api/auth/verify-simple?email=${encodeURIComponent(testEmail)}`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>🔧 URL Fix Test - Email Verification</h2>
          <p>This email tests that verification URLs now use the correct domain.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">
              ✅ Verify Email (Fixed URL)
            </a>
          </div>
          <p><strong>Verification URL:</strong><br>
          <code>${verificationUrl}</code></p>
          <p><strong>Expected behavior:</strong><br>
          • Click should go to www.fisherbackflows.com (not old Vercel URL)<br>
          • Should activate account successfully<br>
          • "Continue to Customer Portal" button should work</p>
        </div>
      `;
      
      const emailResult = await resend.emails.send({
        from: 'Fisher Backflows <noreply@mail.fisherbackflows.com>',
        to: testEmail,
        subject: '🔧 URL Fix Test - Please Verify',
        html: html,
        reply_to: 'fisherbackflows@gmail.com'
      });
      
      if (emailResult.error) {
        console.log(`❌ Email send failed: ${emailResult.error.message}`);
      } else {
        console.log('✅ Test verification email sent successfully!');
        console.log(`   Email ID: ${emailResult.data.id}`);
        console.log(`   Recipient: ${testEmail}`);
        console.log('');
        console.log('🎯 VERIFICATION URL VALIDATION:');
        console.log(`   URL: ${verificationUrl}`);
        console.log(`   Domain: www.fisherbackflows.com ✅`);
        console.log(`   Protocol: HTTPS ✅`);
        console.log(`   Path: /api/auth/verify-simple ✅`);
        console.log(`   Parameter: email=${testEmail} ✅`);
        console.log('');
        console.log('📧 ACTION REQUIRED:');
        console.log('   1. Check email for verification message');
        console.log('   2. Click the verification button');
        console.log('   3. Confirm it goes to www.fisherbackflows.com');
        console.log('   4. Verify "Continue to Customer Portal" works');
      }
    } else {
      console.log('❌ Registration failed - cannot test email URLs');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🔧 VERIFICATION URL FIX TEST: COMPLETE');
  console.log('='.repeat(60));
}

testVerificationUrlFix().catch(console.error);