#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ENV_FILE = path.join(__dirname, '.env.local');

console.log('\n🎯 Fisher Backflows - Stripe Payment Setup\n');
console.log('This script will help you configure Stripe for real payment processing.\n');
console.log('You\'ll need your Stripe API keys from: https://dashboard.stripe.com/apikeys\n');

const questions = [
  {
    key: 'STRIPE_MODE',
    question: 'Do you want to use TEST mode or LIVE mode? (test/live): ',
    default: 'test',
    validate: (value) => ['test', 'live'].includes(value.toLowerCase())
  },
  {
    key: 'STRIPE_SECRET_KEY',
    question: (mode) => `Enter your Stripe ${mode.toUpperCase()} Secret Key (sk_${mode}_...): `,
    validate: (value, mode) => value.startsWith(`sk_${mode}_`)
  },
  {
    key: 'STRIPE_PUBLISHABLE_KEY', 
    question: (mode) => `Enter your Stripe ${mode.toUpperCase()} Publishable Key (pk_${mode}_...): `,
    validate: (value, mode) => value.startsWith(`pk_${mode}_`)
  },
  {
    key: 'STRIPE_WEBHOOK_SECRET',
    question: 'Enter your Stripe Webhook Secret (whsec_...) or press Enter to set up later: ',
    optional: true,
    validate: (value) => !value || value.startsWith('whsec_')
  }
];

async function askQuestion(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupStripe() {
  const config = {};
  
  // Ask for mode first
  const mode = await askQuestion(questions[0].question);
  config.mode = mode.toLowerCase() === 'live' ? 'live' : 'test';
  
  console.log(`\n✅ Using ${config.mode.toUpperCase()} mode\n`);
  
  // Ask for keys
  for (let i = 1; i < questions.length; i++) {
    const q = questions[i];
    let valid = false;
    let value = '';
    
    while (!valid) {
      const prompt = typeof q.question === 'function' ? q.question(config.mode) : q.question;
      value = await askQuestion(prompt);
      
      if (q.optional && !value) {
        valid = true;
      } else if (q.validate) {
        valid = typeof q.validate === 'function' 
          ? q.validate(value, config.mode)
          : q.validate(value);
        
        if (!valid) {
          console.log('❌ Invalid format. Please try again.');
        }
      } else {
        valid = true;
      }
    }
    
    config[q.key] = value;
  }
  
  // Read existing .env.local file
  let envContent = '';
  if (fs.existsSync(ENV_FILE)) {
    envContent = fs.readFileSync(ENV_FILE, 'utf8');
  }
  
  // Update or add Stripe keys
  const updates = {
    'STRIPE_SECRET_KEY': config.STRIPE_SECRET_KEY,
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': config.STRIPE_PUBLISHABLE_KEY,
    'STRIPE_WEBHOOK_SECRET': config.STRIPE_WEBHOOK_SECRET || ''
  };
  
  // Process each key
  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'gm');
    if (envContent.match(regex)) {
      // Update existing key
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      // Add new key
      envContent += `\n${key}=${value}`;
    }
  }
  
  // Write updated content back
  fs.writeFileSync(ENV_FILE, envContent.trim() + '\n');
  
  console.log('\n✅ Stripe configuration saved to .env.local\n');
  
  // Display next steps
  console.log('📋 Next Steps:\n');
  console.log('1. Restart your development server to load the new environment variables');
  console.log('2. Test a payment using the following test cards:');
  
  if (config.mode === 'test') {
    console.log('   - Success: 4242 4242 4242 4242');
    console.log('   - Requires auth: 4000 0025 0000 3155');
    console.log('   - Declined: 4000 0000 0000 9995');
  } else {
    console.log('   ⚠️  You\'re in LIVE mode - real payments will be processed!');
  }
  
  if (!config.STRIPE_WEBHOOK_SECRET) {
    console.log('\n3. Set up webhook endpoint:');
    console.log('   - Go to https://dashboard.stripe.com/webhooks');
    console.log('   - Add endpoint URL: https://fisherbackflows.com/api/stripe/webhook');
    console.log('   - Select events: payment_intent.succeeded, payment_intent.payment_failed, etc.');
    console.log('   - Copy the signing secret and add it to .env.local as STRIPE_WEBHOOK_SECRET');
  }
  
  console.log('\n4. Create the payments table in Supabase:');
  console.log('   Run the following SQL in Supabase SQL Editor:\n');
  
  const sql = `
-- Create payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  invoice_id UUID REFERENCES invoices(id),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  stripe_payment_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  stripe_session_id VARCHAR(255),
  transaction_id VARCHAR(255),
  receipt_url TEXT,
  checkout_url TEXT,
  client_secret TEXT,
  error_message TEXT,
  description TEXT,
  metadata JSONB,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add stripe_customer_id to customers table if not exists
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_customers_stripe_id ON customers(stripe_customer_id);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Customers can view own payments" ON payments
  FOR SELECT USING (customer_id IN (
    SELECT id FROM customers WHERE email = auth.email()
  ));

CREATE POLICY "Team members can manage payments" ON payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  );
`;
  
  console.log(sql);
  
  console.log('\n✅ Setup complete! Your payment system is ready.\n');
  
  rl.close();
}

// Run setup
setupStripe().catch(error => {
  console.error('\n❌ Setup failed:', error.message);
  rl.close();
  process.exit(1);
});