import { supabaseAdmin, createClientComponentClient } from '@/lib/supabase'
import type {
  CustomerCreate,
  CustomerUpdate,
  WorkOrderCreate,
  WorkOrderUpdate,
  InspectionCreate,
  InspectionUpdate
} from '@/lib/validation/schemas'

// Helper function to create client based on context
function createClient() {
  if (typeof window !== 'undefined') {
    return createClientComponentClient()
  }
  return supabaseAdmin
}

// ============================================
// CUSTOMER QUERIES
// ============================================

export async function getCustomers(
  options: {
    page?: number
    limit?: number
    search?: string
    status?: string
    waterDistrictId?: string
  } = {}
) {
  const supabase = createClient()
  const { page = 1, limit = 20, search, status, waterDistrictId } = options

  // Build optimized query with proper indexing
  let query = supabase
    .from('customers')
    .select(`
      id,
      first_name,
      last_name,
      email,
      phone,
      account_number,
      account_status,
      water_district_id,
      created_at,
      device_count:devices(count)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  // Apply filters with index-optimized conditions
  if (status) {
    query = query.eq('account_status', status)
  }

  if (waterDistrictId) {
    query = query.eq('water_district_id', waterDistrictId)
  }

  // Optimized full-text search using trigram indexes
  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  // Apply pagination
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error

  return {
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }
}

export async function getCustomerById(customerId: string) {
  const supabase = createClient()

  // Optimized single query with all related data
  const { data, error } = await supabase
    .from('customers')
    .select(`
      *,
      devices:devices(
        id,
        location,
        make,
        model,
        size,
        status,
        serial_number,
        last_test_date,
        next_test_date,
        days_until_test
      ),
      upcoming_appointments:appointments(
        id,
        scheduled_date,
        status,
        appointment_type,
        technician_id
      ),
      recent_invoices:invoices(
        id,
        amount,
        status,
        due_date,
        created_at
      )
    `)
    .eq('id', customerId)
    .single()

  if (error) throw error
  return data
}

// New optimized function using the database function
export async function getCustomerDashboardData(authUserId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .rpc('get_customer_dashboard_data', {
      p_auth_user_id: authUserId
    })

  if (error) throw error
  return data
}

export async function createCustomer(
  orgId: string,
  userId: string,
  customerData: CustomerCreate
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('customers')
    .insert({
      ...customerData,
      org_id: orgId,
      created_by: userId
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCustomer(
  orgId: string,
  customerId: string,
  updates: CustomerUpdate
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('org_id', orgId)
    .eq('id', customerId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCustomer(orgId: string, customerId: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('org_id', orgId)
    .eq('id', customerId)

  if (error) throw error
}

// ============================================
// WORK ORDER QUERIES
// ============================================

// ============================================
// APPOINTMENT QUERIES (OPTIMIZED)
// ============================================

export async function getAppointments(
  options: {
    page?: number
    limit?: number
    customerId?: string
    status?: string
    technicianId?: string
    scheduledFrom?: string
    scheduledTo?: string
  } = {}
) {
  const supabase = createClient()
  const { page = 1, limit = 20 } = options

  // Optimized query using proper indexes
  let query = supabase
    .from('appointments')
    .select(`
      id,
      customer_id,
      technician_id,
      scheduled_date,
      status,
      appointment_type,
      notes,
      created_at,
      customer:customers(
        id,
        first_name,
        last_name,
        email,
        phone,
        account_number
      ),
      technician:team_users(
        id,
        first_name,
        last_name,
        email,
        phone
      ),
      devices:devices!appointments_customer_id_fkey(
        id,
        location,
        make,
        model,
        status
      )
    `, { count: 'exact' })
    .order('scheduled_date', { ascending: true })

  // Apply index-optimized filters
  if (options.customerId) {
    query = query.eq('customer_id', options.customerId)
  }

  if (options.status) {
    query = query.eq('status', options.status)
  }

  if (options.technicianId) {
    query = query.eq('technician_id', options.technicianId)
  }

  // Date range filters (uses idx_appointments_scheduling index)
  if (options.scheduledFrom) {
    query = query.gte('scheduled_date', options.scheduledFrom)
  }

  if (options.scheduledTo) {
    query = query.lte('scheduled_date', options.scheduledTo)
  }

  // Apply pagination
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error

  return {
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }
}

// Optimized function for technician schedule view
export async function getTechnicianSchedule(
  technicianId: string,
  dateFrom: string,
  dateTo: string
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id,
      scheduled_date,
      status,
      appointment_type,
      estimated_duration,
      customer:customers(
        id,
        first_name,
        last_name,
        phone,
        address
      ),
      devices:devices!appointments_customer_id_fkey(
        id,
        location,
        make,
        model
      )
    `)
    .eq('technician_id', technicianId)
    .gte('scheduled_date', dateFrom)
    .lte('scheduled_date', dateTo)
    .in('status', ['scheduled', 'in_progress'])
    .order('scheduled_date', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createWorkOrder(
  orgId: string,
  userId: string,
  workOrderData: WorkOrderCreate
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('work_orders')
    .insert({
      ...workOrderData,
      org_id: orgId,
      created_by: userId
    })
    .select(`
      *,
      customer:customers(id, name, email),
      assigned_user:assigned_to(id, full_name, email)
    `)
    .single()

  if (error) throw error
  return data
}

export async function updateWorkOrder(
  orgId: string,
  workOrderId: string,
  updates: WorkOrderUpdate
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('work_orders')
    .update(updates)
    .eq('org_id', orgId)
    .eq('id', workOrderId)
    .select(`
      *,
      customer:customers(id, name, email),
      assigned_user:assigned_to(id, full_name, email)
    `)
    .single()

  if (error) throw error
  return data
}

// ============================================
// INSPECTION QUERIES
// ============================================

export async function getInspections(
  orgId: string,
  options: {
    page?: number
    limit?: number
    workOrderId?: string
    inspectorId?: string
    status?: string
  } = {}
) {
  const supabase = createClient()
  const { page = 1, limit = 20 } = options
  
  let query = supabase
    .from('inspections')
    .select(`
      *,
      work_order:work_orders(id, title, customer:customers(id, name)),
      inspector:inspector_id(id, full_name, email)
    `, { count: 'exact' })
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  // Apply filters
  if (options.workOrderId) {
    query = query.eq('work_order_id', options.workOrderId)
  }

  if (options.inspectorId) {
    query = query.eq('inspector_id', options.inspectorId)
  }

  if (options.status) {
    query = query.eq('status', options.status)
  }

  // Pagination
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error

  return {
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }
}

export async function createInspection(
  orgId: string,
  userId: string,
  inspectionData: InspectionCreate
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('inspections')
    .insert({
      ...inspectionData,
      org_id: orgId,
      inspector_id: userId
    })
    .select(`
      *,
      work_order:work_orders(id, title, customer:customers(id, name))
    `)
    .single()

  if (error) throw error
  return data
}

export async function submitInspection(
  orgId: string,
  inspectionId: string,
  userId: string
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('inspections')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString()
    })
    .eq('org_id', orgId)
    .eq('id', inspectionId)
    .eq('inspector_id', userId) // Only inspector can submit
    .select()
    .single()

  if (error) throw error
  return data
}

