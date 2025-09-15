import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// DELETE /api/tester-portal/api-keys/[id] - Delete API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(['admin'])(request)
    if (user instanceof NextResponse) return user

    const { id } = params

    // Get company ID from team user
    const { data: teamUser } = await supabase
      .from('team_users')
      .select('company_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!teamUser?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Verify API key belongs to this company and get its details
    const { data: apiKey } = await supabase
      .from('api_keys')
      .select('id, name, key_preview')
      .eq('id', id)
      .eq('company_id', teamUser.company_id)
      .single()

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    // Delete the API key
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('company_id', teamUser.company_id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 })
    }

    // Log the API key deletion
    await supabase
      .from('audit_logs')
      .insert({
        company_id: teamUser.company_id,
        user_id: user.id,
        action: 'api_key_deleted',
        resource_type: 'api_key',
        resource_id: id,
        metadata: {
          api_key_name: apiKey.name,
          key_preview: apiKey.key_preview
        }
      })

    return NextResponse.json({ 
      message: 'API key deleted successfully' 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/tester-portal/api-keys/[id] - Update API key
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(['admin'])(request)
    if (user instanceof NextResponse) return user

    const { id } = params
    const { name, is_active, rate_limit_per_hour } = await request.json()

    // Get company ID from team user
    const { data: teamUser } = await supabase
      .from('team_users')
      .select('company_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!teamUser?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Verify API key belongs to this company
    const { data: existingKey } = await supabase
      .from('api_keys')
      .select('id')
      .eq('id', id)
      .eq('company_id', teamUser.company_id)
      .single()

    if (!existingKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    // Build update object
    const updates: any = {}
    if (name !== undefined) updates.name = name.trim()
    if (is_active !== undefined) updates.is_active = is_active
    if (rate_limit_per_hour !== undefined) {
      updates.rate_limit_per_hour = Math.max(1, Math.min(10000, rate_limit_per_hour))
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 })
    }

    // Update the API key
    const { data: updatedKey, error } = await supabase
      .from('api_keys')
      .update(updates)
      .eq('id', id)
      .eq('company_id', teamUser.company_id)
      .select(`
        id,
        name,
        key_preview,
        is_active,
        rate_limit_per_hour,
        created_at,
        updated_at
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 })
    }

    // Log the API key update
    await supabase
      .from('audit_logs')
      .insert({
        company_id: teamUser.company_id,
        user_id: user.id,
        action: 'api_key_updated',
        resource_type: 'api_key',
        resource_id: id,
        metadata: {
          updates: updates
        }
      })

    return NextResponse.json({
      data: updatedKey,
      message: 'API key updated successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}