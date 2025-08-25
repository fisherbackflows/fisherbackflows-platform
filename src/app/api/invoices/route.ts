import { NextRequest, NextResponse } from 'next/server'

export interface Invoice {
  id: string
  customerId: string
  customerName: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  amount: number
  status: 'Pending' | 'Paid' | 'Overdue' | 'Cancelled'
  services: Array<{
    description: string
    quantity: number
    rate: number
    total: number
  }>
  notes?: string
  paidDate?: string
}

// Mock invoice data
const invoices: Invoice[] = [
  {
    id: '1',
    customerId: '2',
    customerName: 'ABC Corporation',
    invoiceNumber: 'INV-2024-001',
    issueDate: '2024-03-20',
    dueDate: '2024-04-20',
    amount: 150,
    status: 'Pending',
    services: [
      {
        description: 'Annual Backflow Test - 1" Device',
        quantity: 1,
        rate: 150,
        total: 150
      }
    ],
    notes: 'Device failed initial test, requires repair'
  },
  {
    id: '2',
    customerId: '1',
    customerName: 'John Smith',
    invoiceNumber: 'INV-2024-002',
    issueDate: '2024-01-15',
    dueDate: '2024-02-15',
    amount: 75,
    status: 'Paid',
    services: [
      {
        description: 'Annual Backflow Test - 3/4" Device',
        quantity: 1,
        rate: 75,
        total: 75
      }
    ],
    paidDate: '2024-01-18'
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status')
    
    let filteredInvoices = invoices
    
    // Filter by customer ID
    if (customerId) {
      filteredInvoices = filteredInvoices.filter(invoice =>
        invoice.customerId === customerId
      )
    }
    
    // Filter by status
    if (status && status !== 'All') {
      filteredInvoices = filteredInvoices.filter(invoice =>
        invoice.status === status
      )
    }
    
    return NextResponse.json(filteredInvoices)
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Validate required fields
    if (!data.customerId || !data.services || !Array.isArray(data.services)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Calculate total amount
    const amount = data.services.reduce((total: number, service: any) => 
      total + service.total, 0
    )
    
    // Generate invoice number
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`
    
    // Create new invoice
    const newInvoice: Invoice = {
      id: String(invoices.length + 1),
      invoiceNumber,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      amount,
      status: 'Pending',
      ...data
    }
    
    invoices.push(newInvoice)
    
    return NextResponse.json(newInvoice, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}