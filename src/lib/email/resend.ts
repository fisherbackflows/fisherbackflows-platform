import { Resend } from 'resend'
import { logger } from '@/lib/logger'
import type { EmailSend } from '@/lib/validation/schemas'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@fisherbackflows.com'

// ============================================
// CORE EMAIL FUNCTIONS
// ============================================

/**
 * Send email with validation and error handling
 */
export async function sendEmail(emailData: EmailSend): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(emailData.to) ? emailData.to : [emailData.to],
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
      tags: emailData.tags || []
    })

    if (response.error) {
      logger.error('Resend email error', { error: response.error, to: emailData.to })
      return { success: false, error: response.error.message }
    }

    logger.info('Email sent successfully', { 
      id: response.data?.id,
      to: emailData.to,
      subject: emailData.subject 
    })

    return { success: true, id: response.data?.id }
  } catch (error) {
    logger.error('Failed to send email', { error, emailData })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Send batch emails
 */
export async function sendBatchEmails(emails: EmailSend[]): Promise<{
  success: boolean
  results: Array<{ success: boolean; id?: string; error?: string }>
}> {
  const results = await Promise.allSettled(
    emails.map(email => sendEmail(email))
  )

  const processedResults = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      logger.error('Batch email failed', { 
        index, 
        error: result.reason,
        email: emails[index] 
      })
      return { 
        success: false, 
        error: result.reason?.message || 'Unknown error' 
      }
    }
  })

  const successCount = processedResults.filter(r => r.success).length
  
  logger.info('Batch emails processed', {
    total: emails.length,
    success: successCount,
    failed: emails.length - successCount
  })

  return {
    success: successCount === emails.length,
    results: processedResults
  }
}

// ============================================
// TEMPLATE EMAIL FUNCTIONS
// ============================================

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  email: string,
  data: {
    name: string
    verificationUrl?: string
  }
): Promise<{ success: boolean; id?: string; error?: string }> {
  const welcomeHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Fisher Backflows</h1>
      </div>
      
      <div style="padding: 40px 20px; background: white;">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Hello ${data.name}!</h2>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Welcome to the Fisher Backflows platform. Your account has been created successfully.
        </p>
        
        ${data.verificationUrl ? `
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            To get started, please verify your email address by clicking the button below:
          </p>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${data.verificationUrl}" 
               style="background: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Verify Email Address
            </a>
          </div>
        ` : `
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            You can now log in to your account and start managing your backflow testing needs.
          </p>
        `}
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 30px; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            If you have any questions, please don't hesitate to contact our support team.
          </p>
        </div>
      </div>
    </div>
  `

  return sendEmail({
    to: email,
    subject: 'Welcome to Fisher Backflows',
    html: welcomeHtml,
    tags: [
      { name: 'type', value: 'welcome' },
      { name: 'user', value: email }
    ]
  })
}

/**
 * Send inspection scheduled notification
 */
export async function sendInspectionScheduledEmail(
  email: string,
  data: {
    customerName: string
    workOrderTitle: string
    scheduledDate: string
    inspectorName: string
  }
): Promise<{ success: boolean; id?: string; error?: string }> {
  const inspectionHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0ea5e9; padding: 30px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Inspection Scheduled</h1>
      </div>
      
      <div style="padding: 30px 20px; background: white;">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Hello ${data.customerName},</h2>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Your backflow inspection has been scheduled. Here are the details:
        </p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Work Order:</td>
              <td style="padding: 8px 0; color: #6b7280;">${data.workOrderTitle}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Scheduled Date:</td>
              <td style="padding: 8px 0; color: #6b7280;">${new Date(data.scheduledDate).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Inspector:</td>
              <td style="padding: 8px 0; color: #6b7280;">${data.inspectorName}</td>
            </tr>
          </table>
        </div>
        
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0;">
          Please ensure someone is available at the scheduled time to provide access to the backflow prevention device.
        </p>
      </div>
    </div>
  `

  return sendEmail({
    to: email,
    subject: `Backflow Inspection Scheduled - ${data.workOrderTitle}`,
    html: inspectionHtml,
    tags: [
      { name: 'type', value: 'inspection_scheduled' },
      { name: 'customer', value: email }
    ]
  })
}

