import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const response = NextResponse.next();
  
  try {
    const { identifier, password, type } = await request.json();
    
    if (!identifier) {
      return NextResponse.json(
        { error: 'Email or phone is required' },
        { status: 400 }
      );
    }
    
    // Handle demo login
    if (identifier === 'demo' || type === 'demo') {
      const demoUser = {
        id: 'demo',
        email: 'demo@fisherbackflows.com',
        role: 'customer' as const,
        name: 'Demo Customer',
        accountNumber: 'DEMO'
      };
      
      return NextResponse.json({
        success: true,
        message: 'Demo login successful',
        user: demoUser,
        redirect: '/portal/dashboard'
      });
    }
    
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient(request, response);
    
    // Determine if identifier is email or phone
    let email = identifier;
    
    // If it looks like a phone number, find the email first
    if (type === 'phone' || /^\d+/.test(identifier.replace(/\D/g, ''))) {
      const normalizedPhone = identifier.replace(/\D/g, '');
      
      if (normalizedPhone.length >= 10) {
        // Find customer by phone number
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('email')
          .eq('phone', identifier)
          .single();
        
        if (customerError || !customer) {
          return NextResponse.json(
            { error: 'No account found with this phone number' },
            { status: 401 }
          );
        }
        
        email = customer.email;
      }
    }
    
    // Attempt to sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError || !authData.user) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { error: 'Invalid email/phone or password' },
        { status: 401 }
      );
    }
    
    // Get customer details from database
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (customerError || !customer) {
      console.error('Customer lookup error:', customerError);
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }
    
    // Determine user role based on email domain or metadata
    let role = 'customer';
    if (customer.email.includes('@fisherbackflows.com') || 
        authData.user.user_metadata?.account_type === 'admin') {
      role = 'admin';
    }
    
    const user = {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      role,
      accountNumber: customer.account_number,
      phone: customer.phone,
      status: customer.status
    };
    
    // Set session cookies (Supabase handles this automatically)
    
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user,
      redirect: role === 'admin' ? '/team-portal' : '/portal/dashboard'
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request);
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      );
    }
    
    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (customerError || !customer) {
      // Handle demo user case
      if (session.user.email === 'demo@fisherbackflows.com') {
        return NextResponse.json({
          success: true,
          user: {
            id: 'demo',
            email: 'demo@fisherbackflows.com',
            name: 'Demo Customer',
            role: 'customer',
            accountNumber: 'DEMO'
          }
        });
      }
      
      return NextResponse.json(
        { error: 'Customer record not found' },
        { status: 404 }
      );
    }
    
    // Determine role
    let role = 'customer';
    if (customer.email.includes('@fisherbackflows.com') || 
        session.user.user_metadata?.account_type === 'admin') {
      role = 'admin';
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        role,
        accountNumber: customer.account_number,
        phone: customer.phone,
        status: customer.status
      }
    });
    
  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}