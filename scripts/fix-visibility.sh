#!/bin/bash

echo "🔍 Fixing text visibility issues across team portal..."

# Directory to fix
TEAM_PORTAL_DIR="/mnt/c/users/Fishe/fisherbackflows2/fisherbackflows-platform/src/app/team-portal"

# Fix gray-on-gray combinations
echo "✨ Fixing gray text on gray backgrounds..."
find "$TEAM_PORTAL_DIR" -name "*.tsx" -type f -exec sed -i \
  -e 's/bg-gray-100 text-gray-600/bg-gray-100 text-gray-900/g' \
  -e 's/bg-gray-100 text-gray-700/bg-gray-100 text-gray-900/g' \
  -e 's/bg-gray-100 text-gray-800/bg-gray-100 text-gray-900/g' \
  -e 's/bg-gray-50 text-gray-400/bg-gray-50 text-gray-700/g' \
  -e 's/bg-gray-50 text-gray-500/bg-gray-50 text-gray-700/g' \
  -e 's/bg-gray-200 text-gray-600/bg-gray-200 text-gray-900/g' \
  {} \;

# Fix slate-on-slate combinations
echo "✨ Fixing slate text on slate backgrounds..."
find "$TEAM_PORTAL_DIR" -name "*.tsx" -type f -exec sed -i \
  -e 's/bg-slate-100 text-slate-500/bg-slate-100 text-slate-900/g' \
  -e 's/bg-slate-100 text-slate-600/bg-slate-100 text-slate-900/g' \
  -e 's/bg-slate-50 text-slate-400/bg-slate-50 text-slate-700/g' \
  -e 's/bg-slate-50 text-slate-500/bg-slate-50 text-slate-700/g' \
  {} \;

# Fix specific status colors with poor contrast
echo "✨ Fixing status badge contrast..."
find "$TEAM_PORTAL_DIR" -name "*.tsx" -type f -exec sed -i \
  -e 's/bg-green-50 text-green-600/bg-green-100 text-green-900/g' \
  -e 's/bg-blue-50 text-blue-600/bg-blue-100 text-blue-900/g' \
  -e 's/bg-yellow-50 text-yellow-600/bg-yellow-100 text-yellow-900/g' \
  -e 's/bg-red-50 text-red-600/bg-red-100 text-red-900/g' \
  -e 's/bg-amber-50 text-amber-600/bg-amber-100 text-amber-900/g' \
  -e 's/bg-purple-50 text-purple-600/bg-purple-100 text-purple-900/g' \
  {} \;

# Fix light text on white/light backgrounds
echo "✨ Fixing light text on light backgrounds..."
find "$TEAM_PORTAL_DIR" -name "*.tsx" -type f -exec sed -i \
  -e 's/bg-white text-gray-400/bg-white text-gray-700/g' \
  -e 's/bg-white text-gray-500/bg-white text-gray-700/g' \
  -e 's/bg-white text-slate-400/bg-white text-slate-700/g' \
  -e 's/bg-white text-slate-500/bg-white text-slate-700/g' \
  {} \;

# Fix hover states with poor contrast
echo "✨ Fixing hover state contrast..."
find "$TEAM_PORTAL_DIR" -name "*.tsx" -type f -exec sed -i \
  -e 's/hover:bg-gray-50 text-gray-600/hover:bg-gray-50 text-gray-900/g' \
  -e 's/hover:bg-slate-50 text-slate-600/hover:bg-slate-50 text-slate-900/g' \
  {} \;

# Fix input placeholder contrast
echo "✨ Fixing input placeholder contrast..."
find "$TEAM_PORTAL_DIR" -name "*.tsx" -type f -exec sed -i \
  -e 's/placeholder-gray-400/placeholder-gray-600/g' \
  -e 's/placeholder-slate-400/placeholder-slate-600/g' \
  {} \;

# Fix button text contrast
echo "✨ Ensuring button text contrast..."
find "$TEAM_PORTAL_DIR" -name "*.tsx" -type f -exec sed -i \
  -e 's/bg-gray-100">$/bg-gray-100 text-gray-900">/g' \
  -e 's/bg-slate-100">$/bg-slate-100 text-slate-900">/g' \
  {} \;

echo "✅ Visibility fixes complete!"
echo "📊 Summary of changes:"
echo "  - Fixed gray-on-gray text combinations"
echo "  - Fixed slate-on-slate text combinations"
echo "  - Improved status badge contrast"
echo "  - Fixed light text on light backgrounds"
echo "  - Improved hover state contrast"
echo "  - Fixed input placeholder visibility"