/**
 * Minimalist Email Service - Fisher Backflows
 * Single provider (SendGrid) with simple fallback to console in dev
 */

import sgMail from '@sendgrid/mail';

// Initialize SendGrid if configured
const isConfigured = !!process.env.SENDGRID_API_KEY;
if (isConfigured) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const from = options.from || process.env.SENDGRID_FROM_EMAIL || 'noreply@fisherbackflows.com';
  
  // Development mode - just log
  if (process.env.NODE_ENV === 'development' || !isConfigured) {
    console.log('📧 Email (dev mode):', {
      to: options.to,
      subject: options.subject,
      from
    });
    return true;
  }

  try {
    await sgMail.send({
      to: options.to,
      from,
      subject: options.subject,
      text: options.text,
      html: options.html
    });
    return true;
  } catch (error) {
    console.error('Email send failed:', error);
    return false;
  }
}

// Common email templates as simple functions
export const emailTemplates = {
  appointmentConfirmation: (customerName: string, date: string, time: string, serviceType: string) => {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return {
      subject: `Appointment Confirmed - ${formattedDate} at ${time}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Fisher Backflows</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Professional Backflow Testing Services</p>
          </div>
          
          <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #1e40af; margin-top: 0;">Appointment Confirmed</h2>
            <p>Dear ${customerName},</p>
            <p>Your backflow testing appointment has been confirmed for:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1e40af;">Appointment Details</h3>
              <p><strong>Date:</strong> ${formattedDate}</p>
              <p><strong>Time:</strong> ${time}</p>
              <p><strong>Service:</strong> ${serviceType}</p>
            </div>
            
            <p>Our certified technician will arrive at the scheduled time to perform your backflow testing. Please ensure the testing area is accessible.</p>
            
            <p>If you need to reschedule or have any questions, please contact us at:</p>
            <ul>
              <li>Phone: (253) 555-FLOW</li>
              <li>Email: service@fisherbackflows.com</li>
            </ul>
            
            <p>Thank you for choosing Fisher Backflows!</p>
          </div>
          
          <div style="background: #e5e7eb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-radius: 0 0 8px 8px;">
            <p>Fisher Backflows | Professional Backflow Testing</p>
            <p>This email was sent automatically. Please do not reply to this email.</p>
          </div>
        </div>
      `,
      text: `Fisher Backflows - Appointment Confirmed
      
Dear ${customerName},

Your backflow testing appointment has been confirmed for:
Date: ${formattedDate}
Time: ${time}
Service: ${serviceType}

Our certified technician will arrive at the scheduled time.

Contact us: (253) 555-FLOW | service@fisherbackflows.com

Thank you for choosing Fisher Backflows!`
    };
  },

  testReminder: (customerName: string, date: string) => ({
    subject: 'Backflow Test Reminder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Fisher Backflows</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Appointment Reminder</p>
        </div>
        
        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: #d97706; margin-top: 0;">Appointment Tomorrow</h2>
          <p>Hi ${customerName},</p>
          <p>This is a reminder that your backflow test is scheduled for <strong>${date}</strong>.</p>
          <p>Our technician will arrive between 8 AM and 5 PM.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <p><strong>Please ensure:</strong></p>
            <ul>
              <li>The testing area is clear and accessible</li>
              <li>Someone 18+ is present during testing</li>
              <li>Water shut-off valves are accessible</li>
            </ul>
          </div>
          
          <p>Need to reschedule? Call us immediately: <strong>(253) 555-FLOW</strong></p>
          <p>Thank you,<br>Fisher Backflows Team</p>
        </div>
      </div>
    `
  }),
  
  testComplete: (customerName: string, reportUrl: string) => ({
    subject: 'Backflow Test Complete',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Fisher Backflows</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Test Complete</p>
        </div>
        
        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: #059669; margin-top: 0;">Test Complete</h2>
          <p>Hi ${customerName},</p>
          <p>Your backflow test has been completed successfully.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0; text-align: center;">
            <p><a href="${reportUrl}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Your Report</a></p>
          </div>
          
          <p>Thank you for choosing Fisher Backflows!</p>
          <p>Fisher Backflows Team</p>
        </div>
      </div>
    `
  }),
  
  paymentReceived: (customerName: string, amount: string) => ({
    subject: 'Payment Received',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Fisher Backflows</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Payment Received</p>
        </div>
        
        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: #059669; margin-top: 0;">Payment Confirmed</h2>
          <p>Hi ${customerName},</p>
          <p>We've received your payment of <strong>${amount}</strong>.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
            <p>✅ Payment processed successfully</p>
            <p>📧 Receipt has been sent to your email</p>
          </div>
          
          <p>Thank you for your business!</p>
          <p>Fisher Backflows Team</p>
        </div>
      </div>
    `
  })
};