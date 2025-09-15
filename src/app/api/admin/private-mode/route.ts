import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const isPrivateMode = request.cookies.get('site-private-mode')?.value === 'true';
    
    return NextResponse.json({
      privateMode: isPrivateMode,
      status: isPrivateMode ? 'private' : 'public'
    });
  } catch (error) {
    console.error('Private mode check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user has admin access
    const teamSession = request.cookies.get('team_session')?.value;
    const adminBypass = request.cookies.get('admin-bypass')?.value;
    
    if (!teamSession && !adminBypass) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 401 }
      );
    }

    const { enable } = await request.json();
    
    // Set or remove the private mode cookie
    const cookieStore = await cookies();
    
    if (enable) {
      cookieStore.set('site-private-mode', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });
    } else {
      cookieStore.delete('site-private-mode');
    }
    
    return NextResponse.json({
      success: true,
      message: enable ? 'Private mode enabled' : 'Private mode disabled',
      newStatus: enable ? 'private' : 'public'
    });

  } catch (error) {
    console.error('Private mode toggle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}