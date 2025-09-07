#!/usr/bin/env node

/**
 * Script to unlock a locked team portal account
 * Usage: node scripts/unlock-account.js <email>
 */

const https = require('https');
const http = require('http');

// Configuration
const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010';
const ADMIN_KEY = process.env.ADMIN_BYPASS_KEY;
if (!ADMIN_KEY) {
  console.error('ADMIN_BYPASS_KEY is required to unlock accounts');
  process.exit(1);
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: node scripts/unlock-account.js <email>');
  console.log('Example: node scripts/unlock-account.js admin@fisherbackflows.com');
  process.exit(1);
}

console.log(`\n🔓 Unlocking account for: ${email}\n`);

// First, check account status
const checkAccount = () => {
  const url = new URL(`${API_BASE}/api/admin/unlock-account`);
  url.searchParams.append('email', email);
  url.searchParams.append('key', ADMIN_KEY);

  const protocol = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    protocol.get(url.toString(), (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
};

// Unlock the account
const unlockAccount = () => {
  const url = new URL(`${API_BASE}/api/admin/unlock-account`);
  const postData = JSON.stringify({
    email: email,
    adminKey: ADMIN_KEY
  });

  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const protocol = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

// Main execution
(async () => {
  try {
    // Check current status
    console.log('📋 Checking account status...');
    const checkResult = await checkAccount();
    
    if (checkResult.status === 404) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    if (checkResult.status === 200) {
      const status = checkResult.data;
      console.log('\nAccount Status:');
      console.log(`  Email: ${status.email}`);
      console.log(`  Active: ${status.isActive ? '✅ Yes' : '❌ No'}`);
      console.log(`  Locked: ${status.isLocked ? '🔒 Yes' : '🔓 No'}`);
      console.log(`  Failed Attempts: ${status.failedAttempts}`);
      
      if (status.lockedUntil) {
        console.log(`  Locked Until: ${new Date(status.lockedUntil).toLocaleString()}`);
      }
      if (status.lastFailedLogin) {
        console.log(`  Last Failed: ${new Date(status.lastFailedLogin).toLocaleString()}`);
      }
    }

    // Unlock the account
    console.log('\n🔄 Unlocking account...');
    const unlockResult = await unlockAccount();
    
    if (unlockResult.status === 200) {
      console.log('✅ Account successfully unlocked!');
      console.log(`\nUser Details:`);
      console.log(`  Name: ${unlockResult.data.user.first_name} ${unlockResult.data.user.last_name}`);
      console.log(`  Email: ${unlockResult.data.user.email}`);
      console.log(`  Role: ${unlockResult.data.user.role}`);
      console.log('\n✨ You can now login with your correct password');
    } else {
      console.error('❌ Failed to unlock account:', unlockResult.data.error);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
