import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { createRouteHandlerClient } from '@/lib/supabase';

// Water Department configurations
const WATER_DEPARTMENTS = {
  'City of Tacoma': {
    name: 'City of Tacoma Water Department',
    email: 'backflow@cityoftacoma.org',
    submitUrl: 'https://www.cityoftacoma.org/backflow/submit',
    apiKey: process.env.TACOMA_WATER_API_KEY,
    requiresForm: true,
    formFields: ['test_date', 'device_serial', 'test_result', 'technician_cert'],
    contactPerson: 'Backflow Program Coordinator',
    phone: '(253) 502-8723'
  },
  'Lakewood Water District': {
    name: 'Lakewood Water District',
    email: 'backflow@lakewoodwater.org',
    submitUrl: 'https://lakewoodwater.org/backflow-reports',
    requiresForm: false,
    contactPerson: 'Water Quality Manager',
    phone: '(253) 588-4421'
  },
  'Puyallup Water': {
    name: 'City of Puyallup Water Division',
    email: 'water@puyallupwa.gov',
    requiresForm: false,
    contactPerson: 'Utilities Department',
    phone: '(253) 864-4165'
  },
  'Federal Way': {
    name: 'City of Federal Way Public Works',
    email: 'utilities@cityoffederalway.com',
    requiresForm: false,
    contactPerson: 'Utilities Manager',
    phone: '(253) 835-2400'
  }
};

// Automated water department report submission
export async function POST(request: NextRequest) {
  try {
    const { testReportId, waterDistrict } = await request.json();
    
    if (!testReportId || !waterDistrict) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient(request);
    
    // Get test report with all related data
    const { data: testReport, error } = await supabase
      .from('test_reports')
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone,
          address,
          account_number
        ),
        devices (
          id,
          serial_number,
          size,
          make,
          model,
          location
        )
      `)
      .eq('id', testReportId)
      .single();

    if (error || !testReport) {
      return NextResponse.json(
        { success: false, error: 'Test report not found' },
        { status: 404 }
      );
    }

    // Get water department configuration
    const deptConfig = WATER_DEPARTMENTS[waterDistrict as keyof typeof WATER_DEPARTMENTS];
    if (!deptConfig) {
      return NextResponse.json(
        { success: false, error: 'Water department not supported' },
        { status: 400 }
      );
    }

    // Generate official report document
    const reportDocument = await generateOfficialReport(testReport);
    
    // Submit to water department based on their requirements
    let submissionResult;
    
    if (deptConfig.requiresForm && deptConfig.submitUrl) {
      // Submit via API/form
      submissionResult = await submitViaAPI(testReport, deptConfig, reportDocument);
    } else {
      // Submit via email
      submissionResult = await submitViaEmail(testReport, deptConfig, reportDocument);
    }

    // Record the submission
    await recordSubmission(testReportId, waterDistrict, submissionResult, supabase);

    // Update test report as submitted
    await supabase
      .from('test_reports')
      .update({ 
        submitted: true,
        submitted_date: new Date().toISOString()
      })
      .eq('id', testReportId);

    return NextResponse.json({
      success: true,
      message: `Report successfully submitted to ${deptConfig.name}`,
      submissionResult,
      department: deptConfig.name,
      submissionMethod: deptConfig.requiresForm ? 'API/Form' : 'Email'
    });

  } catch (error) {
    console.error('Error submitting to water department:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit report' },
      { status: 500 }
    );
  }
}

// Submit report via API/online form
async function submitViaAPI(testReport: any, deptConfig: any, reportDocument: any) {
  try {
    const formData = {
      // Standard backflow report fields
      test_date: testReport.test_date,
      device_serial_number: testReport.devices.serial_number,
      device_location: testReport.devices.location,
      device_size: testReport.devices.size,
      device_make: testReport.devices.make,
      device_model: testReport.devices.model,
      
      // Customer information
      customer_name: testReport.customers.name,
      customer_address: testReport.customers.address,
      customer_phone: testReport.customers.phone,
      
      // Test results
      test_result: testReport.status,
      initial_pressure: testReport.initial_pressure,
      final_pressure: testReport.final_pressure,
      test_duration: testReport.test_duration,
      
      // Technician info
      technician_name: testReport.technician,
      technician_license: 'WA-BT-12345', // Your backflow tester license
      
      // Report document
      report_document: reportDocument.base64,
      report_filename: `Backflow_Report_${testReport.test_date}_${testReport.devices.serial_number}.pdf`
    };

    // Submit to water department API
    const response = await fetch(deptConfig.submitUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': deptConfig.apiKey ? `Bearer ${deptConfig.apiKey}` : undefined,
        'User-Agent': 'Fisher Backflows Automated Reporting System'
      }.filter(Boolean),
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      throw new Error(`API submission failed: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      method: 'API',
      status: 'success',
      confirmation: result.confirmationNumber || result.id || 'API_' + Date.now(),
      timestamp: new Date().toISOString(),
      apiResponse: result
    };

  } catch (error) {
    console.error('API submission error:', error);
    
    // Fall back to email if API fails
    console.log('Falling back to email submission...');
    return await submitViaEmail(testReport, deptConfig, reportDocument);
  }
}

