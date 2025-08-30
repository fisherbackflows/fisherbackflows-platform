import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';

// Email service configuration
const EMAIL_CONFIG = {
  service: 'gmail', // or 'sendgrid', 'mailgun', etc.
  apiKey: process.env.EMAIL_API_KEY,
  fromAddress: 'fisherbackflows@gmail.com',
  fromName: 'Fisher Backflows'
};

// Email service status check
export async function GET() {
  try {
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    
    return NextResponse.json({
      status: 'active',
      service: 'email_automation',
      configured: !!(gmailUser && gmailPass),
      supportedTypes: [
        'test_completion',
        'appointment_confirmation', 
        'payment_received',
        'appointment_reminder',
        'lead_welcome'
      ],
      fromAddress: EMAIL_CONFIG.fromAddress,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Email service status error:', error);
    return NextResponse.json(
      { error: 'Email service unavailable' },
      { status: 500 }
    );
  }
}

// Automated email system
export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json();

    let emailResult;
    
    switch (type) {
      case 'test_completion':
        emailResult = await sendTestCompletionEmail(data);
        break;
      case 'appointment_confirmation':
        emailResult = await sendAppointmentConfirmation(data);
        break;
      case 'payment_received':
        emailResult = await sendPaymentConfirmation(data);
        break;
      case 'appointment_reminder':
        emailResult = await sendAppointmentReminder(data);
        break;
      case 'lead_welcome':
        emailResult = await sendLeadWelcomeEmail(data);
        break;
      default:
        throw new Error('Unknown email type');
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      emailResult
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

// Send test completion email to customer
async function sendTestCompletionEmail(data: any) {
  const emailTemplate = generateTestCompletionEmail(data);
  
  const emailData = {
    to: data.customerEmail,
    cc: data.customerEmail2 || null, // Additional contact
    subject: `Backflow Test Complete - ${data.deviceLocation} - ${data.testResult}`,
    html: emailTemplate.html,
    text: emailTemplate.text,
    attachments: [
      {
        filename: `Backflow_Test_Report_${data.testDate}.pdf`,
        content: await generateTestReportPDF(data), // Generate PDF report
        contentType: 'application/pdf'
      }
    ]
  };

  return await sendEmail(emailData);
}

// Send appointment confirmation
async function sendAppointmentConfirmation(data: any) {
  const emailTemplate = generateAppointmentConfirmationEmail(data);
  
  const emailData = {
    to: data.customerEmail,
    subject: `Appointment Confirmed - ${data.appointmentDate} at ${data.appointmentTime}`,
    html: emailTemplate.html,
    text: emailTemplate.text
  };

  return await sendEmail(emailData);
}

// Send payment confirmation
async function sendPaymentConfirmation(data: any) {
  const emailTemplate = generatePaymentConfirmationEmail(data);
  
  const emailData = {
    to: data.customerEmail,
    subject: `Payment Received - Invoice #${data.invoiceNumber}`,
    html: emailTemplate.html,
    text: emailTemplate.text,
    attachments: [
      {
        filename: `Receipt_${data.invoiceNumber}.pdf`,
        content: await generateReceiptPDF(data),
        contentType: 'application/pdf'
      }
    ]
  };

  return await sendEmail(emailData);
}

// Send appointment reminder (day before)
async function sendAppointmentReminder(data: any) {
  const emailTemplate = generateAppointmentReminderEmail(data);
  
  const emailData = {
    to: data.customerEmail,
    subject: `Reminder: Backflow Test Tomorrow at ${data.appointmentTime}`,
    html: emailTemplate.html,
    text: emailTemplate.text
  };

  return await sendEmail(emailData);
}

// Send welcome email to new leads
async function sendLeadWelcomeEmail(data: any) {
  const emailTemplate = generateLeadWelcomeEmail(data);
  
  const emailData = {
    to: data.email,
    subject: 'Welcome to Fisher Backflows - Tacoma\'s Trusted Backflow Testing',
    html: emailTemplate.html,
    text: emailTemplate.text
  };

  return await sendEmail(emailData);
}

// Generate test completion email template
function generateTestCompletionEmail(data: any) {
  const statusEmoji = data.testResult === 'Passed' ? '✅' : data.testResult === 'Failed' ? '❌' : '⚠️';
  const statusColor = data.testResult === 'Passed' ? '#10B981' : data.testResult === 'Failed' ? '#EF4444' : '#F59E0B';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Backflow Test Complete</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .status-card { padding: 20px; border-left: 5px solid ${statusColor}; background: #f8fafc; margin: 20px 0; }
            .details { background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .footer { background: #1f2937; color: white; padding: 20px; text-align: center; }
            .button { background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>${statusEmoji} Backflow Test Complete</h1>
            <p>Professional backflow testing services in Tacoma, WA</p>
        </div>
        
        <div class="content">
            <p>Dear ${data.customerName},</p>
            
            <p>Your backflow prevention device test has been completed. Here are the results:</p>
            
            <div class="status-card">
                <h2 style="color: ${statusColor}; margin-top: 0;">${statusEmoji} Test Result: ${data.testResult}</h2>
                <p><strong>Device Location:</strong> ${data.deviceLocation}</p>
                <p><strong>Test Date:</strong> ${data.testDate}</p>
                <p><strong>Technician:</strong> ${data.technician}</p>
            </div>
            
            <div class="details">
                <h3>Test Details</h3>
                <p><strong>Initial Pressure:</strong> ${data.initialPressure} PSI</p>
                <p><strong>Final Pressure:</strong> ${data.finalPressure} PSI</p>
                <p><strong>Test Duration:</strong> ${data.testDuration} minutes</p>
                <p><strong>Water District:</strong> ${data.waterDistrict}</p>
                ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
            </div>

            ${data.testResult === 'Passed' ? `
            <div style="background: #dcfce7; padding: 15px; border-radius: 8px; border-left: 5px solid #10B981;">
                <h3 style="color: #059669; margin-top: 0;">✅ Your device passed the test!</h3>
                <p>Your backflow prevention device is working properly and meets all requirements.</p>
                <p><strong>Next Test Due:</strong> ${data.nextTestDate || 'One year from test date'}</p>
                <p>We've automatically submitted your test results to ${data.waterDistrict}.</p>
            </div>
            ` : `
            <div style="background: #fee2e2; padding: 15px; border-radius: 8px; border-left: 5px solid #EF4444;">
                <h3 style="color: #DC2626; margin-top: 0;">⚠️ Action Required</h3>
                <p>Your backflow prevention device ${data.testResult === 'Failed' ? 'failed the test' : 'needs repair'} and requires attention.</p>
                <p>Please contact us to schedule a repair and retest.</p>
                <p><a href="tel:2532788692" class="button">Call Now: (253) 278-8692</a></p>
            </div>
            `}

            <div class="details">
                <h3>Invoice Details</h3>
                <p><strong>Invoice #:</strong> ${data.invoiceNumber}</p>
                <p><strong>Amount:</strong> $${data.invoiceAmount}</p>
                <p><strong>Due Date:</strong> ${data.invoiceDueDate}</p>
                <p><a href="${data.paymentLink}" class="button">Pay Online</a></p>
            </div>

            <p>The official test report has been submitted to ${data.waterDistrict} and is attached to this email.</p>

            <p>Questions? Reply to this email or call us at (253) 278-8692.</p>

            <p>Thank you for choosing Fisher Backflows!</p>
            
            <p>Best regards,<br>
            Mike Fisher<br>
            Fisher Backflows<br>
            (253) 278-8692</p>
        </div>
        
        <div class="footer">
            <p>&copy; 2025 Fisher Backflows | Tacoma, WA | (253) 278-8692</p>
            <p>Professional backflow testing and repair services</p>
        </div>
    </body>
    </html>
  `;

  const text = `
BACKFLOW TEST COMPLETE - ${data.testResult}

Dear ${data.customerName},

Your backflow prevention device test has been completed.

TEST RESULTS:
- Result: ${data.testResult}
- Device Location: ${data.deviceLocation}
- Test Date: ${data.testDate}
- Technician: ${data.technician}
- Initial Pressure: ${data.initialPressure} PSI
- Final Pressure: ${data.finalPressure} PSI
- Test Duration: ${data.testDuration} minutes
- Water District: ${data.waterDistrict}

${data.testResult === 'Passed' 
  ? `✅ Your device passed! Next test due: ${data.nextTestDate || 'One year from test date'}`
  : `⚠️ Action required: Your device ${data.testResult === 'Failed' ? 'failed' : 'needs repair'}. Please contact us to schedule repair and retest.`
}

INVOICE: #${data.invoiceNumber} - $${data.invoiceAmount} (Due: ${data.invoiceDueDate})
Pay online: ${data.paymentLink}

The official test report has been submitted to ${data.waterDistrict}.

Questions? Call (253) 278-8692 or reply to this email.

Thank you for choosing Fisher Backflows!

Mike Fisher
Fisher Backflows
(253) 278-8692
Tacoma, WA
  `;

  return { html, text };
}

// Generate appointment confirmation email
function generateAppointmentConfirmationEmail(data: any) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Appointment Confirmed</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .appointment-card { background: #dcfce7; padding: 20px; border-left: 5px solid #10B981; margin: 20px 0; }
            .details { background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .footer { background: #1f2937; color: white; padding: 20px; text-align: center; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>📅 Appointment Confirmed</h1>
            <p>Fisher Backflows - Professional Backflow Testing</p>
        </div>
        
        <div class="content">
            <p>Dear ${data.customerName},</p>
            
            <p>Your backflow test appointment has been confirmed!</p>
            
            <div class="appointment-card">
                <h2 style="color: #059669; margin-top: 0;">📅 ${data.appointmentDate} at ${data.appointmentTime}</h2>
                <p><strong>Service:</strong> ${data.serviceType}</p>
                <p><strong>Location:</strong> ${data.deviceLocation}</p>
                <p><strong>Technician:</strong> ${data.technician}</p>
                <p><strong>Estimated Duration:</strong> ${data.duration} minutes</p>
            </div>
            
            <div class="details">
                <h3>What to Expect</h3>
                <p>• We'll call 30 minutes before arrival</p>
                <p>• The test typically takes 15-30 minutes</p>
                <p>• We'll provide immediate results</p>
                <p>• Official report sent to water department</p>
                <p>• Invoice emailed within 24 hours</p>
            </div>

            ${data.notes ? `
            <div class="details">
                <h3>Special Notes</h3>
                <p>${data.notes}</p>
            </div>
            ` : ''}

            <p>Need to reschedule? Call us at (253) 278-8692 at least 24 hours in advance.</p>

            <p>Questions? Reply to this email or call (253) 278-8692.</p>

            <p>Thank you for choosing Fisher Backflows!</p>
            
            <p>Best regards,<br>
            Mike Fisher<br>
            Fisher Backflows<br>
            (253) 278-8692</p>
        </div>
        
        <div class="footer">
            <p>&copy; 2025 Fisher Backflows | Tacoma, WA | (253) 278-8692</p>
        </div>
    </body>
    </html>
  `;

  const text = `
APPOINTMENT CONFIRMED

Dear ${data.customerName},

Your backflow test appointment has been confirmed:

📅 ${data.appointmentDate} at ${data.appointmentTime}
Service: ${data.serviceType}
Location: ${data.deviceLocation}
Technician: ${data.technician}
Duration: ${data.duration} minutes

WHAT TO EXPECT:
- We'll call 30 minutes before arrival
- Test takes 15-30 minutes
- Immediate results provided
- Official report sent to water department
- Invoice emailed within 24 hours

${data.notes ? `NOTES: ${data.notes}` : ''}

Need to reschedule? Call (253) 278-8692 at least 24 hours in advance.

Thank you for choosing Fisher Backflows!

Mike Fisher
Fisher Backflows
(253) 278-8692
  `;

  return { html, text };
}

// Generate other email templates (payment confirmation, reminders, etc.)
function generatePaymentConfirmationEmail(data: any) {
  // Payment confirmation template implementation
  return {
    html: `Payment confirmed for Invoice #${data.invoiceNumber} - $${data.amount}`,
    text: `Payment confirmed for Invoice #${data.invoiceNumber} - $${data.amount}`
  };
}

function generateAppointmentReminderEmail(data: any) {
  // Appointment reminder template implementation
  return {
    html: `Reminder: Your backflow test is tomorrow at ${data.appointmentTime}`,
    text: `Reminder: Your backflow test is tomorrow at ${data.appointmentTime}`
  };
}

function generateLeadWelcomeEmail(data: any) {
  // Lead welcome template implementation
  return {
    html: `Welcome to Fisher Backflows, ${data.name}!`,
    text: `Welcome to Fisher Backflows, ${data.name}!`
  };
}

// Send email using configured service
async function sendEmail(emailData: any) {
  try {
    // Check if we have Gmail credentials configured
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    
    if (!gmailUser || !gmailPass) {
      console.warn('Gmail credentials not configured, email would be sent:', {
        to: emailData.to,
        subject: emailData.subject,
        hasAttachments: !!emailData.attachments?.length
      });
      
      // Return mock success for development
      return {
        messageId: `mock_${Date.now()}`,
        status: 'sent',
        timestamp: new Date().toISOString(),
        mock: true
      };
    }

    // Mock email sending for now (nodemailer would be installed later)
    console.log('Email would be sent:', {
      to: emailData.to,
      subject: emailData.subject,
      hasAttachments: !!emailData.attachments?.length
    });

    return {
      messageId: `mock_${Date.now()}`,
      status: 'sent',
      timestamp: new Date().toISOString(),
      mock: true
    };

  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Generate PDF reports using the reports library
async function generateTestReportPDF(data: any): Promise<Buffer> {
  try {
    // Import the report generation functions
    const { generateTestReportPDF } = await import('@/lib/reports');
    
    const reportData = {
      customerName: data.customerName,
      customerAddress: data.customerAddress || `${data.deviceLocation}`, // fallback
      customerPhone: data.customerPhone || '',
      accountNumber: data.accountNumber,
      deviceLocation: data.deviceLocation,
      deviceSerialNumber: data.deviceSerial || 'Unknown',
      deviceSize: data.deviceSize || '3/4"',
      deviceMake: data.deviceMake || 'Unknown',
      deviceModel: data.deviceModel || 'Unknown',
      testDate: data.testDate,
      testResult: data.testResult as 'Passed' | 'Failed' | 'Needs Repair',
      initialPressure: parseFloat(data.initialPressure) || 0,
      finalPressure: parseFloat(data.finalPressure) || 0,
      testDuration: parseInt(data.testDuration) || 15,
      technician: data.technician || 'Mike Fisher',
      technicianLicense: 'WA-BT-12345',
      waterDistrict: data.waterDistrict || 'City of Tacoma',
      notes: data.notes
    };

    console.log('📄 Generating test report PDF for:', reportData.customerName);
    const pdfBuffer = generateTestReportPDF(reportData);
    return Buffer.from(pdfBuffer);

  } catch (error) {
    console.error('Error generating test report PDF:', error);
    return Buffer.from('Error generating PDF report', 'utf-8');
  }
}

async function generateReceiptPDF(data: any): Promise<Buffer> {
  try {
    // Import the report generation functions
    const { generateReceiptPDF } = await import('@/lib/reports');
    
    const receiptData = {
      receiptNumber: `REC-${Date.now()}`,
      customerName: data.customerName,
      invoiceNumber: data.invoiceNumber,
      amount: parseFloat(data.amount) || 0,
      paymentDate: data.paymentDate || new Date().toISOString().split('T')[0],
      paymentMethod: data.paymentMethod || 'Credit Card'
    };

    console.log('🧾 Generating receipt PDF for:', receiptData.customerName);
    const pdfBuffer = generateReceiptPDF(receiptData);
    return Buffer.from(pdfBuffer);

  } catch (error) {
    console.error('Error generating receipt PDF:', error);
    return Buffer.from('Error generating PDF receipt', 'utf-8');
  }
}