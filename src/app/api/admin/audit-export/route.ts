import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { auditLogger } from '@/lib/audit-logger';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { format, filters, startDate, endDate } = await request.json();

    const supabase = createRouteHandlerClient({ cookies });

    // Verify admin authentication
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('team_users')
      .select('role')
      .eq('user_id', authUser.id)
      .single();

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Export audit logs
    const exportData = await auditLogger.exportLogs(
      format,
      {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        regulation: filters.regulation || undefined,
        userId: authUser.id
      }
    );

    // Set appropriate content type and filename
    const timestamp = new Date().toISOString().split('T')[0];
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'csv':
        contentType = 'text/csv';
        filename = `audit-logs-${timestamp}.csv`;
        break;
      case 'xml':
        contentType = 'application/xml';
        filename = `audit-logs-${timestamp}.xml`;
        break;
      default:
        contentType = 'application/json';
        filename = `audit-logs-${timestamp}.json`;
    }

    return new NextResponse(exportData, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': Buffer.byteLength(exportData, 'utf8').toString(),
      }
    });

  } catch (error) {
    console.error('Failed to export audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to export audit logs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}