/**
 * Send inspection completed notification
 */
export async function sendInspectionCompletedEmail(
  email: string,
  data: {
    customerName: string
    workOrderTitle: string
    status: 'passed' | 'failed'
    reportUrl: string
    notes?: string
  }
): Promise<{ success: boolean; id?: string; error?: string }> {
  const statusColor = data.status === 'passed' ? '#10b981' : '#ef4444'
  const statusText = data.status === 'passed' ? 'PASSED' : 'FAILED'

  const completedHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${statusColor}; padding: 30px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Inspection ${statusText}</h1>
      </div>
      
      <div style="padding: 30px 20px; background: white;">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Hello ${data.customerName},</h2>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Your backflow inspection for <strong>${data.workOrderTitle}</strong> has been completed.
        </p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
          <div style="background: ${statusColor}; color: white; padding: 10px 20px; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 18px; margin-bottom: 15px;">
            ${statusText}
          </div>
          
          ${data.notes ? `
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 15px 0;">
              <strong>Inspector Notes:</strong><br>
              ${data.notes}
            </p>
          ` : ''}
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
          <a href="${data.reportUrl}" 
             style="background: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            View Full Report
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
          Thank you for choosing Fisher Backflows for your backflow testing needs.
        </p>
      </div>
    </div>
  `

  return sendEmail({
    to: email,
    subject: `Backflow Inspection ${statusText} - ${data.workOrderTitle}`,
    html: completedHtml,
    tags: [
      { name: 'type', value: 'inspection_completed' },
      { name: 'status', value: data.status },
      { name: 'customer', value: email }
    ]
  })
}

/**
 * Send invoice notification
 */
export async function sendInvoiceEmail(
  email: string,
  data: {
    customerName: string
    invoiceNumber: string
    amount: number
    dueDate: string
    paymentUrl: string
  }
): Promise<{ success: boolean; id?: string; error?: string }> {
  const invoiceHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1f2937; padding: 30px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Invoice #${data.invoiceNumber}</h1>
      </div>
      
      <div style="padding: 30px 20px; background: white;">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Hello ${data.customerName},</h2>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          You have a new invoice from Fisher Backflows.
        </p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Invoice Number:</td>
              <td style="padding: 8px 0; color: #6b7280;">#${data.invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Amount Due:</td>
              <td style="padding: 8px 0; color: #6b7280; font-size: 18px; font-weight: bold;">$${(data.amount / 100).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Due Date:</td>
              <td style="padding: 8px 0; color: #6b7280;">${new Date(data.dueDate).toLocaleDateString()}</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
          <a href="${data.paymentUrl}" 
             style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Pay Now
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
          Questions about this invoice? Please contact our billing department.
        </p>
      </div>
    </div>
  `

  return sendEmail({
    to: email,
    subject: `Invoice #${data.invoiceNumber} from Fisher Backflows`,
    html: invoiceHtml,
    tags: [
      { name: 'type', value: 'invoice' },
      { name: 'invoice', value: data.invoiceNumber },
      { name: 'customer', value: email }
    ]
  })
}

// ============================================
// WEBHOOK VERIFICATION
// ============================================

/**
 * Verify Resend webhook signature
 */
export function verifyResendWebhook(
  payload: string,
  signature: string
): boolean {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET

  if (!webhookSecret) {
    logger.warn('RESEND_WEBHOOK_SECRET not configured')
    return false
  }

  try {
    // Resend uses HMAC-SHA256 for webhook signatures
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex')

    const providedSignature = signature.replace('sha256=', '')
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    )
  } catch (error) {
    logger.error('Webhook signature verification failed', { error })
    return false
  }
}

// ============================================
// EMAIL HEALTH CHECK
// ============================================

/**
 * Test email service connectivity
 */
export async function testEmailService(): Promise<{ 
  success: boolean; 
  error?: string 
}> {
  try {
    // Test with a simple email to a test address
    const result = await sendEmail({
      to: 'test@fisherbackflows.com',
      subject: 'Email Service Health Check',
      html: '<p>This is a test email to verify the email service is working.</p>',
      tags: [{ name: 'type', value: 'health_check' }]
    })

    return result
  } catch (error) {
    logger.error('Email service health check failed', { error })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}