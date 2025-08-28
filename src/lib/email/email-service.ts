/**
 * Enterprise Email Delivery System with Multiple Fallback Providers
 * Fisher Backflows - Guaranteed Email Delivery Infrastructure
 */

import nodemailer from 'nodemailer';
import { logger } from '@/lib/logger';
import { cache } from '@/lib/cache';
import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════
// EMAIL SCHEMAS & TYPES
// ═══════════════════════════════════════════════════════════════════════

const EmailAddressSchema = z.union([
  z.string().email(),
  z.object({
    name: z.string().optional(),
    address: z.string().email()
  })
]);

const AttachmentSchema = z.object({
  filename: z.string(),
  content: z.union([z.string(), z.instanceof(Buffer)]),
  contentType: z.string().optional(),
  encoding: z.enum(['base64', 'utf-8']).optional()
});

const EmailSchema = z.object({
  to: z.union([EmailAddressSchema, z.array(EmailAddressSchema)]),
  cc: z.union([EmailAddressSchema, z.array(EmailAddressSchema)]).optional(),
  bcc: z.union([EmailAddressSchema, z.array(EmailAddressSchema)]).optional(),
  from: EmailAddressSchema.optional(),
  subject: z.string().min(1).max(998),
  text: z.string().optional(),
  html: z.string().optional(),
  attachments: z.array(AttachmentSchema).optional(),
  replyTo: EmailAddressSchema.optional(),
  priority: z.enum(['high', 'normal', 'low']).default('normal'),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  templateId: z.string().optional(),
  templateData: z.record(z.any()).optional(),
  scheduledFor: z.date().optional(),
  trackOpens: z.boolean().default(true),
  trackClicks: z.boolean().default(true)
});

export type EmailOptions = z.infer<typeof EmailSchema>;

export interface EmailResult {
  success: boolean;
  messageId?: string;
  provider?: string;
  error?: string;
  timestamp?: Date;
}

export interface EmailProvider {
  name: string;
  send(options: EmailOptions): Promise<EmailResult>;
  isAvailable(): Promise<boolean>;
  priority: number;
}

// ═══════════════════════════════════════════════════════════════════════
// EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════════════

export const EMAIL_TEMPLATES = {
  TEST_REMINDER: 'test-reminder',
  TEST_COMPLETE: 'test-complete',
  INVOICE: 'invoice',
  PAYMENT_RECEIVED: 'payment-received',
  PAYMENT_FAILED: 'payment-failed',
  APPOINTMENT_SCHEDULED: 'appointment-scheduled',
  APPOINTMENT_REMINDER: 'appointment-reminder',
  APPOINTMENT_CANCELLED: 'appointment-cancelled',
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password-reset',
  ACCOUNT_VERIFICATION: 'account-verification'
};

