import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';

// Automated lead generation system
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request);
    const data = await request.json();

    // Lead sources: web form, referral, cold outreach, public records
    const leadData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      property_type: data.propertyType || 'Residential', // Residential, Commercial, Multi-unit
      lead_source: data.leadSource || 'Website', // Website, Referral, Cold Call, Public Records
      estimated_devices: data.estimatedDevices || 1,
      notes: data.notes || '',
      status: 'New Lead',
      priority: calculateLeadPriority(data),
      estimated_value: calculateEstimatedValue(data.propertyType, data.estimatedDevices),
      created_at: new Date().toISOString()
    };

    // Check for existing customer/lead
    const { data: existing, error: checkError } = await supabase
      .from('leads')
      .select('*')
      .or(`email.eq.${data.email},phone.eq.${data.phone}`)
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Lead already exists',
        lead: existing,
        action: 'duplicate_detected'
      });
    }

    // Create new lead
    const { data: newLead, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Auto-qualify lead based on criteria
    const qualification = await autoQualifyLead(newLead);
    
    if (qualification.qualified) {
      // Convert qualified lead to customer automatically
      await convertLeadToCustomer(newLead.id, supabase);
    }

    // Send welcome email/text
    await sendWelcomeMessage(newLead);

    // Schedule follow-up if not auto-converted
    if (!qualification.qualified) {
      await scheduleFollowUp(newLead.id, supabase);
    }

    return NextResponse.json({
      success: true,
      lead: newLead,
      qualification,
      message: qualification.qualified ? 'Lead auto-converted to customer' : 'Lead created, follow-up scheduled'
    });

  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}

// Calculate lead priority (1-5, 5 being highest)
function calculateLeadPriority(data: any): number {
  let priority = 1;
  
  // Commercial properties get higher priority
  if (data.propertyType === 'Commercial') priority += 2;
  if (data.propertyType === 'Multi-unit') priority += 3;
  
  // Multiple devices = higher value
  if (data.estimatedDevices > 1) priority += 1;
  if (data.estimatedDevices > 3) priority += 1;
  
  // Referrals get priority
  if (data.leadSource === 'Referral') priority += 2;
  
  // Urgent requests
  if (data.notes?.toLowerCase().includes('urgent') || 
      data.notes?.toLowerCase().includes('inspection')) priority += 2;
  
  return Math.min(priority, 5);
}

// Calculate estimated annual value
function calculateEstimatedValue(propertyType: string, devices: number): number {
  const baseRates = {
    'Residential': 75,
    'Commercial': 125,
    'Multi-unit': 100
  };
  
  return (baseRates[propertyType as keyof typeof baseRates] || 75) * devices;
}

// Auto-qualify leads based on criteria
async function autoQualifyLead(lead: any) {
  const qualificationCriteria = {
    hasCompleteInfo: !!(lead.name && lead.email && lead.phone && lead.address),
    isLocalArea: isInServiceArea(lead.address),
    isHighValue: lead.estimated_value >= 150,
    isHighPriority: lead.priority >= 4,
    isCommercial: lead.property_type === 'Commercial'
  };

  const qualified = Object.values(qualificationCriteria).filter(Boolean).length >= 3;

  return {
    qualified,
    criteria: qualificationCriteria,
    score: Object.values(qualificationCriteria).filter(Boolean).length
  };
}

// Check if address is in service area (Tacoma/Pierce County)
function isInServiceArea(address: string): boolean {
  const serviceAreas = ['tacoma', 'pierce', 'lakewood', 'puyallup', 'federal way', 'des moines'];
  return serviceAreas.some(area => address.toLowerCase().includes(area));
}

// Convert qualified lead to customer
async function convertLeadToCustomer(leadId: string, supabase: any) {
  try {
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (!lead) return;

    // Generate account number
    const { count } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    const accountNumber = `FB${String((count || 0) + 1).padStart(3, '0')}`;

    // Create customer
    const customerData = {
      account_number: accountNumber,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      address: lead.address,
      status: 'Active',
      lead_source: lead.lead_source,
      estimated_annual_value: lead.estimated_value
    };

    const { data: customer, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single();

    if (error) throw error;

    // Update lead status
    await supabase
      .from('leads')
      .update({ 
        status: 'Converted',
        customer_id: customer.id,
        converted_at: new Date().toISOString()
      })
      .eq('id', leadId);

    // Auto-schedule initial consultation/estimate
    await scheduleInitialService(customer.id, supabase);

    return customer;
  } catch (error) {
    console.error('Error converting lead:', error);
    return null;
  }
}

// Schedule initial service appointment
async function scheduleInitialService(customerId: string, supabase: any) {
  try {
    // Find next available slot (2-3 days out)
    const appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() + 2);

    const appointmentData = {
      customer_id: customerId,
      service_type: 'Initial Assessment',
      appointment_date: appointmentDate.toISOString().split('T')[0],
      appointment_time: '10:00',
      duration: 60,
      status: 'Scheduled',
      notes: 'Auto-scheduled from lead conversion',
      technician: 'Mike Fisher'
    };

    await supabase
      .from('appointments')
      .insert(appointmentData);

  } catch (error) {
    console.error('Error scheduling initial service:', error);
  }
}

// Send welcome message (email/SMS)
async function sendWelcomeMessage(lead: any) {
  try {
    // Email service integration (placeholder)
    const emailData = {
      to: lead.email,
      subject: 'Welcome to Fisher Backflows - Your Backflow Testing Partner',
      template: 'lead_welcome',
      data: {
        name: lead.name,
        estimatedValue: lead.estimated_value,
        nextSteps: lead.status === 'Converted' ? 'We\'ll call to schedule your service' : 'We\'ll contact you within 24 hours'
      }
    };

    // SMS notification (placeholder)
    const smsData = {
      to: lead.phone,
      message: `Hi ${lead.name}! Thanks for your interest in Fisher Backflows. We'll be in touch within 24 hours to schedule your backflow testing. Questions? Reply STOP to opt out.`
    };

    // Implement actual email/SMS sending here
    console.log('Welcome email queued:', emailData);
    console.log('Welcome SMS queued:', smsData);

  } catch (error) {
    console.error('Error sending welcome message:', error);
  }
}

// Schedule follow-up for non-converted leads
async function scheduleFollowUp(leadId: string, supabase: any) {
  try {
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 1); // Follow up next day

    await supabase
      .from('lead_follow_ups')
      .insert({
        lead_id: leadId,
        scheduled_date: followUpDate.toISOString(),
        type: 'Phone Call',
        status: 'Pending'
      });

  } catch (error) {
    console.error('Error scheduling follow-up:', error);
  }
}

// Get leads for manual review
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'New Lead';

    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('status', status)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      leads: leads || []
    });

  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}