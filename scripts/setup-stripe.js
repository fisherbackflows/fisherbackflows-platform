#!/usr/bin/env node

const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');

async function setupStripeProducts() {
  try {
    console.log('Setting up Stripe products and prices for Backflow Buddy...\n');

    // Create the main product
    const product = await stripe.products.create({
      name: 'Backflow Buddy Subscription',
      description: 'Complete backflow testing management platform',
    });

    console.log('✅ Created product:', product.id);

    // Create prices for each plan
    const plans = [
      {
        nickname: 'Starter Monthly',
        unit_amount: 9900, // $99.00
        recurring: { interval: 'month' },
        metadata: { plan_id: 'starter', billing_cycle: 'monthly' }
      },
      {
        nickname: 'Starter Yearly',
        unit_amount: 99000, // $990.00
        recurring: { interval: 'year' },
        metadata: { plan_id: 'starter', billing_cycle: 'yearly' }
      },
      {
        nickname: 'Professional Monthly',
        unit_amount: 29900, // $299.00
        recurring: { interval: 'month' },
        metadata: { plan_id: 'professional', billing_cycle: 'monthly' }
      },
      {
        nickname: 'Professional Yearly',
        unit_amount: 299000, // $2,990.00
        recurring: { interval: 'year' },
        metadata: { plan_id: 'professional', billing_cycle: 'yearly' }
      },
      {
        nickname: 'Enterprise Monthly',
        unit_amount: 79900, // $799.00
        recurring: { interval: 'month' },
        metadata: { plan_id: 'enterprise', billing_cycle: 'monthly' }
      },
      {
        nickname: 'Enterprise Yearly',
        unit_amount: 799000, // $7,990.00
        recurring: { interval: 'year' },
        metadata: { plan_id: 'enterprise', billing_cycle: 'yearly' }
      }
    ];

    console.log('\nCreating prices...');
    const prices = [];

    for (const plan of plans) {
      const price = await stripe.prices.create({
        product: product.id,
        nickname: plan.nickname,
        unit_amount: plan.unit_amount,
        currency: 'usd',
        recurring: plan.recurring,
        metadata: plan.metadata
      });
      
      prices.push(price);
      console.log(`✅ Created price: ${plan.nickname} - ${price.id}`);
    }

    // Output environment variables to add
    console.log('\n📝 Add these to your .env.local file:\n');
    console.log(`# Stripe Product and Price IDs`);
    console.log(`STRIPE_PRODUCT_ID=${product.id}`);
    prices.forEach(price => {
      const planId = price.metadata.plan_id;
      const cycle = price.metadata.billing_cycle;
      const envKey = `STRIPE_PRICE_${planId.toUpperCase()}_${cycle.toUpperCase()}`;
      console.log(`${envKey}=${price.id}`);
    });

    // Create webhook endpoint
    console.log('\n🔧 Setting up webhook endpoint...');
    const webhook = await stripe.webhookEndpoints.create({
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/stripe`,
      enabled_events: [
        'checkout.session.completed',
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed'
      ]
    });

    console.log(`✅ Created webhook: ${webhook.id}`);
    console.log(`\n📝 Add this to your .env.local file:`);
    console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`);

    console.log('\n✨ Stripe setup complete!');
    console.log('\nNext steps:');
    console.log('1. Copy the environment variables above to your .env.local file');
    console.log('2. Deploy your application');
    console.log('3. Test the subscription flow');

  } catch (error) {
    console.error('Error setting up Stripe:', error.message);
    if (error.message.includes('No API key')) {
      console.log('\n⚠️  Please add your Stripe API key to .env.local:');
      console.log('STRIPE_SECRET_KEY=sk_test_...');
    }
    process.exit(1);
  }
}

// Run the setup
setupStripeProducts();