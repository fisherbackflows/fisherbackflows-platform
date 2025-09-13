#!/bin/bash

echo "🎨 Fixing input field text colors for better visibility..."
echo ""

# Fix all instances of bg-white/90 with text-black to use bg-white/10 and text-white
FILES=$(grep -r "bg-white/90.*text-black" src/ --include="*.tsx" --include="*.jsx" -l)

if [ -z "$FILES" ]; then
    echo "✅ No files with visibility issues found"
else
    echo "📝 Files to fix:"
    echo "$FILES"
    echo ""
    
    for file in $FILES; do
        echo "Fixing: $file"
        # Replace bg-white/90 with bg-white/10 and text-black with text-white
        sed -i 's/bg-white\/90\(.*\)text-black/bg-white\/10\1text-white/g' "$file"
        # Also update placeholder colors from gray-500 to gray-400 for better contrast
        sed -i 's/placeholder-gray-500/placeholder-gray-400/g' "$file"
        # Update hover states for eye icons
        sed -i 's/text-gray-500 hover:text-gray-700/text-gray-400 hover:text-white/g' "$file"
        # Update icon colors from gray-600 to gray-400
        sed -i 's/text-gray-600/text-gray-400/g' "$file"
    done
    
    echo ""
    echo "✅ All input fields updated for better visibility!"
fi

# Show summary of changes
echo ""
echo "📊 Summary:"
echo "- Changed background from bg-white/90 to bg-white/10 (more transparent)"
echo "- Changed text color from text-black to text-white"
echo "- Updated placeholder color from gray-500 to gray-400"
echo "- Updated icon colors for better contrast"
echo ""
echo "✨ Done!"