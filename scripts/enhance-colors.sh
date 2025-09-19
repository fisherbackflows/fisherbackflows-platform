#!/bin/bash

# Fisher Backflows Color Enhancement Script
# This script makes ALL colors deeper and more vibrant across the entire platform
# by replacing light/pale colors with their deeper, richer variants

echo "🎨 Starting comprehensive color enhancement across Fisher Backflows platform..."
echo ""

# Define source directories to process
DIRECTORIES=(
    "src/app"
    "src/components" 
    "src/lib"
    "src/api"
)

# File extensions to process
EXTENSIONS="-name '*.tsx' -o -name '*.ts' -o -name '*.jsx' -o -name '*.js' -o -name '*.css'"

# Count total files to process
echo "📊 Scanning codebase..."
TOTAL_FILES=0
for dir in "${DIRECTORIES[@]}"; do
    if [ -d "$dir" ]; then
        count=$(find "$dir" -type f \( $EXTENSIONS \) | wc -l)
        echo "  $dir: $count files"
        TOTAL_FILES=$((TOTAL_FILES + count))
    fi
done
echo "  Total files to enhance: $TOTAL_FILES"
echo ""

# Create backup directory
BACKUP_DIR="color-enhancement-backup-$(date +%Y%m%d-%H%M%S)"
echo "💾 Creating backup in $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"
for dir in "${DIRECTORIES[@]}"; do
    if [ -d "$dir" ]; then
        cp -r "$dir" "$BACKUP_DIR/"
    fi
done
echo "✅ Backup created successfully"
echo ""

