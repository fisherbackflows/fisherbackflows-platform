/**
 * Unified Login API Route
 * Handles authentication for all portals using the unified system
 */

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_for_production_1614aa41ebc6a184fbe318c11ab915ada4f583055a92b98b09c5e1589965528b';

// Request validation schema
interface LoginRequest {
  email: string;
  password: string;
  userType: 'auto' | 'customer' | 'business' | 'field' | 'admin';
  returnTo?: string;
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  role: 'customer' | 'business_owner' | 'business_admin' | 'field_tech' | 'admin';
  is_active: boolean;
  failed_login_attempts?: number;
  locked_until?: string;
  company_id?: string;
}

// Rate limiting storage (in production, use Redis)
const loginAttempts = new Map<string, { count: number; lastAttempt: number; lockedUntil?: number }>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password, userType, returnTo } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const attemptKey = `${email}-${clientIP}`;

    // Check rate limiting
    const attempts = loginAttempts.get(attemptKey);
    const now = Date.now();

    if (attempts) {
      // Clean up old attempts
      if (now - attempts.lastAttempt > ATTEMPT_WINDOW) {
        loginAttempts.delete(attemptKey);
      } else if (attempts.lockedUntil && now < attempts.lockedUntil) {
        const retryAfter = Math.ceil((attempts.lockedUntil - now) / 1000);
        return NextResponse.json(
          { success: false, error: 'Too many login attempts', retryAfter },
          { status: 429 }
        );
      } else if (attempts.count >= MAX_ATTEMPTS && !attempts.lockedUntil) {
        // Lock the account
        attempts.lockedUntil = now + LOCKOUT_DURATION;
        const retryAfter = Math.ceil(LOCKOUT_DURATION / 1000);
        return NextResponse.json(
          { success: false, error: 'Too many login attempts', retryAfter },
          { status: 429 }
        );
      }
    }

    // Find user across all user tables based on userType
    let user: User | null = null;
    let userTable = '';

    if (userType === 'auto' || userType === 'customer') {
      // Check customers table
      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .single();

      if (customerData) {
        user = {
          ...customerData,
          role: 'customer' as const,
          name: `${customerData.first_name} ${customerData.last_name}`.trim()
        };
        userTable = 'customers';
      }
    }

    if (!user && (userType === 'auto' || userType === 'business')) {
      // Check business users table
      const { data: businessData } = await supabase
        .from('business_users')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .single();

      if (businessData) {
        user = {
          ...businessData,
          name: businessData.name || `${businessData.first_name} ${businessData.last_name}`.trim()
        };
        userTable = 'business_users';
      }
    }

    if (!user && (userType === 'auto' || userType === 'field')) {
      // Check field technicians table
      const { data: fieldData } = await supabase
        .from('field_technicians')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .single();

      if (fieldData) {
        user = {
          ...fieldData,
          role: 'field_tech' as const,
          name: `${fieldData.first_name} ${fieldData.last_name}`.trim()
        };
        userTable = 'field_technicians';
      }
    }

    if (!user && (userType === 'auto' || userType === 'admin')) {
      // Check admin users table
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .single();

      if (adminData) {
        user = {
          ...adminData,
          role: 'admin' as const,
          name: adminData.name || `${adminData.first_name} ${adminData.last_name}`.trim()
        };
        userTable = 'admin_users';
      }
    }

    if (!user) {
      // Record failed attempt
      const currentAttempts = loginAttempts.get(attemptKey) || { count: 0, lastAttempt: 0 };
      loginAttempts.set(attemptKey, {
        count: currentAttempts.count + 1,
        lastAttempt: now
      });

      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return NextResponse.json(
        { success: false, error: 'Account is temporarily locked. Please contact support.' },
        { status: 423 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      // Record failed attempt
      const currentAttempts = loginAttempts.get(attemptKey) || { count: 0, lastAttempt: 0 };
      loginAttempts.set(attemptKey, {
        count: currentAttempts.count + 1,
        lastAttempt: now
      });

      // Update failed login attempts in database
      await supabase
        .from(userTable)
        .update({
          failed_login_attempts: (user.failed_login_attempts || 0) + 1,
          last_login_attempt: new Date().toISOString()
        })
        .eq('id', user.id);

      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Clear failed attempts on successful login
    loginAttempts.delete(attemptKey);

    // Update successful login
    await supabase
      .from(userTable)
      .update({
        last_login: new Date().toISOString(),
        failed_login_attempts: 0,
        locked_until: null
      })
      .eq('id', user.id);

    // Generate JWT token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      companyId: user.company_id,
      userTable
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    // Determine redirect path based on role
    const getRedirectPath = (role: string): string => {
      switch (role) {
        case 'customer':
          return '/portal/dashboard';
        case 'business_owner':
        case 'business_admin':
          return '/business';
        case 'field_tech':
          return '/field';
        case 'admin':
          return '/admin';
        default:
          return '/portal/dashboard';
      }
    };

    const redirectPath = getRedirectPath(user.role);

    // Create response with secure cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        redirectPath
      }
    });

    // Set secure HTTP-only cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    });

    // Also set a client-accessible token for frontend use
    response.cookies.set('user_session', JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    }), {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}