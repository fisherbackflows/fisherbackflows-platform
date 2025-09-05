import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Generate minimal hash
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password + 'salt'))))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Insert minimal record 
    const response = await fetch('https://jvhbqfueutvfepsjmztx.supabase.co/rest/v1/customers', {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        email,
        password_hash: hash,
        first_name: 'Test',
        last_name: 'User',
        phone: '555-0000', 
        account_number: 'MIN' + Date.now(),
        account_status: 'active',
        // Add missing required fields
        address_line1: 'Test Address',
        city: 'Test City',
        state: 'TX',
        zip_code: '12345'
      })
    });
    
    const result = await response.text();
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      hash: hash.substring(0, 20),
      result: result.substring(0, 200)
    });
    
  } catch (error) {
    return NextResponse.json({ error: String(error) });
  }
}