import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { Customer } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    
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
      devices: customer.devices?.map((device: any) => ({
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