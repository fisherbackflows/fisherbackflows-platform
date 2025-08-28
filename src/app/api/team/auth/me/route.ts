import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('team_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // In development mode without Supabase, use mock sessions
    if (!isSupabaseConfigured) {
      const mockSessions = global.mockTeamSessions || {};
      const session = mockSessions[sessionToken];

      if (!session || session.expiresAt < Date.now()) {
        // Clean up expired session
        if (session) {
          delete mockSessions[sessionToken];
        }
        
        cookieStore.set('team_session', '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 0,
          path: '/'
        });

        return NextResponse.json(
          { error: 'Session expired' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        user: session.user,
        role: session.user.role
      });
    }

    // Production Supabase authentication
    if (!supabase) {
      return NextResponse.json(
        { error: 'Authentication service unavailable' },
        { status: 503 }
      );
    }

    // Get session and user data
    const { data: session, error: sessionError } = await supabase
      .from('team_sessions')
      .select(`
        *,
        team_users (*)
      `)
      .eq('session_token', sessionToken)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      // Clean up expired/invalid session
      cookieStore.set('team_session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/'
      });

      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    // Return user data (without password hash)
    const { password_hash, ...userData } = session.team_users;
    
    return NextResponse.json({
      user: userData,
      role: userData.role
    });

  } catch (error) {
    console.error('Team auth check error:', error);
    return NextResponse.json(
      { error: 'Authentication check failed' },
      { status: 500 }
    );
  }
}