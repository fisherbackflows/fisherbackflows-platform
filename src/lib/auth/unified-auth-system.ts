/**
 * Unified Authentication System
 * Standardizes authentication across all portals and applications
 * MASTER AUDIT Priority: MEDIUM - Authentication Flow Standardization
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

// Auth configuration
const AUTH_CONFIG = {
  sessionDuration: 60 * 60 * 8, // 8 hours
  refreshThreshold: 60 * 15, // 15 minutes
  maxSessions: 5,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  },
  portals: {
    customer: { prefix: 'customer_', roles: ['customer'] },
    team: { prefix: 'team_', roles: ['admin', 'manager', 'coordinator', 'technician', 'inspector'] },
    field: { prefix: 'field_', roles: ['technician', 'inspector'] },
    admin: { prefix: 'admin_', roles: ['admin'] },
  },
} as const;

// Session types
export interface UnifiedSession {
  id: string;
  userId: string;
  email: string;
  role: string;
  portal: 'customer' | 'team' | 'field' | 'admin';
  organizationId?: string;
  customerId?: string;
  teamUserId?: string;
  permissions: string[];
  createdAt: number;
  expiresAt: number;
  refreshToken?: string;
}

export interface AuthContext {
  session: UnifiedSession;
  user: any;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
}

// Role permission mapping
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'], // All permissions
  manager: [
    'customers:*',
    'appointments:*',
    'invoices:*',
    'reports:*',
    'team:read',
    'analytics:read',
  ],
  coordinator: [
    'customers:read',
    'customers:update',
    'appointments:*',
    'invoices:read',
    'reports:read',
  ],
  technician: [
    'appointments:read',
    'appointments:update',
    'reports:create',
    'reports:update',
    'devices:read',
    'devices:update',
  ],
  inspector: [
    'appointments:read',
    'reports:create',
    'reports:read',
    'devices:read',
  ],
  customer: [
    'portal:access',
    'appointments:read:own',
    'appointments:create:own',
    'invoices:read:own',
    'devices:read:own',
    'reports:read:own',
  ],
};

/**
 * Create unified Supabase client
 */
function createUnifiedSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Generate secure session token
 */
function generateSessionToken(session: UnifiedSession): string {
  return jwt.sign(
    {
      id: session.id,
      userId: session.userId,
      email: session.email,
      role: session.role,
      portal: session.portal,
      organizationId: session.organizationId,
      customerId: session.customerId,
      teamUserId: session.teamUserId,
    },
    process.env.JWT_SECRET || 'default-secret',
    {
      expiresIn: AUTH_CONFIG.sessionDuration,
      issuer: 'fisherbackflows',
      audience: session.portal,
    }
  );
}

/**
 * Verify session token
 */
function verifySessionToken(token: string, portal: string): UnifiedSession | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret', {
      issuer: 'fisherbackflows',
      audience: portal,
    }) as any;

    if (!decoded || !decoded.userId) {
      return null;
    }

    return {
      id: decoded.id,
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      portal: decoded.portal,
      organizationId: decoded.organizationId,
      customerId: decoded.customerId,
      teamUserId: decoded.teamUserId,
      permissions: ROLE_PERMISSIONS[decoded.role] || [],
      createdAt: decoded.iat * 1000,
      expiresAt: decoded.exp * 1000,
    };
  } catch (error) {
    logger.error('Session token verification failed', { error });
    return null;
  }
}

/**
 * Main unified authentication function
 */
