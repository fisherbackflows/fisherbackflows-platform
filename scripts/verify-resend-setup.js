#!/usr/bin/env node

const dns = require('dns').promises;
const { config } = require('dotenv');
const path = require('path');

// Load environment variables
config({ path: path.join(__dirname, '..', '.env.local') });

async function checkDNS() {
  console.log('\n🔧 Fisher Backflows - Resend Domain Verification Helper\n');
  console.log('='.repeat(60));
  
  const domain = 'mail.fisherbackflows.com';
  let allChecksPass = true;

  // Check MX Record
  console.log('\n📧 Checking MX Record for send.' + domain + '...');
  try {
    const mxRecords = await dns.resolveMx('send.' + domain);
    const hasCorrectMX = mxRecords.some(record => 
      record.exchange.includes('amazonses.com')
    );
    
    if (hasCorrectMX) {
      console.log('✅ MX record found: feedback-smtp.us-east-1.amazonses.com');
    } else {
      console.log('❌ MX record not found or incorrect');
      allChecksPass = false;
    }
  } catch (error) {
    console.log('⏳ MX record not yet propagated (this is normal if just added)');
    allChecksPass = false;
  }

  // Check SPF Record
  console.log('\n🔐 Checking SPF Record for send.' + domain + '...');
  try {
    const txtRecords = await dns.resolveTxt('send.' + domain);
    const spfRecord = txtRecords.find(record => 
      record[0]?.includes('v=spf1')
    );
    
    if (spfRecord) {
      console.log('✅ SPF record found: ' + spfRecord[0]);
    } else {
      console.log('❌ SPF record not found');
      allChecksPass = false;
    }
  } catch (error) {
    console.log('⏳ SPF record not yet propagated (this is normal if just added)');
    allChecksPass = false;
  }

  // Check DKIM Record
  console.log('\n🔑 Checking DKIM Record...');
  try {
    const dkimRecords = await dns.resolveTxt('resend._domainkey.' + domain);
    const hasDKIM = dkimRecords.some(record => 
      record[0]?.includes('p=MIG')
    );
    
    if (hasDKIM) {
      console.log('✅ DKIM record found (key present)');
    } else {
      console.log('❌ DKIM record not found');
      allChecksPass = false;
    }
  } catch (error) {
    console.log('⏳ DKIM record not yet propagated (this is normal if just added)');
    allChecksPass = false;
  }

  console.log('\n' + '='.repeat(60));
  
  if (allChecksPass) {
    console.log('\n✅ All DNS records are properly configured and propagated!');
    console.log('\n📝 Next Steps:');
    console.log('1. Go to https://resend.com/domains');
    console.log('2. Click "Verify DNS Records" for mail.fisherbackflows.com');
    console.log('3. The domain should verify successfully now!');
  } else {
    console.log('\n⏳ DNS records are being propagated...');
    console.log('\n📝 What to do:');
    console.log('1. DNS propagation typically takes 15 minutes to 2 hours');
    console.log('2. Run this script again in 30 minutes: node scripts/verify-resend-setup.js');
    console.log('3. Once all checks pass, go to https://resend.com/domains');
    console.log('4. Click "Verify DNS Records" for mail.fisherbackflows.com');
  }

  // Check API Key
  console.log('\n🔑 Checking Resend API Key configuration...');
  if (!process.env.RESEND_API_KEY) {
    console.log('❌ RESEND_API_KEY not found in .env.local');
    console.log('\n📝 To add your API key:');
    console.log('1. Get your API key from https://resend.com/api-keys');
    console.log('2. Edit .env.local and add:');
    console.log('   RESEND_API_KEY=re_xxxxxxxxxxxx');
  } else if (process.env.RESEND_API_KEY.startsWith('re_')) {
    console.log('✅ Resend API key is configured');
    console.log('   Key prefix: ' + process.env.RESEND_API_KEY.substring(0, 10) + '...');
  } else {
    console.log('⚠️  API key found but may be invalid (should start with "re_")');
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📚 Documentation: RESEND_DNS_SETUP.md');
  console.log('🧪 Test email sending: node scripts/test-resend.js');
  console.log('\n');
}

// Run the check
checkDNS().catch(console.error);