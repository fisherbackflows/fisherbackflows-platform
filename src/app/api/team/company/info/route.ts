import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

// Get current user's company information
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

    // Get company information
    const { data: company, error: companyError } = await dbClient
      .from('companies')
      .select(`
        id,
        name,
        slug,
        email,
        phone,
        website,
        address_line1,
        address_line2,
        city,
        state,
        zip_code,
        business_type,
        license_number,
        certification_level,
        plan_type,
        max_users,
        status,
        trial_ends_at,
        features,
        created_at
      `)
      .eq('id', user.company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Get company settings
    const { data: settings } = await dbClient
      .from('company_settings')
      .select('*')
      .eq('company_id', user.company_id)
      .single();

    // Get employee count
    const { count: employeeCount } = await dbClient
      .from('team_users')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', user.company_id)
      .eq('is_active', true);

    // Get pending invitations count
    const { count: pendingInvitations } = await dbClient
      .from('user_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', user.company_id)
      .eq('status', 'pending');

    const response = {
      id: company.id,
      name: company.name,
      slug: company.slug,
      email: company.email,
      phone: company.phone,
      website: company.website,
      address: {
        line1: company.address_line1,
        line2: company.address_line2,
        city: company.city,
        state: company.state,
        zip_code: company.zip_code
      },
      business_type: company.business_type,
      license_number: company.license_number,
      certification_level: company.certification_level,
      plan_type: company.plan_type,
      max_users: company.max_users,
      current_users: employeeCount || 0,
      pending_invitations: pendingInvitations || 0,
      status: company.status,
      trial_ends_at: company.trial_ends_at,
      features: company.features,
      settings: settings || {},
      created_at: company.created_at
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Company info error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}