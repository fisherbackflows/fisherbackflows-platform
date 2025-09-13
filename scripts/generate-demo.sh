#!/bin/bash

echo "🎬 Fisher Backflows Demo Video Generator"
echo "========================================"
echo ""

# Check for required tools
echo "📦 Checking requirements..."

# Install required packages if not present
if ! command -v ffmpeg &> /dev/null; then
    echo "Installing ffmpeg..."
    pkg install -y ffmpeg
fi

if ! command -v imagemagick &> /dev/null; then
    echo "Installing imagemagick..."
    pkg install -y imagemagick
fi

# Create directories
DEMO_DIR="demo-video"
SCREENS_DIR="$DEMO_DIR/screenshots"
mkdir -p "$SCREENS_DIR"

echo ""
echo "🎨 Creating demo screens..."

# Function to create a demo screen with text
create_screen() {
    local step_num=$1
    local title=$2
    local content=$3
    local filename="$SCREENS_DIR/$(printf "%03d" $step_num)-screen.png"
    
    convert -size 390x844 xc:'#0f172a' \
        -gravity north \
        -fill white -pointsize 24 -font DejaVu-Sans-Bold \
        -annotate +0+50 "Fisher Backflows" \
        -fill '#3b82f6' -pointsize 20 \
        -annotate +0+100 "$title" \
        -gravity center \
        -fill white -pointsize 16 -font DejaVu-Sans \
        -annotate +0+0 "$content" \
        -gravity south \
        -fill '#64748b' -pointsize 12 \
        -annotate +0+30 "Step $step_num" \
        "$filename"
    
    echo "  ✓ Created: Step $step_num - $title"
}

# Create demo screens for the workflow
create_screen 1 "Welcome Screen" \
"Professional Backflow Testing
Management Platform

Streamline your testing workflow
from signup to report submission"

create_screen 2 "Choose Account Type" \
"Select your role:

🔧 Certified Tester
Professional backflow testers

🏢 Property Management
Companies managing properties"

create_screen 3 "Tester Registration" \
"Create Your Tester Account

✓ Email: john.smith@testing.com
✓ Password: ••••••••
✓ First Name: John
✓ Last Name: Smith
✓ Company: ABC Testing Services
✓ Phone: (555) 123-4567
✓ Cert #: CERT-12345"

create_screen 4 "Tester Dashboard" \
"Welcome, John Smith!

📊 Active Tests: 5
✅ Completed Today: 3
📅 Scheduled: 2

[Start New Test]"

create_screen 5 "New Test Form" \
"Device Information

📍 Location: Building A - Main Supply
🔧 Type: RP (Reduced Pressure)
🏭 Manufacturer: Watts
📝 Model: 909
🔢 Serial: SN-2024-001
📏 Size: 2 inch"

create_screen 6 "Test Readings" \
"Enter Test Results

Initial Line Pressure: 80 PSI
Check Valve #1: ✅ Holding at 85 PSI
Check Valve #2: ✅ Holding at 83 PSI
Relief Valve: Opens at 65 PSI
Buffer Zone: 5 PSI

Test Result: PASS ✅"

create_screen 7 "Test Confirmation" \
"Test Submitted Successfully!

Test ID: #2024-001
Status: Passed
Date: $(date +%Y-%m-%d)
Time: $(date +%H:%M)

📧 Report sent to property manager
📄 PDF available for download"

create_screen 8 "Company Registration" \
"Property Management Signup

✓ Company: Pacific Property Mgmt
✓ Contact: Sarah Johnson
✓ Email: sarah@pacificpm.com
✓ Phone: (555) 987-6543
✓ Address: 123 Main St
           Seattle, WA 98101"

create_screen 9 "Company Dashboard" \
"Pacific Property Management

📊 Overview
Properties: 15
Devices: 47
Tests Due: 8
Compliance: 94%

⚠️ 3 devices need testing
📅 Next deadline: 7 days"

create_screen 10 "Property List" \
"Your Properties

🏢 Sunset Apartments
   12 devices | 2 due

🏢 Harbor View Complex
   8 devices | All current

🏢 Downtown Plaza
   15 devices | 1 overdue

[+ Add Property]"

create_screen 11 "Device Management" \
"Backflow Devices

Building A - Main Supply
• Watts 909 RP | Due: 30 days
• Test History: View

Building B - Fire System
• Ames 2000SS | Current ✅
• Last Test: 2024-01-15

[Schedule Test]"

create_screen 12 "Reports Dashboard" \
"Test Reports

Recent Reports:
📄 2024-001 - Building A - PASS
📄 2024-002 - Building B - PASS
📄 2024-003 - Building C - FAIL

[Filter] [Export] [Download All]"

create_screen 13 "Report Details" \
"Test Report #2024-001

Property: Sunset Apartments
Device: Watts 909 RP
Tester: John Smith
Date: $(date +%Y-%m-%d)
Result: PASS ✅

[Download PDF] [Email] [Print]"

create_screen 14 "PDF Report" \
"Official Test Certificate

This certifies that the backflow
prevention device has been tested
and meets all requirements.

