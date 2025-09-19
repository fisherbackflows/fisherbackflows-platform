import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, appointmentId, items, amount, description } = body;

    // Use either the new format (customerId, items) or legacy format (amount, description)
    let totalAmount = amount;
    const customerIdToUse = customerId;
    let paymentDescription = description || 'Fisher Backflows Payment';

    if (items && Array.isArray(items)) {
      totalAmount = items.reduce((sum: number, item: any) => 
        sum + (item.amount * item.quantity), 0);
      paymentDescription = items.map((item: any) => item.name).join(', ');
    }

    if (!totalAmount) {
      return NextResponse.json(
        { error: 'Missing amount or items' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient(request);

    // If we have a customerId, get customer details
    let customer = null;
    if (customerIdToUse) {
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerIdToUse)
        .single();

      if (!customerError && customerData) {
        customer = customerData;
      }
    }

    // First create a mock invoice (required for payments table)
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: `TEST-${Date.now()}`,
        customer_id: customerIdToUse,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        subtotal: totalAmount / 100,
        total_amount: totalAmount / 100,
        balance_due: 0, // Will be 0 since payment is immediate
        status: 'paid'
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('Invoice creation error:', invoiceError);
      return NextResponse.json(
        { error: 'Failed to create invoice record' },
        { status: 500 }
      );
    }

    // Now create the payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        customer_id: customerIdToUse,
        invoice_id: invoice.id,
        amount: (totalAmount / 100), // Convert from cents to dollars
        payment_method: 'test_card',
        status: 'completed',
        transaction_id: `test_payment_${Date.now()}`,
        payment_date: new Date().toISOString(),
        notes: `Test payment for: ${paymentDescription}`
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment creation error:', paymentError);
      return NextResponse.json(
        { error: 'Failed to create payment record' },
        { status: 500 }
      );
    }

    // Update appointment status if provided
    if (appointmentId) {
      await supabase
        .from('appointments')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);
    }

    // Return success with mock checkout session URL
    return NextResponse.json({
      success: true,
      checkoutUrl: `http://localhost:3010/portal/payment-success?session_id=test_session_${Date.now()}&payment_id=${payment.id}`,
      paymentId: payment.id,
      sessionId: `test_session_${Date.now()}`,
      amount: totalAmount,
      currency: 'usd',
      message: 'Mock payment processed successfully - in production this would redirect to Stripe Checkout'
    });

  } catch (error: any) {
    console.error('Test checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Test checkout failed' },
      { status: 500 }
    );
  }
}