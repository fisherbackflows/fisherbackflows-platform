import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GPT5Service } from '@/lib/ai/gpt5-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { reportType, period, format, includeCharts, customFilters } = await request.json();

    // Verify admin access
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: teamUser } = await supabase
      .from('team_users')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (!teamUser || !['admin', 'manager'].includes(teamUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Validate inputs
    const validReportTypes = ['executive-summary', 'compliance', 'water-district', 'customer-health', 'operational-performance'];
    if (!reportType || !validReportTypes.includes(reportType)) {
      return NextResponse.json({ 
        error: 'Invalid report type', 
        validTypes: validReportTypes 
      }, { status: 400 });
    }

    if (!period) {
      return NextResponse.json({ error: 'Period is required' }, { status: 400 });
    }

    const gpt5Service = new GPT5Service();
    
    // Generate the report using GPT-5
    const report = await gpt5Service.generateAutomatedReport({
      reportType,
      period,
      format: format || 'html',
      includeCharts: includeCharts || false
    });

    // Apply any custom filters or modifications
    if (customFilters) {
      report.content = await applyCustomFilters(report.content, customFilters);
    }

    // Store the generated report
    const { data: savedReport, error: saveError } = await supabase
      .from('generated_reports')
      .insert({
        title: report.title,
        report_type: reportType,
        period,
        content: report.content,
        sections: report.sections,
        metadata: report.metadata,
        format: format || 'html',
        generated_by: session.user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save report:', saveError);
      // Continue anyway - return the report even if we can't save it
    }

    // Log report generation
    await supabase.from('audit_logs').insert({
      table_name: 'generated_reports',
      action: 'AI_REPORT_GENERATED',
      details: {
        reportType,
        period,
        format,
        includeCharts,
        wordCount: report.metadata.wordCount,
        sectionCount: report.sections.length,
        reportId: savedReport?.id
      },
      created_by: session.user.id
    });

    return NextResponse.json({
      success: true,
      report: {
        id: savedReport?.id,
        ...report
      }
    });
  } catch (error) {
    console.error('Generate Report API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const reportId = url.searchParams.get('reportId');
    const reportType = url.searchParams.get('type');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // Verify admin access
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: teamUser } = await supabase
      .from('team_users')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (!teamUser || !['admin', 'manager'].includes(teamUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (reportId) {
      // Get specific report
      const { data: report, error } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error || !report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }

      return NextResponse.json({ report });
    } else {
      // List reports with optional filtering
      let query = supabase
        .from('generated_reports')
        .select('id, title, report_type, period, format, created_at, generated_by, metadata')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (reportType) {
        query = query.eq('report_type', reportType);
      }

      const { data: reports, error } = await query;

      if (error) {
        throw error;
      }

      return NextResponse.json({ 
        reports: reports || [],
        count: reports?.length || 0 
      });
    }
  } catch (error) {
    console.error('Get Reports API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve reports' },
      { status: 500 }
    );
  }
}

async function applyCustomFilters(content: string, filters: any): Promise<string> {
  // Apply custom filtering logic based on user preferences
  let filteredContent = content;

  if (filters.hidePersonalInfo) {
    // Remove any remaining personal information
    filteredContent = filteredContent.replace(/\b[\w\.-]+@[\w\.-]+\.\w+\b/g, '[EMAIL]');
    filteredContent = filteredContent.replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE]');
  }

  if (filters.summarizeOnly) {
    // Extract only summary sections
    const summaryMatch = filteredContent.match(/## Executive Summary(.*?)(?=##|$)/s);
    if (summaryMatch) {
      filteredContent = summaryMatch[0];
    }
  }

  if (filters.highlightKeywords && filters.keywords) {
    // Highlight specified keywords
    filters.keywords.forEach((keyword: string) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      filteredContent = filteredContent.replace(regex, `**${keyword}**`);
    });
  }

  return filteredContent;
}