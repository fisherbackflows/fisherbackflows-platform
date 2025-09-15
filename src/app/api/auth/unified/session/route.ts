/**
 * Unified Session Validation API Route
 * Validates and returns current session information
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateUnified,
  refreshUnifiedSession,
  getActiveSessions
} from '@/lib/auth/unified-auth-system';
import { logger } from '@/lib/logger';

/**
 * GET - Validate current session
 */
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    // Get portal from headers or query
    const portal = (request.headers.get('x-portal') ||
                   request.nextUrl.searchParams.get('portal') ||
                   'customer') as 'customer' | 'team' | 'field' | 'admin';

    // Authenticate user
    const authContext = await authenticateUnified(request, { portal });

    if (!authContext) {
      return NextResponse.json(
        {
          authenticated: false,
          message: 'No valid session',
        },
        { status: 401 }
      );
    }

    const { session, user } = authContext;

    // Check if session needs refresh (within 15 minutes of expiry)
    const timeUntilExpiry = session.expiresAt - Date.now();
    const shouldRefresh = timeUntilExpiry < 15 * 60 * 1000; // 15 minutes

    let newToken = null;
    if (shouldRefresh) {
      try {
        const refreshResult = await refreshUnifiedSession(session.id, portal);
        if (refreshResult) {
          newToken = refreshResult.token;
          logger.info('Session refreshed', {
            sessionId: session.id,
            userId: session.userId,
            requestId,
          });
        }
      } catch (error) {
        logger.error('Session refresh failed', { error, sessionId: session.id });
      }
    }

    const response = NextResponse.json({
      authenticated: true,
      session: {
        id: session.id,
        userId: session.userId,
        email: session.email,
        role: session.role,
        portal: session.portal,
        organizationId: session.organizationId,
        permissions: session.permissions,
        expiresAt: session.expiresAt,
        expiresIn: Math.floor(timeUntilExpiry / 1000), // seconds
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name || user.contact_name || `${user.first_name} ${user.last_name}`,
        role: user.role || 'customer',
        avatar: user.avatar_url,
      },
      refreshed: !!newToken,
    });

    // Set new token if refreshed
    if (newToken) {
      const cookieName = `${portal}_session`;
      response.cookies.set(cookieName, newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 8 * 60 * 60, // 8 hours
        path: '/',
      });
    }

    return response;
  } catch (error) {
    logger.error('Session validation error', {
      error,
      requestId,
    });

    return NextResponse.json(
      {
        authenticated: false,
        error: {
          code: 'SESSION_ERROR',
          message: 'Failed to validate session',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Refresh current session
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    // Get portal
    const portal = (request.headers.get('x-portal') || 'customer') as
                   'customer' | 'team' | 'field' | 'admin';

    // Authenticate user
    const authContext = await authenticateUnified(request, { portal });

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

    const { session } = authContext;

    // Refresh the session
    const refreshResult = await refreshUnifiedSession(session.id, portal);

    if (!refreshResult) {
      return NextResponse.json(
        {
          error: {
            code: 'REFRESH_FAILED',
            message: 'Failed to refresh session',
          },
        },
        { status: 400 }
      );
    }

    const { session: newSession, token } = refreshResult;

    // Create response with new token
    const response = NextResponse.json({
      success: true,
      session: {
        id: newSession.id,
        userId: newSession.userId,
        email: newSession.email,
        role: newSession.role,
        portal: newSession.portal,
        expiresAt: newSession.expiresAt,
      },
    });

    // Set new token in cookie
    const cookieName = `${portal}_session`;
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/',
    });

    logger.info('Session refreshed via API', {
      sessionId: newSession.id,
      userId: newSession.userId,
      requestId,
    });

    return response;
  } catch (error) {
    logger.error('Session refresh error', {
      error,
      requestId,
    });

    return NextResponse.json(
      {
        error: {
          code: 'REFRESH_ERROR',
          message: 'Failed to refresh session',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/unified/session/all - Get all active sessions for user
 */
export async function getAllSessions(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    // Get portal
    const portal = (request.headers.get('x-portal') || 'customer') as
                   'customer' | 'team' | 'field' | 'admin';

    // Authenticate user
    const authContext = await authenticateUnified(request, { portal });

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

    const { session } = authContext;

    // Get all active sessions for this user
    const sessions = await getActiveSessions(session.userId);

    return NextResponse.json({
      success: true,
      sessions: sessions.map(s => ({
        id: s.id,
        portal: s.portal,
        role: s.role,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        isCurrent: s.id === session.id,
      })),
      count: sessions.length,
    });
  } catch (error) {
    logger.error('Get all sessions error', {
      error,
      requestId,
    });

    return NextResponse.json(
      {
        error: {
          code: 'SESSION_ERROR',
          message: 'Failed to retrieve sessions',
        },
      },
      { status: 500 }
    );
  }
}