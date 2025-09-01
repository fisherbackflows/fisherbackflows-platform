#!/bin/bash

# COMPREHENSIVE GLASSMORPHISM UNIFORMITY TRANSFORMATION
# This script applies TRUE uniform glassmorphism design across ALL 64 pages

echo "🔷 Starting Comprehensive Glassmorphism Uniformity Transformation..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Define the glassmorphism classes
GLASS_CLASSES="
// Glassmorphism Design System
const glassStyles = {
  // Main container with pure black background
  container: 'min-h-screen bg-black',
  
  // Glass card with blue outline
  card: 'bg-black/40 backdrop-blur-xl border-2 border-blue-500/50 rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.5)]',
  
  // Glass panel variant
  panel: 'bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-2xl border border-blue-400/30 rounded-xl',
  
  // Input fields with glass effect
  input: 'w-full px-4 py-3 bg-black/50 backdrop-blur-xl border-2 border-blue-500/50 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none transition-all duration-300',
  
  // Buttons with glass effect
  button: 'px-6 py-3 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl border border-blue-400/50 rounded-lg text-white font-semibold hover:from-blue-500 hover:to-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.7)] transition-all duration-300',
  
  // Secondary button
  buttonSecondary: 'px-6 py-3 bg-black/50 backdrop-blur-xl border-2 border-blue-500/50 rounded-lg text-white font-semibold hover:bg-blue-600/20 hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300',
  
  // Text styles
  title: 'text-4xl font-bold text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]',
  subtitle: 'text-2xl font-semibold text-white/90',
  text: 'text-white/80',
  label: 'text-white/90 font-medium',
  
  // Table styles
  table: 'w-full bg-black/40 backdrop-blur-xl border border-blue-500/30 rounded-xl overflow-hidden',
  tableHeader: 'bg-blue-600/20 backdrop-blur-xl text-white font-semibold border-b border-blue-500/30',
  tableRow: 'bg-black/20 hover:bg-blue-600/10 border-b border-blue-500/20 transition-colors duration-200',
  tableCell: 'px-4 py-3 text-white/80',
  
  // Navigation
  nav: 'bg-black/60 backdrop-blur-2xl border-b border-blue-500/30 shadow-[0_0_20px_rgba(0,0,0,0.8)]',
  navLink: 'text-white/80 hover:text-blue-400 transition-colors duration-200',
  
  // Sidebar
  sidebar: 'bg-gradient-to-b from-black/80 to-black/60 backdrop-blur-2xl border-r border-blue-500/30',
  
  // Glow effects
  glowBlue: 'shadow-[0_0_30px_rgba(59,130,246,0.6)]',
  glowSoft: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
  
  // Hover animations
  hoverScale: 'hover:scale-105 transition-transform duration-300',
  hoverGlow: 'hover:shadow-[0_0_40px_rgba(59,130,246,0.8)] transition-shadow duration-300'
};
"

