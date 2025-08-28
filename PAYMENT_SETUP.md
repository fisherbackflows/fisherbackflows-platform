# Payment Processing Setup Guide

The Fisher Backflows platform now supports real payment processing through Stripe. Follow these steps to configure it:

## Environment Variables Needed

Add these to your `.env.local` file:

```env
# Stripe Configuration for Payment Processing
STRIPE_SECRET_KEY=sk_test_...your-stripe-secret-key...
STRIPE_PUBLISHABLE_KEY=pk_test_...your-stripe-publishable-key...
STRIPE_WEBHOOK_SECRET=whsec_...your-webhook-secret...

# Base URL for payment links
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

## Setting up Stripe Account

1. **Create Stripe Account**: Go to https://stripe.com and create an account
2. **Get API Keys**: In Dashboard > Developers > API Keys
   - Copy "Publishable key" (starts with `pk_test_`)
   - Copy "Secret key" (starts with `sk_test_`)
3. **Set up Webhook**: In Dashboard > Developers > Webhooks
   - Add endpoint: `https://your-domain.com/api/automation/payments`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `invoice.payment_succeeded`
   - Copy the signing secret (starts with `whsec_`)

## Features Now Working

✅ **Automatic Payment Links**: Generated when test is completed
- Secure Stripe Checkout integration
- Automatic invoice creation and payment tracking
- Payment links sent in completion emails

✅ **Real-time Payment Processing**: Via Stripe webhooks
- Automatic invoice status updates
- Customer balance management
- Payment confirmation emails

✅ **Payment Verification**: Secure payment processing
- Webhook signature verification
- Payment intent verification
- Fraud protection through Stripe

✅ **Automated Follow-up**: After payment is received
- Invoice marked as paid
- Customer balance updated
- Next year's test reminder scheduled
- Receipt email sent automatically

## Payment Flow

1. **Test Completed** → Field app submits test results
2. **Invoice Generated** → Automated invoice creation
3. **Payment Link Created** → Stripe payment intent and checkout link
4. **Email Sent** → Customer receives test results + payment link
5. **Customer Pays** → Secure Stripe checkout process
6. **Webhook Received** → Stripe notifies our system
7. **Automation Triggered** → Invoice updated, receipt sent, reminder scheduled

## Customer Payment Experience

1. Customer receives email with test results
2. Clicks "Pay Online" button
3. Redirected to secure Stripe checkout page
4. Enters payment information (cards, Apple Pay, Google Pay, etc.)
5. Payment processed instantly
6. Receives confirmation email with receipt

## Fallback Behavior

- If Stripe is not configured, system creates manual payment tracking
- Customers get payment links to a custom payment page
- All automation still works, just without automatic processing
- Perfect for development and testing

## Testing Payment Processing

1. Use Stripe test mode credentials (keys starting with `sk_test_` and `pk_test_`)
2. Test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Requires 3D Secure: `4000 0025 0000 3155`
3. Complete a test through the field app
4. Check the email for payment link
5. Test the payment process with test cards
6. Verify webhook processing in Stripe dashboard

## Production Checklist

- [ ] Replace test API keys with live keys
- [ ] Update webhook endpoint to production URL
- [ ] Test payment flow end-to-end
- [ ] Verify email delivery
- [ ] Test customer payment experience
- [ ] Monitor webhook processing
- [ ] Set up Stripe monitoring and alerts

## Security Features

✅ **Webhook Signature Verification**: Prevents webhook spoofing
✅ **Payment Intent Verification**: Confirms payments actually succeeded
✅ **Secure API Keys**: Environment variables, never in code
✅ **PCI Compliance**: All payment data handled by Stripe
✅ **Fraud Protection**: Built-in Stripe fraud detection

## Revenue Tracking

The system automatically tracks:
- Payment amounts and dates
- Customer payment history
- Invoice status changes
- Payment method details
- Refund processing (when needed)

This creates a complete audit trail for business reporting and tax purposes.