import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';

// Interface definitions for comprehensive lead management
interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  title?: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  estimated_value: number;
  notes?: string;
  assigned_to?: string;
  contacted_date?: string;
  qualified_date?: string;
  converted_date?: string;
  converted_customer_id?: string;
  created_at: string;
  updated_at: string;
  lead_type: 'backflow' | 'saas';
  priority_score: number;
}

interface LeadCategory {
  type: 'backflow' | 'saas';
  total: number;
  new: number;
  contacted: number;
  qualified: number;
  converted: number;
  lost: number;
  average_value: number;
  total_value: number;
}

interface LeadStats {
  total_leads: number;
  backflow: LeadCategory;
  saas: LeadCategory;
  by_status: {
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
    lost: number;
  };
  by_source: Record<string, number>;
  recent_activity: number;
  conversion_rate: number;
  pipeline_value: number;
}

// Helper function to determine lead type based on source and other criteria
function categorizeLeadType(lead: any): 'backflow' | 'saas' {
  const source = lead.source?.toLowerCase() || '';
  const notes = lead.notes?.toLowerCase() || '';
  const companyName = lead.company_name?.toLowerCase() || '';
  
  // SaaS indicators
  if (source.includes('saas') || 
      source.includes('subscription') || 
      source.includes('platform') ||
      notes.includes('saas') ||
      notes.includes('subscription') ||
      notes.includes('platform') ||
      companyName.includes('saas')) {
    return 'saas';
  }
  
  // Backflow indicators (default for most leads)
  return 'backflow';
}

// Helper function to calculate lead priority score
function calculatePriorityScore(lead: any): number {
  let score = 0;
  
  // Value-based scoring
  const value = parseFloat(lead.estimated_value) || 0;
  if (value > 5000) score += 3;
  else if (value > 2000) score += 2;
  else if (value > 500) score += 1;
  
  // Status-based scoring
  switch (lead.status) {
    case 'qualified': score += 3; break;
    case 'contacted': score += 2; break;
    case 'new': score += 1; break;
  }
  
  // Source-based scoring
  const source = lead.source?.toLowerCase() || '';
  if (source.includes('referral')) score += 2;
  if (source.includes('website')) score += 1;
  
  // Recency scoring (leads created in last 7 days get bonus)
  const createdAt = new Date(lead.created_at);
  const daysSince = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= 7) score += 1;
  
  return Math.min(score, 10); // Cap at 10
}

