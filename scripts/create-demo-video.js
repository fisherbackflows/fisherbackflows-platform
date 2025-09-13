#!/usr/bin/env node

const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, '../demo-screenshots');
const OUTPUT_DIR = path.join(__dirname, '../demo-video');

// Demo data
const DEMO_TESTER = {
  email: 'demo.tester@example.com',
  password: 'DemoPass123!',
  firstName: 'John',
  lastName: 'Smith',
  company: 'ABC Testing Services',
  phone: '(555) 123-4567',
  certNumber: 'CERT-12345'
};

const DEMO_COMPANY = {
  email: 'demo.company@example.com',
  password: 'CompanyPass123!',
  companyName: 'Pacific Property Management',
  contactName: 'Sarah Johnson',
  phone: '(555) 987-6543',
  address: '123 Main St, Seattle, WA 98101'
};

const DEMO_TEST = {
  deviceLocation: 'Building A - Main Water Supply',
  deviceType: 'RP (Reduced Pressure)',
  manufacturer: 'Watts',
  model: '909',
  serialNumber: 'SN-2024-001',
  size: '2"',
  
  // Test readings
  initialLine: '80',
  check1Initial: '85',
  check1Final: '85',
  check2Initial: '83',
  check2Final: '83',
  reliefOpened: '65',
  reliefClosed: '70',
  bufferZone: '5'
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    console.log(`Directory ${dir} already exists or cannot be created`);
  }
}

async function captureScreenshot(page, name, stepNumber) {
  const filename = `${String(stepNumber).padStart(3, '0')}-${name}.png`;
  const filepath = path.join(SCREENSHOTS_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`📸 Captured: ${filename}`);
  return filepath;
}

