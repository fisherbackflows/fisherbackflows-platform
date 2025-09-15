import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all tables and their RLS status
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_rls_status');

    if (tablesError) {
      // Fallback method if RPC doesn't exist
      console.log('Using fallback method for RLS status check');
      return await fallbackRLSCheck(supabase);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tables,
      summary: calculateSummary(tables)
    });

  } catch (error) {
    console.error('RLS status check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check RLS status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function fallbackRLSCheck(supabase: any) {
  try {
    const criticalTables = [
      'customers', 'team_users', 'devices', 'appointments',
      'test_reports', 'invoices', 'payments', 'billing_subscriptions',
      'billing_invoices', 'security_logs', 'technician_locations',
      'technician_current_location', 'audit_logs', 'email_verifications',
      'leads', 'time_off_requests', 'tester_schedules', 'team_sessions',
      'water_districts', 'water_department_submissions',
      'notification_templates', 'push_subscriptions', 
      'notification_logs', 'notification_interactions'
    ];

    const tableStatus = [];

    for (const tableName of criticalTables) {
      try {
        // Check RLS status
        const { data: rlsData } = await supabase
          .from('pg_class')
          .select('relrowsecurity')
          .eq('relname', tableName)
          .single();

        // Check policy count
        const { data: policyData } = await supabase
          .from('pg_policies')
          .select('policyname')
          .eq('tablename', tableName)
          .eq('schemaname', 'public');

        tableStatus.push({
          table_name: tableName,
          rls_enabled: rlsData?.relrowsecurity || false,
          policy_count: policyData?.length || 0,
          policies: policyData?.map(p => p.policyname) || []
        });

      } catch (error) {
        tableStatus.push({
          table_name: tableName,
          rls_enabled: false,
          policy_count: 0,
          policies: [],
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const summary = calculateSummary(tableStatus);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      method: 'fallback',
      tables: tableStatus,
      summary,
      recommendations: generateRecommendations(summary)
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Fallback RLS check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function calculateSummary(tables: any[]) {
  const total = tables.length;
  const withRLS = tables.filter(t => t.rls_enabled).length;
  const withPolicies = tables.filter(t => t.policy_count > 0).length;
  const withRLSNoPolicies = tables.filter(t => t.rls_enabled && t.policy_count === 0).length;

  return {
    total_tables: total,
    tables_with_rls: withRLS,
    tables_with_policies: withPolicies,
    tables_with_rls_no_policies: withRLSNoPolicies,
    rls_coverage_percent: total > 0 ? Math.round((withRLS / total) * 100) : 0,
    policy_coverage_percent: total > 0 ? Math.round((withPolicies / total) * 100) : 0,
    security_score: calculateSecurityScore(withRLS, withPolicies, total, withRLSNoPolicies)
  };
}

function calculateSecurityScore(withRLS: number, withPolicies: number, total: number, withRLSNoPolicies: number): {
  score: number;
  grade: string;
  status: string;
} {
  // Security score calculation
  let score = 0;
  
  // RLS enabled (40% of score)
  score += (withRLS / total) * 40;
  
  // Policies implemented (50% of score) 
  score += (withPolicies / total) * 50;
  
  // Penalty for RLS without policies (critical issue)
  score -= withRLSNoPolicies * 10;
  
  // Ensure score is between 0-100
  score = Math.max(0, Math.min(100, score));

  let grade = 'F';
  let status = 'Critical Risk';

  if (score >= 90) {
    grade = 'A';
    status = 'Excellent Security';
  } else if (score >= 80) {
    grade = 'B';
    status = 'Good Security';
  } else if (score >= 70) {
    grade = 'C';
    status = 'Adequate Security';
  } else if (score >= 60) {
    grade = 'D';
    status = 'Poor Security';
  }

  return { score: Math.round(score), grade, status };
}

function generateRecommendations(summary: any): string[] {
  const recommendations = [];

  if (summary.tables_with_rls_no_policies > 0) {
    recommendations.push(`🚨 CRITICAL: ${summary.tables_with_rls_no_policies} tables have RLS enabled but no policies - this blocks ALL access!`);
  }

  if (summary.rls_coverage_percent < 100) {
    recommendations.push(`⚠️  Enable RLS on ${summary.total_tables - summary.tables_with_rls} remaining tables`);
  }

  if (summary.policy_coverage_percent < 100) {
    recommendations.push(`📝 Add policies to ${summary.total_tables - summary.tables_with_policies} tables`);
  }

  if (summary.security_score.score < 70) {
    recommendations.push('🔒 Current security configuration poses significant risk');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All tables properly secured with RLS and policies!');
  }

  return recommendations;
}

export async function POST(request: NextRequest) {
  try {
    const { action, table_name } = await request.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    switch (action) {
      case 'test_policies':
        return await testPolicies(supabase, table_name);
      
      case 'refresh_status':
        // Force refresh of RLS status
        const { data } = await supabase.rpc('refresh_rls_cache');
        return NextResponse.json({ success: true, refreshed: true });
        
      default:
        return NextResponse.json({ 
          error: 'Invalid action' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('RLS action error:', error);
    return NextResponse.json({
      success: false,
      error: 'RLS action failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function testPolicies(supabase: any, tableName?: string) {
  const tests = [
    {
      name: 'Helper Functions Exist',
      sql: `SELECT COUNT(*) as count FROM pg_proc WHERE proname IN ('is_team_member', 'is_admin', 'is_customer')`,
      expected: 3
    }
  ];

  if (tableName) {
    tests.push({
      name: `RLS Enabled on ${tableName}`,
      sql: `SELECT relrowsecurity FROM pg_class WHERE relname = '${tableName}'`,
      expected: true
    });

    tests.push({
      name: `Policies Exist on ${tableName}`,
      sql: `SELECT COUNT(*) as count FROM pg_policies WHERE tablename = '${tableName}'`,
      expected: 1 // At least 1 policy
    });
  }

  const results = [];

  for (const test of tests) {
    try {
      const { data, error } = await supabase.rpc('execute_sql', { query: test.sql });
      
      if (error) {
        results.push({
          test: test.name,
          passed: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        continue;
      }

      const passed = Array.isArray(data) && data.length > 0 && 
        (test.expected === true ? data[0].relrowsecurity === true : 
         typeof test.expected === 'number' ? data[0].count >= test.expected : false);

      results.push({
        test: test.name,
        passed,
        result: data[0],
        expected: test.expected
      });

    } catch (error) {
      results.push({
        test: test.name,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  const passedTests = results.filter(r => r.passed).length;
  
  return NextResponse.json({
    success: true,
    tests: results,
    summary: {
      total: results.length,
      passed: passedTests,
      failed: results.length - passedTests,
      pass_rate: Math.round((passedTests / results.length) * 100)
    }
  });
}