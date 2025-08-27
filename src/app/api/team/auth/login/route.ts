import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // In development mode without Supabase, use mock authentication
    if (!isSupabaseConfigured) {
      // Mock admin user for development
      if (email.toLowerCase() === 'admin@fisherbackflows.com' && password === 'password') {
        const sessionToken = uuidv4();
        const userData = {
          id: '1',
          email: 'admin@fisherbackflows.com',
          role: 'admin',
          first_name: 'Admin',
          last_name: 'Fisher',
          is_active: true
        };

        // Set secure cookie
        const cookieStore = await cookies();
        cookieStore.set('team_session', sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 8 * 60 * 60, // 8 hours
          path: '/'
        });

        // Store mock session in memory (for development only)
        global.mockTeamSessions = global.mockTeamSessions || {};
        global.mockTeamSessions[sessionToken] = {
          user: userData,
          expiresAt: Date.now() + (8 * 60 * 60 * 1000)
        };

        return NextResponse.json({
          user: userData,
          role: userData.role
        });
      } else {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }
    }

    // Production Supabase authentication
    if (!supabase) {
      return NextResponse.json(
        { error: 'Authentication service unavailable' },
        { status: 503 }
      );
    }

    // Get user from team_users table
    const { data: user, error: userError } = await supabase
      .from('team_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create session token
    const sessionToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 8); // 8 hour session

    // Store session in database
    const { error: sessionError } = await supabase
      .from('team_sessions')
      .insert({
        team_user_id: user.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString()
      });

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      );
    }

    // Update last login
    await supabase
      .from('team_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Set secure cookie
    const cookieStore = await cookies();
    cookieStore.set('team_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/'
    });

    // Return user data (without password hash)
    const { password_hash, ...userData } = user;
    
    return NextResponse.json({
      user: userData,
      role: user.role
    });

  } catch (error) {
    console.error('Team login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}