# Color replacement function
enhance_colors() {
    local file="$1"
    echo "Enhancing: $file"
    
    # Create temporary file for sed operations
    local temp_file="$file.tmp"
    cp "$file" "$temp_file"
    
    # GRAY COLOR ENHANCEMENTS (make grays much deeper)
    sed -i 's/\bg-gray-50\b/bg-gray-200/g' "$temp_file"
    sed -i 's/\bg-gray-100\b/bg-gray-300/g' "$temp_file"
    sed -i 's/\bg-gray-200\b/bg-gray-400/g' "$temp_file"
    sed -i 's/\bg-gray-300\b/bg-gray-500/g' "$temp_file"
    sed -i 's/\bg-gray-400\b/bg-gray-600/g' "$temp_file"
    sed -i 's/\bg-gray-500\b/bg-gray-700/g' "$temp_file"
    sed -i 's/\bg-gray-600\b/bg-gray-800/g' "$temp_file"
    
    sed -i 's/\btext-gray-50\b/text-gray-200/g' "$temp_file"
    sed -i 's/\btext-gray-100\b/text-gray-300/g' "$temp_file"
    sed -i 's/\btext-gray-200\b/text-gray-400/g' "$temp_file"
    sed -i 's/\btext-gray-300\b/text-gray-500/g' "$temp_file"
    sed -i 's/\btext-gray-400\b/text-gray-600/g' "$temp_file"
    sed -i 's/\btext-gray-500\b/text-gray-700/g' "$temp_file"
    sed -i 's/\btext-gray-600\b/text-gray-800/g' "$temp_file"
    sed -i 's/\btext-gray-700\b/text-gray-900/g' "$temp_file"
    
    sed -i 's/\bborder-gray-50\b/border-gray-200/g' "$temp_file"
    sed -i 's/\bborder-gray-100\b/border-gray-300/g' "$temp_file"
    sed -i 's/\bborder-gray-200\b/border-gray-400/g' "$temp_file"
    sed -i 's/\bborder-gray-300\b/border-gray-500/g' "$temp_file"
    sed -i 's/\bborder-gray-400\b/border-gray-600/g' "$temp_file"
    sed -i 's/\bborder-gray-500\b/border-gray-700/g' "$temp_file"
    sed -i 's/\bborder-gray-600\b/border-gray-800/g' "$temp_file"
    
    # SLATE COLOR ENHANCEMENTS (make slates much deeper)
    sed -i 's/\bg-slate-50\b/bg-slate-200/g' "$temp_file"
    sed -i 's/\bg-slate-100\b/bg-slate-300/g' "$temp_file"
    sed -i 's/\bg-slate-200\b/bg-slate-400/g' "$temp_file"
    sed -i 's/\bg-slate-300\b/bg-slate-500/g' "$temp_file"
    sed -i 's/\bg-slate-400\b/bg-slate-600/g' "$temp_file"
    sed -i 's/\bg-slate-500\b/bg-slate-700/g' "$temp_file"
    sed -i 's/\bg-slate-600\b/bg-slate-800/g' "$temp_file"
    
    sed -i 's/\btext-slate-50\b/text-slate-200/g' "$temp_file"
    sed -i 's/\btext-slate-100\b/text-slate-300/g' "$temp_file"
    sed -i 's/\btext-slate-200\b/text-slate-400/g' "$temp_file"
    sed -i 's/\btext-slate-300\b/text-slate-500/g' "$temp_file"
    sed -i 's/\btext-slate-400\b/text-slate-600/g' "$temp_file"
    sed -i 's/\btext-slate-500\b/text-slate-700/g' "$temp_file"
    sed -i 's/\btext-slate-600\b/text-slate-800/g' "$temp_file"
    sed -i 's/\btext-slate-700\b/text-slate-900/g' "$temp_file"
    
    sed -i 's/\bborder-slate-50\b/border-slate-200/g' "$temp_file"
    sed -i 's/\bborder-slate-100\b/border-slate-300/g' "$temp_file"
    sed -i 's/\bborder-slate-200\b/border-slate-400/g' "$temp_file"
    sed -i 's/\bborder-slate-300\b/border-slate-500/g' "$temp_file"
    sed -i 's/\bborder-slate-400\b/border-slate-600/g' "$temp_file"
    sed -i 's/\bborder-slate-500\b/border-slate-700/g' "$temp_file"
    sed -i 's/\bborder-slate-600\b/border-slate-800/g' "$temp_file"
    
    # BLUE COLOR ENHANCEMENTS (make blues more vibrant and deeper)
    sed -i 's/\bg-blue-50\b/bg-blue-200/g' "$temp_file"
    sed -i 's/\bg-blue-100\b/bg-blue-300/g' "$temp_file"
    sed -i 's/\bg-blue-200\b/bg-blue-400/g' "$temp_file"
    sed -i 's/\bg-blue-300\b/bg-blue-500/g' "$temp_file"
    sed -i 's/\bg-blue-400\b/bg-blue-600/g' "$temp_file"
    sed -i 's/\bg-blue-500\b/bg-blue-700/g' "$temp_file"
    sed -i 's/\bg-blue-600\b/bg-blue-800/g' "$temp_file"
    
    sed -i 's/\btext-blue-50\b/text-blue-200/g' "$temp_file"
    sed -i 's/\btext-blue-100\b/text-blue-300/g' "$temp_file"
    sed -i 's/\btext-blue-200\b/text-blue-400/g' "$temp_file"
    sed -i 's/\btext-blue-300\b/text-blue-500/g' "$temp_file"
    sed -i 's/\btext-blue-400\b/text-blue-600/g' "$temp_file"
    sed -i 's/\btext-blue-500\b/text-blue-700/g' "$temp_file"
    sed -i 's/\btext-blue-600\b/text-blue-800/g' "$temp_file"
    
    sed -i 's/\bborder-blue-50\b/border-blue-200/g' "$temp_file"
    sed -i 's/\bborder-blue-100\b/border-blue-300/g' "$temp_file"
    sed -i 's/\bborder-blue-200\b/border-blue-400/g' "$temp_file"
    sed -i 's/\bborder-blue-300\b/border-blue-500/g' "$temp_file"
    sed -i 's/\bborder-blue-400\b/border-blue-600/g' "$temp_file"
    sed -i 's/\bborder-blue-500\b/border-blue-700/g' "$temp_file"
    sed -i 's/\bborder-blue-600\b/border-blue-800/g' "$temp_file"
    
    sed -i 's/\bring-blue-300\b/ring-blue-500/g' "$temp_file"
    sed -i 's/\bring-blue-400\b/ring-blue-600/g' "$temp_file"
    sed -i 's/\bring-blue-500\b/ring-blue-700/g' "$temp_file"
    
    sed -i 's/\bfrom-blue-50\b/from-blue-200/g' "$temp_file"
    sed -i 's/\bfrom-blue-100\b/from-blue-300/g' "$temp_file"
    sed -i 's/\bfrom-blue-200\b/from-blue-400/g' "$temp_file"
    sed -i 's/\bfrom-blue-300\b/from-blue-500/g' "$temp_file"
    sed -i 's/\bfrom-blue-400\b/from-blue-600/g' "$temp_file"
    sed -i 's/\bfrom-blue-500\b/from-blue-700/g' "$temp_file"
    sed -i 's/\bfrom-blue-600\b/from-blue-800/g' "$temp_file"
    
    sed -i 's/\bto-blue-50\b/to-blue-200/g' "$temp_file"
    sed -i 's/\bto-blue-100\b/to-blue-300/g' "$temp_file"
    sed -i 's/\bto-blue-200\b/to-blue-400/g' "$temp_file"
    sed -i 's/\bto-blue-300\b/to-blue-500/g' "$temp_file"
    sed -i 's/\bto-blue-400\b/to-blue-600/g' "$temp_file"
    sed -i 's/\bto-blue-500\b/to-blue-700/g' "$temp_file"
    sed -i 's/\bto-blue-600\b/to-blue-800/g' "$temp_file"
    
    # GREEN COLOR ENHANCEMENTS (make greens more vibrant)
    sed -i 's/\bg-green-50\b/bg-green-200/g' "$temp_file"
    sed -i 's/\bg-green-100\b/bg-green-300/g' "$temp_file"
    sed -i 's/\bg-green-200\b/bg-green-400/g' "$temp_file"
    sed -i 's/\bg-green-300\b/bg-green-500/g' "$temp_file"
    sed -i 's/\bg-green-400\b/bg-green-600/g' "$temp_file"
    sed -i 's/\bg-green-500\b/bg-green-700/g' "$temp_file"
    sed -i 's/\bg-green-600\b/bg-green-800/g' "$temp_file"
    
    sed -i 's/\btext-green-50\b/text-green-200/g' "$temp_file"
    sed -i 's/\btext-green-100\b/text-green-300/g' "$temp_file"
    sed -i 's/\btext-green-200\b/text-green-400/g' "$temp_file"
    sed -i 's/\btext-green-300\b/text-green-500/g' "$temp_file"
    sed -i 's/\btext-green-400\b/text-green-600/g' "$temp_file"
    sed -i 's/\btext-green-500\b/text-green-700/g' "$temp_file"
    sed -i 's/\btext-green-600\b/text-green-800/g' "$temp_file"
    
    sed -i 's/\bborder-green-50\b/border-green-200/g' "$temp_file"
    sed -i 's/\bborder-green-100\b/border-green-300/g' "$temp_file"
    sed -i 's/\bborder-green-200\b/border-green-400/g' "$temp_file"
    sed -i 's/\bborder-green-300\b/border-green-500/g' "$temp_file"
    sed -i 's/\bborder-green-400\b/border-green-600/g' "$temp_file"
    sed -i 's/\bborder-green-500\b/border-green-700/g' "$temp_file"
    sed -i 's/\bborder-green-600\b/border-green-800/g' "$temp_file"
    
    sed -i 's/\bring-green-300\b/ring-green-500/g' "$temp_file"
    sed -i 's/\bring-green-400\b/ring-green-600/g' "$temp_file"
    sed -i 's/\bring-green-500\b/ring-green-700/g' "$temp_file"
    
    sed -i 's/\bfrom-green-50\b/from-green-200/g' "$temp_file"
    sed -i 's/\bfrom-green-100\b/from-green-300/g' "$temp_file"
    sed -i 's/\bfrom-green-200\b/from-green-400/g' "$temp_file"
    sed -i 's/\bfrom-green-300\b/from-green-500/g' "$temp_file"
    sed -i 's/\bfrom-green-400\b/from-green-600/g' "$temp_file"
    sed -i 's/\bfrom-green-500\b/from-green-700/g' "$temp_file"
    sed -i 's/\bfrom-green-600\b/from-green-800/g' "$temp_file"
    
    sed -i 's/\bto-green-50\b/to-green-200/g' "$temp_file"
    sed -i 's/\bto-green-100\b/to-green-300/g' "$temp_file"
    sed -i 's/\bto-green-200\b/to-green-400/g' "$temp_file"
    sed -i 's/\bto-green-300\b/to-green-500/g' "$temp_file"
    sed -i 's/\bto-green-400\b/to-green-600/g' "$temp_file"
    sed -i 's/\bto-green-500\b/to-green-700/g' "$temp_file"
    sed -i 's/\bto-green-600\b/to-green-800/g' "$temp_file"
    
    # RED COLOR ENHANCEMENTS (make reds more vibrant)
    sed -i 's/\bg-red-50\b/bg-red-200/g' "$temp_file"
    sed -i 's/\bg-red-100\b/bg-red-300/g' "$temp_file"
    sed -i 's/\bg-red-200\b/bg-red-400/g' "$temp_file"
    sed -i 's/\bg-red-300\b/bg-red-500/g' "$temp_file"
    sed -i 's/\bg-red-400\b/bg-red-600/g' "$temp_file"
    sed -i 's/\bg-red-500\b/bg-red-700/g' "$temp_file"
    sed -i 's/\bg-red-600\b/bg-red-800/g' "$temp_file"
    
    sed -i 's/\btext-red-50\b/text-red-200/g' "$temp_file"
    sed -i 's/\btext-red-100\b/text-red-300/g' "$temp_file"
    sed -i 's/\btext-red-200\b/text-red-400/g' "$temp_file"
    sed -i 's/\btext-red-300\b/text-red-500/g' "$temp_file"
    sed -i 's/\btext-red-400\b/text-red-600/g' "$temp_file"
    sed -i 's/\btext-red-500\b/text-red-700/g' "$temp_file"
    sed -i 's/\btext-red-600\b/text-red-800/g' "$temp_file"
    
    sed -i 's/\bborder-red-50\b/border-red-200/g' "$temp_file"
    sed -i 's/\bborder-red-100\b/border-red-300/g' "$temp_file"
    sed -i 's/\bborder-red-200\b/border-red-400/g' "$temp_file"
    sed -i 's/\bborder-red-300\b/border-red-500/g' "$temp_file"
    sed -i 's/\bborder-red-400\b/border-red-600/g' "$temp_file"
    sed -i 's/\bborder-red-500\b/border-red-700/g' "$temp_file"
    sed -i 's/\bborder-red-600\b/border-red-800/g' "$temp_file"
    
    sed -i 's/\bring-red-300\b/ring-red-500/g' "$temp_file"
    sed -i 's/\bring-red-400\b/ring-red-600/g' "$temp_file"
    sed -i 's/\bring-red-500\b/ring-red-700/g' "$temp_file"
    
    # YELLOW/AMBER COLOR ENHANCEMENTS (make yellows more vibrant)
    sed -i 's/\bg-yellow-50\b/bg-yellow-200/g' "$temp_file"
    sed -i 's/\bg-yellow-100\b/bg-yellow-300/g' "$temp_file"
    sed -i 's/\bg-yellow-200\b/bg-yellow-400/g' "$temp_file"
    sed -i 's/\bg-yellow-300\b/bg-yellow-500/g' "$temp_file"
    sed -i 's/\bg-yellow-400\b/bg-yellow-600/g' "$temp_file"
    sed -i 's/\bg-yellow-500\b/bg-yellow-700/g' "$temp_file"
    sed -i 's/\bg-yellow-600\b/bg-yellow-800/g' "$temp_file"
    
    sed -i 's/\btext-yellow-50\b/text-yellow-200/g' "$temp_file"
    sed -i 's/\btext-yellow-100\b/text-yellow-300/g' "$temp_file"
    sed -i 's/\btext-yellow-200\b/text-yellow-400/g' "$temp_file"
    sed -i 's/\btext-yellow-300\b/text-yellow-500/g' "$temp_file"
    sed -i 's/\btext-yellow-400\b/text-yellow-600/g' "$temp_file"
    sed -i 's/\btext-yellow-500\b/text-yellow-700/g' "$temp_file"
    sed -i 's/\btext-yellow-600\b/text-yellow-800/g' "$temp_file"
    
    sed -i 's/\bborder-yellow-50\b/border-yellow-200/g' "$temp_file"
    sed -i 's/\bborder-yellow-100\b/border-yellow-300/g' "$temp_file"
    sed -i 's/\bborder-yellow-200\b/border-yellow-400/g' "$temp_file"
    sed -i 's/\bborder-yellow-300\b/border-yellow-500/g' "$temp_file"
    sed -i 's/\bborder-yellow-400\b/border-yellow-600/g' "$temp_file"
    sed -i 's/\bborder-yellow-500\b/border-yellow-700/g' "$temp_file"
    sed -i 's/\bborder-yellow-600\b/border-yellow-800/g' "$temp_file"
    
    # AMBER COLOR ENHANCEMENTS
    sed -i 's/\bg-amber-50\b/bg-amber-200/g' "$temp_file"
    sed -i 's/\bg-amber-100\b/bg-amber-300/g' "$temp_file"
    sed -i 's/\bg-amber-200\b/bg-amber-400/g' "$temp_file"
    sed -i 's/\bg-amber-300\b/bg-amber-500/g' "$temp_file"
    sed -i 's/\bg-amber-400\b/bg-amber-600/g' "$temp_file"
    sed -i 's/\bg-amber-500\b/bg-amber-700/g' "$temp_file"
    sed -i 's/\bg-amber-600\b/bg-amber-800/g' "$temp_file"
    
    sed -i 's/\btext-amber-50\b/text-amber-200/g' "$temp_file"
    sed -i 's/\btext-amber-100\b/text-amber-300/g' "$temp_file"
    sed -i 's/\btext-amber-200\b/text-amber-400/g' "$temp_file"
    sed -i 's/\btext-amber-300\b/text-amber-500/g' "$temp_file"
    sed -i 's/\btext-amber-400\b/text-amber-600/g' "$temp_file"
    sed -i 's/\btext-amber-500\b/text-amber-700/g' "$temp_file"
    sed -i 's/\btext-amber-600\b/text-amber-800/g' "$temp_file"
    
    sed -i 's/\bborder-amber-50\b/border-amber-200/g' "$temp_file"
    sed -i 's/\bborder-amber-100\b/border-amber-300/g' "$temp_file"
    sed -i 's/\bborder-amber-200\b/border-amber-400/g' "$temp_file"
    sed -i 's/\bborder-amber-300\b/border-amber-500/g' "$temp_file"
    sed -i 's/\bborder-amber-400\b/border-amber-600/g' "$temp_file"
    sed -i 's/\bborder-amber-500\b/border-amber-700/g' "$temp_file"
    sed -i 's/\bborder-amber-600\b/border-amber-800/g' "$temp_file"
    
    # EMERALD COLOR ENHANCEMENTS
    sed -i 's/\bg-emerald-50\b/bg-emerald-200/g' "$temp_file"
    sed -i 's/\bg-emerald-100\b/bg-emerald-300/g' "$temp_file"
    sed -i 's/\bg-emerald-200\b/bg-emerald-400/g' "$temp_file"
    sed -i 's/\bg-emerald-300\b/bg-emerald-500/g' "$temp_file"
    sed -i 's/\bg-emerald-400\b/bg-emerald-600/g' "$temp_file"
    sed -i 's/\bg-emerald-500\b/bg-emerald-700/g' "$temp_file"
    sed -i 's/\bg-emerald-600\b/bg-emerald-800/g' "$temp_file"
    
    sed -i 's/\btext-emerald-50\b/text-emerald-200/g' "$temp_file"
    sed -i 's/\btext-emerald-100\b/text-emerald-300/g' "$temp_file"
    sed -i 's/\btext-emerald-200\b/text-emerald-400/g' "$temp_file"
    sed -i 's/\btext-emerald-300\b/text-emerald-500/g' "$temp_file"
    sed -i 's/\btext-emerald-400\b/text-emerald-600/g' "$temp_file"
    sed -i 's/\btext-emerald-500\b/text-emerald-700/g' "$temp_file"
    sed -i 's/\btext-emerald-600\b/text-emerald-800/g' "$temp_file"
    
    sed -i 's/\bborder-emerald-50\b/border-emerald-200/g' "$temp_file"
    sed -i 's/\bborder-emerald-100\b/border-emerald-300/g' "$temp_file"
    sed -i 's/\bborder-emerald-200\b/border-emerald-400/g' "$temp_file"
    sed -i 's/\bborder-emerald-300\b/border-emerald-500/g' "$temp_file"
    sed -i 's/\bborder-emerald-400\b/border-emerald-600/g' "$temp_file"
    sed -i 's/\bborder-emerald-500\b/border-emerald-700/g' "$temp_file"
    sed -i 's/\bborder-emerald-600\b/border-emerald-800/g' "$temp_file"
    
    # PURPLE COLOR ENHANCEMENTS
    sed -i 's/\bg-purple-50\b/bg-purple-200/g' "$temp_file"
    sed -i 's/\bg-purple-100\b/bg-purple-300/g' "$temp_file"
    sed -i 's/\bg-purple-200\b/bg-purple-400/g' "$temp_file"
    sed -i 's/\bg-purple-300\b/bg-purple-500/g' "$temp_file"
    sed -i 's/\bg-purple-400\b/bg-purple-600/g' "$temp_file"
    sed -i 's/\bg-purple-500\b/bg-purple-700/g' "$temp_file"
    sed -i 's/\bg-purple-600\b/bg-purple-800/g' "$temp_file"
    
    sed -i 's/\btext-purple-50\b/text-purple-200/g' "$temp_file"
    sed -i 's/\btext-purple-100\b/text-purple-300/g' "$temp_file"
    sed -i 's/\btext-purple-200\b/text-purple-400/g' "$temp_file"
    sed -i 's/\btext-purple-300\b/text-purple-500/g' "$temp_file"
    sed -i 's/\btext-purple-400\b/text-purple-600/g' "$temp_file"
    sed -i 's/\btext-purple-500\b/text-purple-700/g' "$temp_file"
    sed -i 's/\btext-purple-600\b/text-purple-800/g' "$temp_file"
    
    sed -i 's/\bborder-purple-50\b/border-purple-200/g' "$temp_file"
    sed -i 's/\bborder-purple-100\b/border-purple-300/g' "$temp_file"
    sed -i 's/\bborder-purple-200\b/border-purple-400/g' "$temp_file"
    sed -i 's/\bborder-purple-300\b/border-purple-500/g' "$temp_file"
    sed -i 's/\bborder-purple-400\b/border-purple-600/g' "$temp_file"
    sed -i 's/\bborder-purple-500\b/border-purple-700/g' "$temp_file"
    sed -i 's/\bborder-purple-600\b/border-purple-800/g' "$temp_file"
    
    # ORANGE COLOR ENHANCEMENTS  
    sed -i 's/\bg-orange-50\b/bg-orange-200/g' "$temp_file"
    sed -i 's/\bg-orange-100\b/bg-orange-300/g' "$temp_file"
    sed -i 's/\bg-orange-200\b/bg-orange-400/g' "$temp_file"
    sed -i 's/\bg-orange-300\b/bg-orange-500/g' "$temp_file"
    sed -i 's/\bg-orange-400\b/bg-orange-600/g' "$temp_file"
    sed -i 's/\bg-orange-500\b/bg-orange-700/g' "$temp_file"
    sed -i 's/\bg-orange-600\b/bg-orange-800/g' "$temp_file"
    
    sed -i 's/\btext-orange-50\b/text-orange-200/g' "$temp_file"
    sed -i 's/\btext-orange-100\b/text-orange-300/g' "$temp_file"
    sed -i 's/\btext-orange-200\b/text-orange-400/g' "$temp_file"
    sed -i 's/\btext-orange-300\b/text-orange-500/g' "$temp_file"
    sed -i 's/\btext-orange-400\b/text-orange-600/g' "$temp_file"
    sed -i 's/\btext-orange-500\b/text-orange-700/g' "$temp_file"
    sed -i 's/\btext-orange-600\b/text-orange-800/g' "$temp_file"
    
    sed -i 's/\bborder-orange-50\b/border-orange-200/g' "$temp_file"
    sed -i 's/\bborder-orange-100\b/border-orange-300/g' "$temp_file"
    sed -i 's/\bborder-orange-200\b/border-orange-400/g' "$temp_file"
    sed -i 's/\bborder-orange-300\b/border-orange-500/g' "$temp_file"
    sed -i 's/\bborder-orange-400\b/border-orange-600/g' "$temp_file"
    sed -i 's/\bborder-orange-500\b/border-orange-700/g' "$temp_file"
    sed -i 's/\bborder-orange-600\b/border-orange-800/g' "$temp_file"
    
    # TEAL COLOR ENHANCEMENTS
    sed -i 's/\bg-teal-50\b/bg-teal-200/g' "$temp_file"
    sed -i 's/\bg-teal-100\b/bg-teal-300/g' "$temp_file"
    sed -i 's/\bg-teal-200\b/bg-teal-400/g' "$temp_file"
    sed -i 's/\bg-teal-300\b/bg-teal-500/g' "$temp_file"
    sed -i 's/\bg-teal-400\b/bg-teal-600/g' "$temp_file"
    sed -i 's/\bg-teal-500\b/bg-teal-700/g' "$temp_file"
    sed -i 's/\bg-teal-600\b/bg-teal-800/g' "$temp_file"
    
    sed -i 's/\btext-teal-50\b/text-teal-200/g' "$temp_file"
    sed -i 's/\btext-teal-100\b/text-teal-300/g' "$temp_file"
    sed -i 's/\btext-teal-200\b/text-teal-400/g' "$temp_file"
    sed -i 's/\btext-teal-300\b/text-teal-500/g' "$temp_file"
    sed -i 's/\btext-teal-400\b/text-teal-600/g' "$temp_file"
    sed -i 's/\btext-teal-500\b/text-teal-700/g' "$temp_file"
    sed -i 's/\btext-teal-600\b/text-teal-800/g' "$temp_file"
    
    # CYAN COLOR ENHANCEMENTS
    sed -i 's/\bg-cyan-50\b/bg-cyan-200/g' "$temp_file"
    sed -i 's/\bg-cyan-100\b/bg-cyan-300/g' "$temp_file"
    sed -i 's/\bg-cyan-200\b/bg-cyan-400/g' "$temp_file"
    sed -i 's/\bg-cyan-300\b/bg-cyan-500/g' "$temp_file"
    sed -i 's/\bg-cyan-400\b/bg-cyan-600/g' "$temp_file"
    sed -i 's/\bg-cyan-500\b/bg-cyan-700/g' "$temp_file"
    sed -i 's/\bg-cyan-600\b/bg-cyan-800/g' "$temp_file"
    
    sed -i 's/\btext-cyan-50\b/text-cyan-200/g' "$temp_file"
    sed -i 's/\btext-cyan-100\b/text-cyan-300/g' "$temp_file"
    sed -i 's/\btext-cyan-200\b/text-cyan-400/g' "$temp_file"
    sed -i 's/\btext-cyan-300\b/text-cyan-500/g' "$temp_file"
    sed -i 's/\btext-cyan-400\b/text-cyan-600/g' "$temp_file"
    sed -i 's/\btext-cyan-500\b/text-cyan-700/g' "$temp_file"
    sed -i 's/\btext-cyan-600\b/text-cyan-800/g' "$temp_file"
    
    # SKY/INDIGO/VIOLET COLOR ENHANCEMENTS
    sed -i 's/\bg-sky-50\b/bg-sky-200/g' "$temp_file"
    sed -i 's/\bg-sky-100\b/bg-sky-300/g' "$temp_file"
    sed -i 's/\bg-sky-200\b/bg-sky-400/g' "$temp_file"
    sed -i 's/\bg-sky-300\b/bg-sky-500/g' "$temp_file"
    sed -i 's/\bg-sky-400\b/bg-sky-600/g' "$temp_file"
    sed -i 's/\bg-sky-500\b/bg-sky-700/g' "$temp_file"
    sed -i 's/\bg-sky-600\b/bg-sky-800/g' "$temp_file"
    
    sed -i 's/\bg-indigo-50\b/bg-indigo-200/g' "$temp_file"
    sed -i 's/\bg-indigo-100\b/bg-indigo-300/g' "$temp_file"
    sed -i 's/\bg-indigo-200\b/bg-indigo-400/g' "$temp_file"
    sed -i 's/\bg-indigo-300\b/bg-indigo-500/g' "$temp_file"
    sed -i 's/\bg-indigo-400\b/bg-indigo-600/g' "$temp_file"
    sed -i 's/\bg-indigo-500\b/bg-indigo-700/g' "$temp_file"
    sed -i 's/\bg-indigo-600\b/bg-indigo-800/g' "$temp_file"
    
    # PINK/ROSE COLOR ENHANCEMENTS
    sed -i 's/\bg-pink-50\b/bg-pink-200/g' "$temp_file"
    sed -i 's/\bg-pink-100\b/bg-pink-300/g' "$temp_file"
    sed -i 's/\bg-pink-200\b/bg-pink-400/g' "$temp_file"
    sed -i 's/\bg-pink-300\b/bg-pink-500/g' "$temp_file"
    sed -i 's/\bg-pink-400\b/bg-pink-600/g' "$temp_file"
    sed -i 's/\bg-pink-500\b/bg-pink-700/g' "$temp_file"
    sed -i 's/\bg-pink-600\b/bg-pink-800/g' "$temp_file"
    
    sed -i 's/\btext-pink-50\b/text-pink-200/g' "$temp_file"
    sed -i 's/\btext-pink-100\b/text-pink-300/g' "$temp_file"
    sed -i 's/\btext-pink-200\b/text-pink-400/g' "$temp_file"
    sed -i 's/\btext-pink-300\b/text-pink-500/g' "$temp_file"
    sed -i 's/\btext-pink-400\b/text-pink-600/g' "$temp_file"
    sed -i 's/\btext-pink-500\b/text-pink-700/g' "$temp_file"
    sed -i 's/\btext-pink-600\b/text-pink-800/g' "$temp_file"
    
    # SHADOW ENHANCEMENTS (make shadows more pronounced)
    sed -i 's/\bshadow-blue-500\/10\b/shadow-blue-500\/30/g' "$temp_file"
    sed -i 's/\bshadow-blue-500\/20\b/shadow-blue-500\/40/g' "$temp_file"
    sed -i 's/\bshadow-green-500\/10\b/shadow-green-500\/30/g' "$temp_file"
    sed -i 's/\bshadow-green-500\/20\b/shadow-green-500\/40/g' "$temp_file"
    sed -i 's/\bshadow-red-500\/10\b/shadow-red-500\/30/g' "$temp_file"
    sed -i 's/\bshadow-red-500\/20\b/shadow-red-500\/40/g' "$temp_file"
    sed -i 's/\bshadow-amber-400\/10\b/shadow-amber-400\/30/g' "$temp_file"
    sed -i 's/\bshadow-emerald-400\/10\b/shadow-emerald-400\/30/g' "$temp_file"
    
    # Apply changes if file was modified
    if ! cmp -s "$file" "$temp_file"; then
        mv "$temp_file" "$file"
        return 1  # File was changed
    else
        rm "$temp_file"
        return 0  # No changes made
    fi
}

