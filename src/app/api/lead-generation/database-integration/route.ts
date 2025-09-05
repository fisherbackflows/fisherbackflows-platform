import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase client with service role key for full database access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface GeneratedLead {
  business_name: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  facility_type: string;
  temperature: 'HOT' | 'WARM' | 'COLD';
  score: number;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  estimated_value: number;
  device_count: number;
  distance: number;
  compliance_status?: string;
  days_past_due?: number;
  contact_person?: string;
  business_size?: string;
  lat: number;
  lng: number;
  source: string;
  scoring_breakdown?: any;
  action_plan?: any;
  route_optimization?: any;
}

interface ComplianceAlert {
  lead_id?: string;
  business_name: string;
  address: string;
  phone?: string;
  facility_type: string;
  device_count: number;
  days_past_due: number;
  estimated_value: number;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  scheduled_visit?: string;
}

interface LeadGenerationJob {
  job_type: string;
  source: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  leads_found: number;
  leads_scored: number;
  hot_leads: number;
  warm_leads: number;
  cold_leads: number;
  total_estimated_value: number;
  processing_time_ms?: number;
  error_message?: string;
  job_params?: any;
  results_summary?: any;
}

// Create database tables if they don't exist
async function ensureTablesExist() {
  try {
    // Check if tables exist
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['generated_leads', 'compliance_alerts', 'lead_generation_jobs']);

    if (error && !error.message.includes('does not exist')) {
      console.error('Error checking tables:', error);
    }

    const existingTables = tables?.map(t => t.table_name) || [];
    
    // If tables don't exist, create them using raw SQL
    if (existingTables.length === 0) {
      const createTablesSQL = `
        -- Create generated_leads table if not exists
        CREATE TABLE IF NOT EXISTS generated_leads (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          business_name VARCHAR(255) NOT NULL,
          address TEXT NOT NULL,
          phone VARCHAR(20),
          email VARCHAR(255),
          website VARCHAR(255),
          facility_type VARCHAR(100) NOT NULL,
          temperature VARCHAR(10) NOT NULL CHECK (temperature IN ('HOT', 'WARM', 'COLD')),
          score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
          priority VARCHAR(10) NOT NULL CHECK (priority IN ('URGENT', 'HIGH', 'MEDIUM', 'LOW')),
          estimated_value DECIMAL(10,2) NOT NULL DEFAULT 0,
          device_count INTEGER DEFAULT 1,
          distance DECIMAL(8,2) NOT NULL,
          compliance_status VARCHAR(50),
          days_past_due INTEGER,
          contact_person VARCHAR(255),
          business_size VARCHAR(20),
          lat DECIMAL(10,7) NOT NULL,
          lng DECIMAL(11,7) NOT NULL,
          source VARCHAR(50) NOT NULL,
          generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_contacted_at TIMESTAMP WITH TIME ZONE,
          contact_count INTEGER DEFAULT 0,
          status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'scheduled', 'completed', 'lost')),
          notes TEXT,
          scoring_breakdown JSONB,
          action_plan JSONB,
          route_optimization JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create compliance_alerts table if not exists
        CREATE TABLE IF NOT EXISTS compliance_alerts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          lead_id UUID,
          business_name VARCHAR(255) NOT NULL,
          address TEXT NOT NULL,
          phone VARCHAR(20),
          facility_type VARCHAR(100) NOT NULL,
          device_count INTEGER DEFAULT 1,
          days_past_due INTEGER NOT NULL,
          estimated_value DECIMAL(10,2) NOT NULL,
          urgency VARCHAR(10) NOT NULL CHECK (urgency IN ('CRITICAL', 'HIGH', 'MEDIUM')),
          alert_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          contacted BOOLEAN DEFAULT FALSE,
          scheduled_visit TIMESTAMP WITH TIME ZONE,
          resolved BOOLEAN DEFAULT FALSE,
          resolved_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create lead_generation_jobs table if not exists
        CREATE TABLE IF NOT EXISTS lead_generation_jobs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          job_type VARCHAR(50) NOT NULL,
          source VARCHAR(50) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
          leads_found INTEGER DEFAULT 0,
          leads_scored INTEGER DEFAULT 0,
          hot_leads INTEGER DEFAULT 0,
          warm_leads INTEGER DEFAULT 0,
          cold_leads INTEGER DEFAULT 0,
          total_estimated_value DECIMAL(12,2) DEFAULT 0,
          processing_time_ms INTEGER,
          error_message TEXT,
          job_params JSONB,
          results_summary JSONB,
          started_at TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_generated_leads_temperature ON generated_leads(temperature);
        CREATE INDEX IF NOT EXISTS idx_generated_leads_score ON generated_leads(score DESC);
        CREATE INDEX IF NOT EXISTS idx_generated_leads_priority ON generated_leads(priority);
        CREATE INDEX IF NOT EXISTS idx_generated_leads_status ON generated_leads(status);
        CREATE INDEX IF NOT EXISTS idx_compliance_alerts_urgency ON compliance_alerts(urgency);
        CREATE INDEX IF NOT EXISTS idx_lead_generation_jobs_status ON lead_generation_jobs(status);
      `;

      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTablesSQL });
      if (createError) {
        console.error('Error creating tables:', createError);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error ensuring tables exist:', error);
    return { success: false, error };
  }
}

