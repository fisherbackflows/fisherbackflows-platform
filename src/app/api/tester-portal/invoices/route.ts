import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

async function checkPermissions(request: NextRequest) {
  const cookies = request.cookies;
  const teamSession = cookies.get('team_session')?.value;
  
  if (!teamSession) {
    return { hasAccess: false, isOwner: false, user: null };
  }
  
  try {
    const { data: session } = await supabaseAdmin
      .from('team_sessions')
      .select(`
        team_user_id,
        expires_at,
        team_users (
          id, email, role, is_active
        )
      `)
      .eq('session_token', teamSession)
      .gt('expires_at', new Date().toISOString())
      .single();
      
    if (!session?.team_users) {
      return { hasAccess: false, isOwner: false, user: null };
    }
    
    const user = session.team_users as any;
    const isOwner = user.email === 'blake@fisherbackflows.com' || user.role === 'admin';
    
    return { hasAccess: true, isOwner, user };
  } catch (error) {
    return { hasAccess: false, isOwner: false, user: null };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { hasAccess, user } = await checkPermissions(request);
    
    if (!hasAccess) {
      return NextResponse.json({ 
        success: false,
        error: 'Access denied - requires billing subscription' 
      }, { status: 403 });
    }
    
    // Get invoices from database
    const { data: invoices, error } = await supabaseAdmin
      .from('invoices')
      .select(`
        id,
        customer_id,
        invoice_number,
        amount,
        status,
        due_date,
        issued_date,
        payment_date,
        description,
        line_items,
        payment_method,
        payment_reference,
        notes,
        customers (
          id,
          name,
          email,
          phone,
          address,
          city
        )
      `)
      .order('issued_date', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch invoices'
      }, { status: 500 });
    }

    // Transform data to match frontend interface
    const transformedInvoices = (invoices || []).map(inv => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      customerId: inv.customer_id,
      customerName: inv.customers?.name || 'Unknown Customer',
      customerEmail: inv.customers?.email || '',
      amount: inv.amount || 0,
      status: inv.status || 'draft',
      dueDate: inv.due_date,
      issuedDate: inv.issued_date,
      paymentDate: inv.payment_date,
      description: inv.description || '',
      lineItems: inv.line_items || [],
      paymentMethod: inv.payment_method || '',
      paymentReference: inv.payment_reference || '',
      notes: inv.notes || ''
    }));
    
    return NextResponse.json({
      success: true,
      invoices: transformedInvoices
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { hasAccess, user } = await checkPermissions(request);
    
    if (!hasAccess) {
      return NextResponse.json({ 
        success: false,
        error: 'Access denied - requires billing subscription' 
      }, { status: 403 });
    }
    
    const body = await request.json();
    const {
      customer_id,
      amount,
      due_date,
      description,
      line_items,
      notes
    } = body;
    
    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;
    
    // Create new invoice
    const { data: invoice, error } = await supabaseAdmin
      .from('invoices')
      .insert({
        customer_id,
        invoice_number: invoiceNumber,
        amount,
        status: 'draft',
        due_date,
        issued_date: new Date().toISOString(),
        description: description || '',
        line_items: line_items || [],
        notes: notes || '',
        created_by: user?.id
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to create invoice'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      invoice,
      message: 'Invoice created successfully'
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { hasAccess, user } = await checkPermissions(request);
    
    if (!hasAccess) {
      return NextResponse.json({ 
        success: false,
        error: 'Access denied - requires billing subscription' 
      }, { status: 403 });
    }
    
    const body = await request.json();
    const { id, status, payment_method, payment_reference, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Invoice ID required'
      }, { status: 400 });
    }
    
    // Update invoice with payment info if status is paid
    const updatePayload: any = {
      ...updateData,
      ...(status && { status }),
      updated_at: new Date().toISOString()
    };
    
    if (status === 'paid') {
      updatePayload.payment_date = new Date().toISOString();
      if (payment_method) updatePayload.payment_method = payment_method;
      if (payment_reference) updatePayload.payment_reference = payment_reference;
    }
    
    // Update invoice
    const { data: invoice, error } = await supabaseAdmin
      .from('invoices')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to update invoice'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      invoice,
      message: 'Invoice updated successfully'
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
