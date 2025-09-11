import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/auth'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Generate secure API key
function generateApiKey(): string {
  return 'bbapi_' + crypto.randomBytes(32).toString('hex')
}

// Hash API key for storage
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

// Get preview of API key (last 4 chars)
function getApiKeyPreview(key: string): string {
  return '****' + key.slice(-4)
}

// GET /api/backflowbuddy/api-keys - List API keys
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(['admin'])(request)
    if (user instanceof NextResponse) return user

    // Get company ID from team user
    const { data: teamUser } = await supabase
      .from('team_users')
      .select('company_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!teamUser?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Fetch API keys for this company
    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select(`
        id,
        name,
        key_preview,
        is_active,
        rate_limit_per_hour,
        created_at,
        last_used_at,
        expires_at
      `)
      .eq('company_id', teamUser.company_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 })
    }

    return NextResponse.json({ data: apiKeys })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/backflowbuddy/api-keys - Create new API key
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(['admin'])(request)
    if (user instanceof NextResponse) return user

    const { name } = await request.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'API key name is required' }, { status: 400 })
    }

    // Get company ID from team user
    const { data: teamUser } = await supabase
      .from('team_users')
      .select('company_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!teamUser?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Generate new API key
    const apiKey = generateApiKey()
    const keyHash = hashApiKey(apiKey)
    const keyPreview = getApiKeyPreview(apiKey)

    // Insert API key record
    const { data: newApiKey, error } = await supabase
      .from('api_keys')
      .insert({
        company_id: teamUser.company_id,
        name: name.trim(),
        key_hash: keyHash,
        key_preview: keyPreview,
        is_active: true,
        rate_limit_per_hour: 1000 // Default rate limit
      })
      .select(`
        id,
        name,
        key_preview,
        is_active,
        rate_limit_per_hour,
        created_at
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
    }

    // Log the API key creation
    await supabase
      .from('audit_logs')
      .insert({
        company_id: teamUser.company_id,
        user_id: user.id,
        action: 'api_key_created',
        resource_type: 'api_key',
        resource_id: newApiKey.id,
        metadata: {
          api_key_name: name,
          key_preview: keyPreview
        }
      })

    return NextResponse.json({
      data: newApiKey,
      api_key: apiKey, // Return the full key only once
      message: 'API key created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}