// Store leads in database
async function storeLeads(leads: GeneratedLead[]): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('generated_leads')
      .insert(leads.map(lead => ({
        business_name: lead.business_name,
        address: lead.address,
        phone: lead.phone,
        email: lead.email,
        website: lead.website,
        facility_type: lead.facility_type,
        temperature: lead.temperature,
        score: lead.score,
        priority: lead.priority,
        estimated_value: lead.estimated_value,
        device_count: lead.device_count,
        distance: lead.distance,
        compliance_status: lead.compliance_status,
        days_past_due: lead.days_past_due,
        contact_person: lead.contact_person,
        business_size: lead.business_size,
        lat: lead.lat,
        lng: lead.lng,
        source: lead.source,
        scoring_breakdown: lead.scoring_breakdown,
        action_plan: lead.action_plan,
        route_optimization: lead.route_optimization
      })))
      .select();

    return { success: true, data, count: data?.length || 0 };
  } catch (error) {
    console.error('Error storing leads:', error);
    return { success: false, error };
  }
}

// Store compliance alerts
async function storeComplianceAlerts(alerts: ComplianceAlert[]): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('compliance_alerts')
      .insert(alerts.map(alert => ({
        lead_id: alert.lead_id || null,
        business_name: alert.business_name,
        address: alert.address,
        phone: alert.phone,
        facility_type: alert.facility_type,
        device_count: alert.device_count,
        days_past_due: alert.days_past_due,
        estimated_value: alert.estimated_value,
        urgency: alert.urgency,
        scheduled_visit: alert.scheduled_visit || null
      })))
      .select();

    return { success: true, data, count: data?.length || 0 };
  } catch (error) {
    console.error('Error storing compliance alerts:', error);
    return { success: false, error };
  }
}

// Store lead generation job
async function storeLeadGenerationJob(job: LeadGenerationJob): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('lead_generation_jobs')
      .insert({
        job_type: job.job_type,
        source: job.source,
        status: job.status,
        leads_found: job.leads_found,
        leads_scored: job.leads_scored,
        hot_leads: job.hot_leads,
        warm_leads: job.warm_leads,
        cold_leads: job.cold_leads,
        total_estimated_value: job.total_estimated_value,
        processing_time_ms: job.processing_time_ms,
        error_message: job.error_message,
        job_params: job.job_params,
        results_summary: job.results_summary,
        started_at: job.status === 'running' ? new Date().toISOString() : null,
        completed_at: (job.status === 'completed' || job.status === 'failed') ? new Date().toISOString() : null
      })
      .select();

    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error('Error storing lead generation job:', error);
    return { success: false, error };
  }
}

