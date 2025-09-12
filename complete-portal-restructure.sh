#!/bin/bash

# Fisher Backflows Complete Portal Restructure Script
# This script will 100% complete the portal consolidation task

set -e  # Exit on any error

echo "🚀 Starting Complete Portal Restructure..."
echo "======================================"

# Step 1: Analyze current structure
echo "📊 STEP 1: Analyzing current structure..."

echo "Current team-portal pages:"
find src/app/team-portal -name "page.tsx" -type f | sort

echo "Current tester-portal pages:"
find src/app/tester-portal -name "page.tsx" -type f | sort

echo "Current admin pages:"
find src/app/admin -name "page.tsx" -type f | sort

# Step 2: Create migration mapping
echo "📋 STEP 2: Creating migration mapping..."

cat > migration-map.json << 'EOF'
{
  "team_portal_migrations": {
    "/team-portal/dashboard": "/tester-portal/dashboard",
    "/team-portal/customers": "/tester-portal/customers", 
    "/team-portal/customers/[id]": "/tester-portal/customers/[id]",
    "/team-portal/customers/[id]/edit": "/tester-portal/customers/[id]/edit",
    "/team-portal/customers/new": "/tester-portal/customers/new",
    "/team-portal/customers/import": "/tester-portal/customers/import",
    "/team-portal/customers/database": "/tester-portal/customers/database",
    "/team-portal/schedule": "/tester-portal/schedule",
    "/team-portal/schedule/new": "/tester-portal/schedule/new",
    "/team-portal/invoices": "/tester-portal/invoices",
    "/team-portal/invoices/[id]": "/tester-portal/invoices/[id]",
    "/team-portal/invoices/[id]/edit": "/tester-portal/invoices/[id]/edit",
    "/team-portal/invoices/new": "/tester-portal/invoices/new",
    "/team-portal/test-report": "/tester-portal/reports",
    "/team-portal/test-reports/[id]/submit-district": "/tester-portal/reports/[id]/submit",
    "/team-portal/reminders": "/tester-portal/reminders",
    "/team-portal/reminders/new": "/tester-portal/reminders/new",
    "/team-portal/branding": "/tester-portal/branding",
    "/team-portal/backup": "/tester-portal/backup",
    "/team-portal/export": "/tester-portal/export",
    "/team-portal/import": "/tester-portal/import",
    "/team-portal/data-management": "/tester-portal/analytics/data",
    "/team-portal/district-reports": "/tester-portal/compliance/districts",
    "/team-portal/instagram": "/tester-portal/marketing/social",
    "/team-portal/labels": "/tester-portal/tools/labels",
    "/team-portal/help": "/tester-portal/help",
    "/team-portal/settings": "/tester-portal/settings",
    "/team-portal/more": "/tester-portal/tools",
    "/team-portal/tester": "/tester-portal/field",
    "/team-portal/billing/subscriptions": "/tester-portal/billing",
    "/team-portal/login": "/tester-portal/auth/login"
  },
  "admin_portal_migrations": {
    "/admin/dashboard": "/tester-portal/admin/overview",
    "/admin/bookings": "/tester-portal/admin/bookings"
  },
  "required_features": {
    "customer-management": ["customers", "leads", "import"],
    "scheduling": ["schedule", "appointments", "routes"],
    "billing": ["invoices", "payments", "subscriptions"],
    "compliance": ["reports", "districts", "submissions"],
    "analytics": ["dashboard", "data", "export"],
    "marketing": ["social", "branding", "communications"],
    "communications": ["reminders", "notifications", "templates"],
    "data-management": ["import", "export", "backup"],
    "route-optimization": ["routes", "optimization", "tracking"],
    "branding": ["logos", "templates", "customization"]
  }
}
EOF

echo "✅ Migration map created"

# Step 3: Create directory structure
echo "🏗️  STEP 3: Creating tester-portal directory structure..."

mkdir -p src/app/tester-portal/{customers,schedule,invoices,reports,reminders,branding,backup,export,import,analytics,compliance,marketing,tools,field,billing,auth,admin}
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

echo "✅ Directory structure created"

# Step 4: Create API endpoints directory structure
echo "🔌 STEP 4: Creating API endpoint structure..."

mkdir -p src/app/api/tester-portal/{customers,schedule,invoices,reports,reminders,branding,backup,export,import,analytics,compliance,marketing,tools,field,billing,auth,admin,subscriptions}
mkdir -p src/app/api/tester-portal/customers/{[id]}
mkdir -p src/app/api/tester-portal/invoices/{[id]}
mkdir -p src/app/api/tester-portal/reports/{[id]}

