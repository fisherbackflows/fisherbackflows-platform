import { NextRequest, NextResponse } from 'next/server'
import type { Customer } from '@/lib/types'

// Mock customer data for authentication
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

export async function POST(request: NextRequest) {
  try {
    const { identifier, type } = await request.json()
    
    if (!identifier || !type) {
      return NextResponse.json(
        { error: 'Missing identifier or type' },
        { status: 400 }
      )
    }
    
    // Demo mode - bypass authentication
    if (identifier === 'demo') {
      const demoCustomer = customers[0]
      return NextResponse.json({
        success: true,
        customer: demoCustomer,
        token: 'demo-token'
      })
    }
    
    // Find customer by email or phone
    const customer = customers.find(c => {
      if (type === 'email') {
        return c.email.toLowerCase() === identifier.toLowerCase()
      } else if (type === 'phone') {
        return c.phone.replace(/\D/g, '') === identifier.replace(/\D/g, '')
      }
      return false
    })
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    // In a real app, you would generate a proper JWT token here
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
    
    // Handle demo token
    if (token === 'demo-token') {
      return NextResponse.json({
        success: true,
        customer: customers[0]
      })
    }
    
    // Extract customer ID from token (in a real app, verify JWT)
    const match = token.match(/auth-token-(\d+)-/)
    if (!match) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      )
    }
    
    const customerId = match[1]
    const customer = customers.find(c => c.id === customerId)
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
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