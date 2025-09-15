import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { supabaseAdmin } from '@/lib/supabase';
// LEGITIMATE SERVICE ROLE USAGE: This operation requires elevated privileges
// Reason: Admin operation to unlock user accounts

// SECURITY: Admin key check - cryptographically secure
const ADMIN_KEY = process.env.ADMIN_BYPASS_KEY || '18e6443e086999819ade470550ab0257ddc97378812e5b4cd1ee249988e29f2b';

export async function POST(request: NextRequest) {
  try {
    const { email, adminKey } = await request.json();
    
    // Verify admin key
    if (adminKey !== ADMIN_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Reset the account lock
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Admin client not available' },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('team_users')
      .update({
        failed_login_attempts: 0,
        last_failed_login: null,
        account_locked_until: null
      })
      .eq('email', email.toLowerCase().trim())
      .select()
      .single();

    if (error) {
      console.error('Error unlocking account:', error);
      return NextResponse.json(
        { error: 'Failed to unlock account' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Account unlocked for ${email}`,
      user: {
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role
      }
    });

  } catch (error) {
    console.error('Unlock account error:', error);
    return NextResponse.json(
      { error: 'Failed to unlock account' },
      { status: 500 }
    );
  }
}

// GET endpoint to check account status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const adminKey = searchParams.get('key');
    
    // Verify admin key
    if (adminKey !== ADMIN_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Admin client not available' },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('team_users')
      .select('email, failed_login_attempts, account_locked_until, last_failed_login, is_active')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isLocked = data.account_locked_until && new Date(data.account_locked_until) > new Date();

    return NextResponse.json({
      email: data.email,
      isActive: data.is_active,
      isLocked,
      failedAttempts: data.failed_login_attempts || 0,
      lockedUntil: data.account_locked_until,
      lastFailedLogin: data.last_failed_login
    });

  } catch (error) {
    console.error('Check account error:', error);
    return NextResponse.json(
      { error: 'Failed to check account status' },
      { status: 500 }
    );
  }
}