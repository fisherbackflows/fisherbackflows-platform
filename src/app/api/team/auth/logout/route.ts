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

    // Clear cookie
    cookieStore.set('team_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Team logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}