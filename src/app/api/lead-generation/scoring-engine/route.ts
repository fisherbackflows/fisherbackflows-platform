import { NextRequest, NextResponse } from 'next/server';

interface LeadData {
  id: string;
  businessName: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  facilityType: string;
  deviceCount?: number;
  lastTestDate?: string;
  testDueDate?: string;
  complianceStatus?: string;
  daysPastDue?: number;
  lat: number;
  lng: number;
  contactPerson?: string;
  businessSize?: 'small' | 'medium' | 'large' | 'enterprise';
  annualRevenue?: number;
  employeeCount?: number;
  industryCode?: string;
  source: string;
  foundAt: string;
}

interface ScoredLead {
  id: string;
  businessName: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  facilityType: string;
  temperature: 'HOT' | 'WARM' | 'COLD';
  score: number;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedValue: number;
  distance: number;
  complianceStatus?: string;
  daysPastDue?: number;
  deviceCount: number;
  contactPerson?: string;
  businessSize?: string;
  source: string;
  generatedAt: string;
  scoringBreakdown: {
    complianceScore: number;
    businessTypeScore: number;
    revenueScore: number;
    distanceScore: number;
    contactScore: number;
    urgencyScore: number;
    competitiveScore: number;
  };
  actionPlan: {
    contactMethod: 'phone' | 'email' | 'visit' | 'mail';
    timeframe: '24h' | '48h' | '1week' | '2weeks' | '1month';
    message: string;
    followUpSchedule: string[];
  };
  routeOptimization: {
    cluster: string;
    optimalVisitTime: string;
    travelTime: number;
    visitDuration: number;
  };
}

const PUYALLUP_CENTER = { lat: 47.1853, lng: -122.2928 };
const SERVICE_RADIUS = 20;

