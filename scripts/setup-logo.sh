#!/bin/bash

# Fisher Backflows Logo Setup Script
# This script processes your logo and generates the values needed for Logo.tsx

LOGO_FILE="$1"
OUTPUT_DIR="./scripts"

if [ -z "$LOGO_FILE" ]; then
    echo "🎨 Fisher Backflows Logo Setup"
    echo "Usage: ./scripts/setup-logo.sh \"Fisher Backflows Logo.PNG\""
    echo ""
    echo "This script will:"
    echo "  1. Generate base64 encoding (no line breaks)"
    echo "  2. Calculate SHA-256 hash"
    echo "  3. Get image dimensions" 
    echo "  4. Create ready-to-use Logo.tsx code"
    exit 1
fi

if [ ! -f "$LOGO_FILE" ]; then
    echo "❌ Error: File '$LOGO_FILE' not found"
    exit 1
fi

echo "🚀 Processing logo: $LOGO_FILE"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Generate base64 (no line breaks)
echo "📦 Generating base64 encoding..."
base64 -w 0 "$LOGO_FILE" > "$OUTPUT_DIR/logo.b64"
BASE64_CONTENT=$(cat "$OUTPUT_DIR/logo.b64")

# Generate SHA-256 hash
echo "🔐 Calculating SHA-256 hash..."
SHA256_HASH=$(shasum -a 256 "$LOGO_FILE" | cut -d' ' -f1)

# Get image dimensions using file command or identify (if available)
echo "📐 Getting image dimensions..."
if command -v identify &> /dev/null; then
    # Use ImageMagick identify if available
    DIMENSIONS=$(identify -ping -format '%w %h' "$LOGO_FILE")
    WIDTH=$(echo $DIMENSIONS | cut -d' ' -f1)
    HEIGHT=$(echo $DIMENSIONS | cut -d' ' -f2)
elif command -v file &> /dev/null; then
    # Try to extract from file command
    FILE_INFO=$(file "$LOGO_FILE")
    if [[ $FILE_INFO =~ ([0-9]+)\ x\ ([0-9]+) ]]; then
        WIDTH=${BASH_REMATCH[1]}
        HEIGHT=${BASH_REMATCH[2]}
    else
        echo "⚠️  Could not auto-detect dimensions. Please check manually."
        WIDTH="__WIDTH__"
        HEIGHT="__HEIGHT__"
    fi
else
    echo "⚠️  Could not auto-detect dimensions. Please check manually."
    WIDTH="__WIDTH__"
    HEIGHT="__HEIGHT__"
fi

# Create the Logo.tsx code snippet
echo "✨ Generating Logo.tsx code..."
cat > "$OUTPUT_DIR/logo-code.txt" << EOF
// Replace these values in src/components/ui/Logo.tsx:

const DATA_URI = "data:image/png;base64,$BASE64_CONTENT";
const W = $WIDTH;  // natural pixel width
const H = $HEIGHT; // natural pixel height  
const EXPECTED_SHA256 = "$SHA256_HASH";
EOF

# Create complete Logo.tsx file as backup
echo "📝 Creating complete Logo.tsx template..."
cat > "$OUTPUT_DIR/Logo-ready.tsx" << 'EOF'
import React, { useEffect } from 'react';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

// Logo integrity validation function
async function assertLogoIntegrity(dataUri: string, expectedSha256Hex: string) {
  try {
    const b64 = dataUri.split(",")[1];
    const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const hash = await crypto.subtle.digest("SHA-256", raw);
    const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
    
    if (hex !== expectedSha256Hex) {
      console.warn("Logo hash mismatch — possible alteration.", { expectedSha256Hex, hex });
      return false;
    }
    return true;
  } catch (error) {
    console.warn("Logo integrity check failed:", error);
    return false;
  }
}

