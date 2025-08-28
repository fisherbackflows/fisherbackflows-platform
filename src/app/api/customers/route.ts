import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Customer } from '@/lib/types'
import type { Device, ApiResponse, PaginatedResponse } from '@/types/api'

// Mock data for development when Supabase is not configured
const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '555-0123',
    address: '123 Main St, City, State 12345',
    accountNumber: 'FB001',
    devices: [
      {
        id: 'dev1',
        location: '123 Main St - Backyard',
        serialNumber: 'BF-2023-001',
        size: '3/4"',
        make: 'Watts',
        model: 'Series 909',
        installDate: '2023-01-15',
        lastTestDate: '2024-01-15',
        nextTestDate: '2025-01-15',
        status: 'Passed'
      }
    ],
    balance: 0,
    nextTestDate: '2025-01-15',
    status: 'Active'
  },
  {
    id: '2',
    name: 'ABC Corporation',
    email: 'admin@abccorp.com',
    phone: '555-0456',
    address: '456 Business Ave, City, State 12345',
    accountNumber: 'FB002',
    devices: [
      {
        id: 'dev2',
        location: '456 Business Ave - Main Building',
        serialNumber: 'BF-2023-002',
        size: '1"',
        make: 'Zurn Wilkins',
        model: '350XL',
        installDate: '2023-03-20',
        lastTestDate: '2024-03-20',
        nextTestDate: '2025-03-20',
        status: 'Failed'
      }
    ],
    balance: 150,
    nextTestDate: '2025-03-20',
    status: 'Needs Service'
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    
    // Use mock data if Supabase is not configured
    if (!isSupabaseConfigured || !supabase) {
      let filteredCustomers = mockCustomers
      
      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase()
        filteredCustomers = filteredCustomers.filter(customer =>
          customer.name.toLowerCase().includes(searchLower) ||
          customer.email.toLowerCase().includes(searchLower) ||
          customer.phone.includes(search) ||
          customer.accountNumber.toLowerCase().includes(searchLower)
        )
      }
      
      // Apply status filter
      if (status && status !== 'All') {
        filteredCustomers = filteredCustomers.filter(customer =>
          customer.status === status
        )
      }
      
      return NextResponse.json(filteredCustomers)
    }
    
    // Use Supabase when configured
    let query = supabase
      .from('customers')
      .select(`
        *,
        devices(*)
      `)
    
    // Apply search filter
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,account_number.ilike.%${search}%`
      )
    }
    
    // Apply status filter
    if (status && status !== 'All') {
      query = query.eq('status', status)
    }
    
    const { data: customers, error } = await query
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch customers' },
        { status: 500 }
      )
    }
    
    // Transform data to match frontend expectations
    const transformedCustomers = customers?.map(customer => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      accountNumber: customer.account_number,
      balance: customer.balance,
      nextTestDate: customer.next_test_date,
      status: customer.status,
      devices: customer.devices?.map((device: Device) => ({
        id: device.id,
        location: device.location,
        serialNumber: device.serial_number,
        size: device.size,
        make: device.make,
        model: device.model,
        installDate: device.install_date,
        lastTestDate: device.last_test_date,
        nextTestDate: device.next_test_date,
        status: device.status
      })) || []
    })) || []
    
    return NextResponse.json(transformedCustomers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Validate required fields
    if (!data.name || !data.email || !data.phone || !data.address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Use mock data if Supabase is not configured
    if (!isSupabaseConfigured || !supabase) {
      const newCustomer: Customer = {
        id: String(mockCustomers.length + 1),
        accountNumber: `FB${String(mockCustomers.length + 1).padStart(3, '0')}`,
        ...data,
        devices: [],
        balance: 0,
        nextTestDate: data.nextTestDate || null,
        status: 'Active'
      }
      
      mockCustomers.push(newCustomer)
      return NextResponse.json(newCustomer, { status: 201 })
    }
    
    // Get the next account number
    const { count } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
    
    const accountNumber = `FB${String((count || 0) + 1).padStart(3, '0')}`
    
    // Create new customer in Supabase
    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert({
        account_number: accountNumber,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        balance: 0,
        next_test_date: data.nextTestDate || null,
        status: 'Active'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to create customer' },
        { status: 500 }
      )
    }
    
    // Transform response to match frontend expectations
    const transformedCustomer = {
      id: newCustomer.id,
      name: newCustomer.name,
      email: newCustomer.email,
      phone: newCustomer.phone,
      address: newCustomer.address,
      accountNumber: newCustomer.account_number,
      balance: newCustomer.balance,
      nextTestDate: newCustomer.next_test_date,
      status: newCustomer.status,
      devices: []
    }
    
    return NextResponse.json(transformedCustomer, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}