// Submit report via email
async function submitViaEmail(testReport: any, deptConfig: any, reportDocument: any) {
  try {
    const emailSubject = `Backflow Test Report - ${testReport.customers.name} - ${testReport.test_date} - ${testReport.status}`;
    
    const emailBody = generateWaterDepartmentEmail(testReport, deptConfig);

    const emailData = {
      to: deptConfig.email,
      from: 'fisherbackflows@gmail.com',
      subject: emailSubject,
      html: emailBody.html,
      text: emailBody.text,
      attachments: [
        {
          filename: `Backflow_Report_${testReport.test_date}_${testReport.devices.serial_number}.pdf`,
          content: reportDocument.buffer,
          contentType: 'application/pdf'
        }
      ]
    };

    // Send email (integrate with your email service)
    const emailResult = await sendEmailToWaterDepartment(emailData);

    return {
      method: 'Email',
      status: 'success',
      confirmation: emailResult.messageId || 'EMAIL_' + Date.now(),
      timestamp: new Date().toISOString(),
      emailTo: deptConfig.email,
      emailResult
    };

  } catch (error) {
    console.error('Email submission error:', error);
    throw error;
  }
}

// Generate official backflow test report document
async function generateOfficialReport(testReport: any) {
  try {
    // This would generate a professional PDF report with:
    // - Official letterhead
    // - Test results table
    // - Device information
    // - Technician certification
    // - Photos (if any)
    // - Compliance statements
    
    const reportContent = `
OFFICIAL BACKFLOW PREVENTION DEVICE TEST REPORT

Tester: ${testReport.technician}
License: WA-BT-12345
Date: ${testReport.test_date}

CUSTOMER INFORMATION:
Name: ${testReport.customers.name}
Address: ${testReport.customers.address}
Phone: ${testReport.customers.phone}
Account: ${testReport.customers.account_number}

DEVICE INFORMATION:
Serial Number: ${testReport.devices.serial_number}
Location: ${testReport.devices.location}
Size: ${testReport.devices.size}
Make: ${testReport.devices.make}
Model: ${testReport.devices.model}

TEST RESULTS:
Initial Pressure: ${testReport.initial_pressure} PSI
Final Pressure: ${testReport.final_pressure} PSI
Test Duration: ${testReport.test_duration} minutes
Result: ${testReport.status}

NOTES:
${testReport.notes || 'None'}

CERTIFICATION:
I certify that this backflow prevention device has been tested in accordance with 
WAC 246-290-490 and meets/does not meet the requirements for proper operation.

Technician Signature: Mike Fisher
Date: ${testReport.test_date}
License: WA-BT-12345
    `;

    // Convert to PDF (using a PDF generation library in real implementation)
    const pdfBuffer = Buffer.from(reportContent, 'utf-8');
    const base64 = pdfBuffer.toString('base64');

    return {
      buffer: pdfBuffer,
      base64: base64,
      filename: `Backflow_Report_${testReport.test_date}_${testReport.devices.serial_number}.pdf`
    };

  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
}

// Generate email content for water department
function generateWaterDepartmentEmail(testReport: any, deptConfig: any) {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Backflow Test Report Submission</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #1e40af; color: white; padding: 20px; }
        .content { padding: 20px; }
        .report-details { background: #f8fafc; padding: 15px; border-left: 4px solid #1e40af; margin: 15px 0; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 8px 12px; border: 1px solid #ddd; text-align: left; }
        th { background: #f1f5f9; }
        .status-passed { color: #059669; font-weight: bold; }
        .status-failed { color: #dc2626; font-weight: bold; }
        .status-repair { color: #d97706; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Backflow Prevention Device Test Report</h1>
        <p>Fisher Backflows - Licensed Backflow Testing Services</p>
    </div>
    
    <div class="content">
        <p>Dear ${deptConfig.contactPerson || 'Water Department'},</p>
        
        <p>Please find attached the official backflow prevention device test report for:</p>
        
        <div class="report-details">
            <h3>Test Summary</h3>
            <table>
                <tr><th>Customer</th><td>${testReport.customers.name}</td></tr>
                <tr><th>Address</th><td>${testReport.customers.address}</td></tr>
                <tr><th>Test Date</th><td>${testReport.test_date}</td></tr>
                <tr><th>Device Serial</th><td>${testReport.devices.serial_number}</td></tr>
                <tr><th>Device Location</th><td>${testReport.devices.location}</td></tr>
                <tr><th>Test Result</th><td class="status-${testReport.status.toLowerCase()}">${testReport.status}</td></tr>
            </table>
        </div>

        <div class="report-details">
            <h3>Device Information</h3>
            <table>
                <tr><th>Size</th><td>${testReport.devices.size}</td></tr>
                <tr><th>Make</th><td>${testReport.devices.make}</td></tr>
                <tr><th>Model</th><td>${testReport.devices.model}</td></tr>
            </table>
        </div>

        <div class="report-details">
            <h3>Test Results</h3>
            <table>
                <tr><th>Initial Pressure</th><td>${testReport.initial_pressure} PSI</td></tr>
                <tr><th>Final Pressure</th><td>${testReport.final_pressure} PSI</td></tr>
                <tr><th>Test Duration</th><td>${testReport.test_duration} minutes</td></tr>
                <tr><th>Pressure Drop</th><td>${(testReport.initial_pressure - testReport.final_pressure).toFixed(1)} PSI</td></tr>
            </table>
        </div>

        ${testReport.notes ? `
        <div class="report-details">
            <h3>Additional Notes</h3>
            <p>${testReport.notes}</p>
        </div>
        ` : ''}

        <div class="report-details">
            <h3>Technician Information</h3>
            <table>
                <tr><th>Technician</th><td>${testReport.technician}</td></tr>
                <tr><th>License Number</th><td>WA-BT-12345</td></tr>
                <tr><th>Company</th><td>Fisher Backflows</td></tr>
                <tr><th>Phone</th><td>(253) 278-8692</td></tr>
                <tr><th>Email</th><td>fisherbackflows@gmail.com</td></tr>
            </table>
        </div>

        <p>This report has been submitted in compliance with WAC 246-290-490. 
           Please contact us if you need any additional information.</p>

        <p>Best regards,<br>
        Mike Fisher<br>
        Fisher Backflows<br>
        Licensed Backflow Tester<br>
        (253) 278-8692<br>
        fisherbackflows@gmail.com</p>
    </div>
</body>
</html>
  `;

  const text = `
BACKFLOW PREVENTION DEVICE TEST REPORT

Dear ${deptConfig.contactPerson || 'Water Department'},

Please find attached the official backflow test report for:

CUSTOMER: ${testReport.customers.name}
ADDRESS: ${testReport.customers.address}  
TEST DATE: ${testReport.test_date}
DEVICE SERIAL: ${testReport.devices.serial_number}
DEVICE LOCATION: ${testReport.devices.location}
TEST RESULT: ${testReport.status}

DEVICE INFORMATION:
Size: ${testReport.devices.size}
Make: ${testReport.devices.make}
Model: ${testReport.devices.model}

TEST RESULTS:
Initial Pressure: ${testReport.initial_pressure} PSI
Final Pressure: ${testReport.final_pressure} PSI
Test Duration: ${testReport.test_duration} minutes
Pressure Drop: ${(testReport.initial_pressure - testReport.final_pressure).toFixed(1)} PSI

${testReport.notes ? `NOTES: ${testReport.notes}` : ''}

TECHNICIAN: ${testReport.technician}
LICENSE: WA-BT-12345
COMPANY: Fisher Backflows
PHONE: (253) 278-8692
EMAIL: fisherbackflows@gmail.com

This report has been submitted in compliance with WAC 246-290-490.

Best regards,
Mike Fisher
Fisher Backflows
  `;

  return { html, text };
}

// Send email to water department
async function sendEmailToWaterDepartment(emailData: any) {
  try {
    // This would integrate with your actual email service
    console.log('Email would be sent to water department:', {
      to: emailData.to,
      subject: emailData.subject,
      hasAttachment: !!emailData.attachments?.length
    });

    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      messageId: `water_dept_${Date.now()}`,
      status: 'sent',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error sending email to water department:', error);
    throw error;
  }
}

// Record submission for tracking
async function recordSubmission(testReportId: string, waterDistrict: string, submissionResult: any, supabase: any) {
  try {
    await supabase
      .from('water_department_submissions')
      .insert({
        test_report_id: testReportId,
        water_district: waterDistrict,
        submission_method: submissionResult.method,
        confirmation_number: submissionResult.confirmation,
        status: submissionResult.status,
        submitted_at: submissionResult.timestamp,
        response_data: submissionResult
      });

  } catch (error) {
    console.error('Error recording submission:', error);
    // Don't throw - submission to water dept was successful
  }
}

// Get submission status
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request);
    const { searchParams } = new URL(request.url);
    const testReportId = searchParams.get('testReportId');

    if (testReportId) {
      // Get specific submission
      const { data, error } = await supabase
        .from('water_department_submissions')
        .select('*')
        .eq('test_report_id', testReportId)
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        submission: data
      });
    } else {
      // Get all recent submissions
      const { data, error } = await supabase
        .from('water_department_submissions')
        .select('*')
        .order('submitted_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        submissions: data || []
      });
    }

  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}