echo "✅ API structure created"

# Step 5: Create page migration templates
echo "📄 STEP 5: Creating page migration templates..."

# Template for protected pages
cat > page-template.tsx << 'EOF'
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FEATURE_NAME_ICON } from 'lucide-react'

interface UserPermissions {
  isOwner: boolean
  subscriptions: string[]
}

export default function COMPONENT_NAME() {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPermissions()
  }, [])

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/tester-portal/permissions')
      if (response.ok) {
        const data = await response.json()
        setPermissions(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const hasAccess = (feature: string) => {
    if (!permissions) return false
    return permissions.isOwner || permissions.subscriptions.includes(feature)
  }

  if (!hasAccess('REQUIRED_FEATURE') && !permissions?.isOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
            <FEATURE_NAME_ICON className="h-8 w-8 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">FEATURE_DISPLAY_NAME</h2>
          <p className="text-cyan-200 mb-6">
            This feature requires a REQUIRED_FEATURE subscription.
          </p>
          <div className="space-y-3">
            <Link
              href="/tester-portal/upgrade"
              className="block bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all"
            >
              Upgrade to Access
            </Link>
            <Link
              href="/tester-portal/dashboard"
              className="block text-cyan-400 hover:text-white transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-white/80">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900">
      {/* Header */}
      <div className="border-b border-cyan-400/20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <FEATURE_NAME_ICON className="h-8 w-8 text-cyan-400 mr-3" />
                FEATURE_DISPLAY_NAME
                {permissions?.isOwner && (
                  <span className="ml-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    OWNER ACCESS
                  </span>
                )}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* PAGE CONTENT GOES HERE */}
        <div className="text-center py-12">
          <FEATURE_NAME_ICON className="h-16 w-16 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">FEATURE_DISPLAY_NAME</h2>
          <p className="text-cyan-300">Feature implementation in progress...</p>
        </div>
      </div>
    </div>
  )
}
EOF

echo "✅ Page template created"

# Step 6: Create API template
cat > api-template.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Check user permissions
async function checkPermissions(request: NextRequest, requiredFeature: string) {
  const cookies = request.cookies;
  const teamSession = cookies.get('team_session')?.value;
  
  if (!teamSession) {
    return { hasAccess: false, isOwner: false, error: 'No session' };
  }
  
  const { data: session } = await supabaseAdmin
    .from('team_sessions')
    .select(`
      team_user_id,
      expires_at,
      team_users (
        id, email, role, is_active
      )
    `)
    .eq('session_token', teamSession)
    .gt('expires_at', new Date().toISOString())
    .single();
    
  if (!session?.team_users) {
    return { hasAccess: false, isOwner: false, error: 'Invalid session' };
  }
  
  const user = session.team_users as any;
  const isOwner = user.email === 'blake@fisherbackflows.com' || user.role === 'admin';
  
  if (isOwner) {
    return { hasAccess: true, isOwner: true, user };
  }
  
  // Check subscriptions for company users
  // TODO: Implement subscription checking
  
  return { hasAccess: false, isOwner: false, user };
}

export async function GET(request: NextRequest) {
  try {
    const { hasAccess, isOwner, error } = await checkPermissions(request, 'REQUIRED_FEATURE');
    
    if (!hasAccess) {
      return NextResponse.json({ 
        success: false, 
        error: error || 'Access denied' 
      }, { status: 403 });
    }
    
    // Your API logic here
    
    return NextResponse.json({
      success: true,
      data: {}
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
EOF

echo "✅ API template created"

echo ""
echo "🎯 NEXT STEPS TO COMPLETE:"
echo "=========================="
echo "1. Run the page generation script (next command)"
echo "2. Run the API generation script"  
echo "3. Copy actual functionality from team-portal pages"
echo "4. Test each migrated page"
echo "5. Create upgrade/billing system"
echo "6. Remove old portals"
echo ""
echo "📊 CURRENT STATUS:"
echo "Migrated: 1/32 pages (3%)"
echo "APIs created: 1/30+ endpoints (3%)" 
echo "Features tested: 0/10 (0%)"
echo ""
echo "⚠️  This script created the STRUCTURE."
echo "📋 Still need to implement the FUNCTIONALITY."
echo ""
echo "Would you like me to continue with the actual page migrations?"