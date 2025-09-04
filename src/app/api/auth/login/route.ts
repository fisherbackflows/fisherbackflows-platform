import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }
    
    // Direct Supabase API calls
    const supabaseUrl = 'https://jvhbqfueutvfepsjmztx.supabase.co';
    const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY';
    
    // Get customer record with password hash
    const customerResponse = await fetch(`${supabaseUrl}/rest/v1/customers?email=eq.${encodeURIComponent(email)}&select=*`, {
      method: 'GET',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!customerResponse.ok) {
      return NextResponse.json({ error: 'Customer lookup failed' }, { status: 500 });
    }
    
    const customers = await customerResponse.json();
    
    if (!customers || customers.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    const customer = customers[0];
    
    // Verify password against hash stored in database
    const isPasswordValid = await verifyPassword(password, customer.password_hash);
    
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    if (customer.account_status !== 'active') {
      return NextResponse.json({ error: 'Account not verified' }, { status: 403 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: customer.id,
        email: customer.email,
        name: `${customer.first_name} ${customer.last_name}`,
        accountNumber: customer.account_number,
        phone: customer.phone,
        role: 'customer',
        status: customer.account_status
      },
      redirect: '/'
    });
    
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json({ 
      error: 'Authentication failed. Please try again.',
      debug: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}