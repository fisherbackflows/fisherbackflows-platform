/**
 * Unified Logout API Route
 * Handles session termination for all portals
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateUnified, destroyUnifiedSession } from '@/lib/auth/unified-auth-system';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    // Get portal from request or headers
    const portal = (request.headers.get('x-portal') ||
                   request.nextUrl.searchParams.get('portal') ||
                   'customer') as 'customer' | 'team' | 'field' | 'admin';

    // Authenticate user
    const authContext = await authenticateUnified(request, { portal });

    if (!authContext) {
      // Already logged out
      return NextResponse.json({
        success: true,
        message: 'Already logged out',
      });
    }

    const { session } = authContext;

    // Log logout event
    await supabase.from('security_logs').insert({
      event_type: 'logout',
      user_id: session.userId,
      email: session.email,
      portal,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
      metadata: {
        requestId,
        sessionId: session.id,
      },
    });

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Destroy session
    await destroyUnifiedSession(session.id, portal, response);

    // Clear all portal cookies
    const portals = ['customer', 'team', 'field', 'admin'];
    portals.forEach(p => {
      response.cookies.delete(`${p}_session`);
    });

    // If using Supabase Auth, sign out there too
    if (portal === 'customer') {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        // Ignore Supabase signout errors
        logger.debug('Supabase signout error (ignored)', { error });
      }
    }

    logger.info('Logout successful', {
      userId: session.userId,
      email: session.email,
      portal,
      sessionId: session.id,
      requestId,
    });

    return response;
  } catch (error) {
    logger.error('Logout error', {
      error,
      requestId,
    });

    // Even on error, clear cookies
    const response = NextResponse.json({
      success: false,
      error: {
        code: 'LOGOUT_ERROR',
        message: 'An error occurred during logout',
      },
    });

    // Clear all portal cookies
    const portals = ['customer', 'team', 'field', 'admin'];
    portals.forEach(p => {
      response.cookies.delete(`${p}_session`);
    });

    return response;
  }
}

/**
 * Logout all sessions for the current user
 */
export async function DELETE(request: NextRequest) {
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

    // Revoke all sessions for this user
    const { error } = await supabase
      .from('unified_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', session.userId)
      .is('revoked_at', null);

    if (error) {
      throw error;
    }

    // Log event
    await supabase.from('security_logs').insert({
      event_type: 'logout_all_sessions',
      user_id: session.userId,
      email: session.email,
      portal,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
      metadata: { requestId },
    });

    // Create response and clear all cookies
    const response = NextResponse.json({
      success: true,
      message: 'All sessions logged out successfully',
    });

    const portals = ['customer', 'team', 'field', 'admin'];
    portals.forEach(p => {
      response.cookies.delete(`${p}_session`);
    });

    logger.info('All sessions logged out', {
      userId: session.userId,
      email: session.email,
      requestId,
    });

    return response;
  } catch (error) {
    logger.error('Logout all sessions error', {
      error,
      requestId,
    });

    return NextResponse.json(
      {
        error: {
          code: 'LOGOUT_ERROR',
          message: 'Failed to logout all sessions',
        },
      },
      { status: 500 }
    );
  }
}