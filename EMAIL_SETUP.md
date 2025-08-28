# Email Setup Guide

The Fisher Backflows platform now supports real email sending through Gmail. Follow these steps to configure it:

## Environment Variables Needed

Add these to your `.env.local` file:

```env
# Gmail Configuration for Email Automation
GMAIL_USER=fisherbackflows@gmail.com
GMAIL_APP_PASSWORD=your-16-digit-app-password
```

## Setting up Gmail App Password

1. Go to your Google Account settings
2. Select "Security" > "2-Step Verification" 
3. At the bottom, select "App passwords"
4. Select "Mail" and your device
5. Google will generate a 16-digit password
6. Use this password (not your regular Gmail password)

## Features Now Working

✅ **Test Completion Emails**: Automatically sent when field test is completed
- Professional HTML template with test results
- PDF report attachment (coming soon)
- Invoice details and payment link
- Different styling for Pass/Fail results

✅ **Appointment Confirmations**: Sent when customer books appointment
- Appointment details and what to expect
- Contact information and rescheduling policy

✅ **Payment Confirmations**: Sent when payment is received
- Receipt details and PDF receipt (coming soon)

✅ **Appointment Reminders**: Sent day before scheduled test
- Friendly reminder with appointment details

✅ **Lead Welcome Emails**: Sent to new potential customers
- Welcome message and company information

## Fallback Behavior

- If environment variables are not set, emails will be logged to console
- System continues to work normally, just without actual email sending
- Perfect for development and testing

## Testing Email Automation

1. Set up environment variables
2. Complete a test through the field app
3. Check the email inbox for automated messages
4. Monitor logs for any email sending errors

## Next Steps

- Set up PDF generation for reports and receipts
- Add SMS notifications for urgent alerts
- Configure email templates with company branding