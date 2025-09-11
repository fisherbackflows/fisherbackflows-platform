import { NextRequest, NextResponse } from 'next/server'
import { getCompanyBranding, updateCompanyBranding } from '@/lib/company-branding'
import { getTeamSession } from '@/lib/team-auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const branding = await getCompanyBranding(params.companyId)
    
    if (!branding) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    return NextResponse.json(branding)
  } catch (error: any) {
    console.error('Error fetching company branding:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch company branding' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    // Verify team session and permissions
    const session = await getTeamSession(request)
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user belongs to this company and has admin rights
    const { data: teamUser, error: teamError } = await supabase
      .from('team_users')
      .select('company_id, role')
      .eq('id', session.userId)
      .single()

    if (teamError || !teamUser || teamUser.company_id !== params.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['owner', 'admin'].includes(teamUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const updates = await request.json()

    // Validate color formats
    const colorFields = ['primary_color', 'secondary_color', 'accent_color', 'background_color']
    for (const field of colorFields) {
      if (updates[field] && !/^#[0-9A-Fa-f]{6}$/.test(updates[field])) {
        return NextResponse.json(
          { error: `Invalid color format for ${field}. Use hex format like #0ea5e9` },
          { status: 400 }
        )
      }
    }

    // Don't allow updating certain fields
    delete updates.id
    delete updates.company_id
    delete updates.created_at

    const branding = await updateCompanyBranding(params.companyId, updates)

    if (!branding) {
      return NextResponse.json({ error: 'Failed to update branding' }, { status: 500 })
    }

    // Log the branding update
    await supabase
      .from('audit_logs')
      .insert({
        user_id: session.userId,
        user_type: 'team',
        action: 'branding_update',
        resource_type: 'company_branding',
        resource_id: params.companyId,
        details: updates,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent')
      })

    return NextResponse.json(branding)
  } catch (error: any) {
    console.error('Error updating company branding:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update company branding' },
      { status: 500 }
    )
  }
}