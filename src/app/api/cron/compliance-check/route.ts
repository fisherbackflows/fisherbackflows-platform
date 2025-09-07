import { NextRequest, NextResponse } from 'next/server';

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  lastRun: string | null;
  nextRun: string;
  status: 'active' | 'paused' | 'error';
  runCount: number;
  errorCount: number;
  lastError?: string;
}

interface ComplianceAlert {
  id: string;
  businessName: string;
  address: string;
  phone?: string;
  daysPastDue: number;
  facilityType: string;
  deviceCount: number;
  estimatedValue: number;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  alertTime: string;
  contacted: boolean;
  scheduledVisit?: string;
}

// Simulate cron job storage (in production, use database)
const cronJobs: CronJob[] = [
  {
    id: 'compliance_monitor_hourly',
    name: 'Hourly Compliance Check',
    schedule: '0 * * * *', // Every hour
    lastRun: null,
    nextRun: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    status: 'active',
    runCount: 0,
    errorCount: 0
  },
  {
    id: 'compliance_monitor_daily',
    name: 'Daily Critical Alert Scan',
    schedule: '0 8 * * *', // 8 AM daily
    lastRun: null,
    nextRun: new Date().toISOString().split('T')[0] + 'T08:00:00.000Z',
    status: 'active',
    runCount: 0,
    errorCount: 0
  }
];

let complianceAlerts: ComplianceAlert[] = [];