async function smoothScroll(page, target) {
  await page.evaluate((selector) => {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, target);
  await delay(1000);
}

async function typeWithDelay(page, selector, text, delayMs = 50) {
  await page.click(selector);
  await page.type(selector, text, { delay: delayMs });
}

async function createDemoVideo() {
  console.log('🎬 Starting Fisher Backflows Demo Video Creation...\n');
  
  // Setup directories
  await ensureDir(SCREENSHOTS_DIR);
  await ensureDir(OUTPUT_DIR);
  
  // Clear old screenshots
  try {
    const files = await fs.readdir(SCREENSHOTS_DIR);
    for (const file of files) {
      if (file.endsWith('.png')) {
        await fs.unlink(path.join(SCREENSHOTS_DIR, file));
      }
    }
  } catch (err) {
    console.log('No old screenshots to clean');
  }
  
  // Launch browser
  console.log('🌐 Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ],
    defaultViewport: {
      width: 390,  // iPhone 14 Pro width
      height: 844, // iPhone 14 Pro height
      deviceScaleFactor: 2
    }
  });
  
  const page = await browser.newPage();
  
  // Set mobile user agent
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1');
  
  let stepNumber = 1;
  
  try {
    // === PART 1: LANDING PAGE ===
    console.log('\n📍 Part 1: Landing Page');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await delay(2000);
    await captureScreenshot(page, 'landing-page', stepNumber++);
    
    // Scroll through landing page sections
    await smoothScroll(page, '#features');
    await captureScreenshot(page, 'features-section', stepNumber++);
    
    await smoothScroll(page, '#how-it-works');
    await captureScreenshot(page, 'how-it-works', stepNumber++);
    
    // === PART 2: TESTER SIGNUP ===
    console.log('\n📍 Part 2: Tester Signup');
    await page.click('a[href="/auth/sign-up"]');
    await page.waitForSelector('button:has-text("Tester")', { timeout: 5000 });
    await delay(1500);
    await captureScreenshot(page, 'signup-choice', stepNumber++);
    
    // Select Tester
    await page.click('button:has-text("Tester")');
    await delay(1000);
    await captureScreenshot(page, 'tester-signup-form', stepNumber++);
    
    // Fill tester signup form
    await typeWithDelay(page, 'input[name="email"]', DEMO_TESTER.email);
    await typeWithDelay(page, 'input[name="password"]', DEMO_TESTER.password);
    await typeWithDelay(page, 'input[name="firstName"]', DEMO_TESTER.firstName);
    await typeWithDelay(page, 'input[name="lastName"]', DEMO_TESTER.lastName);
    await typeWithDelay(page, 'input[name="company"]', DEMO_TESTER.company);
    await typeWithDelay(page, 'input[name="phone"]', DEMO_TESTER.phone);
    await typeWithDelay(page, 'input[name="certificationNumber"]', DEMO_TESTER.certNumber);
    
    await delay(500);
    await captureScreenshot(page, 'tester-form-filled', stepNumber++);
    
    // === PART 3: TESTER DASHBOARD ===
    console.log('\n📍 Part 3: Tester Dashboard');
    // Simulate successful signup/login
    await page.goto(`${BASE_URL}/dashboard/tester`, { waitUntil: 'networkidle2' });
    await delay(2000);
    await captureScreenshot(page, 'tester-dashboard', stepNumber++);
    
    // Navigate to start new test
    await page.click('button:has-text("Start New Test")');
    await delay(1500);
    await captureScreenshot(page, 'new-test-form', stepNumber++);
    
    // Fill test form
    console.log('📝 Filling test form...');
    await typeWithDelay(page, 'input[name="deviceLocation"]', DEMO_TEST.deviceLocation);
    await page.select('select[name="deviceType"]', DEMO_TEST.deviceType);
    await typeWithDelay(page, 'input[name="manufacturer"]', DEMO_TEST.manufacturer);
    await typeWithDelay(page, 'input[name="model"]', DEMO_TEST.model);
    await typeWithDelay(page, 'input[name="serialNumber"]', DEMO_TEST.serialNumber);
    await typeWithDelay(page, 'input[name="size"]', DEMO_TEST.size);
    
    await captureScreenshot(page, 'test-details-filled', stepNumber++);
    
    // Scroll to test readings
    await smoothScroll(page, '#test-readings');
    await typeWithDelay(page, 'input[name="initialLine"]', DEMO_TEST.initialLine);
    await typeWithDelay(page, 'input[name="check1Initial"]', DEMO_TEST.check1Initial);
    await typeWithDelay(page, 'input[name="check1Final"]', DEMO_TEST.check1Final);
    await typeWithDelay(page, 'input[name="check2Initial"]', DEMO_TEST.check2Initial);
    await typeWithDelay(page, 'input[name="check2Final"]', DEMO_TEST.check2Final);
    
    await captureScreenshot(page, 'test-readings-filled', stepNumber++);
    
    // Submit test
    await page.click('button:has-text("Submit Test")');
    await delay(2000);
    await captureScreenshot(page, 'test-submitted', stepNumber++);
    
    // View reports
    await page.goto(`${BASE_URL}/dashboard/tester/reports`, { waitUntil: 'networkidle2' });
    await delay(1500);
    await captureScreenshot(page, 'tester-reports', stepNumber++);
    
    // === PART 4: COMPANY SIGNUP ===
    console.log('\n📍 Part 4: Company Signup');
    await page.goto(`${BASE_URL}/auth/sign-up`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('button:has-text("Property Management")', { timeout: 5000 });
    await delay(1000);
    
    // Select Company
    await page.click('button:has-text("Property Management")');
    await delay(1000);
    await captureScreenshot(page, 'company-signup-form', stepNumber++);
    
    // Fill company signup form
    await typeWithDelay(page, 'input[name="email"]', DEMO_COMPANY.email);
    await typeWithDelay(page, 'input[name="password"]', DEMO_COMPANY.password);
    await typeWithDelay(page, 'input[name="companyName"]', DEMO_COMPANY.companyName);
    await typeWithDelay(page, 'input[name="contactName"]', DEMO_COMPANY.contactName);
    await typeWithDelay(page, 'input[name="phone"]', DEMO_COMPANY.phone);
    await typeWithDelay(page, 'input[name="address"]', DEMO_COMPANY.address);
    
    await delay(500);
    await captureScreenshot(page, 'company-form-filled', stepNumber++);
    
    // === PART 5: COMPANY DASHBOARD ===
    console.log('\n📍 Part 5: Company Dashboard');
    await page.goto(`${BASE_URL}/dashboard/company`, { waitUntil: 'networkidle2' });
    await delay(2000);
    await captureScreenshot(page, 'company-dashboard', stepNumber++);
    
    // Navigate through company features
    await page.goto(`${BASE_URL}/dashboard/company/properties`, { waitUntil: 'networkidle2' });
    await delay(1500);
    await captureScreenshot(page, 'company-properties', stepNumber++);
    
    await page.goto(`${BASE_URL}/dashboard/company/devices`, { waitUntil: 'networkidle2' });
    await delay(1500);
    await captureScreenshot(page, 'company-devices', stepNumber++);
    
    await page.goto(`${BASE_URL}/dashboard/company/reports`, { waitUntil: 'networkidle2' });
    await delay(1500);
    await captureScreenshot(page, 'company-reports', stepNumber++);
    
    // === PART 6: REPORT SUBMISSION ===
    console.log('\n📍 Part 6: Report Submission');
    await page.click('button:has-text("View Report")');
    await delay(2000);
    await captureScreenshot(page, 'report-details', stepNumber++);
    
    // Download/Submit report
    await page.click('button:has-text("Download PDF")');
    await delay(1500);
    await captureScreenshot(page, 'report-download', stepNumber++);
    
    console.log('\n✅ All screenshots captured successfully!');
    
  } catch (error) {
    console.error('❌ Error during screenshot capture:', error);
  } finally {
    await browser.close();
  }
  
  // Create video from screenshots
  console.log('\n🎥 Creating video from screenshots...');
  
  const videoPath = path.join(OUTPUT_DIR, 'fisher-backflows-demo.mp4');
  
  // Use ffmpeg to create video from screenshots
  const ffmpegCommand = `ffmpeg -y -framerate 1 -pattern_type glob -i '${SCREENSHOTS_DIR}/*.png' \
    -c:v libx264 -pix_fmt yuv420p -crf 23 \
    -vf "scale=390:844:force_original_aspect_ratio=decrease,pad=390:844:(ow-iw)/2:(oh-ih)/2,setsar=1" \
    -preset slow -movflags +faststart \
    ${videoPath}`;
  
  try {
    await execAsync(ffmpegCommand);
    console.log(`\n✅ Video created successfully: ${videoPath}`);
    
    // Get video info
    const stats = await fs.stat(videoPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 Video size: ${fileSizeMB} MB`);
    
    // Create a simple HTML player for testing
    const htmlPlayer = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fisher Backflows Demo Video</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      background: #0f172a;
      color: white;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }
    h1 {
      margin-bottom: 20px;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    video {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    }
    .controls {
      margin-top: 20px;
      display: flex;
      gap: 10px;
    }
    button {
      padding: 10px 20px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
    }
    button:hover {
      background: #2563eb;
    }
  </style>
</head>
<body>
  <h1>Fisher Backflows Demo</h1>
  <video id="demo-video" controls autoplay muted>
    <source src="fisher-backflows-demo.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>
  <div class="controls">
    <button onclick="document.getElementById('demo-video').playbackRate = 0.5">0.5x Speed</button>
    <button onclick="document.getElementById('demo-video').playbackRate = 1">1x Speed</button>
    <button onclick="document.getElementById('demo-video').playbackRate = 2">2x Speed</button>
  </div>
</body>
</html>`;
    
    await fs.writeFile(path.join(OUTPUT_DIR, 'demo-player.html'), htmlPlayer);
    console.log('📱 HTML player created: demo-video/demo-player.html');
    
  } catch (error) {
    console.error('❌ Error creating video:', error);
    console.log('\n📸 Screenshots are available in:', SCREENSHOTS_DIR);
    
    // Alternative: Create animated GIF
    console.log('\n🎬 Attempting to create animated GIF instead...');
    const gifPath = path.join(OUTPUT_DIR, 'fisher-backflows-demo.gif');
    const gifCommand = `convert -delay 150 -loop 0 ${SCREENSHOTS_DIR}/*.png -resize 390x844 ${gifPath}`;
    
    try {
      await execAsync(gifCommand);
      console.log(`✅ GIF created: ${gifPath}`);
    } catch (gifError) {
      console.log('❌ Could not create GIF. Screenshots available for manual review.');
    }
  }
}

// Run the demo video creation
createDemoVideo().catch(console.error);