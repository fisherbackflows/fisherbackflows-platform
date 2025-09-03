#!/bin/bash

echo "📋 Copying SQL to clipboard for Supabase..."
echo ""

# Check which clipboard tool is available
if command -v xclip &> /dev/null; then
    CLIPBOARD_CMD="xclip -selection clipboard"
elif command -v pbcopy &> /dev/null; then
    CLIPBOARD_CMD="pbcopy"
elif command -v clip.exe &> /dev/null; then
    CLIPBOARD_CMD="clip.exe"
else
    echo "❌ No clipboard tool found. Installing xclip..."
    sudo apt-get install -y xclip
    CLIPBOARD_CMD="xclip -selection clipboard"
fi

# Copy the combined SQL file
if [ -f "APPLY_ALL_MOBILE_TABLES.sql" ]; then
    cat APPLY_ALL_MOBILE_TABLES.sql | $CLIPBOARD_CMD
    echo "✅ Copied APPLY_ALL_MOBILE_TABLES.sql to clipboard!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Go to: https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx/sql/new"
    echo "2. Paste (Ctrl+V) the SQL"
    echo "3. Click 'Run'"
    echo ""
    echo "The clipboard contains all 95 SQL statements for:"
    echo "  • Mobile location tracking"
    echo "  • PWA push notifications"
    echo "  • Performance optimizations"
    echo "  • Security policies"
else
    echo "❌ File not found: APPLY_ALL_MOBILE_TABLES.sql"
fi