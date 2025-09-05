import { NextRequest, NextResponse } from 'next/server';
// Removed verifyPassword import - using inline SHA-256 verification

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
    
    // Verify password using same SHA-256 method as registration
    let isPasswordValid = false;
    
    if (!customer.password_hash) {
      console.error('No password hash for customer:', email);
      isPasswordValid = false;
    } else {
      try {
        // Generate hash of input password using same method as registration
        const salt = 'fisherbackflows2024salt';
        const data = password + salt;
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const inputHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        // Compare with stored hash
        isPasswordValid = inputHash === customer.password_hash;
      } catch (hashError) {
        console.error('Password hashing failed during verification:', hashError);
        isPasswordValid = false;
      }
    }
    
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