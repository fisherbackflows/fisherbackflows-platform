import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export interface AuthContext {
  userId: string
  orgId: string
  role: string
  email: string
}

/**
 * Higher-order function to protect API routes with authentication
 */
export async function withAuth<T = any>(
  req: NextRequest,
  handler: (
    session: any,
    orgId: string,
    role: string,
    requestId: string
  ) => Promise<NextResponse<T>>
): Promise<NextResponse<T | { error: any }>> {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID()

  try {
    // Get auth context from middleware headers
    const userId = req.headers.get('x-user-id')
    const orgId = req.headers.get('x-org-id')
    const role = req.headers.get('x-user-role')

    if (!userId) {
      logger.warn('Unauthorized request - no user ID', { 
        path: req.nextUrl.pathname,
        requestId 
      })
      
      return NextResponse.json(
        { 
          error: { 
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            requestId 
          } 
        },
        { status: 401 }
      )
    }

    if (!orgId) {
      logger.warn('No organization context', { 
        userId,
        path: req.nextUrl.pathname,
        requestId 
      })
      
      return NextResponse.json(
        { 
          error: { 
            code: 'NO_ORG_CONTEXT',
            message: 'Organization context required',
            requestId 
          } 
        },
        { status: 400 }
      )
    }

    // Get fresh session from Supabase
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      logger.error('Session validation failed', { 
        error,
        userId,
        requestId 
      })
      
      return NextResponse.json(
        { 
          error: { 
            code: 'SESSION_INVALID',
            message: 'Invalid or expired session',
            requestId 
          } 
        },
        { status: 401 }
      )
    }

    // Verify user ID matches session
    if (session.user.id !== userId) {
      logger.error('User ID mismatch', { 
        sessionUserId: session.user.id,
        headerUserId: userId,
        requestId 
      })
      
      return NextResponse.json(
        { 
          error: { 
            code: 'AUTH_MISMATCH',
            message: 'Authentication mismatch',
            requestId 
          } 
        },
        { status: 401 }
      )
    }

    // Execute the handler with auth context
    return await handler(session, orgId, role || 'viewer', requestId)
    
  } catch (error) {
    logger.error('Auth middleware error', { 
      error,
      path: req.nextUrl.pathname,
      requestId 
    })
    
    return NextResponse.json(
      { 
        error: { 
          code: 'AUTH_ERROR',
          message: 'Authentication error occurred',
          requestId 
        } 
      },
      { status: 500 }
    )
  }
}

/**
 * Check if user has required role(s) for an operation
 */
export function requireRole(
  userRole: string,
  requiredRoles: string[]
): boolean {
  return requiredRoles.includes(userRole)
}

/**
 * Role hierarchy for permission checking
 */
export const ROLE_HIERARCHY: Record<string, number> = {
  admin: 100,
  manager: 80,
  coordinator: 60,
  inspector: 40,
  technician: 40,
  viewer: 20
}

/**
 * Check if user role has sufficient permissions
 */
export function hasPermission(
  userRole: string,
  requiredRole: string
): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] || 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 100
  return userLevel >= requiredLevel
}

/**
 * Higher-order function for role-based access control
 */
export function requireSession(
  allowedRoles: string[],
  handler: (context: { orgId: string; userId: string; session: any }) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    return withAuth(req, async (session, orgId, role, requestId) => {
      // Check if user has required role
      if (!requireRole(role, allowedRoles)) {
        logger.warn('Insufficient permissions', {
          userRole: role,
          requiredRoles: allowedRoles,
          userId: session.user.id,
          requestId
        })

        return NextResponse.json(
          {
            error: {
              code: 'INSUFFICIENT_PERMISSIONS',
              message: 'Insufficient permissions for this operation',
              requestId
            }
          },
          { status: 403 }
        )
      }

      return handler({
        orgId,
        userId: session.user.id,
        session
      })
    })
  }
}