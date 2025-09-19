#!/usr/bin/env node

// PWA Icon Generator for Fisher Backflows
// Generates all required PWA icons from the base logo

const fs = require('fs');
const path = require('path');

const ICON_SIZES = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
];

const SHORTCUT_ICONS = [
  { name: 'customer-portal-96.png', size: 96 },
  { name: 'schedule-96.png', size: 96 },
  { name: 'payment-96.png', size: 96 },
  { name: 'business-96.png', size: 96 }
];

const NOTIFICATION_ICONS = [
  { name: 'badge-72.png', size: 72 },
  { name: 'view.png', size: 48 },
  { name: 'close.png', size: 48 },
  { name: 'sync.png', size: 48 }
];

console.log('🎨 PWA ICON GENERATION GUIDE');
console.log('============================');
console.log('');
console.log('Since ImageMagick is not available, you need to:');
console.log('');
console.log('1. 📁 Source Image:');
console.log('   → Use: public/fisher-backflows-logo.png');
console.log('   → Size: 512x512 minimum recommended');
console.log('');
console.log('2. 🔧 Online Icon Generator (Recommended):');
console.log('   → Visit: https://realfavicongenerator.net/');
console.log('   → Upload the logo');
console.log('   → Download PWA icon pack');
console.log('   → Extract to public/icons/');
console.log('');
console.log('3. 📐 Required Icon Sizes:');
ICON_SIZES.forEach(icon => {
  console.log(`   → ${icon.name} (${icon.size}x${icon.size})`);
});
console.log('');
console.log('4. 🎯 Shortcut Icons Needed:');
SHORTCUT_ICONS.forEach(icon => {
  console.log(`   → ${icon.name} (${icon.size}x${icon.size})`);
});
console.log('');
console.log('5. 🔔 Notification Icons:');
NOTIFICATION_ICONS.forEach(icon => {
  console.log(`   → ${icon.name} (${icon.size}x${icon.size})`);
});
console.log('');
console.log('6. 📱 Alternative Method - Manual Creation:');
console.log('   → Use GIMP, Photoshop, or online tools');
console.log('   → Create square versions at each required size');
console.log('   → Save as PNG with transparency');
console.log('   → Place in public/icons/ directory');
console.log('');
console.log('7. 🚀 Placeholder Creation:');
console.log('   → Run this script with --create-placeholders');
console.log('   → Will create basic placeholder icons');
console.log('');

// Create placeholder icons if requested
if (process.argv.includes('--create-placeholders')) {
  console.log('🔧 Creating placeholder icons...');
  
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');
  
  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  
  // Create SVG placeholder for each icon
  const createPlaceholderSVG = (size, filename, color = '#0ea5e9') => {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="${color}"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.25}" fill="white" fill-opacity="0.9"/>
  <text x="${size/2}" y="${size/2 + 4}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${size * 0.15}" font-weight="bold">FB</text>
</svg>`;
    
    const filepath = path.join(iconsDir, filename.replace('.png', '.svg'));
    fs.writeFileSync(filepath, svg);
    console.log(`   ✅ Created: ${filename.replace('.png', '.svg')}`);
  };
  
  // Generate main app icons
  ICON_SIZES.forEach(({ size, name }) => {
    createPlaceholderSVG(size, name);
  });
  
  // Generate shortcut icons with different colors
  createPlaceholderSVG(96, 'customer-portal-96.svg', '#10b981');
  createPlaceholderSVG(96, 'schedule-96.svg', '#f59e0b');  
  createPlaceholderSVG(96, 'payment-96.svg', '#ef4444');
  createPlaceholderSVG(96, 'business-96.svg', '#8b5cf6');
  
  // Generate notification icons
  createPlaceholderSVG(72, 'badge-72.svg', '#6366f1');
  createPlaceholderSVG(48, 'view.svg', '#059669');
  createPlaceholderSVG(48, 'close.svg', '#dc2626');
  createPlaceholderSVG(48, 'sync.svg', '#0891b2');
  
  console.log('');
  console.log('✅ Placeholder icons created as SVG files!');
  console.log('🎨 Consider replacing with proper PNG icons for best results.');
}

console.log('📋 NEXT STEPS:');
console.log('1. Create the required icon files');
console.log('2. Run: node scripts/activate-pwa.js');
console.log('3. Test PWA installation on mobile device');
console.log('');