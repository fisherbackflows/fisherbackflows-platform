#!/bin/bash

# Quick Logo Setup - One-liner approach
# Usage: ./scripts/quick-logo.sh "Fisher Backflows Logo.PNG"

LOGO_FILE="$1"

if [ -z "$LOGO_FILE" ]; then
    echo "Usage: ./scripts/quick-logo.sh \"Fisher Backflows Logo.PNG\""
    exit 1
fi

if [ ! -f "$LOGO_FILE" ]; then
    echo "❌ File '$LOGO_FILE' not found"
    exit 1
fi

# Your exact commands
echo "🔐 Generating SHA-256..."
SHA256=$(shasum -a 256 "$LOGO_FILE" | cut -d' ' -f1)

echo "📦 Generating Base64..."
BASE64=$(base64 -w 0 "$LOGO_FILE")

echo ""
echo "✅ Ready! Copy these values into Logo.tsx:"
echo ""
echo "const DATA_URI = \"data:image/png;base64,$BASE64\";"
echo "const EXPECTED_SHA256 = \"$SHA256\";"
echo ""
echo "🔐 SHA-256: $SHA256"
echo "📦 Base64 ready ($(echo -n "$BASE64" | wc -c) characters)"
echo ""