import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logging/logger'
import { sendWelcomeEmail } from '@/lib/email/resend'
import { enqueueJob } from '@/lib/queue/qstash'
import { createHmac } from 'crypto'

// Webhook events we handle
interface SupabaseWebhookEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  schema: string
  record: any
  old_record?: any
}

/**
 * Verify Supabase webhook signature
 */
function verifySupabaseWebhook(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false

  try {
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex')

    return signature === expectedSignature
  } catch (error) {
    logger.error('Webhook signature verification failed', { error })
    return false
  }
}

export async function POST(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID()

  try {
    const signature = req.headers.get('x-supabase-signature')
    const payload = await req.text()

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET
    if (webhookSecret && !verifySupabaseWebhook(payload, signature, webhookSecret)) {
      logger.warn('Invalid Supabase webhook signature', { requestId })
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event: SupabaseWebhookEvent = JSON.parse(payload)

    logger.info('Supabase webhook received', {
      type: event.type,
      table: event.table,
      schema: event.schema,
      recordId: event.record?.id,
      requestId
    })

    // Handle different webhook events
    switch (event.table) {
      case 'profiles':
        await handleProfileEvent(event, requestId)
        break
        
      case 'customers':
        await handleCustomerEvent(event, requestId)
        break
        
      case 'work_orders':
        await handleWorkOrderEvent(event, requestId)
        break
        
      case 'inspections':
        await handleInspectionEvent(event, requestId)
        break
        
      default:
        logger.info('Unhandled webhook table', { 
          table: event.table, 
          requestId 
        })
    }

    return NextResponse.json({ 
      success: true,
      requestId 
    })

  } catch (error) {
    logger.error('Supabase webhook error', { error, requestId })
    
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        requestId 
      },
      { status: 500 }
    )
  }
}

/**
 * Handle profile-related events (user creation, etc.)
 */
async function handleProfileEvent(
  event: SupabaseWebhookEvent,
  requestId: string
) {
  const { type, record } = event

  switch (type) {
    case 'INSERT':
      // New user created - send welcome email
      if (record.email && record.full_name) {
        try {
          await sendWelcomeEmail(record.email, {
            name: record.full_name,
            verificationUrl: record.is_email_verified 
              ? undefined 
              : `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${record.user_id}`
          })

          logger.info('Welcome email queued', { 
            email: record.email,
            userId: record.user_id,
            requestId 
          })
        } catch (error) {
          logger.error('Failed to send welcome email', { 
            error,
            email: record.email,
            requestId 
          })
        }
      }
      break

    case 'UPDATE':
      // Handle profile updates (e.g., email verification)
      if (record.is_email_verified && !event.old_record?.is_email_verified) {
        logger.info('Email verified', { 
          email: record.email,
          userId: record.user_id,
          requestId 
        })
      }
      break
  }
}

/**
 * Handle customer-related events
 */
async function handleCustomerEvent(
  event: SupabaseWebhookEvent,
  requestId: string
) {
  const { type, record } = event

  switch (type) {
    case 'INSERT':
      logger.info('New customer created', {
        customerId: record.id,
        customerName: record.name,
        orgId: record.org_id,
        requestId
      })

      // Enqueue job to sync with external CRM
      await enqueueJob({
        type: 'process_webhook',
        data: {
          event: 'customer.created',
          customer: record
        },
        orgId: record.org_id,
        metadata: { source: 'supabase_webhook' }
      })
      break

    case 'UPDATE':
      // Handle customer updates
      if (record.is_active !== event.old_record?.is_active) {
        const action = record.is_active ? 'activated' : 'deactivated'
        
        logger.info(`Customer ${action}`, {
          customerId: record.id,
          customerName: record.name,
          requestId
        })
      }
      break

    case 'DELETE':
      logger.info('Customer deleted', {
        customerId: event.old_record?.id,
        customerName: event.old_record?.name,
        requestId
      })
      break
  }
}

/**
 * Handle work order events
 */
async function handleWorkOrderEvent(
  event: SupabaseWebhookEvent,
  requestId: string
) {
  const { type, record } = event

  switch (type) {
    case 'INSERT':
      logger.info('Work order created', {
        workOrderId: record.id,
        title: record.title,
        customerId: record.customer_id,
        requestId
      })

      // If work order is scheduled, send reminder
      if (record.scheduled_at) {
        await enqueueJob({
          type: 'send_email',
          data: {
            type: 'work_order_scheduled',
            workOrderId: record.id,
            scheduledAt: record.scheduled_at
          },
          orgId: record.org_id
        }, {
          scheduleAt: new Date(record.scheduled_at)
        })
      }
      break

    case 'UPDATE':
      // Handle status changes
      if (record.status !== event.old_record?.status) {
        logger.info('Work order status changed', {
          workOrderId: record.id,
          oldStatus: event.old_record?.status,
          newStatus: record.status,
          requestId
        })

        // If work order completed, trigger follow-up actions
        if (record.status === 'completed') {
          await enqueueJob({
            type: 'process_webhook',
            data: {
              event: 'work_order.completed',
              workOrder: record
            },
            orgId: record.org_id
          })
        }
      }

      // Handle assignment changes
      if (record.assigned_to !== event.old_record?.assigned_to) {
        logger.info('Work order reassigned', {
          workOrderId: record.id,
          oldAssignee: event.old_record?.assigned_to,
          newAssignee: record.assigned_to,
          requestId
        })

        // Send notification to new assignee
        if (record.assigned_to) {
          await enqueueJob({
            type: 'send_email',
            data: {
              type: 'work_order_assigned',
              workOrderId: record.id,
              assigneeId: record.assigned_to
            },
            orgId: record.org_id
          })
        }
      }
      break
  }
}

/**
 * Handle inspection events
 */
async function handleInspectionEvent(
  event: SupabaseWebhookEvent,
  requestId: string
) {
  const { type, record } = event

  switch (type) {
    case 'INSERT':
      logger.info('Inspection created', {
        inspectionId: record.id,
        workOrderId: record.work_order_id,
        inspectorId: record.inspector_id,
        requestId
      })
      break

    case 'UPDATE':
      // Handle status changes
      if (record.status !== event.old_record?.status) {
        logger.info('Inspection status changed', {
          inspectionId: record.id,
          oldStatus: event.old_record?.status,
          newStatus: record.status,
          requestId
        })

        switch (record.status) {
          case 'submitted':
            // Notify approver
            await enqueueJob({
              type: 'send_email',
              data: {
                type: 'inspection_submitted',
                inspectionId: record.id
              },
              orgId: record.org_id
            })
            break

          case 'approved':
            // Generate report
            await enqueueJob({
              type: 'generate_pdf',
              data: {
                type: 'inspection_report',
                inspectionId: record.id
              },
              orgId: record.org_id
            })

            // Send notification to customer
            await enqueueJob({
              type: 'send_email',
              data: {
                type: 'inspection_approved',
                inspectionId: record.id
              },
              orgId: record.org_id
            })
            break

          case 'rejected':
            // Notify inspector
            await enqueueJob({
              type: 'send_email',
              data: {
                type: 'inspection_rejected',
                inspectionId: record.id,
                notes: record.notes
              },
              orgId: record.org_id
            })
            break
        }
      }
      break
  }
}