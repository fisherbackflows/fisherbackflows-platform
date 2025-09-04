# Quick Guide: Add Resend API Key

## Step 1: Get Your API Key
1. Go to: https://resend.com/api-keys
2. Click "Create API Key"
3. Name it: "Fisher Backflows Production"
4. Permissions: Full Access
5. Copy the key (starts with `re_`)

## Step 2: Add to Environment
Edit `.env.local` and update the last line:

```
RESEND_API_KEY=re_YOUR_ACTUAL_KEY_HERE
```

## Step 3: Verify Setup
```bash
# Check DNS and API key
node scripts/verify-resend-setup.js

# Send test email
node scripts/test-resend.js
```

## Step 4: Test Registration
1. Start dev server: `npm run dev`
2. Go to: http://localhost:3010/portal/register
3. Register a new customer
4. Check email for verification

That's it! Your email system will be working.