// Calculate distance between coordinates
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Advanced lead scoring algorithm
function scoreLeadAdvanced(lead: LeadData): ScoredLead {
  const distance = calculateDistance(PUYALLUP_CENTER.lat, PUYALLUP_CENTER.lng, lead.lat, lead.lng);
  
  // Scoring components with detailed breakdown
  const scoring = {
    complianceScore: 0,
    businessTypeScore: 0,
    revenueScore: 0,
    distanceScore: 0,
    contactScore: 0,
    urgencyScore: 0,
    competitiveScore: 0
  };
  
  // 1. Compliance Score (35% weight - most important)
  if (lead.daysPastDue !== undefined) {
    if (lead.daysPastDue > 365) scoring.complianceScore = 35; // Critical
    else if (lead.daysPastDue > 180) scoring.complianceScore = 32; // Urgent
    else if (lead.daysPastDue > 90) scoring.complianceScore = 28; // Overdue
    else if (lead.daysPastDue > 30) scoring.complianceScore = 24; // Due soon
    else if (lead.daysPastDue > 0) scoring.complianceScore = 20; // Recently due
    else scoring.complianceScore = 10; // Current
  } else {
    scoring.complianceScore = 15; // Unknown status
  }
  
  // 2. Business Type Score (25% weight)
  const facilityScores: { [key: string]: number } = {
    'hospital': 25, 'medical_center': 24, 'clinic': 22, 'dental_office': 20,
    'restaurant': 23, 'food_service': 22, 'cafeteria': 20, 'bakery': 19,
    'manufacturing': 21, 'industrial': 21, 'processing': 20, 'warehouse': 18,
    'office_complex': 17, 'commercial': 16, 'retail': 15, 'shopping_center': 19,
    'school': 18, 'university': 20, 'government': 16, 'municipal': 17,
    'hotel': 19, 'apartment': 16, 'nursing_home': 22, 'daycare': 18,
    'other': 12
  };
  
  const facilityType = lead.facilityType.toLowerCase().replace(/\s+/g, '_');
  scoring.businessTypeScore = facilityScores[facilityType] || 12;
  
  // 3. Revenue Potential Score (20% weight)
  let estimatedDevices = lead.deviceCount || 1;
  
  // Estimate device count based on facility type and size if not provided
  if (!lead.deviceCount) {
    if (lead.businessSize === 'enterprise') estimatedDevices = 12;
    else if (lead.businessSize === 'large') estimatedDevices = 8;
    else if (lead.businessSize === 'medium') estimatedDevices = 4;
    else if (facilityType.includes('hospital') || facilityType.includes('manufacturing')) estimatedDevices = 10;
    else if (facilityType.includes('restaurant') || facilityType.includes('office')) estimatedDevices = 3;
    else estimatedDevices = 2;
  }
  
  const estimatedRevenue = estimatedDevices * 250; // $250 per device average
  if (estimatedRevenue > 5000) scoring.revenueScore = 20;
  else if (estimatedRevenue > 3000) scoring.revenueScore = 17;
  else if (estimatedRevenue > 2000) scoring.revenueScore = 14;
  else if (estimatedRevenue > 1000) scoring.revenueScore = 11;
  else if (estimatedRevenue > 500) scoring.revenueScore = 8;
  else scoring.revenueScore = 5;
  
  // 4. Distance Score (10% weight)
  if (distance <= 3) scoring.distanceScore = 10;
  else if (distance <= 7) scoring.distanceScore = 9;
  else if (distance <= 12) scoring.distanceScore = 7;
  else if (distance <= 18) scoring.distanceScore = 5;
  else if (distance <= 25) scoring.distanceScore = 3;
  else scoring.distanceScore = 1;
  
  // 5. Contact Quality Score (5% weight)
  if (lead.contactPerson && lead.phone && lead.email) scoring.contactScore = 5;
  else if (lead.phone && lead.email) scoring.contactScore = 4;
  else if (lead.phone || lead.email) scoring.contactScore = 3;
  else if (lead.website) scoring.contactScore = 2;
  else scoring.contactScore = 1;
  
  // 6. Urgency Score (3% weight) - immediate opportunity indicators
  if (lead.source === 'compliance_monitor' && lead.daysPastDue && lead.daysPastDue > 90) {
    scoring.urgencyScore = 3;
  } else if (lead.source === 'web_scraper' && lead.facilityType.includes('new_business')) {
    scoring.urgencyScore = 2;
  } else {
    scoring.urgencyScore = 1;
  }
  
  // 7. Competitive Advantage Score (2% weight)
  if (distance <= 10 && facilityScores[facilityType] >= 20) {
    scoring.competitiveScore = 2; // Prime location + high-value facility
  } else if (distance <= 15) {
    scoring.competitiveScore = 1;
  } else {
    scoring.competitiveScore = 0;
  }
  
  // Calculate total score
  const totalScore = Object.values(scoring).reduce((sum, score) => sum + score, 0);
  
  // Determine temperature and priority
  let temperature: 'HOT' | 'WARM' | 'COLD' = 'COLD';
  let priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  
  if (totalScore >= 85) {
    temperature = 'HOT';
    priority = (lead.daysPastDue && lead.daysPastDue > 365) ? 'URGENT' : 'HIGH';
  } else if (totalScore >= 60) {
    temperature = 'WARM';
    priority = (lead.daysPastDue && lead.daysPastDue > 180) ? 'HIGH' : 'MEDIUM';
  } else {
    temperature = 'COLD';
    priority = 'LOW';
  }
  
  // Create action plan based on temperature and priority
  const actionPlan = createActionPlan(temperature, priority, lead, distance);
  
  // Route optimization
  const routeOptimization = calculateRouteOptimization(lead, distance);
  
  return {
    id: lead.id,
    businessName: lead.businessName,
    address: lead.address,
    phone: lead.phone,
    email: lead.email,
    website: lead.website,
    facilityType: lead.facilityType,
    temperature,
    score: Math.round(totalScore),
    priority,
    estimatedValue: estimatedRevenue,
    distance: Math.round(distance * 100) / 100,
    complianceStatus: lead.complianceStatus,
    daysPastDue: lead.daysPastDue,
    deviceCount: estimatedDevices,
    contactPerson: lead.contactPerson,
    businessSize: lead.businessSize,
    source: lead.source,
    generatedAt: new Date().toISOString(),
    scoringBreakdown: scoring,
    actionPlan,
    routeOptimization
  };
}

// Create detailed action plan
function createActionPlan(temperature: string, priority: string, lead: LeadData, distance: number): ScoredLead['actionPlan'] {
  if (temperature === 'HOT') {
    return {
      contactMethod: lead.phone ? 'phone' : 'visit',
      timeframe: priority === 'URGENT' ? '24h' : '48h',
      message: `URGENT: ${lead.businessName} is ${lead.daysPastDue} days overdue for backflow testing. Compliance violation - immediate action required.`,
      followUpSchedule: ['Day 1: Phone call', 'Day 2: Site visit if no response', 'Day 3: Follow-up email with compliance info']
    };
  } else if (temperature === 'WARM') {
    return {
      contactMethod: lead.email ? 'email' : 'phone',
      timeframe: priority === 'HIGH' ? '48h' : '1week',
      message: `Professional backflow testing services available for ${lead.businessName}. Ensure compliance and avoid penalties.`,
      followUpSchedule: ['Week 1: Initial contact', 'Week 2: Follow-up call', 'Week 4: Site visit offer']
    };
  } else {
    return {
      contactMethod: 'email',
      timeframe: '2weeks',
      message: `Educational outreach about backflow testing requirements and benefits for ${lead.businessName}.`,
      followUpSchedule: ['Month 1: Educational email', 'Month 3: Service reminder', 'Month 6: Compliance check-in']
    };
  }
}

