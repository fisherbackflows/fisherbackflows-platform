# Resend DNS Configuration for Porkbun

## Current Issue
Your DNS records have duplicate domain suffixes. Porkbun automatically appends `.fisherbackflows.com` to your entries.

## Required DNS Records for Resend

### 1. MX Record (for bounce handling)
**In Porkbun, enter:**
- Type: `MX`
- Name: `send.mail` (Porkbun will append .fisherbackflows.com)
- Answer: `feedback-smtp.us-east-1.amazonses.com`
- Priority: `10`
- TTL: `600`

### 2. TXT Record (DKIM - for email authentication)
**In Porkbun, enter:**
- Type: `TXT`
- Name: `resend._domainkey.mail` (Porkbun will append .fisherbackflows.com)
- Answer: `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCUgcVWVvAbbp2qQPQ0vr2F1M3ocNnMoIEu8jBOtJ3Sz8krHlfMY8PBEgqRt9Lbs+ZIlXErB8JAQ76SZEC55p3dfwTo3BvM0aRsay6L4w5LnzhO8ON4BlGx1PrgPCXKYRnODouH7KaC20alb2UQDgbyM+orAtR+P2Ber48aSnZlhQIDAQAB`
- TTL: `600`

### 3. TXT Record (SPF - sender verification)
**In Porkbun, enter:**
- Type: `TXT`
- Name: `send.mail` (Porkbun will append .fisherbackflows.com)
- Answer: `v=spf1 include:amazonses.com ~all`
- TTL: `600`

### 4. TXT Record (DMARC - email policy)
**In Porkbun, enter:**
- Type: `TXT`
- Name: `_dmarc.mail` (Porkbun will append .fisherbackflows.com)
- Answer: `v=DMARC1; p=none;`
- TTL: `600`

## Records to Delete
Remove these incorrect records:
- `send.mail.fisherbackflows.com.fisherbackflows.com` (MX)
- `resend._domainkey.mail.fisherbackflows.com.fisherbackflows.com` (TXT)
- `send.mail.fisherbackflows.com.fisherbackflows.com` (TXT)
- `_dmarc.fisherbackflows.com.fisherbackflows.com` (TXT)

## After DNS Changes

1. **Wait for propagation** (15 minutes to 2 hours typically)

2. **Verify in Resend Dashboard**
   - Go to https://resend.com/domains
   - Click "Verify DNS Records" for `mail.fisherbackflows.com`

3. **Test the integration**
   ```bash
   node scripts/test-resend.js
   ```

## Alternative: Use Root Domain

If subdomain setup continues to fail, you can use the root domain instead:

1. In Resend, add domain: `fisherbackflows.com` (instead of mail.fisherbackflows.com)
2. Update DNS records accordingly
3. Update the code to use `noreply@fisherbackflows.com` as the sender

## Need Help?

- Porkbun DNS Guide: https://kb.porkbun.com/article/68-how-do-i-edit-dns
- Resend Support: support@resend.com
- Check DNS Propagation: https://www.whatsmydns.net/