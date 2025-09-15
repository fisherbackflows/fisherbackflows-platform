import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }
    
    // Hash password 
    const salt = 'fisherbackflows2024salt';
    const data = password + salt;
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log('=== FIX PASSWORD DEBUG ===');
    console.log('Email:', email);
    console.log('Hash generated:', hashHex);
    console.log('Hash length:', hashHex.length);
    
    // Update database directly
    const supabaseUrl = 'https://jvhbqfueutvfepsjmztx.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'Service configuration error' }, { status: 500 });
    }
    
    const response = await fetch(`${supabaseUrl}/rest/v1/customers?email=eq.${encodeURIComponent(email)}`, {
      method: 'PATCH', 
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        password_hash: hashHex,
        account_status: 'active'
      })
    });
    
    console.log('Update response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Update failed:', errorText);
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
    
    const result = await response.json();
    console.log('Update result:', result);
    console.log('=== FIX PASSWORD DEBUG END ===');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Password hash fixed and account activated',
      hashPreview: hashHex.substring(0, 10) + '...'
    });
    
  } catch (error) {
    console.error('Fix password error:', error);
    return NextResponse.json({ error: 'Failed to fix password' }, { status: 500 });
  }
}