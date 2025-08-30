/**
 * Complete Authentication System - Fisher Backflows
 * Handles customer and team authentication with proper role management
 */

import { createClientComponentClient, createServerComponentClient, createRouteHandlerClient } from './supabase';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// Global types for mock sessions
declare global {
  var mockTeamSessions: { [key: string]: { user: any; expiresAt: number } } | undefined;
}

// User types
export interface User {
  id: string;
  email: string;
  role: 'customer' | 'technician' | 'admin';
  metadata?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    companyName?: string;
    accountNumber?: string;
  };
}

// Auth helpers for different contexts
export const auth = {
  // Client-side auth
  async getUser(): Promise<User | null> {
    const supabase = createClientComponentClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email!,
      role: user.user_metadata?.role || 'customer',
      metadata: user.user_metadata
    };
  },

  // Server-side auth (App Router)
  async getServerUser(): Promise<User | null> {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email!,
      role: user.user_metadata?.role || 'customer',
      metadata: user.user_metadata
    };
  },

  // API route auth
  async getApiUser(request: NextRequest): Promise<User | null> {
    // First try custom team session authentication
    const cookies = request.cookies;
    const teamSession = cookies.get('team_session')?.value;
    
    if (teamSession) {
      // Check if it's a mock session (development mode)
      if (global.mockTeamSessions && global.mockTeamSessions[teamSession]) {
        const session = global.mockTeamSessions[teamSession];
        if (session.expiresAt > Date.now()) {
          return {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role as 'customer' | 'technician' | 'admin',
            metadata: {
              firstName: session.user.first_name,
              lastName: session.user.last_name
            }
          };
        }
      }
      
      // Check database for team session (if not read-only mode)
      try {
        const supabase = createRouteHandlerClient(request);
        const { data: session } = await supabase
          .from('team_sessions')
          .select(`
            team_user_id,
            expires_at,
            team_users (
              id, email, role, first_name, last_name, is_active
            )
          `)
          .eq('session_token', teamSession)
          .gt('expires_at', new Date().toISOString())
          .single();
          
        if (session?.team_users) {
          const user = session.team_users as any;
          return {
            id: user.id,
            email: user.email,
            role: user.role as 'customer' | 'technician' | 'admin',
            metadata: {
              firstName: user.first_name,
              lastName: user.last_name
            }
          };
        }
      } catch (error) {
        // If database query fails, continue to Supabase auth
      }
    }
    
    // Fallback to Supabase auth for customer authentication
    const supabase = createRouteHandlerClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email!,
      role: user.user_metadata?.role || 'customer',
      metadata: user.user_metadata
    };
  },

  // Sign in
  async signIn(email: string, password: string) {
    const supabase = createClientComponentClient();
    return await supabase.auth.signInWithPassword({ email, password });
  },

  // Sign up
  async signUp(email: string, password: string, metadata?: any) {
    const supabase = createClientComponentClient();
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
  },

  // Sign out
  async signOut() {
    const supabase = createClientComponentClient();
    return await supabase.auth.signOut();
  },

  // Password reset
  async resetPassword(email: string) {
    const supabase = createClientComponentClient();
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/portal/reset-password`
    });
  },

  // Update password
  async updatePassword(newPassword: string) {
    const supabase = createClientComponentClient();
    return await supabase.auth.updateUser({ password: newPassword });
  }
};

// Middleware helper for protected routes
export function requireAuth(allowedRoles?: string[]) {
  return async (request: NextRequest) => {
    const user = await auth.getApiUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    return user;
  };
}

// Legacy auth function exports for backward compatibility
export async function signInCustomer(email: string, password: string) {
  const supabase = createClientComponentClient();
  
  // First check if customer exists in customers table
  const { data: customer } = await supabase
    .from('customers')
    .select('id, email, password_hash, first_name, last_name')
    .eq('email', email)
    .single();

  if (!customer) {
    return { error: { message: 'Invalid email or password' }, data: { user: null } };
  }

  // Verify password if customer has password_hash
  if (customer.password_hash) {
    const passwordMatch = await bcrypt.compare(password, customer.password_hash);
    if (!passwordMatch) {
      return { error: { message: 'Invalid email or password' }, data: { user: null } };
    }
  }

  // Sign in with Supabase Auth
  const result = await supabase.auth.signInWithPassword({ email, password });
  
  if (result.data.user) {
    // Update user metadata with customer info
    await supabase.auth.updateUser({
      data: { 
        role: 'customer',
        customer_id: customer.id,
        first_name: customer.first_name,
        last_name: customer.last_name
      }
    });
  }
  
  return result;
}

export async function signInTech(email: string, password: string) {
  const supabase = createClientComponentClient();
  
  // Check if technician exists in team_users table
  const { data: teamUser } = await supabase
    .from('team_users')
    .select('id, email, password_hash, role, first_name, last_name, license_number')
    .eq('email', email)
    .eq('is_active', true)
    .single();

  if (!teamUser) {
    return { error: { message: 'Invalid email or password' }, data: { user: null } };
  }

  // Verify password
  const passwordMatch = await bcrypt.compare(password, teamUser.password_hash);
  if (!passwordMatch) {
    return { error: { message: 'Invalid email or password' }, data: { user: null } };
  }

  // Sign in with Supabase Auth
  const result = await supabase.auth.signInWithPassword({ email, password });
  
  if (result.data.user) {
    // Update user metadata with team info
    await supabase.auth.updateUser({
      data: { 
        role: teamUser.role,
        team_user_id: teamUser.id,
        first_name: teamUser.first_name,
        last_name: teamUser.last_name,
        license_number: teamUser.license_number
      }
    });

    // Update last_login timestamp
    await supabase
      .from('team_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', teamUser.id);
  }
  
  return result;
}

export async function getCurrentUser() {
  return auth.getUser();
}

export async function getCurrentTech() {
  const user = await auth.getUser();
  if (user && user.role === 'technician') {
    return user;
  }
  return null;
}

export async function signOut() {
  return auth.signOut();
}

export async function signOutTech() {
  return auth.signOut();
}

export async function isAuthenticatedTech() {
  const user = await auth.getUser();
  return user && user.role === 'technician';
}