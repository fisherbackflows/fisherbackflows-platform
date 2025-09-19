#!/bin/bash

echo "Setting up Fisher Backflows Platform v3..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "Creating environment file from template..."
    cp .env.local.example .env.local
    echo "⚠️  Please configure your environment variables in .env.local"
fi

# Run type check
echo "Running type check..."
npm run type-check

# Run linting
echo "Running linter..."
npm run lint

echo "✅ Setup complete! Run 'npm run dev' to start the development server."
echo "📝 Don't forget to configure your environment variables in .env.local"