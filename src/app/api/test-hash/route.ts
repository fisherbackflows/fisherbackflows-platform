import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Simple SHA-256 hash
    const salt = 'fisherbackflows2024salt';
    const data = password + salt;
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Direct database update
    const supabaseUrl = 'https://jvhbqfueutvfepsjmztx.supabase.co';
    const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY';
    
    const response = await fetch(`${supabaseUrl}/rest/v1/customers?email=eq.${encodeURIComponent(email)}`, {
      method: 'PATCH',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        password_hash: hashHex,
        account_status: 'active'
      })
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      hash: hashHex.substring(0, 20) + '...',
      message: 'Password hash updated'
    });
    
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}