# Process all files
echo "🚀 Starting color enhancement process..."
echo ""
FILES_PROCESSED=0
FILES_CHANGED=0

for dir in "${DIRECTORIES[@]}"; do
    if [ ! -d "$dir" ]; then
        echo "⚠️  Directory $dir not found, skipping..."
        continue
    fi
    
    echo "🔄 Processing directory: $dir"
    
    # Find and process all relevant files
    while IFS= read -r -d '' file; do
        enhance_colors "$file"
        changed=$?
        FILES_PROCESSED=$((FILES_PROCESSED + 1))
        if [ $changed -eq 1 ]; then
            FILES_CHANGED=$((FILES_CHANGED + 1))
        fi
        
        # Show progress every 10 files
        if [ $((FILES_PROCESSED % 10)) -eq 0 ]; then
            echo "  Progress: $FILES_PROCESSED/$TOTAL_FILES files processed, $FILES_CHANGED files enhanced"
        fi
    done < <(find "$dir" -type f \( $EXTENSIONS \) -print0)
done

echo ""
echo "✅ Color enhancement completed!"
echo ""
echo "📊 Final Statistics:"
echo "  • Total files processed: $FILES_PROCESSED"
echo "  • Files with color enhancements: $FILES_CHANGED"
echo "  • Files unchanged: $((FILES_PROCESSED - FILES_CHANGED))"
echo ""
echo "💾 Backup location: $BACKUP_DIR"
echo ""
echo "🎨 Summary of enhancements applied:"
echo "  • Gray colors: Made 2-3 shades deeper (50→200, 100→300, etc.)"
echo "  • Slate colors: Made 2-3 shades deeper for richer appearance"
echo "  • Blue colors: Enhanced vibrancy with deeper, more saturated tones"
echo "  • Green colors: Boosted richness and depth"
echo "  • Red colors: Intensified for stronger visual impact"
echo "  • Yellow/Amber: Enhanced warmth and vibrancy"
echo "  • Purple/Emerald: Deepened for luxury appearance"
echo "  • Orange/Teal/Cyan: Increased saturation and depth"
echo "  • Shadows: Made more pronounced for better depth perception"
echo ""
echo "🔍 To verify changes, compare any file with its backup:"
echo "  diff src/path/to/file.tsx $BACKUP_DIR/path/to/file.tsx"
echo ""
echo "🔄 To rollback all changes:"
echo "  rm -rf src/app src/components src/lib src/api"
echo "  cp -r $BACKUP_DIR/* ."
echo ""
echo "✨ Your Fisher Backflows platform now has deeper, more vibrant colors throughout!"