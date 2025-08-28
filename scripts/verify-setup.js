#!/usr/bin/env node

/**
 * Fisher Backflows Setup Verification Script
 * Checks if all environment variables are configured and systems are ready
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Fisher Backflows Setup Verification\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
const hasEnvFile = fs.existsSync(envPath);

if (!hasEnvFile) {
  console.log('❌ .env.local not found');
  console.log('   Run: cp .env.local.example .env.local');
  console.log('   Then edit .env.local with your credentials\n');
} else {
  console.log('✅ .env.local found\n');
}

// Load environment variables
if (hasEnvFile) {
  require('dotenv').config({ path: envPath });
}

// Check Supabase configuration
console.log('📊 Database (Supabase) Configuration:');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (supabaseUrl && supabaseUrl !== 'https://your-project.supabase.co') {
  console.log('✅ NEXT_PUBLIC_SUPABASE_URL configured');
} else {
  console.log('❌ NEXT_PUBLIC_SUPABASE_URL not configured');
}

if (supabaseKey && supabaseKey !== 'your-anon-key-here') {
  console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY configured');
} else {
  console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not configured');
}

if (supabaseService && supabaseService !== 'your-service-role-key-here') {
  console.log('✅ SUPABASE_SERVICE_ROLE_KEY configured');
} else {
  console.log('❌ SUPABASE_SERVICE_ROLE_KEY not configured');
}

// Check Email configuration
console.log('\n📧 Email Automation Configuration:');
const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_APP_PASSWORD;

if (gmailUser && gmailUser !== 'fisherbackflows@gmail.com') {
  console.log('✅ GMAIL_USER configured');
} else {
  console.log('⚠️  GMAIL_USER not configured (will use mock emails)');
}

if (gmailPass && gmailPass !== 'your-16-digit-app-password') {
  console.log('✅ GMAIL_APP_PASSWORD configured');
} else {
  console.log('⚠️  GMAIL_APP_PASSWORD not configured (will use mock emails)');
}

// Check Payment configuration
console.log('\n💳 Payment Processing Configuration:');
const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripePublic = process.env.STRIPE_PUBLISHABLE_KEY;

if (stripeSecret && stripeSecret.startsWith('sk_')) {
  console.log('✅ STRIPE_SECRET_KEY configured');
} else {
  console.log('⚠️  STRIPE_SECRET_KEY not configured (will use mock payments)');
}

if (stripePublic && stripePublic.startsWith('pk_')) {
  console.log('✅ STRIPE_PUBLISHABLE_KEY configured');
} else {
  console.log('⚠️  STRIPE_PUBLISHABLE_KEY not configured (will use mock payments)');
}

// Check Google Calendar configuration
console.log('\n📅 Calendar Integration Configuration:');
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleSecret = process.env.GOOGLE_CLIENT_SECRET;

if (googleClientId) {
  console.log('✅ GOOGLE_CLIENT_ID configured');
} else {
  console.log('⚠️  GOOGLE_CLIENT_ID not configured (will use mock availability)');
}

if (googleSecret) {
  console.log('✅ GOOGLE_CLIENT_SECRET configured');
} else {
  console.log('⚠️  GOOGLE_CLIENT_SECRET not configured (will use mock availability)');
}

// Provide setup summary
console.log('\n📋 Setup Summary:');
const supabaseReady = supabaseUrl && supabaseKey && supabaseService && 
                     supabaseUrl !== 'https://your-project.supabase.co' && 
                     supabaseKey !== 'your-anon-key-here';

if (supabaseReady) {
  console.log('✅ Core System: Ready (Database connected)');
  console.log('   🎯 Your automation platform is functional!');
} else {
  console.log('❌ Core System: Not Ready (Database not connected)');
  console.log('   🔧 Set up Supabase first - see SETUP_GUIDE.md');
}

const emailReady = gmailUser && gmailPass;
if (emailReady) {
  console.log('✅ Email Automation: Ready (Real emails will be sent)');
} else {
  console.log('⚠️  Email Automation: Mock mode (Setup Gmail for real emails)');
}

const paymentReady = stripeSecret && stripePublic;
if (paymentReady) {
  console.log('✅ Payment Processing: Ready (Real payments will be processed)');
} else {
  console.log('⚠️  Payment Processing: Mock mode (Setup Stripe for real payments)');
}

// Next steps
console.log('\n🚀 Next Steps:');
if (!hasEnvFile) {
  console.log('1. Copy .env.local.example to .env.local');
  console.log('2. Follow SETUP_GUIDE.md to configure Supabase');
} else if (!supabaseReady) {
  console.log('1. Set up Supabase project and add credentials to .env.local');
  console.log('2. Run the database schema: copy supabase-schema.sql to Supabase SQL Editor');
  console.log('3. Run sample data: copy sample-data.sql to Supabase SQL Editor');
} else {
  console.log('1. Test the system: npm run dev');
  console.log('2. Visit: http://localhost:3010/field/test/1');
  console.log('3. Optional: Set up Gmail and Stripe for full automation');
}

console.log('\n📖 Read SETUP_GUIDE.md for detailed instructions\n');