import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import type { Invoice as DatabaseInvoice } from '@/types/api';

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

// Service pricing structure
const SERVICE_RATES = {
  'Annual Test': {
    '1/2"': 65,
    '3/4"': 75,
    '1"': 100,
    '1.5"': 125,
    '2"': 150
  },
  'Repair & Retest': {
    'base': 50, // Plus parts and labor
    'retest': 35
  },
  'Installation': {
    'base': 200, // Plus device cost
    'permit': 50
  }
};

// Auto-generate invoices for completed tests
async function createAutoInvoice(customerId: string, serviceType: string, deviceSize: string, notes?: string) {
  try {
    const supabase = createRouteHandlerClient(new Request('http://localhost'));
    
    // Get customer info
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      throw new Error('Customer not found');
    }

    // Calculate pricing
    const services = [];
    let totalAmount = 0;

    if (serviceType === 'Annual Test') {
      const rate = SERVICE_RATES['Annual Test'][deviceSize as keyof typeof SERVICE_RATES['Annual Test']] || 75;
      services.push({
        description: `Annual Backflow Test - ${deviceSize} Device`,
        quantity: 1,
        rate,
        total: rate
      });
      totalAmount = rate;
    }

    // Generate invoice number
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true });
    
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(3, '0')}`;

    // Create invoice
    const invoiceData = {
      customer_id: customerId,
      invoice_number: invoiceNumber,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: totalAmount,
      status: 'Pending' as const,
      services: services,
      notes: notes || `Automated invoice for ${serviceType}`
    };

    const { data: newInvoice, error } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return newInvoice;
  } catch (error) {
    console.error('Error creating auto invoice:', error);
    return null;
  }
}

// Mock invoice data for fallback
const mockInvoices: Invoice[] = [
  {
    id: '1',
    customerId: '1',
    customerName: 'John Smith',
    invoiceNumber: 'INV-2025-001',
    issueDate: '2025-01-15',
    dueDate: '2025-02-15',
    amount: 75,
    status: 'Pending',
    services: [
      {
        description: 'Annual Backflow Test - 3/4" Device',
        quantity: 1,
        rate: 75,
        total: 75
      }
    ],
    notes: 'Automated invoice for Annual Test'
  }
]

export async function GET(request: NextRequest) {
  try {
    console.log('Invoices API v3.0 - Using real database data');
    
    const { createRouteHandlerClient } = require('@/lib/supabase');
    const { auth } = require('@/lib/auth');
    
    // Check authentication
    const user = await auth.getApiUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');
    
    const supabase = createRouteHandlerClient(request);
    
    // Build query
    let query = supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(
          first_name,
          last_name,
          email
        )
      `);
    
    // Apply filters
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }
    if (status && status !== 'All') {
      query = query.eq('status', status.toLowerCase());
    }
    
    const { data: invoices, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch invoices' },
        { status: 500 }
      );
    }
    
    // Transform data to match frontend expectations
    const transformedInvoices = (invoices || []).map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      customerId: invoice.customer_id,
      customerName: invoice.customer ? 
        `${invoice.customer.first_name} ${invoice.customer.last_name}` : 
        'Unknown Customer',
      customerEmail: invoice.customer?.email || '',
      issueDate: invoice.invoice_date,
      dueDate: invoice.due_date,
      amount: invoice.subtotal || 0,
      tax: invoice.tax_amount || 0,
      total: invoice.total_amount || 0,
      status: invoice.status,
      services: [], // Could be populated from line items if needed
      notes: invoice.notes
    }));
    
    return NextResponse.json({
      success: true,
      message: 'Real database data loaded successfully',
      invoices: transformedInvoices
    });
    
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
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
    const amount = data.services.reduce((total: number, service: { total: number }) => 
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

// Export createAutoInvoice for use in other routes
export { createAutoInvoice }