import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { auth } from '@/lib/auth'

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

    // Fetch invoice with customer details and line items
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          phone,
          address_line1,
          address_line2,
          city,
          state,
          zip_code
        ),
        invoice_line_items(
          id,
          description,
          quantity,
          unit_price,
          total_price,
          item_type,
          sort_order
        )
      `)
      .eq('id', id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Transform data to match frontend expectations
    const transformedInvoice = {
      id: invoice.id,
      number: invoice.invoice_number,
      customerId: invoice.customer_id,
      customerName: invoice.customer ? 
        `${invoice.customer.first_name} ${invoice.customer.last_name}` : 
        'Unknown Customer',
      customerEmail: invoice.customer?.email || '',
      customerAddress: invoice.customer ? 
        `${invoice.customer.address_line1}${invoice.customer.address_line2 ? '\n' + invoice.customer.address_line2 : ''}\n${invoice.customer.city}, ${invoice.customer.state} ${invoice.customer.zip_code}` :
        '',
      date: invoice.invoice_date,
      dueDate: invoice.due_date,
      status: invoice.status,
      items: invoice.invoice_line_items?.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.unit_price,
        amount: item.total_price
      })) || [],
      subtotal: invoice.subtotal,
      tax: invoice.tax_amount,
      total: invoice.total_amount,
      notes: invoice.notes,
      created_at: invoice.created_at,
      updated_at: invoice.updated_at
    }
    
    return NextResponse.json(transformedInvoice)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await auth.getApiUser(request)
    if (!user || !['admin', 'technician'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = createRouteHandlerClient(request);

    // Update invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .update({
        invoice_date: body.date,
        due_date: body.dueDate,
        subtotal: body.subtotal,
        tax_amount: body.tax,
        total_amount: body.total,
        status: body.status,
        notes: body.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update invoice' },
        { status: 500 }
      )
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await auth.getApiUser(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params;
    const supabase = createRouteHandlerClient(request);

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to delete invoice' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Invoice deleted successfully' })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}