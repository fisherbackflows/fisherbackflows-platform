import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/requireSession'
import { validateAndSanitize, CustomerCreateSchema, CustomerQuerySchema } from '@/lib/validation/schemas'
import { getCustomers, createCustomer } from '@/lib/db/queries'
import { logger } from '@/lib/logging/logger'
import { rateLimit } from '@/lib/cache/redis'

/**
 * GET /api/v1/customers
 * List customers with filtering and pagination
 */
export async function GET(req: NextRequest) {
  return requireSession(['admin', 'manager', 'coordinator'], async ({ orgId, userId, session }) => {
    const requestId = req.headers.get('x-request-id') || crypto.randomUUID()

    try {
      // Rate limiting
      const clientIP = req.headers.get('x-forwarded-for') || 'unknown'
      const rateLimitResult = await rateLimit(`api:customers:${clientIP}`, 60, 300) // 60 requests per 5 minutes
      
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': '60',
              'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
              'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString()
            }
          }
        )
      }

      // Parse and validate query parameters
      const searchParams = req.nextUrl.searchParams
      const queryParams = {
        page: searchParams.get('page'),
        limit: searchParams.get('limit'),
        search: searchParams.get('search'),
        tags: searchParams.get('tags')?.split(',').filter(Boolean),
        is_active: searchParams.get('is_active') === 'true' ? true : 
                   searchParams.get('is_active') === 'false' ? false : undefined
      }

      const validatedQuery = validateAndSanitize(CustomerQuerySchema, queryParams)

      logger.info('Fetching customers', {
        orgId,
        userId,
        query: validatedQuery,
        requestId
      })

      // Fetch customers from database
      const result = await getCustomers(orgId, validatedQuery)

      logger.info('Customers fetched successfully', {
        count: result.data.length,
        totalCount: result.pagination.total,
        requestId
      })

      return NextResponse.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        requestId
      })

    } catch (error) {
      logger.error('Failed to fetch customers', {
        error,
        orgId,
        userId,
        requestId
      })

      return NextResponse.json(
        {
          error: 'Failed to fetch customers',
          message: error instanceof Error ? error.message : 'Unknown error',
          requestId
        },
        { status: 500 }
      )
    }
  })
}

/**
 * POST /api/v1/customers
 * Create a new customer
 */
export async function POST(req: NextRequest) {
  return requireSession(['admin', 'manager', 'coordinator'], async ({ orgId, userId, session }) => {
    const requestId = req.headers.get('x-request-id') || crypto.randomUUID()

    try {
      // Rate limiting for creation (more restrictive)
      const clientIP = req.headers.get('x-forwarded-for') || 'unknown'
      const rateLimitResult = await rateLimit(`api:customers:create:${clientIP}`, 10, 300) // 10 creates per 5 minutes
      
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          { error: 'Rate limit exceeded for customer creation' },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': '10',
              'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
              'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString()
            }
          }
        )
      }

      // Parse and validate request body
      const body = await req.json()
      const validatedData = validateAndSanitize(CustomerCreateSchema, body)

      logger.info('Creating customer', {
        orgId,
        userId,
        customerName: validatedData.name,
        requestId
      })

      // Create customer in database
      const customer = await createCustomer(orgId, userId, validatedData)

      logger.info('Customer created successfully', {
        customerId: customer.id,
        customerName: customer.name,
        orgId,
        userId,
        requestId
      })

      return NextResponse.json({
        success: true,
        data: customer,
        requestId
      }, { status: 201 })

    } catch (error) {
      logger.error('Failed to create customer', {
        error,
        orgId,
        userId,
        requestId
      })

      // Handle validation errors
      if (error?.name === 'ZodError') {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: error.errors,
            requestId
          },
          { status: 400 }
        )
      }

      // Handle database constraint errors
      if (error?.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          {
            error: 'Customer with this information already exists',
            requestId
          },
          { status: 409 }
        )
      }

      return NextResponse.json(
        {
          error: 'Failed to create customer',
          message: error instanceof Error ? error.message : 'Unknown error',
          requestId
        },
        { status: 500 }
      )
    }
  })
}