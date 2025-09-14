import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('team_session')?.value;

    if (sessionToken) {
      // In development mode without Supabase, remove from mock sessions
      if (!isSupabaseConfigured) {
        const mockSessions = global.mockTeamSessions || {};
        delete mockSessions[sessionToken];
      } else if (supabase) {
        // Remove session from database in production
        await supabase
          .from('team_sessions')
          .delete()
          .eq('session_token', sessionToken);
      }
    }

    // Create response with complete cookie cleanup
    const response = NextResponse.json({ success: true });

    // Clear team_session cookie
    response.cookies.set('team_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    // Clear any other potential session cookies
    response.cookies.set('session', '', {
      maxAge: 0,
      path: '/'
    });

    response.cookies.set('auth', '', {
      maxAge: 0,
      path: '/'
    });

    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;

  } catch (error) {
    console.error('Team logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}