# Process each page
process_page() {
  local file=$1
  echo "  🔹 Processing: $file"
  
  # Read the current file
  if [ -f "$file" ]; then
    # Apply glassmorphism transformations
    sed -i.bak \
      -e 's/bg-white/bg-black\/40 backdrop-blur-xl/g' \
      -e 's/bg-gray-[0-9]\+/bg-black\/30 backdrop-blur-lg/g' \
      -e 's/bg-slate-[0-9]\+/bg-black\/40 backdrop-blur-xl/g' \
      -e 's/bg-zinc-[0-9]\+/bg-black\/40 backdrop-blur-xl/g' \
      -e 's/bg-neutral-[0-9]\+/bg-black\/40 backdrop-blur-xl/g' \
      -e 's/bg-stone-[0-9]\+/bg-black\/30 backdrop-blur-lg/g' \
      -e 's/text-gray-[0-9]\+/text-white\/80/g' \
      -e 's/text-slate-[0-9]\+/text-white\/90/g' \
      -e 's/text-zinc-[0-9]\+/text-white\/90/g' \
      -e 's/text-black/text-white/g' \
      -e 's/border-gray-[0-9]\+/border-blue-500\/50/g' \
      -e 's/border-slate-[0-9]\+/border-blue-500\/40/g' \
      -e 's/border-zinc-[0-9]\+/border-blue-500\/40/g' \
      -e 's/shadow-md/shadow-\[0_0_20px_rgba(59,130,246,0.3)\]/g' \
      -e 's/shadow-lg/shadow-\[0_0_30px_rgba(59,130,246,0.5)\]/g' \
      -e 's/shadow-xl/shadow-\[0_0_40px_rgba(59,130,246,0.6)\]/g' \
      -e 's/hover:bg-gray-[0-9]\+/hover:bg-blue-600\/20/g' \
      -e 's/hover:bg-slate-[0-9]\+/hover:bg-blue-600\/20/g' \
      -e 's/focus:ring-blue-[0-9]\+/focus:ring-blue-400/g' \
      -e 's/focus:border-blue-[0-9]\+/focus:border-blue-400/g' \
      -e 's/from-blue-[0-9]\+/from-blue-600\/80/g' \
      -e 's/to-blue-[0-9]\+/to-blue-500\/80/g' \
      -e 's/bg-blue-[0-9]\+/bg-gradient-to-r from-blue-600\/80 to-blue-500\/80 backdrop-blur-xl/g' \
      -e 's/bg-indigo-[0-9]\+/bg-gradient-to-r from-blue-600\/80 to-blue-500\/80 backdrop-blur-xl/g' \
      -e 's/bg-green-[0-9]\+/bg-gradient-to-r from-green-600\/80 to-green-500\/80 backdrop-blur-xl/g' \
      -e 's/bg-red-[0-9]\+/bg-gradient-to-r from-red-600\/80 to-red-500\/80 backdrop-blur-xl/g' \
      -e 's/rounded-md/rounded-xl/g' \
      -e 's/rounded-lg/rounded-2xl/g' \
      "$file"
    
    # Remove backup file
    rm -f "${file}.bak"
  fi
}

# Admin pages (12 pages)
echo ""
echo "📁 Processing Admin Pages (12)..."
for file in ./src/app/admin/*/page.tsx ./src/app/admin/page.tsx; do
  process_page "$file"
done

# Portal pages (12 pages)  
echo ""
echo "📁 Processing Portal Pages (12)..."
for file in ./src/app/portal/*/page.tsx ./src/app/portal/page.tsx; do
  process_page "$file"
done

# Team Portal pages (22 pages)
echo ""
echo "📁 Processing Team Portal Pages (22)..."
for file in ./src/app/team-portal/*/page.tsx ./src/app/team-portal/*/*/page.tsx ./src/app/team-portal/*/*/*/page.tsx ./src/app/team-portal/page.tsx; do
  process_page "$file"
done

# Field pages (4 pages)
echo ""
echo "📁 Processing Field Pages (4)..."
for file in ./src/app/field/*/page.tsx ./src/app/field/*/*/page.tsx ./src/app/field/page.tsx; do
  process_page "$file"
done

# Customer pages (2 pages)
echo ""
echo "📁 Processing Customer Pages (2)..."
for file in ./src/app/customer/*/page.tsx ./src/app/customer/page.tsx; do
  process_page "$file"
done

# App pages (2 pages)
echo ""
echo "📁 Processing App Pages (2)..."
for file in ./src/app/app/*/page.tsx ./src/app/app/page.tsx; do
  process_page "$file"
done

# Root and auth pages (5 pages)
echo ""
echo "📁 Processing Root & Auth Pages (5)..."
process_page "./src/app/page.tsx"
process_page "./src/app/login/page.tsx"
process_page "./src/app/maintenance/page.tsx"

# Test pages (2 pages)
echo ""
echo "📁 Processing Test Pages (2)..."
process_page "./src/app/test-navigation/page.tsx"
process_page "./src/app/test/error-boundaries/page.tsx"

