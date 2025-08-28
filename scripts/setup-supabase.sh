#!/bin/bash

# 🚀 Fisher Backflows Platform - Supabase Setup Script
# This script helps you configure Supabase for your platform

set -e

echo "🚀 Fisher Backflows Platform - Supabase Setup"
echo "=============================================="

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists. Backing up to .env.local.backup"
    cp .env.local .env.local.backup
fi

# Create .env.local from example
if [ ! -f ".env.local" ]; then
    if [ -f ".env.local.example" ]; then
        cp .env.local.example .env.local
        echo "✅ Created .env.local from template"
    else
        echo "❌ .env.local.example not found"
        exit 1
    fi
fi

echo ""
echo "📋 Please provide your Supabase project information:"
echo ""

# Get Supabase URL
read -p "🔗 Enter your Supabase Project URL (https://xxx.supabase.co): " SUPABASE_URL
if [[ -z "$SUPABASE_URL" ]]; then
    echo "❌ Supabase URL is required"
    exit 1
fi

# Get Anon Key
read -p "🔑 Enter your Supabase Anon Key: " ANON_KEY
if [[ -z "$ANON_KEY" ]]; then
    echo "❌ Anon key is required"
    exit 1
fi

# Get Service Role Key
read -p "🔐 Enter your Supabase Service Role Key: " SERVICE_KEY
if [[ -z "$SERVICE_KEY" ]]; then
    echo "❌ Service role key is required"
    exit 1
fi

# Get JWT Secret (optional)
read -p "🎫 Enter your JWT Secret (optional, press enter to generate): " JWT_SECRET
if [[ -z "$JWT_SECRET" ]]; then
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "your-jwt-secret-$(date +%s)")
    echo "🔄 Generated JWT secret: $JWT_SECRET"
fi

echo ""
echo "📝 Updating .env.local file..."

# Update .env.local with actual values
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL|" .env.local
    sed -i '' "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY|" .env.local
    sed -i '' "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY|" .env.local
    sed -i '' "s|SUPABASE_JWT_SECRET=.*|SUPABASE_JWT_SECRET=$JWT_SECRET|" .env.local
else
    # Linux/WSL
    sed -i "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL|" .env.local
    sed -i "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY|" .env.local
    sed -i "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY|" .env.local
    sed -i "s|SUPABASE_JWT_SECRET=.*|SUPABASE_JWT_SECRET=$JWT_SECRET|" .env.local
fi

echo "✅ Environment variables updated!"

echo ""
echo "🗄️  Database Schema Setup"
echo "========================"
echo "Next steps:"
echo "1. Open your Supabase dashboard"
echo "2. Go to SQL Editor"
echo "3. Copy and paste the contents of 'supabase/schema.sql'"
echo "4. Click 'Run' to create all tables"
echo ""
echo "Or use the Supabase CLI:"
echo "supabase db push"

echo ""
echo "🔧 Authentication Setup"
echo "======================="
echo "1. Go to Authentication → Settings in your Supabase dashboard"
echo "2. Enable Email provider"
echo "3. Set Site URL to: http://localhost:3010"
echo "4. Add redirect URLs:"
echo "   - http://localhost:3010/portal/dashboard"
echo "   - http://localhost:3010/auth/callback"

echo ""
echo "✅ Setup Complete!"
echo "================="
echo "Your Fisher Backflows platform is now configured with Supabase!"
echo ""
echo "🚀 Start the development server:"
echo "   npm run dev"
echo ""
echo "🌐 Test the setup:"
echo "   http://localhost:3010/portal/register"
echo ""
echo "📚 Need help? Check SUPABASE_SETUP.md for detailed instructions"
echo ""

# Test connection
echo "🔍 Testing Supabase connection..."
if command -v node &> /dev/null; then
    node -e "
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient('$SUPABASE_URL', '$ANON_KEY');
    console.log('✅ Supabase client created successfully');
    " 2>/dev/null || echo "⚠️  Could not test connection (install dependencies first)"
fi

echo ""
echo "🎉 Ready to build the future of backflow testing! 🎉"