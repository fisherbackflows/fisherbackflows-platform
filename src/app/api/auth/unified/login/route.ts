/**
 * Unified Login API Route
 * Handles authentication for all portals using the unified system
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { createUnifiedSession } from '@/lib/auth/unified-auth-system';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Request validation schema
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  portal: z.enum(['customer', 'team', 'field', 'admin']),
  rememberMe: z.boolean().optional(),
});

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = LoginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { email, password, portal, rememberMe } = validation.data;

    // Log login attempt
    logger.info('Login attempt', {
      email,
      portal,
      requestId,
    });

    // Determine user lookup based on portal
    let user = null;
    let isValidPassword = false;

    if (portal === 'customer') {
      // Authenticate customer
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (customer && customer.password_hash) {
        isValidPassword = await bcrypt.compare(password, customer.password_hash);
        if (isValidPassword) {
          user = customer;
        }
      }

      // Also try Supabase auth for customers
      if (!user) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authData?.user && !authError) {
          // Get customer record
          const { data: authCustomer } = await supabase
            .from('customers')
            .select('*')
            .eq('auth_user_id', authData.user.id)
            .single();

          if (authCustomer) {
            user = authCustomer;
          }
        }
      }
    } else {
      // Authenticate team member
      const { data: teamUser } = await supabase
        .from('team_users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (teamUser) {
        // Check portal access
        const portalRoleMap: Record<string, string[]> = {
          team: ['admin', 'manager', 'coordinator', 'technician', 'inspector'],
          field: ['technician', 'inspector'],
          admin: ['admin'],
        };

        const allowedRoles = portalRoleMap[portal] || [];
        if (!allowedRoles.includes(teamUser.role)) {
          return NextResponse.json(
            {
              error: {
                code: 'PORTAL_ACCESS_DENIED',
                message: `Your role (${teamUser.role}) does not have access to the ${portal} portal`,
              },
            },
            { status: 403 }
          );
        }

        // Verify password
        if (teamUser.password_hash) {
          isValidPassword = await bcrypt.compare(password, teamUser.password_hash);
          if (isValidPassword) {
            user = teamUser;
          }
        }
      }
    }

    // Check if authentication was successful
    if (!user) {
      // Log failed attempt
      await supabase.from('security_logs').insert({
        event_type: 'login_failed',
        user_id: null,
        email,
        portal,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
        metadata: { requestId },
      });

      return NextResponse.json(
        {
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        },
        { status: 401 }
      );
    }

    // Check account status
    if (portal === 'customer' && user.account_status !== 'active') {
      return NextResponse.json(
        {
          error: {
            code: 'ACCOUNT_INACTIVE',
            message: `Your account is ${user.account_status}. Please contact support.`,
          },
        },
        { status: 403 }
      );
    }

    if (portal !== 'customer' && user.is_active === false) {
      return NextResponse.json(
        {
          error: {
            code: 'ACCOUNT_DISABLED',
            message: 'Your account has been disabled. Please contact your administrator.',
          },
        },
        { status: 403 }
      );
    }

    // Create unified session
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name || user.contact_name || `${user.first_name} ${user.last_name}`,
        role: user.role || 'customer',
        portal,
      },
    });

    const { session, token } = await createUnifiedSession(user, portal, response);

    // Set session duration based on rememberMe
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 8 * 60 * 60; // 30 days or 8 hours
    const cookieName = `${portal}_session`;

    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/',
    });

    // Log successful login
    await supabase.from('security_logs').insert({
      event_type: 'login_success',
      user_id: user.id,
      email: user.email,
      portal,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
      metadata: {
        requestId,
        sessionId: session.id,
        rememberMe,
      },
    });

    logger.info('Login successful', {
      userId: user.id,
      email: user.email,
      portal,
      sessionId: session.id,
      requestId,
    });

    return response;
  } catch (error) {
    logger.error('Login error', {
      error,
      requestId,
    });

    return NextResponse.json(
      {
        error: {
          code: 'LOGIN_ERROR',
          message: 'An error occurred during login',
        },
      },
      { status: 500 }
    );
  }
}