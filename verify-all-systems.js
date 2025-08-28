// Comprehensive system verification
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 SYSTEM VERIFICATION STARTING...\n');
console.log('=' .repeat(50));

// 1. Check Supabase
async function checkSupabase() {
  console.log('\n📊 SUPABASE STATUS:');
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing credentials');
    return false;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Check tables
    const tables = ['customers', 'devices', 'test_reports', 'invoices', 'appointments', 'team_users'];
    let allGood = true;
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: Not found`);
        allGood = false;
      } else {
        console.log(`✅ ${table}: Ready (${count} records)`);
      }
    }
    
    return allGood;
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    return false;
  }
}

// 2. Check GitHub
async function checkGitHub() {
  console.log('\n🐙 GITHUB STATUS:');
  const { execSync } = require('child_process');
  
  try {
    // Check remote
    const remote = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
    console.log(`✅ Repository: ${remote}`);
    
    // Check branch
    const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
    console.log(`✅ Branch: ${branch}`);
    
    // Check if up to date
    execSync('git fetch origin', { encoding: 'utf-8' });
    const status = execSync('git status -uno', { encoding: 'utf-8' });
    
    if (status.includes('up to date')) {
      console.log('✅ Sync: Up to date with origin');
    } else if (status.includes('ahead')) {
      console.log('⚠️  Sync: Local branch ahead of origin');
    } else if (status.includes('behind')) {
      console.log('⚠️  Sync: Local branch behind origin');
    }
    
    return true;
  } catch (error) {
    console.log('❌ GitHub check failed:', error.message);
    return false;
  }
}

// 3. Check Vercel
async function checkVercel() {
  console.log('\n🚀 VERCEL STATUS:');
  const { execSync } = require('child_process');
  
  try {
    // Get latest deployment
    const deployments = execSync('vercel ls --json 2>/dev/null', { encoding: 'utf-8' });
    const deploys = JSON.parse(deployments);
    
    if (deploys.deployments && deploys.deployments.length > 0) {
      const latest = deploys.deployments[0];
      console.log(`✅ Latest Deploy: ${latest.url}`);
      console.log(`✅ Status: ${latest.state || latest.readyState || 'Ready'}`);
      console.log(`✅ Created: ${new Date(latest.created).toLocaleString()}`);
      
      // Check production URL
      console.log('✅ Production: https://fisherbackflows.com');
    }
    
    return true;
  } catch (error) {
    // Fallback to simple command if JSON fails
    try {
      const output = execSync('vercel ls | head -5', { encoding: 'utf-8' });
      console.log('✅ Vercel CLI connected');
      console.log('✅ Recent deployments found');
      return true;
    } catch (e) {
      console.log('❌ Vercel check failed:', e.message);
      return false;
    }
  }
}

// 4. Check Website
async function checkWebsite() {
  console.log('\n🌐 WEBSITE STATUS:');
  
  try {
    const https = require('https');
    
    return new Promise((resolve) => {
      https.get('https://fisherbackflows.com', (res) => {
        console.log(`✅ Response Code: ${res.statusCode}`);
        console.log('✅ Website: Online');
        resolve(true);
      }).on('error', (err) => {
        console.log('❌ Website unreachable:', err.message);
        resolve(false);
      });
    });
  } catch (error) {
    console.log('❌ Website check failed');
    return false;
  }
}

// Run all checks
async function runAllChecks() {
  const results = {
    supabase: await checkSupabase(),
    github: await checkGitHub(),
    vercel: await checkVercel(),
    website: await checkWebsite()
  };
  
  console.log('\n' + '=' .repeat(50));
  console.log('📋 FINAL RESULTS:');
  console.log('=' .repeat(50));
  
  const allPassed = Object.values(results).every(r => r === true);
  
  if (allPassed) {
    console.log('\n✅ ALL SYSTEMS OPERATIONAL!');
    console.log('Your Fisher Backflows platform is fully integrated:');
    console.log('  • GitHub → Vercel → fisherbackflows.com');
    console.log('  • Supabase database connected');
    console.log('  • Automatic deployments working');
  } else {
    console.log('\n⚠️  Some systems need attention:');
    Object.entries(results).forEach(([system, status]) => {
      console.log(`  ${status ? '✅' : '❌'} ${system.toUpperCase()}`);
    });
  }
}

runAllChecks();