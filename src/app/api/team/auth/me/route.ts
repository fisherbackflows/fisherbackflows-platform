import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth-security';
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

    // Use the production session validation
    const sessionValidation = await validateSession(sessionToken);

    if (!sessionValidation.isValid) {
      // Clear invalid session cookie
      const response = NextResponse.json(
        { error: sessionValidation.error || 'Session expired' },
        { status: 401 }
      );
      
      response.cookies.set('team_session', '', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 0,
        path: '/',
        ...(process.env.NODE_ENV === 'production' && {
          domain: '.fisherbackflows.com'
        })
      });

      return response;
    }

    // Return user data
    return NextResponse.json({
      user: sessionValidation.user,
      role: sessionValidation.user.role,
      session: sessionValidation.session
    });

  } catch (error) {
    console.error('Team auth check error:', error);
    return NextResponse.json(
      { error: 'Authentication check failed' },
      { status: 500 }
    );
  }
}