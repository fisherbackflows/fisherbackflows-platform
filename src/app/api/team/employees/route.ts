import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

// Get all employees for the current user's company
export async function GET(request: NextRequest) {
  try {
    // Get session token
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('team_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Database connection
    const dbClient = supabaseAdmin || supabase;
    if (!dbClient) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Get session and user
    const { data: session } = await dbClient
      .from('team_sessions')
      .select(`
        team_user_id,
        team_users!inner(
          id,
          email,
          first_name,
          last_name,
          role,
          company_id,
          is_active
        )
      `)
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const user = session.team_users;
    if (!user.is_active || !user.company_id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Only company admins can view all employees
    if (user.role !== 'company_admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get all employees for the company
    const { data: employees, error: employeesError } = await dbClient
      .from('team_users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        phone,
        license_number,
        is_active,
        last_login,
        created_at,
        invited_at,
        invitation_accepted_at
      `)
      .eq('company_id', user.company_id)
      .order('created_at', { ascending: true });

    if (employeesError) {
      console.error('Error fetching employees:', employeesError);
      return NextResponse.json(
        { error: 'Failed to fetch employees' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      employees: employees || [],
      total: employees?.length || 0
    });

  } catch (error) {
    console.error('Employees API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}