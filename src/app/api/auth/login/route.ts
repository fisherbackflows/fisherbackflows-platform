import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { checkRateLimit, recordAttempt, getClientIdentifier, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting';
import { loginSchema, validateInput } from '@/lib/input-validation';

export async function POST(request: NextRequest) {
  const response = NextResponse.next();
  
  try {
    // SECURITY: Rate limiting for login attempts
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(clientId, RATE_LIMIT_CONFIGS.AUTH_LOGIN);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many login attempts. Please try again later.',
          retryAfter: rateLimitResult.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '1800',
            'X-RateLimit-Limit': RATE_LIMIT_CONFIGS.AUTH_LOGIN.maxAttempts.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remainingAttempts.toString(),
          }
        }
      );
    }
    
    const body = await request.json();
    
    // SECURITY: Input validation
    const validatedInput = validateInput(loginSchema, (errors) => {
      return new Error(errors.errors.map(e => e.message).join(', '));
    })(body);
    
    const { identifier, password, type } = validatedInput;
    
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
    
    // SECURITY: Removed hardcoded admin credentials - use proper Supabase authentication
    
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
        
        email = (customer as any).email;
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
      .eq('email', email)
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
    if ((customer as any).email.includes('@fisherbackflows.com') || 
        authData.user.user_metadata?.account_type === 'admin') {
      role = 'admin';
    }
    
    const user = {
      id: (customer as any).id,
      email: (customer as any).email,
      name: (customer as any).name,
      role,
      accountNumber: (customer as any).account_number,
      phone: (customer as any).phone,
      status: (customer as any).status
    };
    
    // Set session cookies (Supabase handles this automatically)
    
    // SECURITY: Record successful login
    recordAttempt(clientId, true, RATE_LIMIT_CONFIGS.AUTH_LOGIN);
    
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user,
      redirect: role === 'admin' ? '/team-portal' : '/portal/dashboard'
    });
    
  } catch (error) {
    // SECURITY: Record failed login attempt
    const clientId = getClientIdentifier(request);
    recordAttempt(clientId, false, RATE_LIMIT_CONFIGS.AUTH_LOGIN);
    
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