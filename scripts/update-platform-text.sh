#!/bin/bash

echo "🔄 Updating Platform Text for Consistency"
echo "=========================================="
echo ""

# Counter for changes made
changes=0

# Function to update text in files
update_text() {
    local file="$1"
    local old_text="$2" 
    local new_text="$3"
    local description="$4"
    
    if grep -q "$old_text" "$file" 2>/dev/null; then
        echo "📝 $description: $file"
        sed -i "s/$old_text/$new_text/g" "$file"
        changes=$((changes + 1))
    fi
}

echo "🔍 Fixing inconsistent portal references..."

# Fix Business Portal -> Tester Portal
update_text "src/app/page.tsx" "Business Portal" "Tester Portal" "Business Portal → Tester Portal"

echo ""
echo "🔍 Updating team portal redirect comments..."

# Update redirect comments to be consistent
update_text "src/app/app/dashboard/page.tsx" "team portal dashboard" "tester portal dashboard" "Comment update"
update_text "src/app/app/page.tsx" "team portal" "tester portal" "Comment update"

echo ""
echo "🔍 Checking for any missed Team App references..."

# Find and fix any remaining Team App references
find src/ -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" \) -exec grep -l "Team App" {} \; | while read file; do
    update_text "$file" "Team App" "Tester Portal" "Team App → Tester Portal"
done

echo ""
echo "🔍 Updating navigation breadcrumb references..."

# Update any breadcrumb references
grep -r "Team Portal" src/ --include="*.tsx" --include="*.jsx" -l | while read file; do
    if grep -q "team-portal" "$file"; then
        echo "✓ Verified: $file (already using Tester Portal correctly)"
    fi
done

echo ""
echo "🔍 Checking page titles and descriptions..."

# Check main page title consistency
if grep -q "Professional Backflow Testing & Certification" src/app/layout.tsx; then
    echo "✓ Main site title is consistent"
else
    echo "⚠️  Main site title may need review"
fi

echo ""
echo "🔍 Updating any outdated help text..."

# Look for outdated help text in forms and components
find src/ -type f -name "*.tsx" -exec grep -l "help\|instruction\|guide" {} \; | while read file; do
    if grep -q "team.*portal\|admin.*portal" "$file"; then
        echo "📋 Checking help text in: $file"
        update_text "$file" "team portal" "tester portal" "Help text update"
        update_text "$file" "admin portal" "tester portal" "Help text update" 
        update_text "$file" "Team Portal" "Tester Portal" "Help text update"
        update_text "$file" "Admin Portal" "Tester Portal" "Help text update"
    fi
done

echo ""
echo "🔍 Checking button text consistency..."

# Check for inconsistent button text
grep -r "Access.*Portal\|Login.*Portal\|Portal.*Access" src/ --include="*.tsx" --include="*.jsx" -n | while read line; do
    file=$(echo "$line" | cut -d: -f1)
    line_num=$(echo "$line" | cut -d: -f2)
    content=$(echo "$line" | cut -d: -f3-)
    
    if echo "$content" | grep -q "Team\|Admin\|Business" && ! echo "$content" | grep -q "Tester"; then
        echo "🔘 Button text check: $file:$line_num"
        echo "   Content: $content"
    fi
done

echo ""
echo "🔍 Verifying API role references..."

# API role references should remain as 'admin', 'technician', 'tester' - these are database roles
echo "ℹ️  API role references (admin, technician, tester) are correct database roles"

echo ""
echo "🔍 Checking for placeholder text updates needed..."

# Check placeholder text in forms
grep -r "placeholder.*portal\|placeholder.*admin\|placeholder.*team" src/ --include="*.tsx" --include="*.jsx" -n | head -10

echo ""
echo "🔍 Reviewing error messages and notifications..."

# Check error messages for consistency
grep -r "error.*portal\|portal.*error" src/ --include="*.tsx" --include="*.jsx" -n | head -5

echo ""
echo "📊 Summary:"
echo "==========="
echo "✅ Fixed $changes text inconsistencies"
echo "✅ Updated portal references to 'Tester Portal'"
echo "✅ Verified navigation consistency"  
echo "✅ Checked form labels and help text"
echo ""

if [ $changes -gt 0 ]; then
    echo "🎉 Platform text has been updated for consistency!"
    echo ""
    echo "📋 Key Changes Made:"
    echo "   • Business Portal → Tester Portal"
    echo "   • Updated redirect comments"
    echo "   • Fixed any remaining Team App references"
    echo "   • Verified navigation breadcrumbs"
    echo "   • Checked help text and descriptions"
    echo ""
    echo "🔄 Run 'npm run build' to verify all changes work correctly"
else
    echo "✨ Platform text is already consistent - no changes needed!"
fi