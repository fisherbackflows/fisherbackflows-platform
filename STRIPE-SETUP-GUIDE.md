# Stripe Payment Setup Guide for Fisher Backflows

## Quick Setup (Required Steps)

### 1. Get Your Stripe Keys
1. Go to https://dashboard.stripe.com/register (or login if you have an account)
2. Once logged in, go to **Developers** → **API keys**
3. Copy your keys:
   - **Publishable key** (starts with `pk_live_` for production or `pk_test_` for testing)
   - **Secret key** (starts with `sk_live_` for production or `sk_test_` for testing)

### 2. Set Up Webhook Endpoint
1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter endpoint URL: `https://fisherbackflows.com/api/stripe/webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `invoice.payment_succeeded`
   - `checkout.session.completed`
5. Copy the **Signing secret** (starts with `whsec_`)

### 3. Update Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# For testing (use these first!)
# STRIPE_SECRET_KEY=sk_test_YOUR_TEST_SECRET_KEY
# STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_PUBLISHABLE_KEY
# STRIPE_WEBHOOK_SECRET=whsec_YOUR_TEST_WEBHOOK_SECRET
```

### 4. Enable Stripe Features
In Stripe Dashboard, ensure these are enabled:
- **Payment Methods**: Cards, ACH (US Bank Account)
- **Customer Portal**: Settings → Billing → Customer portal
- **Tax**: Settings → Tax (for automatic tax calculation)
- **Invoicing**: If you want Stripe-hosted invoices

## Testing Payments

### Test Card Numbers
Use these in TEST mode only:
- **Success**: 4242 4242 4242 4242
- **Requires auth**: 4000 0025 0000 3155
- **Declined**: 4000 0000 0000 9995

Any future date for expiry, any 3 digits for CVC, any 5 digits for ZIP.

### Test Bank Accounts (ACH)
- **Success**: Routing: 110000000, Account: 000123456789
- **Failure**: Routing: 110000000, Account: 000111111113

## Payment Flows Available

### 1. Quick Payment (One-time)
- Customer enters card details
- Payment processed immediately
- Receipt sent via email

### 2. Save Card for Future
- Card saved to customer profile
- Future payments with one click
- PCI compliant tokenization

### 3. ACH/Bank Transfer
- Lower fees (0.8% capped at $5)
- Takes 3-5 business days
- Good for large invoices

### 4. Payment Plans
- Split large invoices
- Automatic recurring charges
- Customizable schedules

## Security Notes

- **PCI Compliance**: We use Stripe Elements and never touch raw card data
- **SCA Ready**: Supports Strong Customer Authentication for European cards
- **Fraud Protection**: Stripe Radar included automatically
- **SSL Required**: All payment pages must use HTTPS

## Monitoring Payments

### Admin Dashboard
- View all payments at `/admin/dashboard`
- Real-time payment notifications
- Export payment reports

### Stripe Dashboard
- Full payment history
- Detailed analytics
- Risk evaluation scores
- Dispute management

## Common Issues & Solutions

### "Payment requires authentication"
- Normal for European cards (SCA)
- Customer will be redirected to their bank
- Payment completes after authentication

### "Card declined"
- Insufficient funds or bank rejection
- Customer should contact their bank
- Or try a different payment method

### ACH payments pending
- Normal - takes 3-5 business days
- Customer sees pending status
- Webhook updates when complete

## Go Live Checklist

- [ ] Test mode working with test cards
- [ ] Production keys added to environment
- [ ] Webhook endpoint verified
- [ ] SSL certificate active
- [ ] Customer receipts configured
- [ ] Tax settings reviewed
- [ ] Fraud protection settings checked
- [ ] Bank account added for payouts

## Support

- **Stripe Support**: support@stripe.com or Dashboard → Support
- **Integration Issues**: Check webhook logs in Stripe Dashboard
- **API Status**: https://status.stripe.com

## Revenue & Fees

### Stripe Pricing (as of 2024)
- **Cards**: 2.9% + $0.30 per transaction
- **ACH**: 0.8% (capped at $5.00)
- **International cards**: +1% additional
- **Currency conversion**: +1% additional

### Payouts
- **Schedule**: Daily, weekly, or monthly
- **Time**: 2 business days for most banks
- **Instant Payouts**: Available for 1% fee (min $0.50)

Remember to start in TEST mode and thoroughly test all payment flows before switching to LIVE mode!