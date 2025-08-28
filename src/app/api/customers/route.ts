import { NextRequest, NextResponse } from 'next/server'
// Note: Using mock data until customer tables are created in database
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
    
    // Use mock data for now (customers table not yet created in database)
    // TODO: Create customers table in database and connect to real data
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
    
    // Use mock data for now (customers table not yet created in database)
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
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}