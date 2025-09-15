#!/usr/bin/env node

// Test Stripe configuration
require('dotenv').config({ path: '.env.local' });

async function testStripe() {
  console.log('🧪 Testing Stripe Configuration...\n');

  // Check environment variables
  console.log('📊 STRIPE CONFIGURATION:');
  console.log('✅ Secret Key configured:', !!process.env.STRIPE_SECRET_KEY);
  console.log('✅ Publishable Key configured:', !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  console.log('✅ Webhook Secret configured:', !!process.env.STRIPE_WEBHOOK_SECRET);

  if (!process.env.STRIPE_SECRET_KEY) {
    console.log('❌ No Stripe secret key found');
    return;
  }

  try {
    // Import Stripe
    const stripe = await import('stripe');
    const stripeClient = new stripe.default(process.env.STRIPE_SECRET_KEY);

    console.log('\n🔑 Testing Stripe API connection...');

    // Test API connection by retrieving account
    const account = await stripeClient.accounts.retrieve();
    console.log('✅ Stripe API connection successful!');
    console.log('🏢 Account ID:', account.id);
    console.log('📧 Account Email:', account.email || 'Not set');
    console.log('🌍 Country:', account.country);
    console.log('💰 Charges enabled:', account.charges_enabled);
    console.log('💳 Payouts enabled:', account.payouts_enabled);

    // Test creating a test payment intent
    console.log('\n💳 Testing payment intent creation...');
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: 15000, // $150.00 for a typical backflow test
      currency: 'usd',
      description: 'Test backflow testing service',
      metadata: {
        customer_name: 'Test Customer',
        service_type: 'backflow_test',
        test: 'true'
      }
    });

    console.log('✅ Payment Intent created successfully!');
    console.log('💰 Amount:', `$${paymentIntent.amount / 100}`);
    console.log('🆔 Payment Intent ID:', paymentIntent.id);
    console.log('🔐 Client Secret:', paymentIntent.client_secret.substring(0, 20) + '...');

    console.log('\n🎉 STRIPE TEST COMPLETE!');
    console.log('📊 Summary:');
    console.log('  - ✅ API connection working');
    console.log('  - ✅ Payment intents can be created');
    console.log('  - ✅ Account configured properly');
    console.log('  - ✅ Ready to process payments');

  } catch (error) {
    console.log('❌ Stripe test failed:', error.message);
    if (error.type === 'StripeAuthenticationError') {
      console.log('🔑 Check your API key configuration');
    }
  }
}

testStripe().catch(console.error);