const templates: Record<string, (data: any) => { subject: string; html: string; text: string }> = {
  [EMAIL_TEMPLATES.TEST_REMINDER]: (data) => ({
    subject: `Backflow Test Due - ${data.customerName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f4f4f4; }
            .button { display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Fisher Backflows</h1>
              <p>Your Backflow Test is Due</p>
            </div>
            <div class="content">
              <h2>Hello ${data.customerName},</h2>
              <p>This is a reminder that your backflow prevention device at <strong>${data.address}</strong> is due for its annual test.</p>
              <p><strong>Device:</strong> ${data.deviceInfo}</p>
              <p><strong>Last Test Date:</strong> ${data.lastTestDate}</p>
              <p><strong>Due Date:</strong> ${data.dueDate}</p>
              <p>To maintain compliance with water safety regulations, please schedule your test as soon as possible.</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${data.scheduleUrl}" class="button">Schedule Test Online</a>
              </p>
              <p>Or call us at <strong>(253) 278-8692</strong></p>
            </div>
            <div class="footer">
              <p>Fisher Backflows | Tacoma, WA | (253) 278-8692</p>
              <p>You're receiving this because you're a valued customer. <a href="${data.unsubscribeUrl}">Unsubscribe</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Fisher Backflows - Backflow Test Reminder

Hello ${data.customerName},

Your backflow prevention device at ${data.address} is due for its annual test.

Device: ${data.deviceInfo}
Last Test Date: ${data.lastTestDate}
Due Date: ${data.dueDate}

Schedule online: ${data.scheduleUrl}
Or call: (253) 278-8692

Fisher Backflows | Tacoma, WA
    `
  }),

  [EMAIL_TEMPLATES.INVOICE]: (data) => ({
    subject: `Invoice #${data.invoiceNumber} - Fisher Backflows`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .invoice-container { max-width: 700px; margin: 0 auto; padding: 20px; }
            .invoice-header { border-bottom: 2px solid #0066cc; padding-bottom: 20px; margin-bottom: 20px; }
            .invoice-details { margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            .total-row { font-weight: bold; font-size: 1.2em; }
            .pay-button { display: inline-block; padding: 15px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="invoice-header">
              <h1>Fisher Backflows</h1>
              <p>Invoice #${data.invoiceNumber}</p>
              <p>Date: ${data.issueDate}</p>
            </div>
            
            <div class="invoice-details">
              <h3>Bill To:</h3>
              <p>${data.customerName}<br>${data.customerAddress}</p>
              
              <h3>Services:</h3>
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.lineItems.map((item: any) => `
                    <tr>
                      <td>${item.description}</td>
                      <td>${item.quantity}</td>
                      <td>$${item.price}</td>
                      <td>$${item.total}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3">Subtotal:</td>
                    <td>$${data.subtotal}</td>
                  </tr>
                  <tr>
                    <td colspan="3">Tax:</td>
                    <td>$${data.tax}</td>
                  </tr>
                  <tr class="total-row">
                    <td colspan="3">Total Due:</td>
                    <td>$${data.total}</td>
                  </tr>
                </tfoot>
              </table>
              
              <p style="text-align: center;">
                <a href="${data.paymentUrl}" class="pay-button">Pay Invoice Online</a>
              </p>
              
              <p><strong>Due Date:</strong> ${data.dueDate}</p>
              <p>Thank you for your business!</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Invoice from Fisher Backflows

Invoice #${data.invoiceNumber}
Date: ${data.issueDate}
Due Date: ${data.dueDate}

Bill To: ${data.customerName}

Total Due: $${data.total}

Pay online: ${data.paymentUrl}

Thank you for your business!
    `
  }),

  [EMAIL_TEMPLATES.PASSWORD_RESET]: (data) => ({
    subject: 'Reset Your Password - Fisher Backflows',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 500px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #0066cc; color: white; text-decoration: none; border-radius: 5px; }
            .code { font-size: 24px; font-weight: bold; color: #0066cc; padding: 10px; background: #f0f0f0; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Password Reset Request</h2>
            <p>We received a request to reset your password for your Fisher Backflows account.</p>
            <p>Click the button below to reset your password:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${data.resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or use this code:</p>
            <div class="code">${data.resetCode}</div>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        </body>
      </html>
    `,
    text: `
Password Reset Request

Reset your password: ${data.resetUrl}
Or use code: ${data.resetCode}

This link expires in 1 hour.
    `
  })
};

// ═══════════════════════════════════════════════════════════════════════
// EMAIL PROVIDERS
// ═══════════════════════════════════════════════════════════════════════

// SendGrid Provider
class SendGridProvider implements EmailProvider {
  name = 'SendGrid';
  priority = 1;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || '';
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey && !this.apiKey.includes('your-');
  }

  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      if (!await this.isAvailable()) {
        throw new Error('SendGrid not configured');
      }

      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(this.apiKey);

      const msg = {
        to: options.to,
        from: options.from || process.env.SENDGRID_FROM_EMAIL,
        subject: options.subject,
        text: options.text,
        html: options.html,
        cc: options.cc,
        bcc: options.bcc,
        replyTo: options.replyTo,
        attachments: options.attachments?.map(att => ({
          content: att.content.toString('base64'),
          filename: att.filename,
          type: att.contentType,
          disposition: 'attachment'
        })),
        trackingSettings: {
          clickTracking: { enable: options.trackClicks },
          openTracking: { enable: options.trackOpens }
        }
      };

      const [response] = await sgMail.send(msg);

      return {
        success: true,
        messageId: response.headers['x-message-id'],
        provider: this.name,
        timestamp: new Date()
      };
    } catch (error: any) {
      logger.error('SendGrid send failed', { error, options });
      return {
        success: false,
        error: error.message,
        provider: this.name
      };
    }
  }
}

// AWS SES Provider
class AWSEmailProvider implements EmailProvider {
  name = 'AWS SES';
  priority = 2;
  private sesClient: any;

  constructor() {
    if (process.env.AWS_SES_ACCESS_KEY) {
      const { SESClient } = require('@aws-sdk/client-ses');
      this.sesClient = new SESClient({
        region: process.env.AWS_SES_REGION || 'us-west-2',
        credentials: {
          accessKeyId: process.env.AWS_SES_ACCESS_KEY!,
          secretAccessKey: process.env.AWS_SES_SECRET_KEY!
        }
      });
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.sesClient;
  }

  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      if (!await this.isAvailable()) {
        throw new Error('AWS SES not configured');
      }

      const { SendEmailCommand } = require('@aws-sdk/client-ses');

      const command = new SendEmailCommand({
        Source: typeof options.from === 'string' ? options.from : options.from?.address,
        Destination: {
          ToAddresses: Array.isArray(options.to) ? options.to.map(t => typeof t === 'string' ? t : t.address) : [typeof options.to === 'string' ? options.to : options.to.address],
          CcAddresses: options.cc ? (Array.isArray(options.cc) ? options.cc.map(c => typeof c === 'string' ? c : c.address) : [typeof options.cc === 'string' ? options.cc : options.cc.address]) : undefined,
          BccAddresses: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.map(b => typeof b === 'string' ? b : b.address) : [typeof options.bcc === 'string' ? options.bcc : options.bcc.address]) : undefined
        },
        Message: {
          Subject: { Data: options.subject },
          Body: {
            Text: options.text ? { Data: options.text } : undefined,
            Html: options.html ? { Data: options.html } : undefined
          }
        }
      });

      const response = await this.sesClient.send(command);

      return {
        success: true,
        messageId: response.MessageId,
        provider: this.name,
        timestamp: new Date()
      };
    } catch (error: any) {
      logger.error('AWS SES send failed', { error, options });
      return {
        success: false,
        error: error.message,
        provider: this.name
      };
    }
  }
}

// SMTP Provider (Gmail/Custom)
class SMTPProvider implements EmailProvider {
  name = 'SMTP';
  priority = 3;
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS
          }
        });
      } else if (process.env.SMTP_HOST) {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER!,
            pass: process.env.SMTP_PASS!
          }
        });
      }
    } catch (error) {
      logger.error('SMTP transporter initialization failed', { error });
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.transporter) return false;
    
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }

  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      if (!this.transporter) {
        throw new Error('SMTP not configured');
      }

      const info = await this.transporter.sendMail({
        from: typeof options.from === 'string' ? options.from : options.from?.address || process.env.GMAIL_USER,
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: options.replyTo,
        priority: options.priority,
        attachments: options.attachments
      });

      return {
        success: true,
        messageId: info.messageId,
        provider: this.name,
        timestamp: new Date()
      };
    } catch (error: any) {
      logger.error('SMTP send failed', { error, options });
      return {
        success: false,
        error: error.message,
        provider: this.name
      };
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// EMAIL SERVICE WITH FALLBACK
// ═══════════════════════════════════════════════════════════════════════

export class EmailService {
  private providers: EmailProvider[] = [];
  private queue: Map<string, EmailOptions> = new Map();
  private retryCount: Map<string, number> = new Map();
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 5000;

  constructor() {
    // Initialize providers in priority order
    this.providers = [
      new SendGridProvider(),
      new AWSEmailProvider(),
      new SMTPProvider()
    ].sort((a, b) => a.priority - b.priority);

    // Start queue processor
    this.startQueueProcessor();
  }

  /**
   * Send email with automatic fallback
   */
  async send(options: EmailOptions): Promise<EmailResult> {
    // Validate email options
    const validated = EmailSchema.parse(options);

    // Apply template if specified
    if (validated.templateId && templates[validated.templateId]) {
      const template = templates[validated.templateId](validated.templateData);
      validated.subject = template.subject;
      validated.html = template.html;
      validated.text = template.text;
    }

    // Add tracking pixel for open tracking
    if (validated.trackOpens && validated.html) {
      const trackingId = this.generateTrackingId();
      validated.html += `<img src="${process.env.NEXT_PUBLIC_APP_URL}/api/email/track/open/${trackingId}" width="1" height="1" style="display:none;">`;
    }

    // Try each provider in order
    for (const provider of this.providers) {
      if (await provider.isAvailable()) {
        const result = await provider.send(validated);
        
        if (result.success) {
          // Log successful send
          logger.info('Email sent successfully', {
            provider: provider.name,
            to: validated.to,
            subject: validated.subject,
            messageId: result.messageId
          });
          
          // Store in sent emails cache
          await this.cacheEmailRecord(result.messageId!, validated);
          
          return result;
        }
        
        // Log provider failure
        logger.warn(`Email provider ${provider.name} failed`, {
          error: result.error,
          to: validated.to
        });
      }
    }

    // All providers failed - add to retry queue
    const queueId = this.addToQueue(validated);
    
    logger.error('All email providers failed, added to retry queue', {
      queueId,
      to: validated.to,
      subject: validated.subject
    });

    return {
      success: false,
      error: 'All email providers failed. Email queued for retry.',
      timestamp: new Date()
    };
  }

  /**
   * Send bulk emails
   */
  async sendBulk(
    recipients: string[],
    template: string,
    templateData: Record<string, any>
  ): Promise<Map<string, EmailResult>> {
    const results = new Map<string, EmailResult>();
    
    // Process in batches to avoid overwhelming providers
    const BATCH_SIZE = 50;
    const DELAY_BETWEEN_BATCHES = 1000;
    
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      
      const promises = batch.map(recipient =>
        this.send({
          to: recipient,
          templateId: template,
          templateData: { ...templateData, recipient },
          subject: '', // Will be set by template
          priority: 'normal'
        }).then(result => {
          results.set(recipient, result);
        })
      );
      
      await Promise.all(promises);
      
      // Delay between batches
      if (i + BATCH_SIZE < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }
    
    return results;
  }

  /**
   * Schedule email for later
   */
  async scheduleEmail(
    options: EmailOptions,
    sendAt: Date
  ): Promise<string> {
    const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store in database or queue system
    await cache.set(`email:scheduled:${scheduleId}`, {
      ...options,
      scheduledFor: sendAt,
      status: 'scheduled'
    }, Math.floor((sendAt.getTime() - Date.now()) / 1000));
    
    logger.info('Email scheduled', {
      scheduleId,
      sendAt,
      to: options.to,
      subject: options.subject
    });
    
    return scheduleId;
  }

  /**
   * Cancel scheduled email
   */
  async cancelScheduled(scheduleId: string): Promise<boolean> {
    const result = await cache.del(`email:scheduled:${scheduleId}`);
    return result > 0;
  }

  /**
   * Get email status
   */
  async getEmailStatus(messageId: string): Promise<any> {
    return await cache.get(`email:sent:${messageId}`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════

  private addToQueue(options: EmailOptions): string {
    const queueId = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.queue.set(queueId, options);
    this.retryCount.set(queueId, 0);
    return queueId;
  }

  private async startQueueProcessor() {
    setInterval(async () => {
      for (const [queueId, options] of this.queue.entries()) {
        const retries = this.retryCount.get(queueId) || 0;
        
        if (retries >= this.MAX_RETRIES) {
          logger.error('Email exceeded max retries, removing from queue', {
            queueId,
            to: options.to,
            subject: options.subject
          });
          
          this.queue.delete(queueId);
          this.retryCount.delete(queueId);
          continue;
        }
        
        // Retry sending
        const result = await this.send(options);
        
        if (result.success) {
          this.queue.delete(queueId);
          this.retryCount.delete(queueId);
        } else {
          this.retryCount.set(queueId, retries + 1);
        }
      }
    }, this.RETRY_DELAY);
  }

  private generateTrackingId(): string {
    return `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async cacheEmailRecord(
    messageId: string,
    options: EmailOptions
  ): Promise<void> {
    await cache.set(`email:sent:${messageId}`, {
      messageId,
      to: options.to,
      subject: options.subject,
      sentAt: new Date(),
      provider: options.from,
      status: 'sent'
    }, 86400 * 30); // Keep for 30 days
  }
}

// ═══════════════════════════════════════════════════════════════════════
// EMAIL UTILITIES
// ═══════════════════════════════════════════════════════════════════════

export const emailUtils = {
  /**
   * Validate email address
   */
  isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  /**
   * Sanitize email content
   */
  sanitizeHtml(html: string): string {
    // Basic XSS prevention
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  },

  /**
   * Generate unsubscribe link
   */
  generateUnsubscribeLink(email: string, listId?: string): string {
    const token = Buffer.from(`${email}:${listId || 'default'}`).toString('base64');
    return `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?token=${token}`;
  },

  /**
   * Parse email bounce
   */
  parseBounce(bounceMessage: string): {
    type: 'hard' | 'soft' | 'unknown';
    email?: string;
    reason?: string;
  } {
    // Parse bounce messages from various providers
    if (bounceMessage.includes('550') || bounceMessage.includes('User unknown')) {
      return { type: 'hard', reason: 'Invalid recipient' };
    } else if (bounceMessage.includes('452') || bounceMessage.includes('quota')) {
      return { type: 'soft', reason: 'Mailbox full' };
    }
    return { type: 'unknown', reason: bounceMessage };
  }
};

// ═══════════════════════════════════════════════════════════════════════
// EXPORT SINGLETON
// ═══════════════════════════════════════════════════════════════════════

let emailService: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailService) {
    emailService = new EmailService();
  }
  return emailService;
}

export default getEmailService();