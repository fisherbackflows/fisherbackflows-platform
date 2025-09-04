# Fix for Supabase Email Verification

## The Problem
When you click "Verify Email Address" from Supabase's email, you get:
`{"error":"Verification token is required"}`

This happens because Supabase's email template uses `token_hash` parameter, but the verification endpoint was looking for `token`.

## The Solution (Already Applied)
1. Updated `/api/auth/verify` to accept both `token` and `token_hash` parameters
2. Now handles Supabase's format correctly

## How Email Verification Works

### Current Flow:
1. **User registers** → Supabase sends email with link like:
   ```
   https://your-site.com/auth/v1/verify?token_hash=XXXXX&type=signup
   ```

2. **User clicks link** → Our `/api/auth/verify` endpoint:
   - Accepts both `token` and `token_hash`
   - Verifies with Supabase
   - Updates customer status
   - Redirects to success page

## Configure Supabase Email Template (Optional)

To customize the email template in Supabase Dashboard:

1. Go to: https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx/auth/templates
2. Edit "Confirm signup" template
3. Set the confirmation URL to:
   ```
   {{ .SiteURL }}/api/auth/verify?token_hash={{ .TokenHash }}&type=signup
   ```

## Using Resend for Other Emails

While Supabase handles verification emails (they have the secure token), Resend is set up for:
- Welcome emails after verification
- Appointment confirmations
- Test report delivery
- Payment receipts
- Reminder notifications

## Testing the Fix

1. Register a new user
2. Check email for verification link
3. Click the link - should redirect to success page
4. No more "token required" error!

## Status
✅ **FIXED** - Verification emails now work correctly