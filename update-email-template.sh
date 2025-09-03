#!/bin/bash

# Update Fisher Backflows Email Templates via Supabase Management API
# Get your access token from https://supabase.com/dashboard/account/tokens

SUPABASE_ACCESS_TOKEN="your-access-token"
PROJECT_REF="jvhbqfueutvfepsjmztx"

# Read the HTML template
TEMPLATE_CONTENT=$(cat email-templates/confirmation.html | sed 's/"/\\"/g' | tr -d '\n')

curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
      "mailer_subjects_confirmation": "Verify Your Fisher Backflows Account",
      "mailer_templates_confirmation_content": "'$TEMPLATE_CONTENT'"
  }'