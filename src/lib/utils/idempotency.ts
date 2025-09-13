import { createHash, createHmac } from 'crypto'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

/**
 * Generate idempotency key from request
 */
export function generateIdempotencyKey(
  method: string,
  path: string,
  body: any,
  userId: string
): string {
  const secret = process.env.IDEMPOTENCY_SECRET
  if (!secret) {
    throw new Error('IDEMPOTENCY_SECRET is not configured')
  }

  const payload = JSON.stringify({
    method,
    path,
    body,
    userId
  })

  return createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
}

/**
 * Check for existing idempotent request
 */
export async function checkIdempotency(
  key: string,
  orgId: string,
  userId: string
): Promise<{
  exists: boolean
  response?: {
    status: number
    body: any
  }
}> {
  try {
    const supabase = createClient()
    
    // Check for existing key
    const { data, error } = await supabase
      .from('idempotency_keys')
      .select('response_status, response_body')
      .eq('key', key)
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .single()

    if (error) {
      // Not found is ok
      if (error.code === 'PGRST116') {
        return { exists: false }
      }
      throw error
    }

    if (data && data.response_status && data.response_body) {
      logger.info('Idempotent request found', { key })
      return {
        exists: true,
        response: {
          status: data.response_status,
          body: data.response_body
        }
      }
    }

    return { exists: false }
  } catch (error) {
    logger.error('Idempotency check failed', { key, error })
    // Fail open - allow request to proceed
    return { exists: false }
  }
}

/**
 * Store idempotent response
 */
export async function storeIdempotentResponse(
  key: string,
  orgId: string,
  userId: string,
  method: string,
  path: string,
  params: any,
  status: number,
  body: any
): Promise<void> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('idempotency_keys')
      .insert({
        key,
        org_id: orgId,
        user_id: userId,
        request_method: method,
        request_path: path,
        request_params: params,
        response_status: status,
        response_body: body
      })

    if (error) {
      // Duplicate key is ok (race condition)
      if (error.code !== '23505') {
        throw error
      }
    }

    logger.debug('Idempotent response stored', { key })
  } catch (error) {
    logger.error('Failed to store idempotent response', { key, error })
    // Non-critical - continue
  }
}

/**
 * Middleware for idempotency
 */
export async function withIdempotency<T>(
  req: NextRequest,
  handler: () => Promise<{ status: number; body: T }>,
  options: {
    userId: string
    orgId: string
  }
): Promise<{ status: number; body: T; isIdempotent?: boolean }> {
  const idempotencyKey = req.headers.get('idempotency-key')
  
  if (!idempotencyKey) {
    // No idempotency requested
    return handler()
  }

  // Check for existing response
  const existing = await checkIdempotency(
    idempotencyKey,
    options.orgId,
    options.userId
  )

  if (existing.exists && existing.response) {
    return {
      ...existing.response,
      isIdempotent: true
    }
  }

  // Execute handler
  const result = await handler()

  // Store response for future requests
  await storeIdempotentResponse(
    idempotencyKey,
    options.orgId,
    options.userId,
    req.method,
    req.nextUrl.pathname,
    Object.fromEntries(req.nextUrl.searchParams.entries()),
    result.status,
    result.body
  )

  return result
}

/**
 * Clean up expired idempotency keys
 */
export async function cleanupExpiredKeys(): Promise<number> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('idempotency_keys')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('key')

    if (error) throw error

    const count = data?.length || 0
    
    if (count > 0) {
      logger.info('Cleaned up expired idempotency keys', { count })
    }

    return count
  } catch (error) {
    logger.error('Failed to cleanup idempotency keys', { error })
    return 0
  }
}