export async function authenticateUnified(
  request: NextRequest,
  options: {
    portal: 'customer' | 'team' | 'field' | 'admin';
    requiredRoles?: string[];
    requiredPermissions?: string[];
  }
): Promise<AuthContext | null> {
  const requestId = crypto.randomUUID();
  const { portal, requiredRoles = [], requiredPermissions = [] } = options;

  try {
    // Get session token from cookies
    const cookieName = `${AUTH_CONFIG.portals[portal].prefix}session`;
    const sessionToken = request.cookies.get(cookieName)?.value;

    if (!sessionToken) {
      logger.debug('No session token found', { portal, requestId });
      return null;
    }

    // Verify token
    const session = verifySessionToken(sessionToken, portal);
    if (!session) {
      logger.warn('Invalid session token', { portal, requestId });
      return null;
    }

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      logger.info('Session expired', { portal, userId: session.userId, requestId });
      return null;
    }

    // Validate portal access
    const allowedRoles = AUTH_CONFIG.portals[portal].roles;
    if (!allowedRoles.includes(session.role)) {
      logger.warn('Invalid portal access', {
        portal,
        role: session.role,
        userId: session.userId,
        requestId,
      });
      return null;
    }

    // Check required roles
    if (requiredRoles.length > 0 && !requiredRoles.includes(session.role)) {
      logger.warn('Insufficient role', {
        requiredRoles,
        userRole: session.role,
        userId: session.userId,
        requestId,
      });
      return null;
    }

    // Check required permissions
    if (requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every(
        (perm) => session.permissions.includes(perm) || session.permissions.includes('*')
      );

      if (!hasAllPermissions) {
        logger.warn('Insufficient permissions', {
          requiredPermissions,
          userPermissions: session.permissions,
          userId: session.userId,
          requestId,
        });
        return null;
      }
    }

    // Get fresh user data from database
    const supabase = createUnifiedSupabaseClient();
    let user = null;

    if (portal === 'customer') {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('id', session.customerId)
        .single();
      user = data;
    } else {
      const { data } = await supabase
        .from('team_users')
        .select('*')
        .eq('id', session.teamUserId)
        .single();
      user = data;
    }

    if (!user) {
      logger.error('User not found in database', {
        portal,
        userId: session.userId,
        requestId,
      });
      return null;
    }

    // Create auth context
    const authContext: AuthContext = {
      session,
      user,
      isAuthenticated: true,
      hasPermission: (permission: string) =>
        session.permissions.includes(permission) || session.permissions.includes('*'),
      hasRole: (role: string | string[]) => {
        const roles = Array.isArray(role) ? role : [role];
        return roles.includes(session.role);
      },
    };

    // Log successful authentication
    logger.info('Authentication successful', {
      portal,
      userId: session.userId,
      role: session.role,
      requestId,
    });

    return authContext;
  } catch (error) {
    logger.error('Authentication error', {
      error,
      portal,
      requestId,
    });
    return null;
  }
}

/**
 * Create unified session
 */
export async function createUnifiedSession(
  user: any,
  portal: 'customer' | 'team' | 'field' | 'admin',
  response?: NextResponse
): Promise<{ session: UnifiedSession; token: string }> {
  const sessionId = crypto.randomUUID();
  const now = Date.now();

  // Determine role and IDs based on portal
  let role = user.role || 'viewer';
  let organizationId = user.organization_id;
  let customerId = null;
  let teamUserId = null;

  if (portal === 'customer') {
    role = 'customer';
    customerId = user.id;
    organizationId = user.organization_id;
  } else {
    teamUserId = user.id;
    organizationId = user.company_id || user.organization_id;
  }

  // Create session object
  const session: UnifiedSession = {
    id: sessionId,
    userId: user.auth_user_id || user.id,
    email: user.email,
    role,
    portal,
    organizationId,
    customerId,
    teamUserId,
    permissions: ROLE_PERMISSIONS[role] || [],
    createdAt: now,
    expiresAt: now + AUTH_CONFIG.sessionDuration * 1000,
  };

  // Generate token
  const token = generateSessionToken(session);

  // Store session in database
  const supabase = createUnifiedSupabaseClient();
  await supabase.from('unified_sessions').insert({
    id: sessionId,
    user_id: session.userId,
    portal,
    role,
    organization_id: organizationId,
    customer_id: customerId,
    team_user_id: teamUserId,
    token_hash: jwt.sign(token, process.env.JWT_SECRET || 'default-secret'),
    expires_at: new Date(session.expiresAt).toISOString(),
    ip_address: null, // Can be extracted from request if needed
    user_agent: null, // Can be extracted from request if needed
  });

  // Set cookie if response provided
  if (response) {
    const cookieName = `${AUTH_CONFIG.portals[portal].prefix}session`;
    response.cookies.set(cookieName, token, {
      ...AUTH_CONFIG.cookieOptions,
      maxAge: AUTH_CONFIG.sessionDuration,
    });
  }

  logger.info('Session created', {
    sessionId,
    userId: session.userId,
    portal,
    role,
  });

  return { session, token };
}

