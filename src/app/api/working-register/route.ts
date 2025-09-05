import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, password, address } = body;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !password) {
      return NextResponse.json({ error: 'All required fields must be provided' }, { status: 400 });
    }
    
    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }
    
    // Validate phone  
    if (!/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(phone.replace(/\D/g, ''))) {
      return NextResponse.json({ error: 'Please enter a valid phone number' }, { status: 400 });
    }
    
    // Validate password
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }
    
    // Generate hash (same as working minimal version)
    const salt = 'fisherbackflows2024salt';
    const data = password + salt;
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Generate account number
    const accountNumber = 'FB' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
    
    // Insert customer (same as working minimal version)
    const response = await fetch('https://jvhbqfueutvfepsjmztx.supabase.co/rest/v1/customers', {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        account_number: accountNumber,
        first_name: firstName,
        last_name: lastName, 
        email,
        phone,
        password_hash: hash,
        address_line1: (address && address.street) ? address.street : 'Not provided',
        city: (address && address.city) ? address.city : 'Not provided',
        state: (address && address.state) ? address.state : 'TX', 
        zip_code: (address && address.zipCode) ? address.zipCode : '00000',
        account_status: 'pending_verification'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Customer creation failed:', response.status, errorText);
      return NextResponse.json({ error: 'Failed to create customer record' }, { status: 500 });
    }
    
    const customers = await response.json();
    const customer = Array.isArray(customers) ? customers[0] : customers;
    
    return NextResponse.json({
      success: true,
      message: 'Account created successfully! Please check your email to verify your account.',
      user: {
        id: customer.id,
        accountNumber: customer.account_number,
        firstName: customer.first_name,
        lastName: customer.last_name,
        email: customer.email,
        phone: customer.phone,
        status: customer.account_status
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}