// Update job status
async function updateJobStatus(jobId: string, status: string, updates: any = {}): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('lead_generation_jobs')
      .update({
        status,
        ...updates,
        ...(status === 'completed' || status === 'failed' ? { completed_at: new Date().toISOString() } : {})
      })
      .eq('id', jobId)
      .select();

    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error('Error updating job status:', error);
    return { success: false, error };
  }
}

// Main database integration endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    // Ensure tables exist
    await ensureTablesExist();

    switch (action) {
      case 'store_leads': {
        const result = await storeLeads(data.leads);
        return NextResponse.json({
          success: result.success,
          message: result.success 
            ? `Successfully stored ${result.count} leads`
            : 'Failed to store leads',
          data: result.data,
          error: result.error
        });
      }

      case 'store_alerts': {
        const result = await storeComplianceAlerts(data.alerts);
        return NextResponse.json({
          success: result.success,
          message: result.success 
            ? `Successfully stored ${result.count} compliance alerts`
            : 'Failed to store alerts',
          data: result.data,
          error: result.error
        });
      }

      case 'create_job': {
        const result = await storeLeadGenerationJob(data.job);
        return NextResponse.json({
          success: result.success,
          message: result.success 
            ? 'Lead generation job created successfully'
            : 'Failed to create job',
          job: result.data,
          error: result.error
        });
      }

      case 'update_job': {
        const result = await updateJobStatus(data.jobId, data.status, data.updates);
        return NextResponse.json({
          success: result.success,
          message: result.success 
            ? `Job ${data.jobId} updated successfully`
            : 'Failed to update job',
          job: result.data,
          error: result.error
        });
      }

      case 'full_pipeline': {
        // Execute full lead generation pipeline
        const startTime = Date.now();
        
        // Create job record
        const jobResult = await storeLeadGenerationJob({
          job_type: 'full_pipeline',
          source: data.source || 'automated',
          status: 'running',
          leads_found: 0,
          leads_scored: 0,
          hot_leads: 0,
          warm_leads: 0,
          cold_leads: 0,
          total_estimated_value: 0,
          job_params: data.params || {}
        });

        if (!jobResult.success) {
          return NextResponse.json({
            success: false,
            error: 'Failed to create pipeline job'
          }, { status: 500 });
        }

        const jobId = jobResult.data.id;

        try {
          // Store leads if provided
          let leadResult = { success: true, count: 0 };
          if (data.leads && data.leads.length > 0) {
            leadResult = await storeLeads(data.leads);
          }

          // Store alerts if provided
          let alertResult = { success: true, count: 0 };
          if (data.alerts && data.alerts.length > 0) {
            alertResult = await storeComplianceAlerts(data.alerts);
          }

          // Calculate statistics
          const hotLeads = data.leads?.filter((l: any) => l.temperature === 'HOT').length || 0;
          const warmLeads = data.leads?.filter((l: any) => l.temperature === 'WARM').length || 0;
          const coldLeads = data.leads?.filter((l: any) => l.temperature === 'COLD').length || 0;
          const totalValue = data.leads?.reduce((sum: number, l: any) => sum + (l.estimated_value || 0), 0) || 0;

          // Update job with results
          await updateJobStatus(jobId, 'completed', {
            leads_found: data.leads?.length || 0,
            leads_scored: leadResult.count,
            hot_leads: hotLeads,
            warm_leads: warmLeads,
            cold_leads: coldLeads,
            total_estimated_value: totalValue,
            processing_time_ms: Date.now() - startTime,
            results_summary: {
              leads_stored: leadResult.count,
              alerts_stored: alertResult.count,
              pipeline_success: leadResult.success && alertResult.success
            }
          });

          return NextResponse.json({
            success: true,
            jobId,
            pipeline: {
              leads_processed: leadResult.count,
              alerts_generated: alertResult.count,
              hot_leads: hotLeads,
              warm_leads: warmLeads,
              cold_leads: coldLeads,
              total_estimated_value: totalValue,
              processing_time_ms: Date.now() - startTime
            }
          });

        } catch (error) {
          // Update job with error
          await updateJobStatus(jobId, 'failed', {
            error_message: error instanceof Error ? error.message : 'Pipeline execution failed',
            processing_time_ms: Date.now() - startTime
          });

          throw error;
        }
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: store_leads, store_alerts, create_job, update_job, full_pipeline'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Database integration error:', error);
    return NextResponse.json({
      success: false,
      error: 'Database integration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Get stored data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dataType = searchParams.get('type') || 'leads';
    const limit = parseInt(searchParams.get('limit') || '50');
    const temperature = searchParams.get('temperature');
    const status = searchParams.get('status');

    await ensureTablesExist();

    switch (dataType) {
      case 'leads': {
        let query = supabase
          .from('generated_leads')
          .select('*')
          .order('score', { ascending: false })
          .limit(limit);

        if (temperature) {
          query = query.eq('temperature', temperature);
        }
        if (status) {
          query = query.eq('status', status);
        }

        const { data, error } = await query;

        return NextResponse.json({
          success: true,
          leads: data || [],
          count: data?.length || 0,
          error
        });
      }

      case 'alerts': {
        let query = supabase
          .from('compliance_alerts')
          .select('*')
          .order('days_past_due', { ascending: false })
          .limit(limit);

        if (status) {
          query = query.eq('contacted', status === 'contacted');
        }

        const { data, error } = await query;

        return NextResponse.json({
          success: true,
          alerts: data || [],
          count: data?.length || 0,
          error
        });
      }

      case 'jobs': {
        const { data, error } = await supabase
          .from('lead_generation_jobs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        return NextResponse.json({
          success: true,
          jobs: data || [],
          count: data?.length || 0,
          error
        });
      }

      case 'stats': {
        // Get comprehensive statistics
        const [leadsResult, alertsResult, jobsResult] = await Promise.all([
          supabase.from('generated_leads').select('temperature, score, estimated_value'),
          supabase.from('compliance_alerts').select('urgency, contacted, estimated_value'),
          supabase.from('lead_generation_jobs').select('status, leads_found, total_estimated_value')
        ]);

        const leads = leadsResult.data || [];
        const alerts = alertsResult.data || [];
        const jobs = jobsResult.data || [];

        const stats = {
          leads: {
            total: leads.length,
            hot: leads.filter(l => l.temperature === 'HOT').length,
            warm: leads.filter(l => l.temperature === 'WARM').length,
            cold: leads.filter(l => l.temperature === 'COLD').length,
            averageScore: leads.length > 0 ? leads.reduce((sum, l) => sum + l.score, 0) / leads.length : 0,
            totalValue: leads.reduce((sum, l) => sum + (l.estimated_value || 0), 0)
          },
          alerts: {
            total: alerts.length,
            critical: alerts.filter(a => a.urgency === 'CRITICAL').length,
            high: alerts.filter(a => a.urgency === 'HIGH').length,
            contacted: alerts.filter(a => a.contacted).length,
            totalValue: alerts.reduce((sum, a) => sum + (a.estimated_value || 0), 0)
          },
          jobs: {
            total: jobs.length,
            completed: jobs.filter(j => j.status === 'completed').length,
            running: jobs.filter(j => j.status === 'running').length,
            failed: jobs.filter(j => j.status === 'failed').length,
            totalLeadsFound: jobs.reduce((sum, j) => sum + (j.leads_found || 0), 0)
          }
        };

        return NextResponse.json({
          success: true,
          stats
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid data type. Use: leads, alerts, jobs, stats'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json({
      success: false,
      error: 'Database query failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}