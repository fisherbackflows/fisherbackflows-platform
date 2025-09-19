#!/bin/bash

echo "Setting up Vercel environment variables..."

# Add all production environment variables
echo "test_jwt_secret_key_for_production_$(openssl rand -hex 32)" | npx vercel env add JWT_SECRET production --force
echo "test_nextauth_secret_key_for_production_$(openssl rand -hex 32)" | npx vercel env add NEXTAUTH_SECRET production --force
echo "test_encryption_key_32_char_$(openssl rand -hex 16)" | npx vercel env add ENCRYPTION_KEY production --force

# Supabase (using test values from .env.local)
echo "https://jvhbqfueutvfepsjmztx.supabase.co" | npx vercel env add NEXT_PUBLIC_SUPABASE_URL production --force
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTcxODg5MDcsImV4cCI6MjAzMjc2NDkwN30.Hg7f1DFL7Wvwy7j_2XnRaw6P_cxlh2rLkOBIZqKBtZU" | npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --force
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNzE4ODkwNywiZXhwIjoyMDMyNzY0OTA3fQ.SXR1WIxqBtvHX3Xhv3yoKQQA9KUkuC-sxQQi4dKoVCw" | npx vercel env add SUPABASE_SERVICE_ROLE_KEY production --force

# App URL
echo "https://fisherbackflows.com" | npx vercel env add NEXT_PUBLIC_APP_URL production --force

# Email Service (test values)
echo "re_test_123456789" | npx vercel env add RESEND_API_KEY production --force
echo "onboarding@resend.dev" | npx vercel env add RESEND_FROM_EMAIL production --force

# Stripe (test keys)
echo "sk_test_123456789" | npx vercel env add STRIPE_SECRET_KEY production --force
echo "pk_test_123456789" | npx vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production --force
echo "whsec_test123456789" | npx vercel env add STRIPE_WEBHOOK_SECRET production --force

echo "✅ Environment variables configured on Vercel"