import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface WebhookPayload {
  event: string
  timestamp: string
  data: any
  webhook_id?: string
}

// Queue webhook delivery for a company
export async function queueWebhookDelivery(
  companyId: string, 
  eventType: string, 
  payload: any
): Promise<void> {
  try {
    // Get all active webhook endpoints for this company that listen to this event
    const { data: endpoints } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .contains('events', [eventType])

    if (!endpoints || endpoints.length === 0) {
      console.log(`No webhook endpoints found for company ${companyId} and event ${eventType}`)
      return
    }

    // Queue delivery for each endpoint
    for (const endpoint of endpoints) {
      const webhookPayload: WebhookPayload = {
        event: eventType,
        timestamp: new Date().toISOString(),
        data: payload,
        webhook_id: endpoint.id
      }

      await supabase
        .from('webhook_deliveries')
        .insert({
          webhook_endpoint_id: endpoint.id,
          event_type: eventType,
          payload: webhookPayload,
          status: 'pending',
          attempt_count: 0,
          next_retry_at: new Date().toISOString()
        })
    }

    console.log(`Queued webhook deliveries for ${endpoints.length} endpoints`)

  } catch (error) {
    console.error('Error queueing webhook delivery:', error)
  }
}

// Generate webhook signature
function generateSignature(payload: string, secret: string): string {
  return 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
}

// Deliver a single webhook
export async function deliverWebhook(deliveryId: string): Promise<boolean> {
  try {
    // Get delivery record with endpoint details
    const { data: delivery } = await supabase
      .from('webhook_deliveries')
      .select(`
        *,
        webhook_endpoints (
          url,
          secret,
          timeout_seconds
        )
      `)
      .eq('id', deliveryId)
      .single()

    if (!delivery || !delivery.webhook_endpoints) {
      console.error('Webhook delivery not found:', deliveryId)
      return false
    }

    const endpoint = delivery.webhook_endpoints
    const payloadString = JSON.stringify(delivery.payload)
    const signature = generateSignature(payloadString, endpoint.secret)
    
    // Attempt delivery
    const startTime = Date.now()
    
    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': delivery.event_type,
          'X-Webhook-Delivery': deliveryId,
          'User-Agent': 'BackflowBuddy-Webhooks/1.0'
        },
        body: payloadString,
        signal: AbortSignal.timeout((endpoint.timeout_seconds || 30) * 1000)
      })

      const responseTime = Date.now() - startTime
      const responseBody = await response.text()

      // Update delivery record
      if (response.ok) {
        await supabase
          .from('webhook_deliveries')
          .update({
            status: 'delivered',
            http_status_code: response.status,
            response_body: responseBody.substring(0, 1000), // Limit response size
            delivered_at: new Date().toISOString(),
            attempt_count: delivery.attempt_count + 1
          })
          .eq('id', deliveryId)

        console.log(`Webhook delivered successfully: ${deliveryId} (${responseTime}ms)`)
        return true

      } else {
        // HTTP error - schedule retry
        const nextRetry = new Date(Date.now() + (Math.pow(2, delivery.attempt_count) * 60 * 1000)) // Exponential backoff
        
        await supabase
          .from('webhook_deliveries')
          .update({
            status: delivery.attempt_count >= 2 ? 'failed' : 'pending', // Max 3 attempts
            http_status_code: response.status,
            response_body: responseBody.substring(0, 1000),
            attempt_count: delivery.attempt_count + 1,
            next_retry_at: delivery.attempt_count >= 2 ? null : nextRetry.toISOString()
          })
          .eq('id', deliveryId)

        console.log(`Webhook delivery failed: ${deliveryId} (HTTP ${response.status})`)
        return false
      }

    } catch (fetchError) {
      // Network/timeout error - schedule retry
      const nextRetry = new Date(Date.now() + (Math.pow(2, delivery.attempt_count) * 60 * 1000))
      
      await supabase
        .from('webhook_deliveries')
        .update({
          status: delivery.attempt_count >= 2 ? 'failed' : 'pending',
          response_body: fetchError instanceof Error ? fetchError.message : 'Network error',
          attempt_count: delivery.attempt_count + 1,
          next_retry_at: delivery.attempt_count >= 2 ? null : nextRetry.toISOString()
        })
        .eq('id', deliveryId)

      console.log(`Webhook delivery network error: ${deliveryId}`)
      return false
    }

  } catch (error) {
    console.error('Error delivering webhook:', error)
    return false
  }
}

// Process pending webhook deliveries (called by cron job)
export async function processPendingWebhooks(): Promise<void> {
  try {
    // Get pending deliveries that are ready for retry
    const { data: pendingDeliveries } = await supabase
      .from('webhook_deliveries')
      .select('id')
      .eq('status', 'pending')
      .lte('next_retry_at', new Date().toISOString())
      .limit(100) // Process in batches

    if (!pendingDeliveries || pendingDeliveries.length === 0) {
      return
    }

    console.log(`Processing ${pendingDeliveries.length} pending webhook deliveries`)

    // Process deliveries in parallel (with concurrency limit)
    const batchSize = 10
    for (let i = 0; i < pendingDeliveries.length; i += batchSize) {
      const batch = pendingDeliveries.slice(i, i + batchSize)
      
      await Promise.allSettled(
        batch.map(delivery => deliverWebhook(delivery.id))
      )
      
      // Small delay between batches to avoid overwhelming external services
      if (i + batchSize < pendingDeliveries.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

  } catch (error) {
    console.error('Error processing pending webhooks:', error)
  }
}

// Common webhook events
export const WEBHOOK_EVENTS = {
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
  CUSTOMER_DELETED: 'customer.deleted',
  APPOINTMENT_SCHEDULED: 'appointment.scheduled',
  APPOINTMENT_COMPLETED: 'appointment.completed',
  APPOINTMENT_CANCELLED: 'appointment.cancelled',
  TEST_COMPLETED: 'test.completed',
  INVOICE_CREATED: 'invoice.created',
  INVOICE_PAID: 'invoice.paid',
  SUBSCRIPTION_UPDATED: 'subscription.updated'
} as const

// Helper function to trigger webhooks from API endpoints
export async function triggerWebhook(
  companyId: string,
  event: string,
  data: any
): Promise<void> {
  // Queue for background processing
  await queueWebhookDelivery(companyId, event, data)
}