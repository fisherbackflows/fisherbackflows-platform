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
  testReminder: (customerName: string, date: string) => ({
    subject: 'Backflow Test Reminder',
    html: `
      <h2>Hi ${customerName},</h2>
      <p>Your backflow test is scheduled for ${date}.</p>
      <p>Our technician will arrive between 8 AM and 5 PM.</p>
      <p>Thank you,<br>Fisher Backflows Team</p>
    `
  }),
  
  testComplete: (customerName: string, reportUrl: string) => ({
    subject: 'Backflow Test Complete',
    html: `
      <h2>Hi ${customerName},</h2>
      <p>Your backflow test has been completed successfully.</p>
      <p><a href="${reportUrl}">View your report</a></p>
      <p>Thank you,<br>Fisher Backflows Team</p>
    `
  }),
  
  paymentReceived: (customerName: string, amount: string) => ({
    subject: 'Payment Received',
    html: `
      <h2>Hi ${customerName},</h2>
      <p>We've received your payment of ${amount}.</p>
      <p>Thank you for your business!</p>
      <p>Fisher Backflows Team</p>
    `
  })
};