// Calculate route optimization
function calculateRouteOptimization(lead: LeadData, distance: number): ScoredLead['routeOptimization'] {
  // Determine geographic cluster
  let cluster = 'Central';
  if (lead.lat > 47.2 && lead.lng > -122.25) cluster = 'North';
  else if (lead.lat < 47.15 && lead.lng > -122.25) cluster = 'South';
  else if (lead.lng < -122.35) cluster = 'West';
  else if (lead.lng > -122.15) cluster = 'East';
  
  // Optimal visit time based on facility type
  let optimalTime = '10:00 AM';
  if (lead.facilityType.includes('restaurant')) optimalTime = '2:00 PM'; // After lunch rush
  else if (lead.facilityType.includes('hospital')) optimalTime = '9:00 AM'; // Early morning
  else if (lead.facilityType.includes('office')) optimalTime = '10:00 AM'; // Mid-morning
  else if (lead.facilityType.includes('industrial')) optimalTime = '8:00 AM'; // Start of shift
  
  return {
    cluster,
    optimalVisitTime: optimalTime,
    travelTime: Math.round(distance * 3), // ~3 minutes per mile
    visitDuration: 60 // Standard 1-hour visit
  };
}

// Batch scoring endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leads, options = {} } = body;
    
    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid leads array provided'
      }, { status: 400 });
    }
    
    const {
      minScore = 30,
      maxResults = 100,
      temperatureFilter,
      sortBy = 'score'
    } = options;
    
    // Score all leads
    const scoredLeads: ScoredLead[] = [];
    const stats = {
      totalProcessed: 0,
      hotLeads: 0,
      warmLeads: 0,
      coldLeads: 0,
      avgScore: 0,
      totalEstimatedRevenue: 0,
      urgentLeads: 0,
      processingTime: 0
    };
    
    const startTime = Date.now();
    
    for (const leadData of leads) {
      if (leadData.lat && leadData.lng) {
        const distance = calculateDistance(PUYALLUP_CENTER.lat, PUYALLUP_CENTER.lng, leadData.lat, leadData.lng);
        
        // Only process leads within service radius
        if (distance <= SERVICE_RADIUS) {
          const scoredLead = scoreLeadAdvanced(leadData);
          
          if (scoredLead.score >= minScore) {
            if (!temperatureFilter || scoredLead.temperature === temperatureFilter) {
              scoredLeads.push(scoredLead);
              
              // Update stats
              if (scoredLead.temperature === 'HOT') stats.hotLeads++;
              else if (scoredLead.temperature === 'WARM') stats.warmLeads++;
              else stats.coldLeads++;
              
              if (scoredLead.priority === 'URGENT') stats.urgentLeads++;
              
              stats.totalEstimatedRevenue += scoredLead.estimatedValue;
            }
          }
        }
      }
      stats.totalProcessed++;
    }
    
    stats.processingTime = Date.now() - startTime;
    stats.avgScore = scoredLeads.length > 0 
      ? Math.round(scoredLeads.reduce((sum, lead) => sum + lead.score, 0) / scoredLeads.length)
      : 0;
    
    // Sort leads
    if (sortBy === 'score') {
      scoredLeads.sort((a, b) => b.score - a.score);
    } else if (sortBy === 'distance') {
      scoredLeads.sort((a, b) => a.distance - b.distance);
    } else if (sortBy === 'value') {
      scoredLeads.sort((a, b) => b.estimatedValue - a.estimatedValue);
    } else if (sortBy === 'urgency') {
      const priorityOrder = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      scoredLeads.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    }
    
    return NextResponse.json({
      success: true,
      stats,
      leads: scoredLeads.slice(0, maxResults),
      processing: {
        timestamp: new Date().toISOString(),
        serviceRadius: SERVICE_RADIUS,
        centerPoint: PUYALLUP_CENTER,
        criteria: { minScore, temperatureFilter, sortBy }
      }
    });
    
  } catch (error) {
    console.error('Lead scoring error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to score leads',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Single lead scoring endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessName = searchParams.get('business');
    const address = searchParams.get('address');
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const facilityType = searchParams.get('type') || 'commercial';
    
    if (!businessName || !address || !lat || !lng) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: business, address, lat, lng'
      }, { status: 400 });
    }
    
    const leadData: LeadData = {
      id: `single_${Date.now()}`,
      businessName,
      address,
      facilityType,
      lat,
      lng,
      source: 'manual_input',
      foundAt: new Date().toISOString()
    };
    
    const scoredLead = scoreLeadAdvanced(leadData);
    
    return NextResponse.json({
      success: true,
      lead: scoredLead,
      analysis: {
        temperature: scoredLead.temperature,
        priority: scoredLead.priority,
        recommendation: scoredLead.actionPlan.message,
        nextAction: `${scoredLead.actionPlan.contactMethod} within ${scoredLead.actionPlan.timeframe}`,
        estimatedValue: `$${scoredLead.estimatedValue.toLocaleString()}`,
        distance: `${scoredLead.distance} miles`
      }
    });
    
  } catch (error) {
    console.error('Single lead scoring error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to score lead',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}