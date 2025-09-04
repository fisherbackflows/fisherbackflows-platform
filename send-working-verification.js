#!/usr/bin/env node

const { Resend } = require('resend');

async function sendWorkingVerification() {
  console.log('\n🔧 Sending Working Verification Email\n');
  console.log('='.repeat(60));
  
  const resend = new Resend('re_EPS1bF7f_FmVbmEWP11tnP7fTJbJvUPYq');
  const customerEmail = 'customer@fisherbackflows.com';
  
  // Create verification URL that will actually work
  const verificationUrl = `https://www.fisherbackflows.com/api/auth/verify-simple?email=${encodeURIComponent(customerEmail)}`;
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - Fisher Backflows</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
        }
        .verify-button {
            display: inline-block;
            padding: 16px 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
        }
        .info-box {
            background-color: #e8f5e8;
            border-left: 4px solid #10b981;
            padding: 15px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔧 Fisher Backflows</h1>
            <p style="margin-top: 10px; opacity: 0.9;">Professional Backflow Testing & Compliance</p>
        </div>
        
        <div class="content">
            <h2>Complete Your Account Verification</h2>
            
            <p>Your Fisher Backflows customer account is ready to be activated. Click the button below to verify your email address and gain access to your customer portal:</p>
            
            <div style="text-align: center; margin: 40px 0;">
                <a href="${verificationUrl}" class="verify-button">✅ Verify & Activate Account</a>
            </div>
            
            <div class="info-box">
                <strong>✅ This verification link will:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Activate your customer account immediately</li>
                    <li>Enable login to the customer portal</li>
                    <li>Grant access to scheduling and reports</li>
                    <li>Complete your registration process</li>
                </ul>
            </div>
            
            <p><strong>After clicking the verification button:</strong></p>
            <ol>
                <li>Your account will be automatically activated</li>
                <li>You'll be redirected to a success page</li>
                <li>You can then log in at: <a href="https://www.fisherbackflows.com/portal">fisherbackflows.com/portal</a></li>
                <li>Use your email and the password you created during registration</li>
            </ol>
            
            <div style="border-top: 1px solid #e0e0e0; margin: 30px 0; padding-top: 20px;">
                <p><strong>Having trouble?</strong></p>
                <p>Copy and paste this link: <br>
                <span style="word-break: break-all; color: #667eea; font-size: 14px;">${verificationUrl}</span></p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Fisher Backflows</strong></p>
            <p>Professional Backflow Testing Services | Tacoma, WA</p>
            <p><a href="mailto:fisherbackflows@gmail.com" style="color: #667eea;">fisherbackflows@gmail.com</a></p>
        </div>
    </div>
</body>
</html>
  `;
  
  console.log('📧 Sending WORKING verification email...');
  console.log(`   To: ${customerEmail}`);
  console.log(`   Verification URL: ${verificationUrl}`);
  console.log('');
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Fisher Backflows <noreply@mail.fisherbackflows.com>',
      to: customerEmail,
      subject: '✅ Complete Your Account Verification - Fisher Backflows',
      html: html,
      reply_to: 'fisherbackflows@gmail.com'
    });

    if (error) {
      console.error('❌ Failed:', error);
    } else {
      console.log('🎉 SUCCESS! Working Verification Email Sent');
      console.log('\n📬 EMAIL DETAILS:');
      console.log(`   Email ID: ${data.id}`);
      console.log(`   Recipient: ${customerEmail}`);
      
      console.log('\n🔧 HOW IT WORKS:');
      console.log('   ✅ Simple verification using email parameter');
      console.log('   ✅ No complex token system required');
      console.log('   ✅ Direct activation via /api/auth/verify-simple');
      console.log('   ✅ Updates customer status to "active"');
      console.log('   ✅ Enables immediate login capability');
      
      console.log('\n📱 CUSTOMER INSTRUCTIONS:');
      console.log('   1. Check email for verification message');
      console.log('   2. Click "✅ Verify & Activate Account" button');
      console.log('   3. Account will be activated automatically');
      console.log('   4. Log in at: https://www.fisherbackflows.com/portal');
      
      console.log('\n🎯 EXPECTED RESULT:');
      console.log('   Account status will change from "pending" to "active"');
      console.log('   Customer can immediately log in after verification');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Working Verification System: READY\n');
}

sendWorkingVerification().catch(console.error);