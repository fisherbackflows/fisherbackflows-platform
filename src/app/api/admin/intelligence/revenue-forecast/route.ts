import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PredictiveAnalyticsEngine } from '@/lib/ai/predictive-engine';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'quarterly';
    const includeScenarios = url.searchParams.get('scenarios') === 'true';

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

    if (!teamUser || (teamUser as any).role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const engine = new PredictiveAnalyticsEngine();
    const forecast = await engine.generateRevenueForecasting(period);

    let response = forecast;

    if (includeScenarios) {
      // The forecast already contains scenarios in its structure
      response = {
        ...forecast,
        additionalScenarios: forecast.scenarios
      } as any;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Revenue forecast API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { period, adjustments, scenario } = await request.json();

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

    if (!teamUser || (teamUser as any).role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const engine = new PredictiveAnalyticsEngine();
    
    // Generate custom forecast (adjustments would be applied in a real implementation)
    const customForecast = await engine.generateRevenueForecasting(period || 'quarterly');

    // Log the custom forecast request
    await supabase.from('audit_logs').insert({
      table_name: 'revenue_forecasting',
      action: 'CUSTOM_FORECAST_GENERATED',
      details: {
        period,
        scenario,
        adjustments,
        projectedRevenue: customForecast.predictedRevenue,
        confidence: customForecast.confidence,
        generatedBy: session.user.id
      },
      created_by: session.user.id
    } as any);

    return NextResponse.json(customForecast);
  } catch (error) {
    console.error('Custom revenue forecast API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}