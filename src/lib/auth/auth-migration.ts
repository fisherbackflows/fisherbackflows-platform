/**
 * Authentication Migration Utility
 * Transitions existing auth implementations to unified system
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateUnified,
  createUnifiedSession,
  withUnifiedAuth,
  AuthContext
} from './unified-auth-system';
import { authenticateRequest as legacyAuthenticateRequest } from '../auth-helpers';
import { getTeamSession as legacyGetTeamSession } from '../team-auth';
import { logger } from '@/lib/logger';

/**
 * Migration configuration
 */
const MIGRATION_CONFIG = {
  // Enable gradual migration
  enableFallback: true,
  // Log migration events
  logMigration: true,
  // Track migration metrics
  trackMetrics: true,
};

/**
 * Backward-compatible authentication wrapper
 * Attempts unified auth first, falls back to legacy if needed
 */
export async function authenticateWithFallback(
  request: NextRequest,
  portal: 'customer' | 'team' | 'field' | 'admin'
): Promise<AuthContext | null> {
  const requestId = crypto.randomUUID();

  try {
    // Try unified authentication first
    const unifiedAuth = await authenticateUnified(request, { portal });

    if (unifiedAuth) {
      if (MIGRATION_CONFIG.logMigration) {
        logger.info('Unified auth successful', {
          portal,
          userId: unifiedAuth.session.userId,
          requestId,
        });
      }
      return unifiedAuth;
    }

    // Fall back to legacy auth if enabled
    if (!MIGRATION_CONFIG.enableFallback) {
      return null;
    }

    // Handle legacy authentication based on portal
    if (portal === 'customer') {
      const legacyResult = await legacyAuthenticateRequest(request);

      if (legacyResult.success && legacyResult.user) {
        // Migrate to unified session
        const { session } = await createUnifiedSession(legacyResult.user, 'customer');

        if (MIGRATION_CONFIG.logMigration) {
          logger.info('Migrated customer session to unified auth', {
            userId: session.userId,
            requestId,
          });
        }

        return {
          session,
          user: legacyResult.user,
          isAuthenticated: true,
          hasPermission: (perm) => session.permissions.includes(perm),
          hasRole: (role) => Array.isArray(role)
            ? role.includes(session.role)
            : session.role === role,
        };
      }
    } else if (portal === 'team' || portal === 'field') {
      const legacySession = await legacyGetTeamSession(request);

      if (legacySession) {
        // Create unified session from legacy
        const { session } = await createUnifiedSession(
          {
            id: legacySession.userId,
            email: legacySession.email,
            role: legacySession.role,
            company_id: legacySession.companyId,
          },
          portal
        );

        if (MIGRATION_CONFIG.logMigration) {
          logger.info('Migrated team session to unified auth', {
            portal,
            userId: session.userId,
            requestId,
          });
        }

        return {
          session,
          user: legacySession,
          isAuthenticated: true,
          hasPermission: (perm) => session.permissions.includes(perm),
          hasRole: (role) => Array.isArray(role)
            ? role.includes(session.role)
            : session.role === role,
        };
      }
    }

    return null;
  } catch (error) {
    logger.error('Authentication migration error', {
      error,
      portal,
      requestId,
    });
    return null;
  }
}

/**
 * Migrate existing route handler to unified auth
 */
export function migrateRouteHandler<T = any>(
  handler: (request: NextRequest, context: any) => Promise<NextResponse<T>>,
  options: {
    portal: 'customer' | 'team' | 'field' | 'admin';
    requiredRoles?: string[];
    requiredPermissions?: string[];
    useLegacyContext?: boolean;
  }
) {
  return async (request: NextRequest): Promise<NextResponse<T | { error: any }>> => {
    // Use unified auth with fallback
    const authContext = await authenticateWithFallback(request, options.portal);

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

    // Check roles if required
    if (options.requiredRoles?.length) {
      if (!authContext.hasRole(options.requiredRoles)) {
        return NextResponse.json(
          {
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient permissions',
            },
          },
          { status: 403 }
        );
      }
    }

    // Check permissions if required
    if (options.requiredPermissions?.length) {
      const hasAllPermissions = options.requiredPermissions.every(
        perm => authContext.hasPermission(perm)
      );

      if (!hasAllPermissions) {
        return NextResponse.json(
          {
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient permissions',
            },
          },
          { status: 403 }
        );
      }
    }

    // Convert to legacy context format if needed
    const context = options.useLegacyContext
      ? {
          user: authContext.user,
          customerId: authContext.session.customerId,
          userId: authContext.session.userId,
          orgId: authContext.session.organizationId,
          role: authContext.session.role,
        }
      : authContext;

    try {
      return await handler(request, context);
    } catch (error) {
      logger.error('Route handler error', { error });
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
 * Batch migrate existing sessions to unified system
 */
export async function batchMigrateSessions(): Promise<{
  migrated: number;
  failed: number;
  errors: any[];
}> {
  const results = {
    migrated: 0,
    failed: 0,
    errors: [] as any[],
  };

  try {
    // This would be run as a one-time migration script
    // Implementation depends on current session storage
    logger.info('Batch session migration not implemented yet');
  } catch (error) {
    logger.error('Batch migration failed', { error });
    results.errors.push(error);
  }

  return results;
}

/**
 * Migration status checker
 */
export async function checkMigrationStatus(): Promise<{
  unifiedSessions: number;
  legacySessions: number;
  migrationProgress: number;
}> {
  // This would check both unified and legacy session stores
  // For now, return placeholder data
  return {
    unifiedSessions: 0,
    legacySessions: 0,
    migrationProgress: 0,
  };
}

/**
 * Helper to create unified auth middleware
 */
export function createUnifiedAuthMiddleware(
  portal: 'customer' | 'team' | 'field' | 'admin',
  requiredRoles?: string[]
) {
  return async (request: NextRequest) => {
    const auth = await authenticateWithFallback(request, portal);

    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (requiredRoles?.length && !auth.hasRole(requiredRoles)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Add auth context to request headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', auth.session.userId);
    requestHeaders.set('x-user-role', auth.session.role);
    requestHeaders.set('x-portal', auth.session.portal);

    if (auth.session.organizationId) {
      requestHeaders.set('x-org-id', auth.session.organizationId);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  };
}