Digital Signature: John Smith
Cert #: CERT-12345
Valid Until: $(date -d '+1 year' +%Y-%m-%d)

[Submit to Water Dept]"

create_screen 15 "Submission Complete" \
"✅ Workflow Complete!

Report successfully submitted to:
• Property Manager
• Water Department
• Device Database

Thank you for using
Fisher Backflows!"

echo ""
echo "🎥 Creating video from screenshots..."

# Create MP4 video optimized for mobile
ffmpeg -y -framerate 0.5 -pattern_type glob -i "$SCREENS_DIR/*.png" \
    -c:v libx264 -pix_fmt yuv420p -crf 23 \
    -vf "fps=2,scale=390:844:flags=lanczos" \
    -preset medium -movflags +faststart \
    "$DEMO_DIR/fisher-backflows-demo.mp4" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Video created successfully!"
    echo ""
    echo "📱 Video Details:"
    echo "   Location: $DEMO_DIR/fisher-backflows-demo.mp4"
    echo "   Resolution: 390x844 (iPhone format)"
    echo "   Duration: ~30 seconds"
    echo "   Size: $(du -h $DEMO_DIR/fisher-backflows-demo.mp4 | cut -f1)"
else
    echo "⚠️  Video creation failed, trying GIF format..."
    
    # Create animated GIF as fallback
    convert -delay 200 -loop 0 "$SCREENS_DIR/*.png" \
        -resize 390x844 "$DEMO_DIR/fisher-backflows-demo.gif"
    
    if [ $? -eq 0 ]; then
        echo "✅ GIF created successfully!"
        echo "   Location: $DEMO_DIR/fisher-backflows-demo.gif"
    fi
fi

# Create HTML viewer
cat > "$DEMO_DIR/view-demo.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fisher Backflows Demo</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 400px;
            width: 100%;
            text-align: center;
        }
        h1 {
            font-size: 28px;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .subtitle {
            color: #94a3b8;
            margin-bottom: 30px;
            font-size: 14px;
        }
        video {
            width: 100%;
            border-radius: 20px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            background: #000;
        }
        .controls {
            margin-top: 20px;
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
        }
        button {
            padding: 10px 20px;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.5);
        }
        button:active {
            transform: translateY(0);
        }
        .info {
            margin-top: 30px;
            padding: 20px;
            background: rgba(30, 41, 59, 0.5);
            border-radius: 15px;
            border: 1px solid rgba(148, 163, 184, 0.1);
        }
        .info h3 {
            color: #3b82f6;
            margin-bottom: 10px;
            font-size: 16px;
        }
        .info p {
            color: #cbd5e1;
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 8px;
        }
        .workflow-step {
            text-align: left;
            margin: 5px 0;
            padding-left: 20px;
            position: relative;
        }
        .workflow-step:before {
            content: "→";
            position: absolute;
            left: 0;
            color: #3b82f6;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Fisher Backflows</h1>
        <p class="subtitle">Complete Workflow Demo</p>
        
        <video id="demo" controls autoplay muted loop playsinline>
            <source src="fisher-backflows-demo.mp4" type="video/mp4">
            <source src="fisher-backflows-demo.gif" type="image/gif">
            Your browser does not support the video tag.
        </video>
        
        <div class="controls">
            <button onclick="playVideo()">▶️ Play</button>
            <button onclick="pauseVideo()">⏸️ Pause</button>
            <button onclick="restartVideo()">🔄 Restart</button>
            <button onclick="changeSpeed()">⚡ Speed</button>
        </div>
        
        <div class="info">
            <h3>Workflow Overview</h3>
            <div class="workflow-step">Landing page introduction</div>
            <div class="workflow-step">Account type selection</div>
            <div class="workflow-step">Tester registration process</div>
            <div class="workflow-step">Tester dashboard navigation</div>
            <div class="workflow-step">New test creation</div>
            <div class="workflow-step">Test data entry</div>
            <div class="workflow-step">Test submission</div>
            <div class="workflow-step">Company registration</div>
            <div class="workflow-step">Company dashboard</div>
            <div class="workflow-step">Property management</div>
            <div class="workflow-step">Device tracking</div>
            <div class="workflow-step">Report viewing</div>
            <div class="workflow-step">PDF generation</div>
            <div class="workflow-step">Report submission</div>
        </div>
    </div>
    
    <script>
        const video = document.getElementById('demo');
        let currentSpeed = 1;
        
        function playVideo() {
            video.play();
        }
        
        function pauseVideo() {
            video.pause();
        }
        
        function restartVideo() {
            video.currentTime = 0;
            video.play();
        }
        
        function changeSpeed() {
            const speeds = [0.5, 1, 1.5, 2];
            currentSpeed = speeds[(speeds.indexOf(currentSpeed) + 1) % speeds.length];
            video.playbackRate = currentSpeed;
            alert(`Playback speed: ${currentSpeed}x`);
        }
    </script>
</body>
</html>
EOF

echo ""
echo "📱 To view on your phone:"
echo "   1. Open: $DEMO_DIR/view-demo.html"
echo "   2. Or transfer: $DEMO_DIR/fisher-backflows-demo.mp4"
echo ""
echo "✨ Demo generation complete!"