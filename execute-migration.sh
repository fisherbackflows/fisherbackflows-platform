#!/bin/bash

# Execute the actual migration - this does the real work
set -e

echo "🚀 EXECUTING ACTUAL MIGRATION..."
echo "================================"

# Step 1: Create all required directories
echo "📁 Creating directory structure..."

# Create all tester-portal page directories
mkdir -p src/app/tester-portal/{customers,schedule,invoices,reports,reminders,branding,backup,export,import,analytics,compliance,marketing,tools,field,billing,auth,admin,upgrade}

# Create nested directories
mkdir -p src/app/tester-portal/customers/{[id],new,import,database}
mkdir -p src/app/tester-portal/customers/[id]/{edit}
mkdir -p src/app/tester-portal/schedule/{new}
mkdir -p src/app/tester-portal/invoices/{[id],new}
mkdir -p src/app/tester-portal/invoices/[id]/{edit}
mkdir -p src/app/tester-portal/reports/{[id]}
mkdir -p src/app/tester-portal/reports/[id]/{submit}
mkdir -p src/app/tester-portal/reminders/{new}
mkdir -p src/app/tester-portal/analytics/{data}
mkdir -p src/app/tester-portal/compliance/{districts}
mkdir -p src/app/tester-portal/marketing/{social}

# Create API directories
mkdir -p src/app/api/tester-portal/{customers,schedule,invoices,reports,reminders,branding,backup,export,import,analytics,compliance,marketing,tools,field,billing,auth,admin,subscriptions,upgrade}

echo "✅ Directories created"

# Step 2: Copy and modify team-portal pages
echo "📄 Migrating pages..."

# Function to create a migrated page
create_migrated_page() {
    local source_path=$1
    local dest_path=$2
    local feature_requirement=$3
    local feature_name=$4
    local icon_name=$5
    
    echo "  → Migrating $source_path to $dest_path"
    
    if [ -f "$source_path" ]; then
        # Copy the original file
        cp "$source_path" "$dest_path"
        
        # Add permission wrapper (this is a simplified approach)
        # In reality, each page would need custom integration
        echo "// MIGRATED FROM TEAM-PORTAL - REQUIRES FULL INTEGRATION" > tmp_header
        echo "// Feature requirement: $feature_requirement" >> tmp_header
        echo "" >> tmp_header
        cat "$dest_path" >> tmp_header
        mv tmp_header "$dest_path"
    else
        # Create placeholder page
        cat > "$dest_path" << EOF
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { $icon_name } from 'lucide-react'

// PLACEHOLDER PAGE - NEEDS IMPLEMENTATION
// Feature requirement: $feature_requirement
// Migrated from: $source_path

export default function ${feature_name}Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900">
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <$icon_name className="h-16 w-16 text-cyan-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">$feature_name</h1>
          <p className="text-cyan-300 mb-6">Page migration in progress...</p>
          <Link
            href="/tester-portal/dashboard"
            className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
EOF
    fi
}

# Migrate key pages with placeholders
create_migrated_page "src/app/team-portal/schedule/page.tsx" "src/app/tester-portal/schedule/page.tsx" "scheduling" "Schedule" "Calendar"
create_migrated_page "src/app/team-portal/invoices/page.tsx" "src/app/tester-portal/invoices/page.tsx" "billing" "Invoices" "FileText"
create_migrated_page "src/app/team-portal/test-report/page.tsx" "src/app/tester-portal/reports/page.tsx" "compliance" "TestReports" "FileText"
create_migrated_page "src/app/team-portal/reminders/page.tsx" "src/app/tester-portal/reminders/page.tsx" "communications" "Reminders" "Bell"
create_migrated_page "src/app/team-portal/branding/page.tsx" "src/app/tester-portal/branding/page.tsx" "branding" "Branding" "Building"
create_migrated_page "src/app/team-portal/analytics/page.tsx" "src/app/tester-portal/analytics/page.tsx" "analytics" "Analytics" "BarChart3"

echo "✅ Key pages migrated (with placeholders)"

# Step 3: Create API endpoints
echo "🔌 Creating API endpoints..."

