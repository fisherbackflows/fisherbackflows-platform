import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, getVerificationEmailHtml } from '@/lib/resend';

// Email templates for Tester Portal API
const emailTemplates = {
  customer_welcome: {
    subject: 'Welcome to {{company_name}}',
    getHtml: (data: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0ea5e9; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ${data.company_name}!</h1>
            </div>
            <div class="content">
              <p>Dear ${data.customer_name},</p>
              <p>Thank you for choosing ${data.company_name} for your backflow testing needs. Your account has been successfully created.</p>
              <p>You can now access your customer portal to:</p>
              <ul>
                <li>View your devices and test history</li>
                <li>Schedule appointments</li>
                <li>Access test reports and certificates</li>
                <li>Manage your billing</li>
              </ul>
              <p style="text-align: center;">
                <a href="${data.portal_url}" class="button">Access Your Portal</a>
              </p>
              <p>If you have any questions, please don't hesitate to contact us.</p>
              <p>Best regards,<br>The ${data.company_name} Team</p>
            </div>
            <div class="footer">
              <p>© 2025 ${data.company_name}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  },
  payment_failed: {
    subject: 'Payment Failed - Action Required',
    getHtml: (data: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .alert { background-color: #fef2f2; border: 1px solid #ef4444; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Failed</h1>
            </div>
            <div class="content">
              <p>Dear ${data.company_name},</p>
              <div class="alert">
                <strong>⚠️ Your payment of $${data.amount} could not be processed.</strong>
              </div>
              <p>We were unable to process your recent payment for your Tester Portal subscription.</p>
              <p>To avoid service interruption, please update your payment method as soon as possible.</p>
              <p style="text-align: center;">
                <a href="${data.dashboard_url}" class="button">Update Payment Method</a>
              </p>
              <p>Best regards,<br>The Tester Portal Team</p>
            </div>
            <div class="footer">
              <p>© 2025 Tester Portal. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  },
  trial_ending: {
    subject: 'Your Trial is Ending Soon',
    getHtml: (data: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Trial is Ending Soon</h1>
            </div>
            <div class="content">
              <p>Dear ${data.company_name},</p>
              <div class="warning">
                <strong>⏰ Your 14-day trial will end on ${data.trial_end_date}</strong>
              </div>
              <p>We hope you've been enjoying Tester Portal!</p>
              <p style="text-align: center;">
                <a href="${data.billing_url}" class="button">Review Your Plan</a>
              </p>
              <p>Best regards,<br>The Tester Portal Team</p>
            </div>
            <div class="footer">
              <p>© 2025 Tester Portal. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  },
  tester_portal_welcome: {
    subject: 'Welcome to Tester Portal - Your API Key Inside',
    getHtml: (data: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0ea5e9; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .api-key { background-color: #f3f4f6; border: 2px dashed #9ca3af; padding: 15px; border-radius: 5px; margin: 20px 0; font-family: monospace; word-break: break-all; }
            .important { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Tester Portal!</h1>
            </div>
            <div class="content">
              <p>Dear ${data.company_name},</p>
              <p>Congratulations! Your Tester Portal API account is now active. You have a 14-day free trial until ${data.trial_ends}.</p>
              
              <div class="important">
                <strong>🔑 Your API Key (SAVE THIS!):</strong>
                <div class="api-key">${data.api_key}</div>
                <p><em>This is the only time you'll see this full key. Please store it securely.</em></p>
              </div>

              <p style="text-align: center;">
                <a href="${data.dashboard_url}" class="button">Access Dashboard</a>
                <a href="${data.docs_url}" class="button">View API Docs</a>
              </p>

              <p>Best regards,<br>The Tester Portal Team</p>
            </div>
            <div class="footer">
              <p>© 2025 Tester Portal API Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }
};

// Helper function to process template with data
function processTemplate(subject: string, data: Record<string, any>): string {
  let processed = subject;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processed = processed.replace(regex, String(value));
  }
  return processed;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, html, text, from, type, verificationUrl, customerName, template, data, attachments } = body;

    // Validate required fields
    if (!to) {
      return NextResponse.json(
        { error: 'Recipient email is required' },
        { status: 400 }
      );
    }

    // Handle verification emails
    if (type === 'verification' && verificationUrl) {
      const verificationHtml = getVerificationEmailHtml(verificationUrl, customerName);
      const result = await sendEmail({
        to,
        subject: 'Verify Your Email - Fisher Backflows',
        html: verificationHtml
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Verification email sent successfully',
        data: result.data
      });
    }

    // Handle template emails
    if (template && emailTemplates[template as keyof typeof emailTemplates]) {
      const selectedTemplate = emailTemplates[template as keyof typeof emailTemplates];
      const emailSubject = processTemplate(selectedTemplate.subject, data || {});
      const emailHtml = selectedTemplate.getHtml(data || {});
      
      const result = await sendEmail({
        to,
        subject: emailSubject,
        html: emailHtml,
        from: from || process.env.RESEND_FROM_EMAIL,
        attachments
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Template email sent successfully',
        data: result.data
      });
    }

    // Handle custom emails
    if (subject && (html || text)) {
      const result = await sendEmail({
        to,
        subject,
        html: html || undefined,
        text: text || undefined,
        from: from || process.env.RESEND_FROM_EMAIL,
        attachments
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        data: result.data
      });
    }

    return NextResponse.json(
      { error: 'Invalid email request. Must provide either verification details, template, or subject/html.' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}