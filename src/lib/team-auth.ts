import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface TeamSession {
  userId: string
  email: string
  role: string
  companyId?: string
}

export async function getTeamSession(request: NextRequest): Promise<TeamSession | null> {
  try {
    // Check for session token in cookies
    const sessionToken = request.cookies.get('team_session')?.value

    if (!sessionToken) {
      return null
    }

    // Verify the JWT token
    const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET || 'default-secret') as any

    if (!decoded || !decoded.userId) {
      return null
    }

    // Get the team user from database
    const { data: teamUser, error } = await supabase
      .from('team_users')
      .select('id, email, role, company_id')
      .eq('id', decoded.userId)
      .single()

    if (error || !teamUser) {
      return null
    }

    return {
      userId: teamUser.id,
      email: teamUser.email,
      role: teamUser.role,
      companyId: teamUser.company_id
    }
  } catch (error) {
    console.error('Session verification error:', error)
    return null
  }
}

export async function createTeamSession(userId: string): Promise<string> {
  const token = jwt.sign(
    { userId, type: 'team' },
    process.env.JWT_SECRET || 'default-secret',
    { expiresIn: '7d' }
  )
  
  return token
}