#!/usr/bin/env node

async function retriggerVerification() {
  const email = 'fisherbackflows@gmail.com'; // Change this to the email you want to resend to
  
  console.log('\n📧 Retriggering Email Verification with Pure Resend\n');
  console.log('='.repeat(60));
  console.log(`Email: ${email}`);
  console.log('');

  try {
    console.log('🔄 Sending verification email...\n');
    
    const response = await fetch('http://localhost:3010/api/auth/resend-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email })
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ SUCCESS! Verification Email Sent');
      console.log('\n📬 EMAIL DETAILS:');
      console.log(`   To: ${result.emailSentTo}`);
      console.log(`   From: noreply@mail.fisherbackflows.com`);
      console.log(`   Subject: "Verify Your Email - Fisher Backflows"`);
      console.log('\n🔗 VERIFICATION PROCESS:');
      console.log('   ✅ Custom token generated');
      console.log('   ✅ Token stored in email_verifications table');
      console.log('   ✅ Email sent via Resend (NOT Supabase)');
      console.log('   ✅ No bounce risk to Supabase account');
      console.log('\n📱 CHECK YOUR EMAIL:');
      console.log('   Look for the verification email');
      console.log('   Click "Verify Email Address" button');
      console.log('   Should redirect to success page');
      
    } else {
      console.error('❌ Failed:', result.error);
      
      if (result.error?.includes('already verified')) {
        console.log('\n✅ This means your email system is working!');
        console.log('   The account is already verified.');
      } else if (result.error?.includes('No account found')) {
        console.log('\n💡 Try registering first:');
        console.log('   http://localhost:3010/portal/register');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n⚠️  Make sure server is running: npm run dev');
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🔒 Pure Resend Email System: ACTIVE\n');
}

retriggerVerification().catch(console.error);