export async function approveInspection(
  orgId: string,
  inspectionId: string,
  userId: string,
  approved: boolean,
  notes?: string
) {
  const supabase = createClient()
  
  const updates = approved 
    ? {
        status: 'approved' as const,
        approved_at: new Date().toISOString(),
        approved_by: userId,
        notes
      }
    : {
        status: 'rejected' as const,
        notes
      }

  const { data, error } = await supabase
    .from('inspections')
    .update(updates)
    .eq('org_id', orgId)
    .eq('id', inspectionId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// ORGANIZATION QUERIES
// ============================================

export async function getUserOrganizations(userId: string) {
  const cacheKey = `user:orgs:${userId}`
  
  // Check cache first
  const cached = await cache.get(cacheKey)
  if (cached) return cached
  
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_org_memberships')
    .select(`
      role,
      is_active,
      joined_at,
      organization:organizations(
        id,
        name,
        slug,
        subscription_tier,
        created_at
      )
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('joined_at', { ascending: false })

  if (error) throw error
  
  const result = data || []
  
  // Cache for 5 minutes
  await cache.set(cacheKey, result, 300)
  
  return result
}

export async function getOrganizationMembers(orgId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_org_memberships')
    .select(`
      role,
      is_active,
      joined_at,
      user:profiles(
        user_id,
        full_name,
        email,
        phone
      )
    `)
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('joined_at', { ascending: false })

  if (error) throw error
  return data || []
}

// ============================================
// ANALYTICS QUERIES
// ============================================

export async function getOrganizationStats(orgId: string) {
  const cacheKey = `org:stats:${orgId}`
  
  // Check cache first
  const cached = await cache.get(cacheKey)
  if (cached) return cached
  
  return await cache.set(cacheKey, async () => {
    const supabase = createClient()
    
    // Get basic counts
    const [
      { count: customerCount },
      { count: workOrderCount },
      { count: inspectionCount },
      { count: reportCount }
    ] = await Promise.all([
      supabase.from('customers').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
      supabase.from('work_orders').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
      supabase.from('inspections').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('org_id', orgId)
    ])

    // Get work order status breakdown
    const { data: workOrderStats } = await supabase
      .from('work_orders')
      .select('status')
      .eq('org_id', orgId)

    const statusBreakdown = workOrderStats?.reduce((acc: Record<string, number>, wo) => {
      acc[wo.status] = (acc[wo.status] || 0) + 1
      return acc
    }, {}) || {}

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    
    const { count: recentCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .gte('created_at', thirtyDaysAgo)

    const { count: recentWorkOrders } = await supabase
      .from('work_orders')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .gte('created_at', thirtyDaysAgo)

    return {
      customers: {
        total: customerCount || 0,
        recent: recentCustomers || 0
      },
      workOrders: {
        total: workOrderCount || 0,
        recent: recentWorkOrders || 0,
        byStatus: statusBreakdown
      },
      inspections: {
        total: inspectionCount || 0
      },
      reports: {
        total: reportCount || 0
      }
    }
  })
}

// ============================================
// AUDIT QUERIES
// ============================================

export async function getAuditLogs(
  orgId: string,
  options: {
    page?: number
    limit?: number
    userId?: string
    action?: string
    entityType?: string
    entityId?: string
  } = {}
) {
  const supabase = createClient()
  const { page = 1, limit = 50 } = options
  
  let query = supabase
    .from('audit_logs')
    .select(`
      *,
      user:profiles(user_id, full_name, email)
    `, { count: 'exact' })
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  // Apply filters
  if (options.userId) {
    query = query.eq('user_id', options.userId)
  }

  if (options.action) {
    query = query.eq('action', options.action)
  }

  if (options.entityType) {
    query = query.eq('entity_type', options.entityType)
  }

  if (options.entityId) {
    query = query.eq('entity_id', options.entityId)
  }

  // Pagination
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error

  return {
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }
}

// ============================================
// JOB QUERIES
// ============================================

export async function createJob(
  orgId: string | null,
  userId: string | null,
  jobData: {
    type: string
    payload: any
    scheduled_for?: string
    max_attempts?: number
  }
) {
  const supabase = createServiceClient() // Use service client for jobs
  
  const { data, error } = await supabase
    .from('jobs')
    .insert({
      org_id: orgId,
      created_by: userId,
      ...jobData
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getJobs(
  orgId: string | null,
  options: {
    page?: number
    limit?: number
    type?: string
    status?: string
  } = {}
) {
  const supabase = createClient()
  const { page = 1, limit = 20 } = options
  
  let query = supabase
    .from('jobs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  // Filter by org (null for system jobs)
  if (orgId) {
    query = query.eq('org_id', orgId)
  } else {
    query = query.is('org_id', null)
  }

  // Apply filters
  if (options.type) {
    query = query.eq('type', options.type)
  }

  if (options.status) {
    query = query.eq('status', options.status)
  }

  // Pagination
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error

  return {
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }
}

export async function updateJob(
  jobId: string,
  updates: {
    status?: string
    result?: any
    error?: string
    started_at?: string
    completed_at?: string
    attempts?: number
  }
) {
  const supabase = createServiceClient() // Use service client
  
  const { data, error } = await supabase
    .from('jobs')
    .update(updates)
    .eq('id', jobId)
    .select()
    .single()

  if (error) throw error
  return data
}