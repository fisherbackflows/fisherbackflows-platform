import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { validateSession } from '@/lib/auth-security';

export async function POST(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('team_session')?.value;
    
    if (!sessionToken) {
      return NextResponse.json(
        { valid: false, error: 'No session token provided' },
        { status: 401 }
      );
    }

    // Validate the session
    const validation = await validateSession(sessionToken);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { valid: false, error: validation.error },
        { status: 401 }
      );
    }

    // Return user info for authorized access
    return NextResponse.json({
      valid: true,
      user: {
        id: validation.user.id,
        email: validation.user.email,
        role: validation.user.role,
        first_name: validation.user.first_name,
        last_name: validation.user.last_name
      },
      session: {
        expires_at: validation.session?.expires_at,
        last_activity: validation.session?.last_activity
      }
    });

  } catch (error) {
    console.error('Session validation API error:', error);
    return NextResponse.json(
      { valid: false, error: 'Session validation failed' },
      { status: 500 }
    );
  }
}