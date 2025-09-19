// Unified Notification Service
// Integrates Email, SMS, Push Notifications, and In-App notifications

import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import sgMail from '@sendgrid/mail'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import twilio from 'twilio'
import webpush from 'web-push'

export type NotificationType = 
  | 'email' 
  | 'sms' 
  | 'push' 
  | 'in_app'

export type NotificationChannel = 
  | 'appointment_reminder'
  | 'test_completion'
  | 'payment_due'
  | 'payment_received'
  | 'lead_welcome'
  | 'system_alert'
  | 'security_event'
  | 'custom'

export interface NotificationTemplate {
  subject: string
  htmlBody: string
  textBody: string
  smsBody?: string
  pushTitle?: string
  pushBody?: string
}

export interface NotificationRecipient {
  id?: string
  email?: string
  phone?: string
  name?: string
  role?: string
}

export interface NotificationData {
  recipient: NotificationRecipient
  channel: NotificationChannel
  type: NotificationType | NotificationType[]
  templateData?: Record<string, any>
  customTemplate?: NotificationTemplate
  scheduledFor?: Date
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  metadata?: Record<string, any>
}

export interface NotificationResult {
  success: boolean
  messageId?: string
  error?: string
  provider?: string
  deliveredAt?: Date
}

class UnifiedNotificationService {
  private supabase
  private emailTransporter: nodemailer.Transporter | null = null
  private sesClient: SESClient | null = null
  private twilioClient: ReturnType<typeof twilio> | null = null
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    this.initializeServices()
  }

  // ====================
  // SERVICE INITIALIZATION
  // ====================

  private initializeServices() {
    // Initialize email services
    this.initializeEmailServices()
    
    // Initialize SMS service
    this.initializeSMSService()
    
    // Initialize push notifications
    this.initializePushNotifications()
  }

  private initializeEmailServices() {
    // Gmail SMTP
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      this.emailTransporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      })
    }

    // SendGrid
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    }

    // AWS SES
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.sesClient = new SESClient({
        region: process.env.AWS_REGION || 'us-west-2',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      })
    }
  }

  private initializeSMSService() {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      )
    }
  }

  private initializePushNotifications() {
    if (process.env.NEXT_PUBLIC_VAPID_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        `mailto:${process.env.COMPANY_EMAIL}`,
        process.env.NEXT_PUBLIC_VAPID_KEY,
        process.env.VAPID_PRIVATE_KEY
      )
    }
  }

  // ====================
  // MAIN NOTIFICATION METHODS
  // ====================

  /**
   * Send notification using specified types
   */
  async sendNotification(data: NotificationData): Promise<Record<NotificationType, NotificationResult>> {
    const results: Record<string, NotificationResult> = {}
    const types = Array.isArray(data.type) ? data.type : [data.type]

    // Get template
    const template = data.customTemplate || await this.getTemplate(data.channel)
    
    // Process template data
    const processedTemplate = await this.processTemplate(template, data.templateData || {})

    // Send notifications for each type
    for (const type of types) {
      try {
        switch (type) {
          case 'email':
            results[type] = await this.sendEmail(data.recipient, processedTemplate, data)
            break
          case 'sms':
            results[type] = await this.sendSMS(data.recipient, processedTemplate, data)
            break
          case 'push':
            results[type] = await this.sendPushNotification(data.recipient, processedTemplate, data)
            break
          case 'in_app':
            results[type] = await this.sendInAppNotification(data.recipient, processedTemplate, data)
            break
          default:
            results[type] = { success: false, error: `Unsupported notification type: ${type}` }
        }
      } catch (error) {
        console.error(`Error sending ${type} notification:`, error)
        results[type] = { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      }
    }

    // Log notification attempt
    await this.logNotification(data, results)

    return results as Record<NotificationType, NotificationResult>
  }

  // ====================
  // EMAIL NOTIFICATIONS
  // ====================

  private async sendEmail(
    recipient: NotificationRecipient, 
    template: NotificationTemplate, 
    data: NotificationData
  ): Promise<NotificationResult> {
    if (!recipient.email) {
      return { success: false, error: 'No email address provided' }
    }

    const emailData = {
      to: recipient.email,
      from: process.env.COMPANY_EMAIL || process.env.GMAIL_USER!,
      subject: template.subject,
      html: template.htmlBody,
      text: template.textBody
    }

    // Try SendGrid first
    if (process.env.SENDGRID_API_KEY) {
      try {
        const result = await sgMail.send(emailData)
        await this.logEmailDelivery(recipient.email, 'sendgrid', result[0].headers['x-message-id'])
        return { 
          success: true, 
          messageId: result[0].headers['x-message-id'], 
          provider: 'sendgrid',
          deliveredAt: new Date()
        }
      } catch (error) {
        console.error('SendGrid failed, trying Gmail:', error)
      }
    }

    // Try Gmail SMTP
    if (this.emailTransporter) {
      try {
        const result = await this.emailTransporter.sendMail(emailData)
        await this.logEmailDelivery(recipient.email, 'gmail', result.messageId)
        return { 
          success: true, 
          messageId: result.messageId, 
          provider: 'gmail',
          deliveredAt: new Date()
        }
      } catch (error) {
        console.error('Gmail failed, trying AWS SES:', error)
      }
    }

    // Try AWS SES
    if (this.sesClient) {
      try {
        const command = new SendEmailCommand({
          Source: process.env.AWS_SES_FROM_EMAIL || process.env.COMPANY_EMAIL!,
          Destination: { ToAddresses: [recipient.email] },
          Message: {
            Subject: { Data: template.subject },
            Body: {
              Html: { Data: template.htmlBody },
              Text: { Data: template.textBody }
            }
          }
        })
        
        const result = await this.sesClient.send(command)
        await this.logEmailDelivery(recipient.email, 'ses', result.MessageId)
        return { 
          success: true, 
          messageId: result.MessageId, 
          provider: 'ses',
          deliveredAt: new Date()
        }
      } catch (error) {
        console.error('AWS SES failed:', error)
      }
    }

    // All email providers failed
    return { success: false, error: 'All email providers failed' }
  }

  private async logEmailDelivery(email: string, provider: string, messageId?: string) {
    await this.supabase
      .from('notification_logs')
      .insert({
        to_email: email,
        from_email: process.env.COMPANY_EMAIL || process.env.GMAIL_USER!,
        subject: 'Notification',
        status: 'sent',
        provider,
        provider_id: messageId,
        sent_at: new Date().toISOString()
      })
  }

  // ====================
  // SMS NOTIFICATIONS
  // ====================

  private async sendSMS(
    recipient: NotificationRecipient, 
    template: NotificationTemplate, 
    data: NotificationData
  ): Promise<NotificationResult> {
    if (!recipient.phone) {
      return { success: false, error: 'No phone number provided' }
    }

    if (!this.twilioClient) {
      return { success: false, error: 'SMS service not configured' }
    }

    try {
      const message = await this.twilioClient.messages.create({
        body: template.smsBody || template.textBody,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: recipient.phone
      })

      await this.logSMSDelivery(recipient.phone, message.sid)
      
      return { 
        success: true, 
        messageId: message.sid, 
        provider: 'twilio',
        deliveredAt: new Date()
      }
    } catch (error) {
      console.error('SMS sending failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'SMS sending failed' 
      }
    }
  }

  private async logSMSDelivery(phone: string, messageId: string) {
    await this.supabase
      .from('sms_logs')
      .insert({
        to_phone: phone,
        from_phone: process.env.TWILIO_PHONE_NUMBER!,
        message: 'Notification',
        status: 'sent',
        provider: 'twilio',
        provider_id: messageId,
        sent_at: new Date().toISOString()
      })
  }

  // ====================
  // PUSH NOTIFICATIONS
  // ====================

  private async sendPushNotification(
    recipient: NotificationRecipient, 
    template: NotificationTemplate, 
    data: NotificationData
  ): Promise<NotificationResult> {
    if (!recipient.id) {
      return { success: false, error: 'No user ID provided' }
    }

    try {
      // Get user's push subscriptions
      const { data: subscriptions, error } = await this.supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', recipient.id)
        .eq('active', true)

      if (error || !subscriptions?.length) {
        return { success: false, error: 'No active push subscriptions found' }
      }

      const payload = {
        title: template.pushTitle || template.subject,
        body: template.pushBody || template.textBody,
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        data: data.metadata || {}
      }

      let successCount = 0
      const errors: string[] = []

      // Send to all subscriptions
      for (const subscription of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: subscription.keys
            },
            JSON.stringify(payload)
          )
          successCount++
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Push notification failed'
          errors.push(errorMsg)
          
          // Remove invalid subscriptions
          if (errorMsg.includes('410')) {
            await this.supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', subscription.id)
          }
        }
      }

      if (successCount > 0) {
        return { 
          success: true, 
          messageId: `pushed_to_${successCount}_devices`, 
          provider: 'webpush',
          deliveredAt: new Date()
        }
      } else {
        return { success: false, error: errors.join(', ') }
      }
    } catch (error) {
      console.error('Push notification failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Push notification failed' 
      }
    }
  }

  // ====================
  // IN-APP NOTIFICATIONS
  // ====================

  private async sendInAppNotification(
    recipient: NotificationRecipient, 
    template: NotificationTemplate, 
    data: NotificationData
  ): Promise<NotificationResult> {
    if (!recipient.id) {
      return { success: false, error: 'No user ID provided' }
    }

    try {
      const { data: notification, error } = await this.supabase
        .from('notifications')
        .insert({
          user_id: recipient.id,
          type: 'in_app',
          channel: data.channel,
          title: template.subject,
          message: template.textBody,
          status: 'sent',
          scheduled_for: data.scheduledFor?.toISOString(),
          metadata: data.metadata || {}
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return { 
        success: true, 
        messageId: notification.id, 
        provider: 'supabase',
        deliveredAt: new Date()
      }
    } catch (error) {
      console.error('In-app notification failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'In-app notification failed' 
      }
    }
  }

  // ====================
  // TEMPLATE MANAGEMENT
  // ====================

  private async getTemplate(channel: NotificationChannel): Promise<NotificationTemplate> {
    const templates: Record<NotificationChannel, NotificationTemplate> = {
      appointment_reminder: {
        subject: 'Appointment Reminder - Fisher Backflows',
        htmlBody: `
          <h2>Backflow Test Appointment Reminder</h2>
          <p>Hello {{customerName}},</p>
          <p>This is a reminder of your scheduled backflow test appointment:</p>
          <ul>
            <li><strong>Date:</strong> {{appointmentDate}}</li>
            <li><strong>Time:</strong> {{appointmentTime}}</li>
            <li><strong>Location:</strong> {{deviceLocation}}</li>
            <li><strong>Technician:</strong> {{technician}}</li>
          </ul>
          <p>Please ensure access to your backflow device is clear and available.</p>
          <p>If you need to reschedule, please contact us at {{companyPhone}}.</p>
          <p>Thank you,<br>Fisher Backflows Team</p>
        `,
        textBody: 'Appointment reminder: {{appointmentDate}} at {{appointmentTime}}. Location: {{deviceLocation}}. Technician: {{technician}}. Contact {{companyPhone}} to reschedule.',
        smsBody: 'Reminder: Backflow test {{appointmentDate}} at {{appointmentTime}}. Technician: {{technician}}. Contact {{companyPhone}} to reschedule.',
        pushTitle: 'Appointment Reminder',
        pushBody: 'Your backflow test is scheduled for {{appointmentDate}} at {{appointmentTime}}'
      },

      test_completion: {
        subject: 'Backflow Test Complete - {{testResult}}',
        htmlBody: `
          <h2>Backflow Test Results</h2>
          <p>Hello {{customerName}},</p>
          <p>Your backflow test has been completed with the following results:</p>
          <ul>
            <li><strong>Test Date:</strong> {{testDate}}</li>
            <li><strong>Result:</strong> {{testResult}}</li>
            <li><strong>Technician:</strong> {{technician}}</li>
            <li><strong>Device:</strong> {{deviceLocation}}</li>
          </ul>
          {{#if testPassed}}
            <p style="color: green;">✅ Your device passed the test and is compliant.</p>
            <p>Next test due: {{nextTestDate}}</p>
          {{else}}
            <p style="color: red;">❌ Your device requires attention. Please contact us to schedule repairs.</p>
          {{/if}}
          <p>Invoice total: ${{invoiceAmount}}</p>
          {{#if paymentLink}}<p><a href="{{paymentLink}}">Pay Online</a></p>{{/if}}
          <p>Thank you,<br>Fisher Backflows Team</p>
        `,
        textBody: 'Test complete: {{testResult}}. Device: {{deviceLocation}}. Invoice: ${{invoiceAmount}}. {{#if paymentLink}}Pay online: {{paymentLink}}{{/if}}',
        smsBody: 'Backflow test {{testResult}}. Invoice: ${{invoiceAmount}}. {{#if paymentLink}}Pay: {{paymentLink}}{{/if}}',
        pushTitle: 'Test Complete: {{testResult}}',
        pushBody: 'Your backflow test is complete. Invoice: ${{invoiceAmount}}'
      },

      payment_due: {
        subject: 'Payment Reminder - Invoice #{{invoiceNumber}}',
        htmlBody: `
          <h2>Payment Reminder</h2>
          <p>Hello {{customerName}},</p>
          <p>This is a friendly reminder that payment is due for your recent service:</p>
          <ul>
            <li><strong>Invoice:</strong> #{{invoiceNumber}}</li>
            <li><strong>Amount:</strong> ${{amount}}</li>
            <li><strong>Due Date:</strong> {{dueDate}}</li>
            <li><strong>Service:</strong> {{serviceDescription}}</li>
          </ul>
          {{#if paymentLink}}<p><a href="{{paymentLink}}" style="background: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Pay Now</a></p>{{/if}}
          <p>Thank you,<br>Fisher Backflows Team</p>
        `,
        textBody: 'Payment due: Invoice #{{invoiceNumber}}, ${{amount}}, due {{dueDate}}. {{#if paymentLink}}Pay online: {{paymentLink}}{{/if}}',
        smsBody: 'Payment reminder: ${{amount}} due {{dueDate}}. {{#if paymentLink}}Pay: {{paymentLink}}{{/if}}',
        pushTitle: 'Payment Due: ${{amount}}',
        pushBody: 'Invoice #{{invoiceNumber}} is due {{dueDate}}'
      },

      payment_received: {
        subject: 'Payment Received - Thank You',
        htmlBody: `
          <h2>Payment Confirmation</h2>
          <p>Hello {{customerName}},</p>
          <p>Thank you! We have received your payment:</p>
          <ul>
            <li><strong>Amount:</strong> ${{amount}}</li>
            <li><strong>Invoice:</strong> #{{invoiceNumber}}</li>
            <li><strong>Payment Method:</strong> {{paymentMethod}}</li>
            <li><strong>Transaction ID:</strong> {{transactionId}}</li>
          </ul>
          <p>Your account is now current.</p>
          <p>Thank you for your business,<br>Fisher Backflows Team</p>
        `,
        textBody: 'Payment received: ${{amount}} for invoice #{{invoiceNumber}}. Transaction: {{transactionId}}. Thank you!',
        smsBody: 'Payment received: ${{amount}}. Transaction: {{transactionId}}. Thank you!',
        pushTitle: 'Payment Received',
        pushBody: 'Thank you! Payment of ${{amount}} has been processed.'
      },

      lead_welcome: {
        subject: 'Welcome to Fisher Backflows',
        htmlBody: `
          <h2>Welcome to Fisher Backflows</h2>
          <p>Hello {{name}},</p>
          <p>Thank you for your interest in our backflow testing services!</p>
          <p>We provide professional, certified backflow testing and repair services in the Tacoma area.</p>
          <p><strong>Our Services:</strong></p>
          <ul>
            <li>Annual backflow testing</li>
            <li>Backflow device repairs</li>
            <li>Emergency testing services</li>
            <li>Water district report submissions</li>
          </ul>
          <p>We'll be in touch soon to schedule your service.</p>
          <p>Questions? Call us at {{companyPhone}} or email {{companyEmail}}.</p>
          <p>Best regards,<br>Fisher Backflows Team</p>
        `,
        textBody: 'Welcome to Fisher Backflows! We provide professional backflow testing services. We will contact you soon. Questions? {{companyPhone}}',
        smsBody: 'Welcome to Fisher Backflows! We provide backflow testing services. We will contact you soon.',
        pushTitle: 'Welcome to Fisher Backflows',
        pushBody: 'Thank you for your interest in our services!'
      },

      system_alert: {
        subject: 'System Alert - {{alertType}}',
        htmlBody: `
          <h2>System Alert</h2>
          <p><strong>Alert Type:</strong> {{alertType}}</p>
          <p><strong>Message:</strong> {{message}}</p>
          <p><strong>Time:</strong> {{timestamp}}</p>
          {{#if actionRequired}}<p><strong>Action Required:</strong> {{actionRequired}}</p>{{/if}}
        `,
        textBody: 'System Alert: {{alertType}} - {{message}} at {{timestamp}}',
        smsBody: 'Alert: {{alertType}} - {{message}}',
        pushTitle: 'System Alert',
        pushBody: '{{alertType}}: {{message}}'
      },

      security_event: {
        subject: 'Security Alert - {{eventType}}',
        htmlBody: `
          <h2>Security Alert</h2>
          <p><strong>Event:</strong> {{eventType}}</p>
          <p><strong>Details:</strong> {{details}}</p>
          <p><strong>Time:</strong> {{timestamp}}</p>
          <p><strong>IP Address:</strong> {{ipAddress}}</p>
          <p>If this was not you, please contact support immediately.</p>
        `,
        textBody: 'Security Alert: {{eventType}} from {{ipAddress}} at {{timestamp}}',
        smsBody: 'Security Alert: {{eventType}} from {{ipAddress}}',
        pushTitle: 'Security Alert',
        pushBody: '{{eventType}} detected on your account'
      },

      custom: {
        subject: '{{subject}}',
        htmlBody: '{{htmlBody}}',
        textBody: '{{textBody}}',
        smsBody: '{{smsBody}}',
        pushTitle: '{{pushTitle}}',
        pushBody: '{{pushBody}}'
      }
    }

    return templates[channel] || templates.custom
  }

  private async processTemplate(template: NotificationTemplate, data: Record<string, any>): Promise<NotificationTemplate> {
    // Simple template processing (could use handlebars for more complex templates)
    const processText = (text: string) => {
      return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] || match
      })
    }

    return {
      subject: processText(template.subject),
      htmlBody: processText(template.htmlBody),
      textBody: processText(template.textBody),
      smsBody: template.smsBody ? processText(template.smsBody) : undefined,
      pushTitle: template.pushTitle ? processText(template.pushTitle) : undefined,
      pushBody: template.pushBody ? processText(template.pushBody) : undefined
    }
  }

  // ====================
  // LOGGING & ANALYTICS
  // ====================

  private async logNotification(data: NotificationData, results: Record<string, NotificationResult>) {
    try {
      await this.supabase
        .from('system_logs')
        .insert({
          level: 'INFO',
          component: 'notifications',
          message: `Notification sent via ${Object.keys(results).join(', ')}`,
          metadata: {
            channel: data.channel,
            recipient: data.recipient,
            results,
            priority: data.priority || 'normal'
          }
        })
    } catch (error) {
      console.error('Failed to log notification:', error)
    }
  }

  // ====================
  // CONVENIENCE METHODS
  // ====================

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(appointmentId: string): Promise<Record<NotificationType, NotificationResult>> {
    const { data: appointment } = await this.supabase
      .from('appointments')
      .select(`
        *,
        customers (name, email, phone),
        devices (location)
      `)
      .eq('id', appointmentId)
      .single()

    if (!appointment) {
      throw new Error('Appointment not found')
    }

    return this.sendNotification({
      recipient: {
        email: appointment.customers.email,
        phone: appointment.customers.phone,
        name: appointment.customers.name
      },
      channel: 'appointment_reminder',
      type: ['email', 'sms'],
      templateData: {
        customerName: appointment.customers.name,
        appointmentDate: appointment.appointment_date,
        appointmentTime: appointment.appointment_time,
        deviceLocation: appointment.devices?.location || appointment.device_location,
        technician: appointment.technician,
        companyPhone: process.env.COMPANY_PHONE
      }
    })
  }

  /**
   * Send test completion notification
   */
  async sendTestCompletion(testReportId: string): Promise<Record<NotificationType, NotificationResult>> {
    const { data: report } = await this.supabase
      .from('test_reports')
      .select(`
        *,
        customers (name, email, phone),
        devices (location)
      `)
      .eq('id', testReportId)
      .single()

    if (!report) {
      throw new Error('Test report not found')
    }

    return this.sendNotification({
      recipient: {
        email: report.customers.email,
        phone: report.customers.phone,
        name: report.customers.name
      },
      channel: 'test_completion',
      type: ['email', 'sms'],
      templateData: {
        customerName: report.customers.name,
        testDate: report.test_date,
        testResult: report.status,
        testPassed: report.status === 'Passed',
        technician: report.technician,
        deviceLocation: report.devices?.location,
        nextTestDate: '2026-01-15', // Calculate based on test date
        invoiceAmount: process.env.DEFAULT_TEST_PRICE || '150'
      }
    })
  }
}

// Export singleton instance
export const notifications = new UnifiedNotificationService()