export async function GET(request: NextRequest) {
  console.log('🚀 Admin Leads API - GET request received');
  
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const leadType = searchParams.get('type'); // 'backflow', 'saas', or 'all'
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    console.log('📊 Query params:', { limit, offset, status, source, leadType, search, sortBy, sortOrder });

    const supabase = createRouteHandlerClient(request);
    console.log('✅ Supabase client created successfully');

    // Build the query
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (source && source !== 'all') {
      query = query.eq('source', source);
    }

    // Search functionality
    if (search && search.trim()) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,company_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,notes.ilike.%${search}%`
      );
    }

    // Apply sorting
    const validSortColumns = ['created_at', 'updated_at', 'first_name', 'last_name', 'estimated_value', 'status'];
    if (validSortColumns.includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    console.log('🔍 Executing Supabase query...');
    const { data: rawLeads, error, count } = await query;

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch leads',
          debug: {
            supabaseError: error.message,
            code: error.code
          }
        },
        { status: 500 }
      );
    }

    const allLeads = rawLeads || [];
    console.log('✅ Query successful:', { 
      leadsCount: allLeads.length, 
      totalCount: count 
    });

    // Process and categorize leads
    const processedLeads: Lead[] = allLeads.map(lead => ({
      ...lead,
      lead_type: categorizeLeadType(lead),
      priority_score: calculatePriorityScore(lead)
    }));

    // Filter by lead type if specified
    let filteredLeads = processedLeads;
    if (leadType && leadType !== 'all') {
      filteredLeads = processedLeads.filter(lead => lead.lead_type === leadType);
    }

    // Get all leads for statistics (without pagination)
    const { data: allLeadsForStats } = await supabase
      .from('leads')
      .select('*');

    const allProcessedLeads = (allLeadsForStats || []).map(lead => ({
      ...lead,
      lead_type: categorizeLeadType(lead),
      priority_score: calculatePriorityScore(lead)
    }));

    // Calculate comprehensive statistics
    const backflowLeads = allProcessedLeads.filter(lead => lead.lead_type === 'backflow');
    const saasLeads = allProcessedLeads.filter(lead => lead.lead_type === 'saas');

    const calculateCategoryStats = (leads: any[]): LeadCategory => ({
      type: leads.length > 0 ? leads[0].lead_type : 'backflow',
      total: leads.length,
      new: leads.filter(l => l.status === 'new').length,
      contacted: leads.filter(l => l.status === 'contacted').length,
      qualified: leads.filter(l => l.status === 'qualified').length,
      converted: leads.filter(l => l.status === 'converted').length,
      lost: leads.filter(l => l.status === 'lost').length,
      average_value: leads.length > 0 ? leads.reduce((sum, l) => sum + (parseFloat(l.estimated_value) || 0), 0) / leads.length : 0,
      total_value: leads.reduce((sum, l) => sum + (parseFloat(l.estimated_value) || 0), 0)
    });

    const stats: LeadStats = {
      total_leads: allProcessedLeads.length,
      backflow: calculateCategoryStats(backflowLeads),
      saas: calculateCategoryStats(saasLeads),
      by_status: {
        new: allProcessedLeads.filter(l => l.status === 'new').length,
        contacted: allProcessedLeads.filter(l => l.status === 'contacted').length,
        qualified: allProcessedLeads.filter(l => l.status === 'qualified').length,
        converted: allProcessedLeads.filter(l => l.status === 'converted').length,
        lost: allProcessedLeads.filter(l => l.status === 'lost').length
      },
      by_source: allProcessedLeads.reduce((acc, lead) => {
        const source = lead.source || 'unknown';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recent_activity: allProcessedLeads.filter(lead => {
        const daysSince = (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 7;
      }).length,
      conversion_rate: allProcessedLeads.length > 0 ? (allProcessedLeads.filter(l => l.status === 'converted').length / allProcessedLeads.length) * 100 : 0,
      pipeline_value: allProcessedLeads
        .filter(l => ['new', 'contacted', 'qualified'].includes(l.status))
        .reduce((sum, l) => sum + (parseFloat(l.estimated_value) || 0), 0)
    };

    // Sort processed leads by priority score (highest first)
    filteredLeads.sort((a, b) => {
      // First sort by priority score (descending)
      const scoreDiff = b.priority_score - a.priority_score;
      if (scoreDiff !== 0) return scoreDiff;
      
      // Then by creation date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const response = {
      success: true,
      leads: filteredLeads,
      stats,
      pagination: {
        total: count,
        limit,
        offset,
        has_more: offset + filteredLeads.length < (count || 0)
      },
      filters: {
        status,
        source,
        lead_type: leadType,
        search,
        sort_by: sortBy,
        sort_order: sortOrder
      },
      data_source: 'database',
      timestamp: new Date().toISOString()
    };

    console.log('📈 Response stats:', {
      totalLeads: stats.total_leads,
      backflowLeads: stats.backflow.total,
      saasLeads: stats.saas.total,
      conversionRate: stats.conversion_rate.toFixed(1) + '%',
      pipelineValue: stats.pipeline_value
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        debug: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined
        }
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🚀 Creating new lead:', body);

    const supabase = createRouteHandlerClient(request);
    
    // Create the lead
    const { data: lead, error } = await supabase
      .from('leads')
      .insert([{
        first_name: body.first_name,
        last_name: body.last_name,
        company_name: body.company_name,
        title: body.title,
        email: body.email,
        phone: body.phone,
        address: body.address,
        city: body.city,
        state: body.state,
        zip_code: body.zip_code,
        source: body.source || 'manual',
        status: body.status || 'new',
        estimated_value: body.estimated_value || 0,
        notes: body.notes,
        assigned_to: body.assigned_to || 'Unassigned'
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating lead:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    // Process the created lead
    const processedLead = {
      ...lead,
      lead_type: categorizeLeadType(lead),
      priority_score: calculatePriorityScore(lead)
    };

    console.log('✅ Lead created successfully:', processedLead.id);

    return NextResponse.json({
      success: true,
      lead: processedLead
    });

  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH endpoint for updating lead status, assignment, etc.
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    console.log('🔄 Updating lead:', id, updates);

    const supabase = createRouteHandlerClient(request);
    
    // Update the lead
    const { data: lead, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating lead:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update lead' },
        { status: 500 }
      );
    }

    // Process the updated lead
    const processedLead = {
      ...lead,
      lead_type: categorizeLeadType(lead),
      priority_score: calculatePriorityScore(lead)
    };

    console.log('✅ Lead updated successfully:', processedLead.id);

    return NextResponse.json({
      success: true,
      lead: processedLead
    });

  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}