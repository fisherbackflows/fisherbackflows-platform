# 🎯 Logo Setup Example

## Command Line Approach (Your Method)

```bash
# 1. Generate base64 (no line breaks)
base64 -w 0 "Fisher Backflows Logo.PNG" > logo.b64

# 2. Generate SHA-256 hash  
shasum -a 256 "Fisher Backflows Logo.PNG"
# Output: a1b2c3d4e5f6...890 Fisher Backflows Logo.PNG

# 3. Get base64 content
cat logo.b64
# Output: iVBORw0KGgoAAAANSUhEUgAAA...
```

## Update Logo.tsx

Replace these lines in `src/components/ui/Logo.tsx`:

```typescript
// BEFORE
const DATA_URI = "data:image/png;base64,PASTE_YOUR_EXACT_BASE64_LOGO_HERE";
const W = 200;  // replace with natural pixel width
const H = 50;   // replace with natural pixel height
const EXPECTED_SHA256 = "PASTE_EXPECTED_SHA256_HEX";

// AFTER
const DATA_URI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA...";
const W = 300;  // your logo's actual width
const H = 80;   // your logo's actual height  
const EXPECTED_SHA256 = "a1b2c3d4e5f6...890";
```

## Quick Script Alternative

```bash
# Use the provided script for one-command setup
./scripts/quick-logo.sh "Fisher Backflows Logo.PNG"

# Output:
# ✅ Ready! Copy these values into Logo.tsx:
# 
# const DATA_URI = "data:image/png;base64,iVBORw0KGgo...";
# const EXPECTED_SHA256 = "a1b2c3d4e5f6...890";
```

## Result

Your logo will appear:
- **Homepage header** with glassmorphic navigation
- **Portal login page** for professional branding  
- **Footer** for company identification
- **Responsive scaling** on all devices
- **Integrity protection** with SHA-256 validation

🔐 **Security**: Console warnings if logo is tampered with
🎨 **Design**: Perfect glassmorphic integration
📱 **Mobile**: Responsive across all screen sizes