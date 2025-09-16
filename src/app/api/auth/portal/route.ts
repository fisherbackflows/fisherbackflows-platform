import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs';
import { createRouteHandlerClient } from '@/lib/supabase'
import type { Customer } from '@/lib/types'

async function calculateCustomerBalance(customerId: string, request: NextRequest): Promise<number> {
  const supabase = createRouteHandlerClient(request)
  
  const { data: invoices } = await supabase
    .from('invoices')
    .select('amount, status')
    .eq('customer_id', customerId)
    .in('status', ['pending', 'overdue'])

  return invoices?.reduce((total, invoice) => total + invoice.amount, 0) || 0
}

export async function POST(request: NextRequest) {
  try {
    const { identifier, type } = await request.json()
    
    if (!identifier || !type) {
      return NextResponse.json(
        { error: 'Missing identifier or type' },
        { status: 400 }
      )
    }
    
    const supabase = createRouteHandlerClient(request)
    
    // Demo mode - use real database but return first customer
    if (identifier === 'demo') {
      const { data: customers } = await supabase
        .from('customers')
        .select('*')
        .limit(1)
        .single()
        
      if (customers) {
        const customer = {
          id: customers.id,
          name: `${customers.first_name} ${customers.last_name}`,
          email: customers.email,
          phone: customers.phone,
          address: `${customers.address_line1}, ${customers.city}, ${customers.state} ${customers.zip_code}`,
          accountNumber: customers.account_number || 'FB-DEMO',
          balance: 0,
          status: customers.account_status || 'Active'
        }
        
        return NextResponse.json({
          success: true,
          customer,
          token: `auth-token-${customer.id}-${Date.now()}`
        })
      }
    }
    
    // Find customer by email or phone in database
    let query = supabase
      .from('customers')
      .select('*')
    
    if (type === 'email') {
      query = query.ilike('email', identifier)
    } else if (type === 'phone') {
      // Clean phone number for comparison
      const cleanPhone = identifier.replace(/\D/g, '')
      query = query.ilike('phone', `%${cleanPhone}%`)
    }
    
    const { data: customerData, error } = await query.single()
    
    if (error || !customerData) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    // Transform database customer to API format
    const customer = {
      id: customerData.id,
      name: `${customerData.first_name} ${customerData.last_name}`,
      email: customerData.email,
      phone: customerData.phone,
      address: `${customerData.address_line1}, ${customerData.city}, ${customerData.state} ${customerData.zip_code}`,
      accountNumber: customerData.account_number,
      balance: await calculateCustomerBalance(customerData.id, request),
      status: customerData.account_status || 'Active'
    }
    
    // Generate simple token (in production, use JWT)
    const token = `auth-token-${customer.id}-${Date.now()}`
    
    return NextResponse.json({
      success: true,
      customer,
      token
    })
  } catch (error) {
    console.error('Portal authentication error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify token and return customer data
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid token' },
        { status: 401 }
      )
    }
    
    const token = authHeader.substring(7)
    const supabase = createRouteHandlerClient(request)
    
    // Extract customer ID from token (in production, verify JWT properly)
    const match = token.match(/auth-token-([a-f0-9-]{36})-/)
    if (!match) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      )
    }
    
    const customerId = match[1]
    
    // Get customer data from database
    const { data: customerData, error } = await supabase
      .from('customers')
      .select(`
        *,
        devices:devices(*),
        invoices:invoices(*)
      `)
      .eq('id', customerId)
      .single()
    
    if (error || !customerData) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    // Transform to API format with devices and recent data
    const customer = {
      id: customerData.id,
      name: `${customerData.first_name} ${customerData.last_name}`,
      email: customerData.email,
      phone: customerData.phone,
      address: `${customerData.address_line1}, ${customerData.city}, ${customerData.state} ${customerData.zip_code}`,
      accountNumber: customerData.account_number,
      balance: customerData.invoices?.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0,
      status: customerData.account_status || 'Active',
      devices: customerData.devices?.map(device => ({
        id: device.id,
        location: device.location_description,
        serialNumber: device.serial_number || 'N/A',
        size: device.size_inches || 'N/A',
        make: device.manufacturer,
        model: device.model,
        installDate: device.installation_date,
        lastTestDate: device.last_test_date,
        nextTestDate: device.next_test_due,
        status: device.device_status
      })) || []
    }
    
    return NextResponse.json({
      success: true,
      customer
    })
  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json(
      { error: 'Token verification failed' },
      { status: 500 }
    )
  }
}