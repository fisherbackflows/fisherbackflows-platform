#!/usr/bin/env node
/**
 * Fisher Backflows Email Integration Testing
 * Tests the email system functionality including mock and real services
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
function loadEnvironment() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      
      for (const line of lines) {
        if (line.trim() && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          const value = valueParts.join('=').trim();
          if (key && value) {
            process.env[key.trim()] = value;
          }
        }
      }
    }
  } catch (error) {
    console.log('Warning: Could not load .env.local file');
  }
}

async function testEmailService() {
  loadEnvironment();
  
  console.log('🧪 Testing Fisher Backflows Email Integration\n');
  
  // Test 1: Import and test the Resend library directly
  console.log('📧 Test 1: Testing Resend library integration...');
  try {
    // Dynamic import to test the resend module
    const resendModule = await import('../src/lib/resend.ts');
    
    console.log('   ✅ Resend module imported successfully');
    
    // Test email sending
    const testResult = await resendModule.sendEmail({
      to: 'test@example.com',
      subject: 'Fisher Backflows Integration Test',
      html: '<h2>Test Email</h2><p>This is a test email from the integration test.</p>'
    });
    
    console.log('   📩 Email send result:', testResult);
    
    if (testResult.success) {
      console.log('   ✅ Email service working correctly');
    } else {
      console.log('   ⚠️  Email service returned error:', testResult.error);
    }
    
  } catch (error) {
    console.log('   ❌ Error testing Resend library:', error.message);
  }
  
  console.log('');
  
  // Test 2: Test verification email template
  console.log('📧 Test 2: Testing email templates...');
  try {
    const resendModule = await import('../src/lib/resend.ts');
    
    const verificationHtml = resendModule.getVerificationEmailHtml(
      'https://example.com/verify?token=test123',
      'John Doe'
    );
    
    console.log('   ✅ Verification email template generated successfully');
    console.log('   📏 Template length:', verificationHtml.length, 'characters');
    
    // Check if template contains expected elements
    const hasButton = verificationHtml.includes('Verify Email Address');
    const hasCompanyName = verificationHtml.includes('Fisher Backflows');
    const hasUrl = verificationHtml.includes('https://example.com/verify?token=test123');
    
    console.log('   🔍 Template validation:');
    console.log('     - Has verify button:', hasButton ? '✅' : '❌');
    console.log('     - Has company name:', hasCompanyName ? '✅' : '❌'); 
    console.log('     - Has verification URL:', hasUrl ? '✅' : '❌');
    
  } catch (error) {
    console.log('   ❌ Error testing email templates:', error.message);
  }
  
  console.log('');
  
  // Test 3: Test the API endpoint (if dev server is running)
  console.log('📧 Test 3: Testing email API endpoint...');
  try {
    const testEmailData = {
      to: 'test@example.com',
      subject: 'API Test Email',
      html: '<p>This is a test email sent via the API endpoint.</p>'
    };
    
    const response = await fetch('http://localhost:3010/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testEmailData)
    });
    
    const result = await response.json();
    
    console.log('   📡 API Response Status:', response.status);
    console.log('   📊 API Response:', result);
    
    if (response.ok && result.success) {
      console.log('   ✅ Email API endpoint working correctly');
    } else {
      console.log('   ⚠️  Email API endpoint returned error');
    }
    
  } catch (error) {
    console.log('   ⚠️  Could not test API endpoint (dev server may not be running):', error.message);
  }
  
  console.log('');
  
  // Test 4: Test verification email API
  console.log('📧 Test 4: Testing verification email API...');
  try {
    const verificationData = {
      to: 'test@example.com',
      type: 'verification',
      verificationUrl: 'https://fisherbackflows.com/verify?token=test123',
      customerName: 'Test Customer'
    };
    
    const response = await fetch('http://localhost:3010/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(verificationData)
    });
    
    const result = await response.json();
    
    console.log('   📡 Verification API Response Status:', response.status);
    console.log('   📊 Verification API Response:', result);
    
    if (response.ok && result.success) {
      console.log('   ✅ Verification email API working correctly');
    } else {
      console.log('   ⚠️  Verification email API returned error');
    }
    
  } catch (error) {
    console.log('   ⚠️  Could not test verification API endpoint:', error.message);
  }
  
  console.log('');
  
  // Configuration Summary
  console.log('📋 Configuration Summary:');
  console.log('   Resend API Key:', process.env.RESEND_API_KEY ? 'Configured' : 'Not configured (using mock)');
  console.log('   Company Email:', process.env.COMPANY_EMAIL || 'Not set');
  console.log('   App URL:', process.env.NEXT_PUBLIC_APP_URL || 'Not set');
  console.log('');
  
  // Recommendations
  console.log('💡 Recommendations:');
  if (!process.env.RESEND_API_KEY) {
    console.log('   1. Sign up for Resend account at https://resend.com');
    console.log('   2. Get your API key from https://resend.com/api-keys');
    console.log('   3. Add RESEND_API_KEY to your .env.local file');
    console.log('   4. Verify your sending domain (mail.fisherbackflows.com)');
  } else {
    console.log('   ✅ Email service is properly configured');
    console.log('   💡 Consider setting up email templates for better branding');
    console.log('   💡 Monitor email delivery rates and bounce handling');
  }
}

// Run the email integration test
testEmailService().catch(error => {
  console.error('Fatal error during email testing:', error);
  process.exit(1);
});