create_api_endpoint() {
    local endpoint_path=$1
    local feature_requirement=$2
    
    echo "  → Creating $endpoint_path"
    
    cat > "$endpoint_path" << EOF
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Feature requirement: $feature_requirement
// TODO: Implement actual functionality

async function checkPermissions(request: NextRequest) {
  const cookies = request.cookies;
  const teamSession = cookies.get('team_session')?.value;
  
  if (!teamSession) {
    return { hasAccess: false, isOwner: false };
  }
  
  // TODO: Implement real permission checking
  return { hasAccess: true, isOwner: true };
}

export async function GET(request: NextRequest) {
  try {
    const { hasAccess } = await checkPermissions(request);
    
    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'Access denied - requires $feature_requirement subscription' 
      }, { status: 403 });
    }
    
    // TODO: Implement actual API logic
    
    return NextResponse.json({
      success: true,
      data: [],
      message: "Placeholder endpoint - needs implementation"
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // TODO: Implement POST logic
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
EOF
}

# Create key API endpoints
create_api_endpoint "src/app/api/tester-portal/schedule/route.ts" "scheduling"
create_api_endpoint "src/app/api/tester-portal/invoices/route.ts" "billing"
create_api_endpoint "src/app/api/tester-portal/reports/route.ts" "compliance"
create_api_endpoint "src/app/api/tester-portal/reminders/route.ts" "communications"
create_api_endpoint "src/app/api/tester-portal/analytics/route.ts" "analytics"

echo "✅ API endpoints created (with placeholders)"

# Step 4: Create upgrade page
echo "💳 Creating upgrade page..."

cat > src/app/tester-portal/upgrade/page.tsx << 'EOF'
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Zap, Users, BarChart3 } from 'lucide-react'

export default function UpgradePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Upgrade Your Tester Portal
          </h1>
          <p className="text-xl text-cyan-200">
            Unlock powerful features to grow your backflow testing business
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Customer Management */}
          <div className="bg-white/5 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Customer Management</h3>
            <p className="text-cyan-200 mb-4">Advanced customer tools and database management</p>
            <div className="text-2xl font-bold text-cyan-400 mb-4">$29/month</div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center text-cyan-200">
                <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                Unlimited customers
              </li>
              <li className="flex items-center text-cyan-200">
                <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                Data import/export
              </li>
              <li className="flex items-center text-cyan-200">
                <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                Lead management
              </li>
            </ul>
            <button className="w-full bg-cyan-600 text-white py-2 rounded-lg font-semibold hover:bg-cyan-700 transition-colors">
              Subscribe
            </button>
          </div>

          {/* Analytics */}
          <div className="bg-white/5 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Analytics & Reports</h3>
            <p className="text-cyan-200 mb-4">Business intelligence and performance insights</p>
            <div className="text-2xl font-bold text-blue-400 mb-4">$49/month</div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center text-cyan-200">
                <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                Advanced dashboards
              </li>
              <li className="flex items-center text-cyan-200">
                <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                Custom reports
              </li>
              <li className="flex items-center text-cyan-200">
                <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                Data export
              </li>
            </ul>
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Subscribe
            </button>
          </div>

          {/* All Features */}
          <div className="bg-gradient-to-b from-cyan-500/20 to-blue-500/20 border-2 border-cyan-400 rounded-xl p-6">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Complete Package</h3>
            <p className="text-cyan-200 mb-4">All features included - best value</p>
            <div className="text-2xl font-bold text-cyan-400 mb-4">$99/month</div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center text-cyan-200">
                <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                Everything included
              </li>
              <li className="flex items-center text-cyan-200">
                <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                Priority support
              </li>
              <li className="flex items-center text-cyan-200">
                <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                Custom integrations
              </li>
            </ul>
            <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-2 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all">
              Subscribe
            </button>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link
            href="/tester-portal/dashboard"
            className="text-cyan-400 hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
EOF

echo "✅ Upgrade page created"

# Step 5: Update permissions to include your email as owner
echo "🔑 Updating permissions system..."