export default function Logo({ 
  className = "", 
  width, 
  height,
  priority = false 
}: LogoProps) {
EOF

# Add the generated values to the complete template
cat >> "$OUTPUT_DIR/Logo-ready.tsx" << EOF
  const DATA_URI = "data:image/png;base64,$BASE64_CONTENT";
  const W = $WIDTH;  // natural pixel width
  const H = $HEIGHT; // natural pixel height
  const EXPECTED_SHA256 = "$SHA256_HASH";
EOF

# Add the rest of the template
cat >> "$OUTPUT_DIR/Logo-ready.tsx" << 'EOF'
  
  // Validate logo integrity on mount (only when logo is configured)
  useEffect(() => {
    if (DATA_URI !== "data:image/png;base64,PASTE_YOUR_EXACT_BASE64_LOGO_HERE" && 
        EXPECTED_SHA256 !== "PASTE_EXPECTED_SHA256_HEX") {
      assertLogoIntegrity(DATA_URI, EXPECTED_SHA256);
    }
  }, []);
  
  // Use provided dimensions or fall back to natural dimensions
  const displayWidth = width || W;
  const displayHeight = height || H;
  
  // If no logo is provided, show text fallback with water theme
  if (DATA_URI === "data:image/png;base64,PASTE_YOUR_EXACT_BASE64_LOGO_HERE") {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="relative">
          <svg 
            width="32" 
            height="32" 
            viewBox="0 0 32 32" 
            fill="none"
            className="glow-blue-sm"
          >
            <path 
              d="M16 2C16 2 8 10 8 18C8 22.4183 11.5817 26 16 26C20.4183 26 24 22.4183 24 18C24 10 16 2 16 2Z" 
              fill="currentColor"
              className="text-blue-400"
            />
            <ellipse 
              cx="13" 
              cy="16" 
              rx="3" 
              ry="4" 
              fill="currentColor"
              className="text-white/20"
            />
            <rect 
              x="14" 
              y="26" 
              width="4" 
              height="4" 
              fill="currentColor"
              className="text-blue-400"
            />
          </svg>
          <div className="absolute inset-0 animate-ping opacity-30">
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 32 32" 
              fill="none"
            >
              <path 
                d="M16 2C16 2 8 10 8 18C8 22.4183 11.5817 26 16 26C20.4183 26 24 22.4183 24 18C24 10 16 2 16 2Z" 
                fill="currentColor"
                className="text-blue-400"
              />
            </svg>
          </div>
        </div>
        <div className="text-xl font-bold">
          <span className="gradient-text">Fisher Backflows</span>
        </div>
      </div>
    );
  }

  return (
    <img
      alt="Fisher Backflows"
      width={displayWidth}
      height={displayHeight}
      decoding="sync"
      fetchPriority={priority ? "high" : "auto"}
      draggable={false}
      className={className}
      style={{
        display: "block",
        width: `${displayWidth}px`,
        height: "auto",
        imageRendering: "auto",
        objectFit: "contain",
        objectPosition: "left top",
        WebkitUserDrag: "none",
        userSelect: "none",
      }}
      src={DATA_URI}
    />
  );
}
EOF

# Output summary
echo ""
echo "✅ Logo processing complete!"
echo ""
echo "📊 Generated files in $OUTPUT_DIR/:"
echo "  • logo.b64           - Base64 encoded logo"
echo "  • logo-code.txt      - Code snippet for Logo.tsx" 
echo "  • Logo-ready.tsx     - Complete ready-to-use component"
echo ""
echo "📋 Logo Details:"
echo "  • File: $LOGO_FILE"
echo "  • Dimensions: ${WIDTH} × ${HEIGHT}px"
echo "  • SHA-256: $SHA256_HASH"
echo "  • Base64 size: $(echo -n "$BASE64_CONTENT" | wc -c) characters"
echo ""
echo "🚀 Next Steps:"
echo "  1. Copy values from scripts/logo-code.txt"
echo "  2. Paste into src/components/ui/Logo.tsx"
echo "  3. OR replace entire file with scripts/Logo-ready.tsx"
echo ""
echo "🔐 Security: Your logo is now cryptographically protected!"
EOF