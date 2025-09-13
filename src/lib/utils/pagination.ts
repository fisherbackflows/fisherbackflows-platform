import { z } from 'zod'

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

export interface PaginationParams {
  page: number
  limit: number
  cursor?: string
  sort?: string
  order: 'asc' | 'desc'
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  nextCursor?: string
  prevCursor?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationInfo
}

/**
 * Parse pagination parameters from query string
 */
export function parsePaginationParams(
  searchParams: URLSearchParams
): PaginationParams {
  return {
    page: Math.max(1, parseInt(searchParams.get('page') || '1')),
    limit: Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE)))
    ),
    cursor: searchParams.get('cursor') || undefined,
    sort: searchParams.get('sort') || undefined,
    order: (searchParams.get('order') as 'asc' | 'desc') || 'desc'
  }
}

/**
 * Generate pagination info
 */
export function generatePaginationInfo(
  params: PaginationParams,
  total: number,
  data: any[]
): PaginationInfo {
  const totalPages = Math.ceil(total / params.limit)
  
  return {
    page: params.page,
    limit: params.limit,
    total,
    totalPages,
    hasNext: params.page < totalPages,
    hasPrev: params.page > 1,
    // For cursor-based pagination
    nextCursor: data.length === params.limit ? generateCursor(data[data.length - 1]) : undefined,
    prevCursor: params.page > 1 ? generateCursor(data[0], true) : undefined
  }
}

/**
 * Generate cursor for cursor-based pagination
 */
function generateCursor(item: any, reverse = false): string {
  // Simple cursor based on created_at timestamp and id
  const timestamp = item.created_at || new Date().toISOString()
  const id = item.id || 'unknown'
  
  const cursor = `${timestamp}:${id}`
  return reverse ? `rev:${cursor}` : cursor
}

/**
 * Parse cursor for database queries
 */
export function parseCursor(cursor?: string): {
  timestamp?: string
  id?: string
  reverse?: boolean
} {
  if (!cursor) return {}
  
  const isReverse = cursor.startsWith('rev:')
  const cleanCursor = isReverse ? cursor.slice(4) : cursor
  
  const [timestamp, id] = cleanCursor.split(':')
  
  return {
    timestamp,
    id,
    reverse: isReverse
  }
}

/**
 * Build Supabase range query
 */
export function buildRangeQuery(params: PaginationParams): {
  from: number
  to: number
} {
  const from = (params.page - 1) * params.limit
  const to = from + params.limit - 1
  
  return { from, to }
}

/**
 * Validate sort field against allowed fields
 */
export function validateSortField(
  sort?: string,
  allowedFields: string[] = []
): string | undefined {
  if (!sort || !allowedFields.includes(sort)) {
    return 'created_at' // Default sort field
  }
  return sort
}

/**
 * Build order by clause for Supabase
 */
export function buildOrderBy(
  sort: string = 'created_at',
  order: 'asc' | 'desc' = 'desc'
): { column: string; ascending: boolean } {
  return {
    column: sort,
    ascending: order === 'asc'
  }
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  params: PaginationParams,
  total: number
): PaginatedResponse<T> {
  return {
    data,
    pagination: generatePaginationInfo(params, total, data)
  }
}

/**
 * Cursor-based pagination helper
 */
export function applyCursorPagination(
  query: any,
  params: PaginationParams,
  timestampColumn = 'created_at',
  idColumn = 'id'
) {
  if (params.cursor) {
    const { timestamp, id, reverse } = parseCursor(params.cursor)
    
    if (timestamp && id) {
      if (reverse) {
        // Previous page
        query = query.or(
          `${timestampColumn}.gt.${timestamp},and(${timestampColumn}.eq.${timestamp},${idColumn}.gt.${id})`
        )
      } else {
        // Next page
        query = query.or(
          `${timestampColumn}.lt.${timestamp},and(${timestampColumn}.eq.${timestamp},${idColumn}.lt.${id})`
        )
      }
    }
  }
  
  return query
}

/**
 * Calculate offset for traditional pagination
 */
export function calculateOffset(page: number, limit: number): number {
  return (Math.max(1, page) - 1) * limit
}

/**
 * Generate pagination links for API responses
 */
export function generatePaginationLinks(
  baseUrl: string,
  params: PaginationParams,
  pagination: PaginationInfo
): {
  first?: string
  prev?: string
  next?: string
  last?: string
} {
  const links: Record<string, string> = {}
  const urlParams = new URLSearchParams()
  
  // Add current params except page
  if (params.limit !== DEFAULT_PAGE_SIZE) {
    urlParams.set('limit', params.limit.toString())
  }
  if (params.sort) {
    urlParams.set('sort', params.sort)
  }
  if (params.order !== 'desc') {
    urlParams.set('order', params.order)
  }
  
  const baseQuery = urlParams.toString()
  
  // First page
  if (pagination.page > 1) {
    links.first = `${baseUrl}?${baseQuery ? baseQuery + '&' : ''}page=1`
  }
  
  // Previous page
  if (pagination.hasPrev) {
    links.prev = `${baseUrl}?${baseQuery ? baseQuery + '&' : ''}page=${pagination.page - 1}`
  }
  
  // Next page
  if (pagination.hasNext) {
    links.next = `${baseUrl}?${baseQuery ? baseQuery + '&' : ''}page=${pagination.page + 1}`
  }
  
  // Last page
  if (pagination.page < pagination.totalPages) {
    links.last = `${baseUrl}?${baseQuery ? baseQuery + '&' : ''}page=${pagination.totalPages}`
  }
  
  return links
}