// Execute compliance monitoring
async function executeComplianceCheck(jobType: 'hourly' | 'daily'): Promise<ComplianceAlert[]> {
  try {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://fisherbackflows.com'
      : 'http://localhost:3000';
    
    const mode = jobType === 'hourly' ? 'scan' : 'alerts';
    const minScore = jobType === 'hourly' ? 85 : 90; // Higher threshold for daily alerts
    
    const response = await fetch(`${baseUrl}/api/lead-generation/compliance-monitor?mode=${mode}&minScore=${minScore}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Fisher-Compliance-Monitor/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Compliance check failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    const newAlerts: ComplianceAlert[] = [];
    
    if (data.success) {
      const leads = data.leads || data.urgentAlerts || [];
      
      for (const lead of leads) {
        // Only create alerts for high-priority leads
        if (lead.priority === 'URGENT' || lead.priority === 'HIGH') {
          const alert: ComplianceAlert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            businessName: lead.businessName,
            address: lead.address,
            phone: lead.phone,
            daysPastDue: lead.daysPastDue,
            facilityType: lead.facilityType,
            deviceCount: lead.deviceCount,
            estimatedValue: lead.estimatedValue,
            urgency: lead.priority === 'URGENT' ? 'CRITICAL' : 'HIGH',
            alertTime: new Date().toISOString(),
            contacted: false
          };
          
          // Check if we already have this alert (avoid duplicates)
          const existingAlert = complianceAlerts.find(a => 
            a.businessName === alert.businessName && 
            a.address === alert.address
          );
          
          if (!existingAlert) {
            newAlerts.push(alert);
            complianceAlerts.push(alert);
          }
        }
      }
    }
    
    return newAlerts;
    
  } catch (error) {
    console.error('Compliance check execution error:', error);
    throw error;
  }
}

// Send compliance alerts (email/SMS simulation)
async function sendComplianceAlerts(alerts: ComplianceAlert[]): Promise<void> {
  if (alerts.length === 0) return;
  
  try {
    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    const alertSummary = {
      timestamp: new Date().toISOString(),
      totalAlerts: alerts.length,
      criticalCount: alerts.filter(a => a.urgency === 'CRITICAL').length,
      highCount: alerts.filter(a => a.urgency === 'HIGH').length,
      estimatedRevenue: alerts.reduce((sum, a) => sum + a.estimatedValue, 0),
      alerts: alerts.map(alert => ({
        business: alert.businessName,
        address: alert.address,
        phone: alert.phone,
        daysPastDue: alert.daysPastDue,
        urgency: alert.urgency,
        value: `$${alert.estimatedValue.toLocaleString()}`
      }))
    };
    
    console.log('📧 COMPLIANCE ALERT EMAIL SENT:', alertSummary);
    
    // Mark alerts as processed
    alerts.forEach(alert => {
      const index = complianceAlerts.findIndex(a => a.id === alert.id);
      if (index !== -1) {
        complianceAlerts[index].contacted = true;
      }
    });
    
  } catch (error) {
    console.error('Failed to send compliance alerts:', error);
    throw error;
  }
}

// Update cron job status
function updateCronJob(jobId: string, status: 'success' | 'error', error?: string): void {
  const job = cronJobs.find(j => j.id === jobId);
  if (job) {
    job.lastRun = new Date().toISOString();
    job.runCount++;
    
    if (status === 'error') {
      job.status = 'error';
      job.errorCount++;
      job.lastError = error;
    } else {
      job.status = 'active';
      job.lastError = undefined;
    }
    
    // Calculate next run time
    if (jobId === 'compliance_monitor_hourly') {
      job.nextRun = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    } else if (jobId === 'compliance_monitor_daily') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      job.nextRun = tomorrow.toISOString();
    }
  }
}

// Main cron endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobType = searchParams.get('job') as 'hourly' | 'daily' || 'hourly';
    const action = searchParams.get('action') || 'run';
    
    if (action === 'status') {
      // Return cron job status
      return NextResponse.json({
        success: true,
        jobs: cronJobs,
        alerts: {
          total: complianceAlerts.length,
          uncontacted: complianceAlerts.filter(a => !a.contacted).length,
          critical: complianceAlerts.filter(a => a.urgency === 'CRITICAL').length,
          recent: complianceAlerts.filter(a => 
            new Date().getTime() - new Date(a.alertTime).getTime() < 24 * 60 * 60 * 1000
          ).length
        }
      });
    }
    
    if (action === 'run') {
      // Execute compliance monitoring
      const jobId = jobType === 'hourly' ? 'compliance_monitor_hourly' : 'compliance_monitor_daily';
      
      try {
        console.log(`🔄 Running ${jobType} compliance check...`);
        const newAlerts = await executeComplianceCheck(jobType);
        
        if (newAlerts.length > 0) {
          console.log(`🚨 Found ${newAlerts.length} new compliance alerts`);
          await sendComplianceAlerts(newAlerts);
        }
        
        updateCronJob(jobId, 'success');
        
        return NextResponse.json({
          success: true,
          jobType,
          executed: true,
          newAlerts: newAlerts.length,
          totalAlerts: complianceAlerts.length,
          timestamp: new Date().toISOString(),
          alerts: newAlerts
        });
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        updateCronJob(jobId, 'error', errorMessage);
        
        return NextResponse.json({
          success: false,
          jobType,
          error: errorMessage,
          timestamp: new Date().toISOString()
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use "run" or "status"'
    }, { status: 400 });
    
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({
      success: false,
      error: 'Cron job execution failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Manual trigger for testing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, jobType } = body;
    
    if (action === 'trigger') {
      // Manually trigger a compliance check
      const alerts = await executeComplianceCheck(jobType || 'hourly');
      
      if (alerts.length > 0) {
        await sendComplianceAlerts(alerts);
      }
      
      return NextResponse.json({
        success: true,
        triggered: true,
        jobType: jobType || 'hourly',
        alertsGenerated: alerts.length,
        timestamp: new Date().toISOString(),
        alerts
      });
      
    } else if (action === 'clear_alerts') {
      // Clear old alerts
      const beforeCount = complianceAlerts.length;
      complianceAlerts = complianceAlerts.filter(alert => 
        new Date().getTime() - new Date(alert.alertTime).getTime() < 7 * 24 * 60 * 60 * 1000 // Keep 7 days
      );
      
      return NextResponse.json({
        success: true,
        cleared: beforeCount - complianceAlerts.length,
        remaining: complianceAlerts.length
      });
      
    } else if (action === 'pause_job') {
      const { jobId } = body;
      const job = cronJobs.find(j => j.id === jobId);
      if (job) {
        job.status = 'paused';
        return NextResponse.json({
          success: true,
          message: `Job ${jobId} paused`
        });
      }
      
    } else if (action === 'resume_job') {
      const { jobId } = body;
      const job = cronJobs.find(j => j.id === jobId);
      if (job) {
        job.status = 'active';
        return NextResponse.json({
          success: true,
          message: `Job ${jobId} resumed`
        });
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });
    
  } catch (error) {
    console.error('Manual trigger error:', error);
    return NextResponse.json({
      success: false,
      error: 'Manual trigger failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}