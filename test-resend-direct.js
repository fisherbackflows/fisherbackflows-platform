const { Resend } = require('resend');

const resend = new Resend('re_EPS1bF7f_FmVbmEWP11tnP7fTJbJvUPYq');

async function testDirect() {
  console.log('Testing Resend API directly...\n');
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Fisher Backflows <noreply@mail.fisherbackflows.com>',
      to: 'fisherbackflows@gmail.com',
      subject: 'Test Email - Fisher Backflows Platform',
      html: `
        <h2>🎉 Resend Integration Working!</h2>
        <p>This confirms your Resend integration is operational.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `
    });

    if (error) {
      console.error('❌ Resend error:', error);
      if (error.message?.includes('domain')) {
        console.log('\n📝 Domain not verified yet. Please:');
        console.log('1. Go to https://resend.com/domains');
        console.log('2. Click "Verify DNS Records" for mail.fisherbackflows.com');
      }
    } else {
      console.log('✅ Email sent successfully!');
      console.log('📧 Email ID:', data?.id);
      console.log('📬 Check fisherbackflows@gmail.com');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

testDirect();