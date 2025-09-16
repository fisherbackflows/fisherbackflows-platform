import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { createClient } from '@/lib/supabase/server';
import { GPT5Service } from '@/lib/ai/gpt5-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { query, context, timeframe, includeRecommendations } = await request.json();

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

    if (!teamUser || !['admin', 'manager'].includes((teamUser as any).role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (query.length > 500) {
      return NextResponse.json({ error: 'Query too long (max 500 characters)' }, { status: 400 });
    }

    const gpt5Service = new GPT5Service();
    
    // Generate business insights using GPT-5
    const insights = await gpt5Service.generateBusinessInsights({
      query,
      context: context || 'overall business',
      timeframe: timeframe || '30d',
      includeData: true
    });

    // Enhance insights with additional context
    const enhancedInsights = await enhanceInsightsWithContext(supabase, insights, context, timeframe);

    // Store the insight request for analysis
    const { data: savedInsight } = await (supabase as any)
      .from('ai_insights')
      .insert({
        query,
        context,
        timeframe,
        insight: enhancedInsights.insight,
        key_findings: enhancedInsights.keyFindings,
        recommendations: enhancedInsights.recommendations,
        confidence: enhancedInsights.confidence,
        generated_by: session.user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    // Log insight generation
    await (supabase as any).from('audit_logs').insert({
      table_name: 'ai_insights',
      action: 'BUSINESS_INSIGHT_GENERATED',
      details: {
        query,
        context,
        timeframe,
        confidence: enhancedInsights.confidence,
        findingsCount: enhancedInsights.keyFindings.length,
        recommendationsCount: enhancedInsights.recommendations.length,
        insightId: savedInsight?.id
      },
      created_by: session.user.id
    });

    return NextResponse.json({
      success: true,
      insight: {
        id: savedInsight?.id,
        ...enhancedInsights,
        query,
        context,
        timeframe,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('AI Insights API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate business insights' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const insightId = url.searchParams.get('insightId');
    const context = url.searchParams.get('context');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const recent = url.searchParams.get('recent') === 'true';

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

    if (!teamUser || !['admin', 'manager'].includes((teamUser as any).role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (insightId) {
      // Get specific insight
      const { data: insight, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('id', insightId)
        .single();

      if (error || !insight) {
        return NextResponse.json({ error: 'Insight not found' }, { status: 404 });
      }

      return NextResponse.json({ insight });
    } else {
      // List insights with optional filtering
      let query = supabase
        .from('ai_insights')
        .select('id, query, context, timeframe, confidence, key_findings, recommendations, created_at, generated_by')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (context) {
        query = query.eq('context', context);
      }

      if (recent) {
        const recentDate = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)); // Last 7 days
        query = query.gte('created_at', recentDate.toISOString());
      }

      const { data: insights, error } = await query;

      if (error) {
        throw error;
      }

      // Get insight analytics
      const analytics = await getInsightAnalytics(supabase);

      return NextResponse.json({ 
        insights: insights || [],
        count: insights?.length || 0,
        analytics
      });
    }
  } catch (error) {
    console.error('Get Insights API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve insights' },
      { status: 500 }
    );
  }
}

async function enhanceInsightsWithContext(
  supabase: any,
  insights: any,
  context?: string,
  timeframe?: string
): Promise<any> {
  // Add contextual data to insights
  const enhancedInsights = { ...insights };

  try {
    // Get recent trends for context
    const trends = await getBusinessTrends(supabase, timeframe || '30d');
    
    // Add trend context to recommendations
    enhancedInsights.recommendations = enhancedInsights.recommendations.map((rec: string) => {
      if (trends.revenueTrend > 0 && rec.toLowerCase().includes('revenue')) {
        return `${rec} (Note: Revenue is currently trending upward by ${trends.revenueTrend}%)`;
      }
      if (trends.customerTrend < 0 && rec.toLowerCase().includes('customer')) {
        return `${rec} (Note: Customer acquisition is down ${Math.abs(trends.customerTrend)}% - priority action needed)`;
      }
      return rec;
    });

    // Add contextual alerts
    const alerts = [];
    if (trends.complianceTrend < 95) {
      alerts.push(`Compliance rate has dropped to ${trends.complianceTrend}% - immediate attention required`);
    }
    if (trends.revenueVariability > 25) {
      alerts.push(`Revenue volatility is high (${trends.revenueVariability}%) - consider stabilization strategies`);
    }

    enhancedInsights.alerts = alerts;

    // Add market context if applicable
    if (context === 'revenue' || context === 'overall business') {
      enhancedInsights.marketContext = {
        seasonalFactor: getSeasonalFactor(new Date().getMonth()),
        competitivePosition: 'Strong regional presence',
        regulatoryEnvironment: 'Washington State compliance requirements stable'
      };
    }

    // Adjust confidence based on data quality
    const dataQuality = await assessDataQuality(supabase, timeframe || '30d');
    enhancedInsights.confidence = Math.min(
      enhancedInsights.confidence,
      dataQuality.overallScore
    );

    enhancedInsights.dataQuality = dataQuality;

  } catch (error) {
    console.error('Error enhancing insights:', error);
    // Return original insights if enhancement fails
  }

  return enhancedInsights;
}

async function getBusinessTrends(supabase: any, timeframe: string) {
  const days = getTimeframeDays(timeframe);
  const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
  const midDate = new Date(Date.now() - (days * 12 * 60 * 60 * 1000)); // Halfway point

  const [recentData, olderData] = await Promise.all([
    getBusinessMetrics(supabase, midDate, new Date()),
    getBusinessMetrics(supabase, startDate, midDate)
  ]);

  return {
    revenueTrend: calculateTrendPercentage(olderData.revenue, recentData.revenue),
    customerTrend: calculateTrendPercentage(olderData.customers, recentData.customers),
    complianceTrend: recentData.complianceRate || 95,
    revenueVariability: calculateVariability([olderData.revenue, recentData.revenue])
  };
}

async function getBusinessMetrics(supabase: any, startDate: Date, endDate: Date) {
  const [revenueData, customerData, appointmentData] = await Promise.all([
    supabase.from('invoices')
      .select('total_amount, status')
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString()),
    supabase.from('customers')
      .select('id, created_at, status')
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString()),
    supabase.from('appointments')
      .select('status')
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString())
  ]);

  const revenue = revenueData.data?.filter((inv: any) => inv.status === 'paid')
    .reduce((sum: number, inv: any) => sum + parseFloat(inv.total_amount || '0'), 0) || 0;

  const customers = customerData.data?.filter((c: any) => c.status === 'active').length || 0;

  const completedAppointments = appointmentData.data?.filter((apt: any) => apt.status === 'completed').length || 0;
  const totalAppointments = appointmentData.data?.length || 1;
  const complianceRate = (completedAppointments / totalAppointments) * 100;

  return { revenue, customers, complianceRate };
}

async function assessDataQuality(supabase: any, timeframe: string) {
  const days = getTimeframeDays(timeframe);
  const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

  // Check data completeness and quality
  const [customerData, appointmentData, invoiceData] = await Promise.all([
    supabase.from('customers').select('id, email, phone').gte('created_at', startDate.toISOString()),
    supabase.from('appointments').select('id, status, scheduled_date').gte('created_at', startDate.toISOString()),
    supabase.from('invoices').select('id, total_amount, status').gte('created_at', startDate.toISOString())
  ]);

  const customerCompleteness = customerData.data?.filter((c: any) => c.email && c.phone).length /
    Math.max(customerData.data?.length || 0, 1);

  const appointmentCompleteness = appointmentData.data?.filter((a: any) => a.status && a.scheduled_date).length /
    Math.max(appointmentData.data?.length || 0, 1);

  const invoiceCompleteness = invoiceData.data?.filter((i: any) => i.total_amount && i.status).length /
    Math.max(invoiceData.data?.length || 0, 1);

  const overallScore = Math.round(((customerCompleteness + appointmentCompleteness + invoiceCompleteness) / 3) * 100);

  return {
    overallScore,
    customerCompleteness: Math.round(customerCompleteness * 100),
    appointmentCompleteness: Math.round(appointmentCompleteness * 100),
    invoiceCompleteness: Math.round(invoiceCompleteness * 100),
    dataPoints: (customerData.data?.length || 0) + (appointmentData.data?.length || 0) + (invoiceData.data?.length || 0)
  };
}

async function getInsightAnalytics(supabase: any) {
  const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
  
  const { data: insights } = await supabase
    .from('ai_insights')
    .select('context, confidence, created_at')
    .gte('created_at', thirtyDaysAgo.toISOString());

  if (!insights || insights.length === 0) {
    return {
      totalInsights: 0,
      avgConfidence: 0,
      contextBreakdown: {},
      recentActivity: 0
    };
  }

  const contextBreakdown = insights.reduce((acc: any, insight: any) => {
    acc[insight.context] = (acc[insight.context] || 0) + 1;
    return acc;
  }, {});

  const avgConfidence = insights.reduce((sum: number, insight: any) => sum + insight.confidence, 0) / insights.length;

  const sevenDaysAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
  const recentActivity = insights.filter((insight: any) => new Date(insight.created_at) >= sevenDaysAgo).length;

  return {
    totalInsights: insights.length,
    avgConfidence: Math.round(avgConfidence),
    contextBreakdown,
    recentActivity
  };
}

function getTimeframeDays(timeframe: string): number {
  const map: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
  return map[timeframe] || 30;
}

function calculateTrendPercentage(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return Math.round(((newValue - oldValue) / oldValue) * 100);
}

function calculateVariability(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  return Math.round((stdDev / mean) * 100);
}

function getSeasonalFactor(month: number): string {
  // 0 = January, 11 = December
  if (month >= 3 && month <= 8) return 'High season (spring/summer testing)';
  if (month >= 9 && month <= 11) return 'Moderate season (fall compliance)';
  return 'Low season (winter planning)';
}