import { Client, Receiver } from '@upstash/qstash'
import { logger } from '@/lib/logging/logger'
import type { JobType } from '@/lib/validation/schemas'

// Initialize QStash client
const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN!,
})

// Initialize receiver for webhook verification
const qstashReceiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
})

// Job configuration
export const JOB_CONFIG = {
  generate_pdf: {
    url: '/api/jobs/generate-pdf',
    retries: 3,
    delay: 0,
    timeout: 30000, // 30 seconds
  },
  send_email: {
    url: '/api/jobs/send-email',
    retries: 5,
    delay: 1,
    timeout: 10000, // 10 seconds
  },
  nightly_sync: {
    url: '/api/jobs/nightly-sync',
    retries: 2,
    delay: 0,
    timeout: 300000, // 5 minutes
  },
  process_webhook: {
    url: '/api/jobs/process-webhook',
    retries: 3,
    delay: 2,
    timeout: 15000, // 15 seconds
  },
  cleanup_temp: {
    url: '/api/jobs/cleanup-temp',
    retries: 1,
    delay: 0,
    timeout: 60000, // 1 minute
  },
}

export interface JobPayload {
  type: JobType
  data: any
  orgId?: string
  userId?: string
  metadata?: Record<string, any>
}

/**
 * Enqueue a job for background processing
 */
export async function enqueueJob(
  payload: JobPayload,
  options: {
    delay?: number // Delay in seconds
    scheduleAt?: Date // Specific time to run
    deduplicationId?: string // Prevent duplicate jobs
  } = {}
): Promise<string> {
  const config = JOB_CONFIG[payload.type as keyof typeof JOB_CONFIG]
  
  if (!config) {
    throw new Error(`Unknown job type: ${payload.type}`)
  }

  const url = `${process.env.NEXT_PUBLIC_APP_URL}${config.url}`

  try {
    const publishOptions: any = {
      url,
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
      retries: config.retries,
      timeout: config.timeout,
    }

    // Add delay or schedule
    if (options.scheduleAt) {
      publishOptions.notBefore = Math.floor(options.scheduleAt.getTime() / 1000)
    } else if (options.delay || config.delay) {
      publishOptions.delay = `${options.delay || config.delay}s`
    }

    // Add deduplication
    if (options.deduplicationId) {
      publishOptions.deduplicationId = options.deduplicationId
    }

    const response = await qstashClient.publishJSON(publishOptions)

    logger.info('Job enqueued', {
      type: payload.type,
      messageId: response.messageId,
      orgId: payload.orgId,
      userId: payload.userId,
    })

    return response.messageId
  } catch (error) {
    logger.error('Failed to enqueue job', {
      type: payload.type,
      error,
    })
    throw error
  }
}

/**
 * Enqueue multiple jobs in batch
 */
export async function enqueueBatch(
  jobs: Array<{
    payload: JobPayload
    options?: {
      delay?: number
      scheduleAt?: Date
      deduplicationId?: string
    }
  }>
): Promise<string[]> {
  const messageIds: string[] = []

  for (const job of jobs) {
    try {
      const messageId = await enqueueJob(job.payload, job.options)
      messageIds.push(messageId)
    } catch (error) {
      logger.error('Failed to enqueue job in batch', {
        type: job.payload.type,
        error,
      })
    }
  }

  return messageIds
}

/**
 * Verify QStash webhook signature
 */
export async function verifyWebhook(
  signature: string | null,
  body: string,
  url: string
): Promise<boolean> {
  if (!signature) {
    logger.warn('Missing QStash signature')
    return false
  }

  try {
    await qstashReceiver.verify({
      signature,
      body,
      url,
    })
    return true
  } catch (error) {
    logger.error('QStash signature verification failed', { error })
    return false
  }
}

/**
 * Schedule a recurring job
 */
export async function scheduleRecurring(
  payload: JobPayload,
  schedule: string // Cron expression
): Promise<string> {
  const config = JOB_CONFIG[payload.type as keyof typeof JOB_CONFIG]
  
  if (!config) {
    throw new Error(`Unknown job type: ${payload.type}`)
  }

  const url = `${process.env.NEXT_PUBLIC_APP_URL}${config.url}`

  try {
    const response = await qstashClient.schedules.create({
      destination: url,
      cron: schedule,
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
      retries: config.retries,
    })

    logger.info('Recurring job scheduled', {
      type: payload.type,
      scheduleId: response.scheduleId,
      cron: schedule,
    })

    return response.scheduleId
  } catch (error) {
    logger.error('Failed to schedule recurring job', {
      type: payload.type,
      error,
    })
    throw error
  }
}

/**
 * Cancel a scheduled job
 */
export async function cancelSchedule(scheduleId: string): Promise<void> {
  try {
    await qstashClient.schedules.delete(scheduleId)
    logger.info('Schedule cancelled', { scheduleId })
  } catch (error) {
    logger.error('Failed to cancel schedule', { scheduleId, error })
    throw error
  }
}

/**
 * Get job status by message ID
 */
export async function getJobStatus(messageId: string): Promise<any> {
  try {
    const events = await qstashClient.messages.get(messageId)
    return events
  } catch (error) {
    logger.error('Failed to get job status', { messageId, error })
    return null
  }
}

/**
 * Dead letter queue handler
 */
export async function handleDLQ(messageId: string): Promise<void> {
  try {
    const dlq = await qstashClient.dlq.get()
    const message = dlq.messages.find(m => m.messageId === messageId)

    if (message) {
      logger.error('Message in DLQ', {
        messageId,
        url: message.url,
        responseStatus: message.responseStatus,
        responseBody: message.responseBody,
      })

      // You can implement retry logic or alerting here
      // For now, just log
    }
  } catch (error) {
    logger.error('Failed to handle DLQ', { messageId, error })
  }
}

/**
 * Retry failed jobs from DLQ
 */
export async function retryDLQMessages(
  filter?: (message: any) => boolean
): Promise<number> {
  try {
    const dlq = await qstashClient.dlq.get()
    let retried = 0

    for (const message of dlq.messages) {
      if (!filter || filter(message)) {
        try {
          // Parse the original payload
          const payload = JSON.parse(message.body)
          
          // Re-enqueue with original payload
          await enqueueJob(payload, { delay: 5 })
          
          // Remove from DLQ
          await qstashClient.dlq.delete(message.dlqId)
          
          retried++
          logger.info('DLQ message retried', { 
            messageId: message.messageId,
            type: payload.type 
          })
        } catch (error) {
          logger.error('Failed to retry DLQ message', { 
            messageId: message.messageId,
            error 
          })
        }
      }
    }

    return retried
  } catch (error) {
    logger.error('Failed to retry DLQ messages', { error })
    return 0
  }
}