import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { verifyResendWebhook } from '@/lib/email/resend'
import { logger } from '@/lib/logger'

interface ResendWebhookEvent {
  type: 'email.sent' | 'email.delivered' | 'email.delivery_delayed' | 'email.complained' | 'email.bounced' | 'email.opened' | 'email.clicked'
  created_at: string
  data: {
    created_at: string
    email_id: string
    from: string
    subject: string
    to: string[]
    tags?: Array<{
      name: string
      value: string
    }>
  }
}

export async function POST(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID()

  try {
    const signature = req.headers.get('svix-signature') || req.headers.get('resend-signature')
    const payload = await req.text()

    // Verify webhook signature
    if (!verifyResendWebhook(payload, signature || '')) {
      logger.warn('Invalid Resend webhook signature', { requestId })
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event: ResendWebhookEvent = JSON.parse(payload)

    logger.info('Resend webhook received', {
      type: event.type,
      emailId: event.data.email_id,
      to: event.data.to,
      requestId
    })

    // Process webhook event
    await processResendEvent(event, requestId)

    return NextResponse.json({ 
      success: true,
      requestId 
    })

  } catch (error) {
    logger.error('Resend webhook error', { error, requestId })
    
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        requestId 
      },
      { status: 500 }
    )
  }
}

async function processResendEvent(event: ResendWebhookEvent, requestId: string) {
  const supabase = createServiceClient()
  
  const { type, data } = event
  const { email_id, to, subject, tags } = data

  try {
    switch (type) {
      case 'email.sent':
        logger.info('Email sent successfully', {
          emailId: email_id,
          to,
          subject,
          requestId
        })
        
        // Update email status in database if we track email statuses
        await updateEmailStatus(email_id, 'sent', { sent_at: event.created_at })
        break

      case 'email.delivered':
        logger.info('Email delivered', {
          emailId: email_id,
          to,
          requestId
        })
        
        await updateEmailStatus(email_id, 'delivered', { delivered_at: event.created_at })
        break

      case 'email.delivery_delayed':
        logger.warn('Email delivery delayed', {
          emailId: email_id,
          to,
          requestId
        })
        
        await updateEmailStatus(email_id, 'delayed', { delayed_at: event.created_at })
        break

      case 'email.bounced':
        logger.warn('Email bounced', {
          emailId: email_id,
          to,
          requestId
        })
        
        await updateEmailStatus(email_id, 'bounced', { bounced_at: event.created_at })
        
        // Mark email as invalid in profiles
        await markEmailAsInvalid(to[0], 'bounced')
        break

      case 'email.complained':
        logger.warn('Email complaint received', {
          emailId: email_id,
          to,
          requestId
        })
        
        await updateEmailStatus(email_id, 'complained', { complained_at: event.created_at })
        
        // Mark email as invalid in profiles  
        await markEmailAsInvalid(to[0], 'complained')
        break

      case 'email.opened':
        logger.info('Email opened', {
          emailId: email_id,
          to,
          requestId
        })
        
        await updateEmailStatus(email_id, 'opened', { opened_at: event.created_at })
        break

      case 'email.clicked':
        logger.info('Email clicked', {
          emailId: email_id,
          to,
          requestId
        })
        
        await updateEmailStatus(email_id, 'clicked', { clicked_at: event.created_at })
        break

      default:
        logger.info('Unhandled Resend webhook event', {
          type,
          emailId: email_id,
          requestId
        })
    }

    // Extract user information from tags if available
    const userTag = tags?.find(tag => tag.name === 'user')
    const orgTag = tags?.find(tag => tag.name === 'org')
    
    if (userTag || orgTag) {
      // Store email event for analytics
      await storeEmailEvent({
        email_id,
        event_type: type,
        recipient: to[0],
        user_id: userTag?.value,
        org_id: orgTag?.value,
        subject,
        created_at: event.created_at
      })
    }

  } catch (error) {
    logger.error('Failed to process Resend event', {
      error,
      type,
      emailId: email_id,
      requestId
    })
  }
}

async function updateEmailStatus(
  emailId: string,
  status: string,
  metadata: Record<string, any>
) {
  // This would update an email_logs table if we're tracking email status
  // For now, just log the status change
  logger.debug('Email status updated', {
    emailId,
    status,
    ...metadata
  })
}

async function markEmailAsInvalid(email: string, reason: string) {
  const supabase = createServiceClient()
  
  try {
    // Update profile to mark email as invalid
    const { data, error } = await supabase
      .from('profiles')
      .update({
        metadata: {
          email_status: 'invalid',
          email_invalid_reason: reason,
          email_invalid_at: new Date().toISOString()
        }
      })
      .eq('email', email)
      .select('user_id, full_name')

    if (error) {
      logger.error('Failed to mark email as invalid', { error, email })
      return
    }

    if (data && data.length > 0) {
      logger.warn('Email marked as invalid', {
        email,
        reason,
        userId: data[0].user_id,
        userName: data[0].full_name
      })
    }
  } catch (error) {
    logger.error('Error marking email as invalid', { error, email, reason })
  }
}

async function storeEmailEvent(event: {
  email_id: string
  event_type: string
  recipient: string
  user_id?: string
  org_id?: string
  subject: string
  created_at: string
}) {
  const supabase = createServiceClient()
  
  try {
    // This would insert into an email_events table for analytics
    // For now, just log the event
    logger.debug('Email event stored', event)
    
    // You could implement email analytics tracking here:
    // await supabase.from('email_events').insert({
    //   email_id: event.email_id,
    //   event_type: event.event_type,
    //   recipient: event.recipient,
    //   user_id: event.user_id,
    //   org_id: event.org_id,
    //   subject: event.subject,
    //   created_at: event.created_at
    // })

  } catch (error) {
    logger.error('Failed to store email event', { error, event })
  }
}