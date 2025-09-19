import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { logSecurityEvent } from '@/lib/auth-security';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (real) {
    return real;
  }
  return request.ip || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Get session token from cookie
    const sessionToken = request.cookies.get('team_session')?.value;

    if (!sessionToken) {
      await logSecurityEvent({
        eventType: 'suspicious_activity',
        ipAddress: clientIP,
        userAgent,
        success: false,
        metadata: {
          reason: 'no_session_token',
          attempted_action: 'change_password'
        }
      });

      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get the user from session
    const { data: session } = await supabase
      .from('team_sessions')
      .select(`
        id,
        user_id,
        team_users!inner (
          id,
          email,
          password_hash,
          first_name,
          last_name,
          role,
          is_active
        )
      `)
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (!session?.team_users) {
      await logSecurityEvent({
        eventType: 'suspicious_activity',
        ipAddress: clientIP,
        userAgent,
        success: false,
        metadata: {
          reason: 'invalid_session',
          attempted_action: 'change_password'
        }
      });

      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = session.team_users;

    if (!user.is_active) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({
        error: 'Current password and new password are required'
      }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({
        error: 'New password must be at least 8 characters long'
      }, { status: 400 });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isCurrentPasswordValid) {
      await logSecurityEvent({
        eventType: 'suspicious_activity',
        ipAddress: clientIP,
        userEmail: user.email,
        userAgent,
        success: false,
        metadata: {
          reason: 'incorrect_current_password',
          attempted_action: 'change_password'
        }
      });

      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password in database
    const { error } = await supabase
      .from('team_users')
      .update({
        password_hash: hashedNewPassword,
        password_changed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating password:', error);
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }

    // Log successful password change
    await logSecurityEvent({
      eventType: 'auth_success',
      ipAddress: clientIP,
      userEmail: user.email,
      userAgent,
      success: true,
      metadata: {
        action: 'password_changed',
        user_id: user.id
      }
    });

    return NextResponse.json({
      message: 'Password changed successfully',
      success: true
    });

  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}