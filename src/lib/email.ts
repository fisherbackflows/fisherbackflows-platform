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
  }),

  invoiceGenerated: (customerName: string, invoiceNumber: string, amount: string, dueDate: string, paymentUrl?: string) => ({
    subject: `Invoice ${invoiceNumber} - Fisher Backflows`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Fisher Backflows</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Invoice Ready</p>
        </div>
        
        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: #1e40af; margin-top: 0;">New Invoice Generated</h2>
          <p>Hi ${customerName},</p>
          <p>Your backflow testing has been completed and your invoice is ready for payment.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">Invoice Details</h3>
            <p><strong>Invoice #:</strong> ${invoiceNumber}</p>
            <p><strong>Amount:</strong> $${amount}</p>
            <p><strong>Due Date:</strong> ${dueDate}</p>
          </div>
          
          ${paymentUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${paymentUrl}" style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">Pay Online Now</a>
          </div>
          ` : ''}
          
          <p>For questions about this invoice, please contact us:</p>
          <ul>
            <li>Phone: (253) 278-8692</li>
            <li>Email: service@fisherbackflows.com</li>
          </ul>
          
          <p>Thank you for choosing Fisher Backflows!</p>
          <p>Fisher Backflows Team</p>
        </div>
        
        <div style="background: #e5e7eb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-radius: 0 0 8px 8px;">
          <p>Fisher Backflows | Professional Backflow Testing</p>
          <p>This invoice was generated automatically after your test completion.</p>
        </div>
      </div>
    `
  }),

  // Lead nurturing email templates
  leadWelcome: (leadName: string, leadSource?: string) => ({
    subject: 'Welcome! Let\'s protect your water supply - Fisher Backflows',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Fisher Backflows</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Professional Backflow Testing</p>
        </div>
        
        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: #059669; margin-top: 0;">Welcome ${leadName}!</h2>
          <p>Thank you for your interest in our backflow testing services${leadSource ? ` through ${leadSource}` : ''}.</p>
          
          <p>Backflow prevention is crucial for protecting your water supply from contamination. Here's what makes Fisher Backflows the right choice:</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #059669; margin-top: 0;">Why Choose Fisher Backflows?</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Certified Professionals:</strong> All our technicians are state-certified</li>
              <li><strong>Fast Service:</strong> Usually same-day or next-day appointments</li>
              <li><strong>Competitive Pricing:</strong> Starting at just $65 for residential testing</li>
              <li><strong>Full Compliance:</strong> We handle all water district submissions</li>
              <li><strong>Repair Services:</strong> Complete backflow device repair and replacement</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/portal/schedule" style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">Schedule Your Test Now</a>
          </div>
          
          <p>Have questions? Just reply to this email or call us at <strong>(253) 278-8692</strong>.</p>
          
          <p>Looking forward to serving you!</p>
          <p>Mike Fisher<br/>Fisher Backflows LLC</p>
        </div>
      </div>
    `
  }),

  leadFollowUp1: (leadName: string) => ({
    subject: 'Don\'t wait - schedule your backflow test before it\'s overdue',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Fisher Backflows</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">⚠️ Don't Let Your Test Expire</p>
        </div>
        
        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: #dc2626; margin-top: 0;">Hi ${leadName},</h2>
          <p>We wanted to follow up on your backflow testing needs. Did you know that overdue backflow tests can result in:</p>
          
          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0;">
            <ul style="margin: 0; color: #7f1d1d;">
              <li>Water service disconnection</li>
              <li>Fines from your water district</li>
              <li>Non-compliance violations</li>
              <li>Potential health risks</li>
            </ul>
          </div>
          
          <p><strong>Don't wait until it's too late!</strong> Schedule your test today and stay compliant.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #059669; margin-top: 0;">Quick & Easy Scheduling</h3>
            <p>✅ Online booking available 24/7<br/>
            ✅ Same-day and next-day appointments<br/>
            ✅ All paperwork handled for you<br/>
            ✅ Competitive pricing starting at $65</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/portal/schedule" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">Schedule Now - Don't Delay!</a>
          </div>
          
          <p>Questions? Call us at <strong>(253) 278-8692</strong> or just reply to this email.</p>
        </div>
      </div>
    `
  }),

  leadFollowUp2: (leadName: string) => ({
    subject: 'Final reminder: Your backflow test compliance',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Fisher Backflows</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Final Reminder</p>
        </div>
        
        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: #1e40af; margin-top: 0;">Hi ${leadName},</h2>
          <p>This is our final reminder about your backflow testing needs. We understand you're busy, but compliance is important.</p>
          
          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">Special Offer - This Week Only</h3>
            <p><strong>$10 OFF</strong> your backflow test when you book this week!</p>
            <p>Use code: <strong>COMPLY2025</strong></p>
          </div>
          
          <p>We've made it as easy as possible:</p>
          <ul>
            <li>Quick 15-minute online booking</li>
            <li>Flexible scheduling including weekends</li>
            <li>We handle all district paperwork</li>
            <li>Immediate test results</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/portal/schedule?promo=COMPLY2025" style="background: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">Book Now & Save $10</a>
          </div>
          
          <p>If you're no longer interested, please <a href="#" style="color: #6b7280;">click here to unsubscribe</a>.</p>
          
          <p>Thanks for considering Fisher Backflows!</p>
        </div>
      </div>
    `
  }),

  leadReEngagement: (leadName: string) => ({
    subject: 'Still need backflow testing? We\'re here to help',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Fisher Backflows</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">We're Still Here to Help</p>
        </div>
        
        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: #7c3aed; margin-top: 0;">Hi ${leadName},</h2>
          <p>We haven't heard from you in a while, but we wanted to check in about your backflow testing needs.</p>
          
          <p>Perhaps we can help address any concerns:</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #7c3aed; margin-top: 0;">Common Questions</h3>
            <p><strong>Q: How long does testing take?</strong><br/>
            A: Usually 15-30 minutes per device.</p>
            
            <p><strong>Q: What if my device fails?</strong><br/>
            A: We can repair it on the spot or schedule a follow-up.</p>
            
            <p><strong>Q: Do you handle the paperwork?</strong><br/>
            A: Yes! We submit everything to your water district.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="tel:2532788692" style="background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">Call Us: (253) 278-8692</a>
          </div>
          
          <p>Or simply reply to this email with your questions. We're here to help make compliance easy!</p>
        </div>
      </div>
    `
  })
};