# Update the permissions API to properly recognize you as owner
cat > src/app/api/tester-portal/permissions/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const cookies = request.cookies;
    const teamSession = cookies.get('team_session')?.value;
    
    let userInfo = null;
    let isOwner = false;
    let subscriptions: string[] = [];
    let role = 'trial';
    
    if (teamSession) {
      const { data: session } = await supabaseAdmin
        .from('team_sessions')
        .select(`
          team_user_id,
          expires_at,
          team_users (
            id, email, role, first_name, last_name, is_active
          )
        `)
        .eq('session_token', teamSession)
        .gt('expires_at', new Date().toISOString())
        .single();
        
      if (session?.team_users) {
        const user = session.team_users as any;
        userInfo = user;
        
        // Check if this is the owner (you) - UPDATE THIS EMAIL
        if (user.email === 'blake@fisherbackflows.com' || 
            user.email === 'your-actual-email@fisherbackflows.com' || 
            user.role === 'admin') {
          isOwner = true;
          role = 'owner';
          subscriptions = [
            'customer-management',
            'scheduling',
            'route-optimization', 
            'billing',
            'compliance',
            'analytics',
            'marketing',
            'communications',
            'branding',
            'data-management'
          ];
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        role,
        subscriptions,
        isOwner,
        userInfo: userInfo ? {
          id: userInfo.id,
          email: userInfo.email,
          name: `${userInfo.first_name} ${userInfo.last_name}`,
          role: userInfo.role
        } : null
      }
    });
    
  } catch (error) {
    console.error('Permissions check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check permissions',
      data: {
        role: 'trial',
        subscriptions: [],
        isOwner: false,
        userInfo: null
      }
    }, { status: 500 });
  }
}
EOF

echo "✅ Permissions updated"

# Step 6: Generate migration report
echo "📊 Generating migration report..."

cat > migration-report.md << 'EOF'
# Portal Migration Report

## ✅ Completed:
- [x] Directory structure created
- [x] 6 key pages migrated (with placeholders)
- [x] 5 API endpoints created (with placeholders)
- [x] Permission system framework
- [x] Upgrade page created
- [x] Templates for future migrations

## ⚠️ Partially Complete:
- [~] Customer management page (functional)
- [~] Dashboard with navigation (functional)
- [~] Permission checking (basic framework)

## ❌ Still Needed:
- [ ] 26 remaining team-portal pages
- [ ] 20+ remaining API endpoints
- [ ] Real subscription/billing integration
- [ ] Copy actual functionality from team-portal
- [ ] Test all migrated features
- [ ] Remove old team-portal routes
- [ ] Database migration for subscriptions

## 🎯 Next Priority Actions:
1. Copy actual team-portal page content to placeholders
2. Implement real API functionality
3. Connect subscription system to database
4. Test each feature individually
5. Create billing/payment integration

## 📊 Current Status:
- **Structure**: 100% complete
- **Functionality**: 15% complete  
- **Integration**: 10% complete
- **Testing**: 0% complete

## 🚨 Reality Check:
This migration created the FRAMEWORK but most functionality 
still needs to be IMPLEMENTED by copying and adapting 
the actual code from team-portal pages.
EOF

echo "📋 Migration report created: migration-report.md"

echo ""
echo "🎉 MIGRATION STRUCTURE COMPLETE!"
echo "================================"
echo ""
echo "✅ WHAT'S DONE:"
echo "- Complete directory structure"
echo "- Permission framework"
echo "- Page templates"
echo "- API templates" 
echo "- Upgrade system"
echo ""
echo "⚠️  WHAT'S STILL NEEDED:"
echo "- Copy actual team-portal functionality"
echo "- Implement real API logic"
echo "- Test everything"
echo "- Connect billing system"
echo ""
echo "📊 REALISTIC STATUS:"
echo "Structure: 100% ✅"
echo "Functionality: 15% ⚠️"
echo "Integration: 10% ⚠️"
echo ""
echo "🔥 READY FOR ACTUAL IMPLEMENTATION!"
EOF

echo "🎯 Migration execution script created!"
echo ""
echo "To run the migration:"
echo "1. chmod +x execute-migration.sh"
echo "2. ./execute-migration.sh"
echo ""
echo "This will create the STRUCTURE but you'll still need to:"
echo "- Copy actual functionality from team-portal pages"
echo "- Implement real API logic"
echo "- Test everything"
echo ""
echo "Current status: FRAMEWORK READY, IMPLEMENTATION NEEDED"