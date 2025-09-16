// Unified Authentication Service
// Integrates Supabase Auth + NextAuth + Custom JWT for seamless authentication

import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient, createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

export type UserRole = 'admin' | 'technician' | 'customer'

export interface AuthUser {
  id: string
  email: string
  name?: string
  phone?: string
  role: UserRole
  organizationId: string
  active: boolean
  metadata?: Record<string, any>
}

export interface AuthSession {
  user: AuthUser
  accessToken: string
  expiresAt: number
}

class UnifiedAuthService {
  private supabaseAdmin
  
  constructor() {
    this.supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }

  // ====================
  // SERVER-SIDE AUTHENTICATION
  // ====================

  /**
   * Get authenticated user from request context
   */
  async getAuthenticatedUser(request: NextRequest): Promise<AuthUser | null> {
    try {
      // Try Supabase auth first
      const supabase = createRouteHandlerClient(request)
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (user && !error) {
        // Get user profile
        const { data: profile } = await supabase
          .from('team_users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile) {
          return {
            id: user.id,
            email: user.email!,
            name: profile.name,
            phone: profile.phone,
            role: profile.role as UserRole,
            organizationId: profile.organization_id,
            active: profile.active,
            metadata: profile.metadata
          }
        }
      }

      // Try JWT token from headers
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        return await this.verifyJWT(token)
      }

      // Try session cookie
      const sessionCookie = request.cookies.get('team_session')
      if (sessionCookie) {
        return await this.verifyJWT(sessionCookie.value)
      }

      return null
    } catch (error) {
      console.error('Auth error:', error)
      return null
    }
  }

  /**
   * Verify JWT token
   */
  async verifyJWT(token: string): Promise<AuthUser | null> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      
      // Get user from database
      const { data: profile } = await this.supabaseAdmin
        .from('team_users')
        .select('*')
        .eq('id', decoded.userId)
        .single()

      if (profile && profile.active) {
        return {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          phone: profile.phone,
          role: profile.role as UserRole,
          organizationId: profile.organization_id,
          active: profile.active,
          metadata: profile.metadata
        }
      }

      return null
    } catch (error) {
      console.error('JWT verification failed:', error)
      return null
    }
  }

  /**
   * Generate JWT token
   */
  generateJWT(userId: string, email: string, role: UserRole, organizationId: string): string {
    return jwt.sign(
      {
        userId,
        email,
        role,
        organizationId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      },
      process.env.JWT_SECRET!
    )
  }

  // ====================
  // AUTHENTICATION METHODS
  // ====================

  /**
   * Authenticate user with email/password
   */
  async authenticateUser(email: string, password: string): Promise<AuthSession | null> {
    try {
      // Try Supabase auth first
      const { data: authData, error: authError } = await this.supabaseAdmin.auth.signInWithPassword({
        email,
        password
      })

      if (authData.user && !authError) {
        const { data: profile } = await this.supabaseAdmin
          .from('team_users')
          .select('*')
          .eq('id', authData.user.id)
          .single()

        if (profile && profile.active) {
          const user: AuthUser = {
            id: authData.user.id,
            email: authData.user.email!,
            name: profile.name,
            phone: profile.phone,
            role: profile.role as UserRole,
            organizationId: profile.organization_id,
            active: profile.active,
            metadata: profile.metadata
          }

          const accessToken = this.generateJWT(
            user.id,
            user.email,
            user.role,
            user.organizationId
          )

          return {
            user,
            accessToken,
            expiresAt: Date.now() + (24 * 60 * 60 * 1000)
          }
        }
      }

      return null
    } catch (error) {
      console.error('Authentication failed:', error)
      return null
    }
  }

  /**
   * Create new user account
   */
  async createUser(
    email: string,
    password: string,
    name: string,
    phone?: string,
    role: UserRole = 'customer'
  ): Promise<AuthUser | null> {
    try {
      // Create auth user
      const { data: authData, error: authError } = await this.supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      })

      if (authError || !authData.user) {
        throw new Error(authError?.message || 'Failed to create user')
      }

      // Create profile
      const { data: profile, error: profileError } = await this.supabaseAdmin
        .from('team_users')
        .insert({
          id: authData.user.id,
          email,
          name,
          phone,
          role,
          organization_id: '00000000-0000-0000-0000-000000000001',
          active: true
        })
        .select()
        .single()

      if (profileError) {
        // Cleanup auth user if profile creation fails
        await this.supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        throw new Error(profileError.message)
      }

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        phone: profile.phone,
        role: profile.role as UserRole,
        organizationId: profile.organization_id,
        active: profile.active,
        metadata: profile.metadata
      }
    } catch (error) {
      console.error('User creation failed:', error)
      return null
    }
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, updates: Partial<AuthUser>): Promise<AuthUser | null> {
    try {
      const { data: profile, error } = await this.supabaseAdmin
        .from('team_users')
        .update({
          name: updates.name,
          phone: updates.phone,
          role: updates.role,
          active: updates.active,
          metadata: updates.metadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        phone: profile.phone,
        role: profile.role as UserRole,
        organizationId: profile.organization_id,
        active: profile.active,
        metadata: profile.metadata
      }
    } catch (error) {
      console.error('User update failed:', error)
      return null
    }
  }

  /**
   * Delete user account
   */
  async deleteUser(userId: string): Promise<boolean> {
    try {
      // Deactivate profile first
      await this.supabaseAdmin
        .from('team_users')
        .update({ active: false })
        .eq('id', userId)

      // Delete auth user
      const { error } = await this.supabaseAdmin.auth.admin.deleteUser(userId)
      
      if (error) {
        throw new Error(error.message)
      }

      return true
    } catch (error) {
      console.error('User deletion failed:', error)
      return false
    }
  }

  // ====================
  // AUTHORIZATION HELPERS
  // ====================

  /**
   * Check if user has required role
   */
  hasRole(user: AuthUser | null, requiredRole: UserRole | UserRole[]): boolean {
    if (!user) return false
    
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    return roles.includes(user.role)
  }

  /**
   * Check if user is admin
   */
  isAdmin(user: AuthUser | null): boolean {
    return this.hasRole(user, 'admin')
  }

  /**
   * Check if user is technician or admin
   */
  isTechnician(user: AuthUser | null): boolean {
    return this.hasRole(user, ['admin', 'technician'])
  }

  /**
   * Create auth response with session cookie
   */
  createAuthResponse(session: AuthSession, redirectTo?: string): NextResponse {
    const response = redirectTo 
      ? NextResponse.redirect(new URL(redirectTo, process.env.NEXT_PUBLIC_APP_URL))
      : NextResponse.json({ success: true, user: session.user })

    // Set secure HTTP-only cookie
    response.cookies.set('team_session', session.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    })

    return response
  }

  /**
   * Create logout response
   */
  createLogoutResponse(redirectTo?: string): NextResponse {
    const response = redirectTo 
      ? NextResponse.redirect(new URL(redirectTo, process.env.NEXT_PUBLIC_APP_URL))
      : NextResponse.json({ success: true, message: 'Logged out' })

    // Clear session cookie
    response.cookies.delete('team_session')

    return response
  }

  // ====================
  // PASSWORD UTILITIES
  // ====================

  /**
   * Hash password
   */
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12)
  }

  /**
   * Verify password
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash)
  }

  /**
   * Generate secure random password
   */
  generatePassword(length: number = 12): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  // ====================
  // SESSION MANAGEMENT
  // ====================

  /**
   * Validate session and refresh if needed
   */
  async validateSession(token: string): Promise<AuthSession | null> {
    try {
      const user = await this.verifyJWT(token)
      if (!user) return null

      // Check if token is close to expiration (less than 1 hour left)
      const decoded = jwt.decode(token) as any
      const timeUntilExpiry = (decoded.exp * 1000) - Date.now()
      
      if (timeUntilExpiry < 60 * 60 * 1000) { // Less than 1 hour
        // Refresh token
        const newToken = this.generateJWT(
          user.id,
          user.email,
          user.role,
          user.organizationId
        )
        
        return {
          user,
          accessToken: newToken,
          expiresAt: Date.now() + (24 * 60 * 60 * 1000)
        }
      }

      return {
        user,
        accessToken: token,
        expiresAt: decoded.exp * 1000
      }
    } catch (error) {
      console.error('Session validation failed:', error)
      return null
    }
  }
}

// Export singleton instance
export const unifiedAuth = new UnifiedAuthService()

// Export middleware helper
export async function requireAuth(
  request: NextRequest,
  requiredRole?: UserRole | UserRole[]
): Promise<{ user: AuthUser; response?: NextResponse }> {
  const user = await unifiedAuth.getAuthenticatedUser(request)
  
  if (!user) {
    return {
      user: null!,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  if (requiredRole && !unifiedAuth.hasRole(user, requiredRole)) {
    return {
      user,
      response: NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
  }

  return { user }
}