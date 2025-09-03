#!/bin/bash

# Update Fisher Backflows Email Template
# Get your access token from: https://supabase.com/dashboard/account/tokens

echo "To update the email template, you need to:"
echo "1. Go to https://supabase.com/dashboard/account/tokens"
echo "2. Create a new token (name it 'Email Template Update')"
echo "3. Copy the token and run this command:"
echo ""
echo "export SUPABASE_ACCESS_TOKEN='your-token-here'"
echo "export PROJECT_REF='jvhbqfueutvfepsjmztx'"
echo ""
echo "Then run:"
echo ""

# Read and escape the HTML template
TEMPLATE_CONTENT=$(cat email-templates/confirmation.html | sed 's/"/\\"/g' | tr '\n' ' ' | sed 's/  */ /g')

echo "curl -X PATCH \"https://api.supabase.com/v1/projects/\$PROJECT_REF/config/auth\" \\"
echo "  -H \"Authorization: Bearer \$SUPABASE_ACCESS_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "      \"mailer_subjects_confirmation\": \"Welcome to Fisher Backflows - Verify Your Account\","
echo "      \"mailer_templates_confirmation_content\": \"'$TEMPLATE_CONTENT'\""
echo "  }'"
echo ""
echo "Or just copy the HTML from email-templates/confirmation.html"
echo "and paste it into: Supabase Dashboard → Authentication → Email Templates → Confirm signup"