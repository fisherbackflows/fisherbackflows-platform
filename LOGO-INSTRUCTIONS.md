# 🎨 Adding Your Logo to Fisher Backflows Website

## 📍 Current Status
- Logo component with **integrity validation** at `src/components/ui/Logo.tsx`
- **SHA-256 hash verification** prevents logo tampering
- Integrated throughout the site with glassmorphic styling
- **Logo hash generator tool** available for easy setup

## 🔧 Quick Setup Options

### Option 1: Command Line (Fastest)
```bash
# Quick one-liner approach
./scripts/quick-logo.sh "Fisher Backflows Logo.PNG"

# Or use your exact commands
base64 -w 0 "Fisher Backflows Logo.PNG" > logo.b64
shasum -a 256 "Fisher Backflows Logo.PNG"
```

### Option 2: Automated Script
```bash
# Complete processing with auto-dimensions
./scripts/setup-logo.sh "Fisher Backflows Logo.PNG"
```

### Option 3: Logo Hash Generator Tool
1. **Open the generator**: `scripts/generate-logo-hash.html` in your browser
2. **Upload your logo**: Click "Select Your Logo File" and choose your image
3. **Copy the generated code**: The tool provides everything you need
4. **Paste into Logo.tsx**: Replace the placeholder values

## 🔧 Manual Setup

### Step 1: Convert Your Logo to Base64
1. **Prepare your logo**: Save as PNG (recommended) or JPG
2. **Optimize**: Ensure it's web-optimized (under 100KB if possible)
3. **Convert to Base64**: Use one of these methods:
   - Online tool: https://base64.guru/converter/encode/image
   - Command line: `base64 -i your-logo.png`
   - Or use any base64 image encoder

### Step 2: Generate SHA-256 Hash
Use this JavaScript code in browser console:
```javascript
// Paste your base64 string here
const dataUri = "data:image/png;base64,YOUR_BASE64_HERE";
const b64 = dataUri.split(",")[1];
const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
crypto.subtle.digest("SHA-256", raw).then(hash => {
  const hex = Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("");
  console.log("SHA-256 Hash:", hex);
});
```

### Step 3: Get Logo Dimensions
Check your logo's actual pixel dimensions:
- **Windows**: Right-click → Properties → Details
- **Mac**: Get Info → More Info
- **Online**: Upload to any image editor to see dimensions

### Step 4: Update Logo Component
Open `src/components/ui/Logo.tsx` and replace these values:

```typescript
const DATA_URI = "data:image/png;base64,YOUR_BASE64_HERE";
const W = 300;  // Your logo's actual width in pixels
const H = 80;   // Your logo's actual height in pixels
const EXPECTED_SHA256 = "your_sha256_hash_here";
```

## 🛡️ Security Features

### Logo Integrity Validation
- **Automatic verification**: Logo is validated on every page load
- **Tamper detection**: Console warnings if logo has been altered
- **Production ready**: Only validates when real logo is configured
- **Performance optimized**: Hash check runs once per component mount

### How It Works
```javascript
// This runs automatically when logo loads
assertLogoIntegrity(DATA_URI, EXPECTED_SHA256);
// Warns in console if hash doesn't match
```

## 🎯 Logo Locations

The logo appears in these locations with flexible sizing:
- **Homepage header**: Main navigation branding
- **Portal login**: Professional header
- **Footer**: Company identification
- **All responsive**: Scales perfectly on mobile

## ✨ Features
- 🔒 **Integrity validation** with SHA-256 hashing
- 📐 **Natural dimensions** preserved with responsive scaling
- ⚡ **Performance optimized** with proper loading attributes
- 🎨 **Glassmorphic integration** matches site aesthetic
- 🔄 **Beautiful fallback** animated water droplet placeholder
- 📱 **Mobile ready** responsive across all devices

## 🔄 Testing Your Logo

After adding your logo:
1. **Check integration**: Visit http://localhost:3000 and http://localhost:3000/portal
2. **Verify console**: Open DevTools - no integrity warnings should appear
3. **Test responsiveness**: Resize browser window to check scaling
4. **Mobile check**: Test on mobile devices or browser mobile view

## 💡 Pro Tips
- **PNG with transparency** works best on dark backgrounds
- **High resolution logos** (2x size) look crisp on retina displays
- **Keep under 100KB** for fast loading
- **Test hash validation** by temporarily changing one character in base64

## 🚨 Complete Checklist
- [ ] Use logo hash generator tool OR convert manually
- [ ] Get logo dimensions (width × height)
- [ ] Update `DATA_URI` in Logo.tsx
- [ ] Update `W` and `H` values in Logo.tsx  
- [ ] Update `EXPECTED_SHA256` in Logo.tsx
- [ ] Test homepage and portal pages
- [ ] Verify no console warnings
- [ ] Check mobile responsiveness

## 🛠️ Troubleshooting

**Console Warning: "Logo hash mismatch"**
- Double-check your SHA-256 hash matches the base64 data
- Regenerate hash if you modified the logo

**Logo not displaying**
- Verify base64 string starts with `data:image/png;base64,`
- Check file size isn't too large (>1MB can cause issues)
- Ensure no line breaks in base64 string

**Logo too big/small**
- Adjust `W` and `H` values to natural pixel dimensions
- Component will scale appropriately for different locations

Your logo is now secure, validated, and ready to brand your world-class Fisher Backflows website! 🚀