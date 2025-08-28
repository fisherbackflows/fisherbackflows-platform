/**
 * Minimalist Authentication - Fisher Backflows
 * Single source of truth: Supabase Auth
 */

import { createClientComponentClient, createServerComponentClient, createRouteHandlerClient } from './supabase';
import { NextRequest, NextResponse } from 'next/server';

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