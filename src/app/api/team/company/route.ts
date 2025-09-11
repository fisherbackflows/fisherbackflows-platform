import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getTeamSession } from '@/lib/team-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const session = await getTeamSession(request)
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get team member's company
    const { data: teamUser, error: teamError } = await supabase
      .from('team_users')
      .select('company_id')
      .eq('id', session.userId)
      .single()

    if (teamError || !teamUser) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', teamUser.company_id)
      .single()

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    return NextResponse.json(company)
  } catch (error: any) {
    console.error('Company fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch company' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getTeamSession(request)
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get team member's company and role
    const { data: teamUser, error: teamError } = await supabase
      .from('team_users')
      .select('company_id, role')
      .eq('id', session.userId)
      .single()

    if (teamError || !teamUser) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    // Only owners and admins can update company settings
    if (!['owner', 'admin'].includes(teamUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const updates = await request.json()

    // Don't allow updating certain fields
    delete updates.id
    delete updates.owner_id
    delete updates.stripe_customer_id
    delete updates.stripe_subscription_id
    delete updates.subscription_status
    delete updates.subscription_plan

    // Update company
    const { data: company, error: updateError } = await supabase
      .from('companies')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', teamUser.company_id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // Log the update
    await supabase
      .from('audit_logs')
      .insert({
        user_id: session.userId,
        user_type: 'team',
        action: 'company_update',
        resource_type: 'company',
        resource_id: teamUser.company_id,
        details: updates,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent')
      })

    return NextResponse.json(company)
  } catch (error: any) {
    console.error('Company update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update company' },
      { status: 500 }
    )
  }
}