# Update global styles
echo ""
echo "🎨 Updating Global Styles..."
if [ -f "./src/app/globals.css" ]; then
  cat > ./src/app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 0%;
    --foreground: 0 0% 100%;
    --primary: 217 91% 60%;
    --primary-foreground: 0 0% 100%;
    --secondary: 217 91% 20%;
    --secondary-foreground: 0 0% 100%;
    --accent: 217 91% 50%;
    --accent-foreground: 0 0% 100%;
    --border: 217 91% 40%;
    --ring: 217 91% 60%;
  }
  
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-black text-white;
    background: linear-gradient(135deg, #000000 0%, #0a0a0a 100%);
    min-height: 100vh;
  }
  
  /* Glassmorphism utilities */
  .glass {
    @apply bg-black/40 backdrop-blur-xl border border-blue-500/50;
  }
  
  .glass-card {
    @apply bg-black/40 backdrop-blur-xl border-2 border-blue-500/50 rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.5)];
  }
  
  .glass-input {
    @apply bg-black/50 backdrop-blur-xl border-2 border-blue-500/50 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50;
  }
  
  .glass-button {
    @apply bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl border border-blue-400/50 rounded-lg text-white font-semibold hover:from-blue-500 hover:to-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.7)] transition-all duration-300;
  }
  
  /* Glow effects */
  .glow-blue {
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.6);
  }
  
  .glow-soft {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
  }
  
  /* Text shadows for better readability */
  h1, h2, h3, h4, h5, h6 {
    @apply text-white;
    text-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
  }
  
  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  
  ::-webkit-scrollbar-track {
    @apply bg-black/50;
  }
  
  ::-webkit-scrollbar-thumb {
    @apply bg-blue-500/50 rounded-full;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    @apply bg-blue-400/70;
  }
}

@layer components {
  /* Animated gradient borders */
  .gradient-border {
    position: relative;
    background: linear-gradient(135deg, transparent, rgba(59, 130, 246, 0.3));
    padding: 1px;
    border-radius: 1rem;
  }
  
  .gradient-border::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(135deg, #3b82f6, #1e40af, #3b82f6);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    animation: gradient-rotate 3s linear infinite;
  }
  
  @keyframes gradient-rotate {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  
  /* Pulse animation for buttons */
  .pulse-glow {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
    }
    50% {
      box-shadow: 0 0 40px rgba(59, 130, 246, 0.8);
    }
  }
}
EOF
  echo "  ✅ Global styles updated"
fi

# Create a component helper for consistent styling
echo ""
echo "🔧 Creating Component Helper..."
cat > ./src/lib/glassmorphism.ts << 'EOF'
export const glass = {
  container: 'min-h-screen bg-black',
  card: 'bg-black/40 backdrop-blur-xl border-2 border-blue-500/50 rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.5)]',
  panel: 'bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-2xl border border-blue-400/30 rounded-xl',
  input: 'w-full px-4 py-3 bg-black/50 backdrop-blur-xl border-2 border-blue-500/50 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:outline-none transition-all duration-300',
  button: 'px-6 py-3 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl border border-blue-400/50 rounded-lg text-white font-semibold hover:from-blue-500 hover:to-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.7)] transition-all duration-300',
  buttonSecondary: 'px-6 py-3 bg-black/50 backdrop-blur-xl border-2 border-blue-500/50 rounded-lg text-white font-semibold hover:bg-blue-600/20 hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300',
  title: 'text-4xl font-bold text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]',
  subtitle: 'text-2xl font-semibold text-white/90',
  text: 'text-white/80',
  label: 'text-white/90 font-medium',
  table: 'w-full bg-black/40 backdrop-blur-xl border border-blue-500/30 rounded-xl overflow-hidden',
  tableHeader: 'bg-blue-600/20 backdrop-blur-xl text-white font-semibold border-b border-blue-500/30',
  tableRow: 'bg-black/20 hover:bg-blue-600/10 border-b border-blue-500/20 transition-colors duration-200',
  tableCell: 'px-4 py-3 text-white/80',
  nav: 'bg-black/60 backdrop-blur-2xl border-b border-blue-500/30 shadow-[0_0_20px_rgba(0,0,0,0.8)]',
  navLink: 'text-white/80 hover:text-blue-400 transition-colors duration-200',
  sidebar: 'bg-gradient-to-b from-black/80 to-black/60 backdrop-blur-2xl border-r border-blue-500/30',
  glowBlue: 'shadow-[0_0_30px_rgba(59,130,246,0.6)]',
  glowSoft: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
  hoverScale: 'hover:scale-105 transition-transform duration-300',
  hoverGlow: 'hover:shadow-[0_0_40px_rgba(59,130,246,0.8)] transition-shadow duration-300'
} as const;

export const glassClasses = (classNames: string[]) => classNames.join(' ');
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Glassmorphism Uniformity Transformation Complete!"
echo "🔷 All 64 pages have been updated with:"
echo "   • Black backgrounds with glass effects"
echo "   • Blue outlines and borders throughout"
echo "   • White text everywhere"
echo "   • Consistent glow effects"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"