/**
 * Destroy unified session
 */
export async function destroyUnifiedSession(
  sessionId: string,
  portal: 'customer' | 'team' | 'field' | 'admin',
  response?: NextResponse
): Promise<void> {
  try {
    // Remove from database
    const supabase = createUnifiedSupabaseClient();
    await supabase
      .from('unified_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', sessionId);

    // Clear cookie if response provided
    if (response) {
      const cookieName = `${AUTH_CONFIG.portals[portal].prefix}session`;
      response.cookies.delete(cookieName);
    }

    logger.info('Session destroyed', { sessionId, portal });
  } catch (error) {
    logger.error('Failed to destroy session', { error, sessionId, portal });
  }
}

/**
 * Refresh unified session
 */
export async function refreshUnifiedSession(
  sessionId: string,
  portal: 'customer' | 'team' | 'field' | 'admin'
): Promise<{ session: UnifiedSession; token: string } | null> {
  try {
    const supabase = createUnifiedSupabaseClient();

    // Get existing session
    const { data: existingSession } = await supabase
      .from('unified_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!existingSession || existingSession.revoked_at) {
      return null;
    }

    // Get user data
    let user = null;
    if (portal === 'customer') {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('id', existingSession.customer_id)
        .single();
      user = data;
    } else {
      const { data } = await supabase
        .from('team_users')
        .select('*')
        .eq('id', existingSession.team_user_id)
        .single();
      user = data;
    }

    if (!user) {
      return null;
    }

    // Create new session
    return createUnifiedSession(user, portal);
  } catch (error) {
    logger.error('Failed to refresh session', { error, sessionId, portal });
    return null;
  }
}

/**
 * Higher-order function for protecting API routes
 */
export function withUnifiedAuth<T = any>(
  handler: (
    request: NextRequest,
    context: AuthContext
  ) => Promise<NextResponse<T>>,
  options: {
    portal: 'customer' | 'team' | 'field' | 'admin';
    requiredRoles?: string[];
    requiredPermissions?: string[];
  }
) {
  return async (request: NextRequest): Promise<NextResponse<T | { error: any }>> => {
    const authContext = await authenticateUnified(request, options);

    if (!authContext) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    try {
      return await handler(request, authContext);
    } catch (error) {
      logger.error('Handler error', { error });
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An error occurred processing your request',
          },
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Check if user has permission
 */
export function checkPermission(
  session: UnifiedSession,
  permission: string
): boolean {
  return (
    session.permissions.includes(permission) ||
    session.permissions.includes('*')
  );
}

/**
 * Check if user has role
 */
export function checkRole(
  session: UnifiedSession,
  requiredRole: string | string[]
): boolean {
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(session.role);
}

/**
 * Get active sessions for user
 */
export async function getActiveSessions(userId: string): Promise<UnifiedSession[]> {
  const supabase = createUnifiedSupabaseClient();
  const { data } = await supabase
    .from('unified_sessions')
    .select('*')
    .eq('user_id', userId)
    .is('revoked_at', null)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(AUTH_CONFIG.maxSessions);

  return (data || []).map((s: any) => ({
    id: s.id,
    userId: s.user_id,
    email: s.email,
    role: s.role,
    portal: s.portal,
    organizationId: s.organization_id,
    customerId: s.customer_id,
    teamUserId: s.team_user_id,
    permissions: ROLE_PERMISSIONS[s.role] || [],
    createdAt: new Date(s.created_at).getTime(),
    expiresAt: new Date(s.expires_at).getTime(),
  }));
}

/**
 * Cleanup expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
  const supabase = createUnifiedSupabaseClient();
  await supabase
    .from('unified_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .lt('expires_at', new Date().toISOString())
    .is('revoked_at', null);
}