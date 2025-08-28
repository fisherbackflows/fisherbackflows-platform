import { NextRequest, NextResponse } from 'next/server'
import type { Customer } from '@/lib/types'

// Mock customer data - replace with database connection
const customers: Customer[] = [
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
  }
]

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customer = customers.find(c => c.id === params.id)
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(customer)
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
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const customerIndex = customers.findIndex(c => c.id === params.id)
    
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
      id: params.id // Ensure ID doesn't change
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
  { params }: { params: { id: string } }
) {
  try {
    const customerIndex = customers.findIndex(c => c.id === params.id)
    
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