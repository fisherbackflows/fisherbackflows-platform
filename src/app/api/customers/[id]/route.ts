import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { auth } from '@/lib/auth'

// Types matching database schema
interface Customer {
  id: string
  account_number: string
  first_name: string
  last_name: string
  email: string
  phone: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  zip_code: string
  account_status: string
  created_at: string
  updated_at: string
}

interface Device {
  id: string
  device_type: string
  manufacturer: string
  model: string
  size_inches: string
  location_description: string
  installation_date?: string
  last_test_date?: string
  next_test_due?: string
  device_status: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await auth.getApiUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params;
    const supabase = createRouteHandlerClient(request);

    // Fetch customer with their devices
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select(`
        *,
        devices (
          id,
          device_type,
          manufacturer,
          model,
          size_inches,
          location_description,
          installation_date,
          last_test_date,
          next_test_due,
          device_status
        )
      `)
      .eq('id', id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Transform data to match frontend expectations
    const transformedCustomer = {
      id: customer.id,
      name: `${customer.first_name} ${customer.last_name}`,
      email: customer.email,
      phone: customer.phone,
      address: `${customer.address_line1}${customer.address_line2 ? ', ' + customer.address_line2 : ''}, ${customer.city}, ${customer.state} ${customer.zip_code}`,
      accountNumber: customer.account_number,
      devices: customer.devices || [],
      status: customer.account_status,
      created_at: customer.created_at,
      updated_at: customer.updated_at
    }
    
    return NextResponse.json(transformedCustomer)
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json()
    const customerIndex = customers.findIndex(c => c.id === id)
    
    if (customerIndex === -1) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    // Update customer
    customers[customerIndex] = {
      ...customers[customerIndex],
      ...data,
      id: id // Ensure ID doesn't change
    }
    
    return NextResponse.json(customers[customerIndex])
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customerIndex = customers.findIndex(c => c.id === id)
    
    if (customerIndex === -1) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    // Remove customer
    customers.splice(customerIndex, 1)
    
    return NextResponse.json({ message: 'Customer deleted successfully' })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    )
  }
}