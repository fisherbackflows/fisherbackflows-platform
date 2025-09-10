import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface BookingConfirmationData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  appointmentId: string;
  appointmentDate: string;
  appointmentTime: string;
  deviceLocation: string;
  deviceType: string;
  zone: string;
  notes?: string;
}

export async function sendBookingConfirmation(data: BookingConfirmationData) {
  try {
    if (!resend) {
      console.warn('Resend API key not configured, skipping email');
      return {
        success: false,
        error: 'Email service not configured',
        message: 'Email service not available'
      };
    }
    const formattedDate = new Date(`${data.appointmentDate}T${data.appointmentTime}`).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    });
    
    const formattedTime = new Date(`2000-01-01T${data.appointmentTime}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Send email confirmation
    const emailResult = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Fisher Backflows <onboarding@resend.dev>',
      to: [data.customerEmail],
      subject: 'Backflow Test Appointment Confirmed',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f172a, #1e293b); color: white; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(90deg, #3b82f6, #1d4ed8); padding: 32px 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Appointment Confirmed</h1>
            <p style="margin: 8px 0 0; opacity: 0.9;">Fisher Backflows Testing</p>
          </div>
          
          <div style="padding: 32px 24px;">
            <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <h2 style="margin: 0 0 16px; color: #3b82f6; font-size: 20px;">Appointment Details</h2>
              <div style="display: grid; gap: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                  <span style="opacity: 0.8;">Date:</span>
                  <strong>${formattedDate}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                  <span style="opacity: 0.8;">Time:</span>
                  <strong>${formattedTime}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                  <span style="opacity: 0.8;">Service Zone:</span>
                  <strong>${data.zone}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                  <span style="opacity: 0.8;">Device:</span>
                  <strong>${data.deviceType} at ${data.deviceLocation}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                  <span style="opacity: 0.8;">Confirmation #:</span>
                  <strong style="font-family: monospace; font-size: 12px;">${data.appointmentId.slice(-8).toUpperCase()}</strong>
                </div>
              </div>
            </div>
            
            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 12px; color: #10b981; font-size: 16px;">What to Expect</h3>
              <ul style="margin: 0; padding-left: 20px; opacity: 0.9; line-height: 1.6;">
                <li>Our certified technician will arrive within the scheduled time window</li>
                <li>The test typically takes 30-45 minutes to complete</li>
                <li>You'll receive a compliance certificate immediately upon passing</li>
                <li>Payment can be made via cash, check, or card on-site</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 24px 0;">
              <a href="https://fisherbackflows.com/portal/dashboard" 
                 style="display: inline-block; background: linear-gradient(90deg, #3b82f6, #1d4ed8); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                View in Customer Portal
              </a>
            </div>
            
            <div style="text-align: center; padding: 20px 0; border-top: 1px solid rgba(255,255,255,0.1); opacity: 0.7;">
              <p style="margin: 0; font-size: 14px;">Questions? Call us at (253) 555-0123</p>
              <p style="margin: 4px 0 0; font-size: 12px;">Fisher Backflows Testing • Puyallup, WA</p>
            </div>
          </div>
        </div>
      `,
      text: `
Appointment Confirmed - Fisher Backflows Testing

Dear ${data.customerName},

Your backflow testing appointment has been confirmed!

Appointment Details:
• Date: ${formattedDate}
• Time: ${formattedTime}
• Service Zone: ${data.zone}
• Device: ${data.deviceType} at ${data.deviceLocation}
• Confirmation #: ${data.appointmentId.slice(-8).toUpperCase()}

What to Expect:
- Our certified technician will arrive within the scheduled time window
- The test typically takes 30-45 minutes to complete
- You'll receive a compliance certificate immediately upon passing
- Payment can be made via cash, check, or card on-site

Need to make changes? Visit your customer portal: https://fisherbackflows.com/portal/dashboard

Questions? Call us at (253) 555-0123

Fisher Backflows Testing
Puyallup, WA
      `
    });

    console.log('Email confirmation sent:', emailResult.data?.id);
    
    return {
      success: true,
      emailId: emailResult.data?.id,
      message: 'Confirmation sent successfully'
    };

  } catch (error) {
    console.error('Failed to send booking confirmation:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send confirmation'
    };
  }
}