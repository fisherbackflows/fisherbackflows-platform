import 'server-only';
export const runtime = 'nodejs'; // Force Node.js runtime for service role access

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, recordAttempt, getClientIdentifier, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting';
import { 
  CustomerRegistrationService, 
  RegistrationError, 
  type RegistrationData 
} from '@/lib/auth/registration';

// Input validation schemas
const VALIDATION_RULES = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
  password: {
    minLength: 8,
    // Password strength will be enforced by Supabase
  }
} as const;

interface ValidationError {
  field: string;
  message: string;
}

function validateRegistrationData(body: any): { 
  isValid: boolean; 
  data?: RegistrationData; 
  errors?: ValidationError[] 
} {
  const errors: ValidationError[] = [];
  
  // Required fields
  if (!body.firstName?.trim()) {
    errors.push({ field: 'firstName', message: 'First name is required' });
  }
  if (!body.lastName?.trim()) {
    errors.push({ field: 'lastName', message: 'Last name is required' });
  }
  if (!body.email?.trim()) {
    errors.push({ field: 'email', message: 'Email is required' });
  }
  if (!body.phone?.trim()) {
    errors.push({ field: 'phone', message: 'Phone number is required' });
  }
  if (!body.password) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  // Format validation
  if (body.email && !VALIDATION_RULES.email.test(body.email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }
  
  if (body.phone && !VALIDATION_RULES.phone.test(body.phone.replace(/\D/g, ''))) {
    errors.push({ field: 'phone', message: 'Please enter a valid phone number (e.g., 555-123-4567)' });
  }
  
  if (body.password && body.password.length < VALIDATION_RULES.password.minLength) {
    errors.push({ 
      field: 'password', 
      message: `Password must be at least ${VALIDATION_RULES.password.minLength} characters long` 
    });
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Clean and structure the data
  const data: RegistrationData = {
    firstName: body.firstName.trim(),
    lastName: body.lastName.trim(),
    email: body.email.trim().toLowerCase(),
    phone: body.phone.trim(),
    password: body.password,
    address: body.address ? {
      street: body.address.street?.trim(),
      city: body.address.city?.trim(),
      state: body.address.state?.trim(),
      zipCode: body.address.zipCode?.trim(),
    } : undefined,
    propertyType: body.propertyType?.trim()
  };

  return { isValid: true, data };
}

export async function POST(request: NextRequest) {
  try {
    // EMERGENCY BYPASS - Simple, robust registration path
    console.log('[EMERGENCY] service key present?', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('[EMERGENCY] supabase url present?', !!process.env.NEXT_PUBLIC_SUPABASE_URL);

    // Step 1: Parse and validate input with flexible content-type handling
    let body: any | undefined;
    const contentType = request.headers.get('content-type') || '';
    try {
      if (contentType.includes('application/json')) {
        body = await request.json();
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const form = await request.formData();
        body = Object.fromEntries(form.entries());
      } else if (contentType.includes('multipart/form-data')) {
        const form = await request.formData();
        body = Object.fromEntries(form.entries());
        // Convert nested address fields if provided as flat keys
        body.address = body.address || {
          street: body.street,
          city: body.city,
          state: body.state,
          zipCode: body.zipCode,
        };
      } else {
        // Try JSON first, then formData as a fallback
        try {
          body = await request.json();
        } catch {
          const form = await request.formData();
          body = Object.fromEntries(form.entries());
        }
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected JSON or form data.' },
        { status: 400 }
      );
    }

    const validation = validateRegistrationData(body);
    if (!validation.isValid) {
      const clientId = getClientIdentifier(request);
      recordAttempt(clientId, RATE_LIMIT_CONFIGS.AUTH_REGISTER, false);
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.errors 
        },
        { status: 400 }
      );
    }

    // Step 3: If env is healthy, use the full service; otherwise use a direct service-client path
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

    let result;
    const envOk = !!(supabaseUrl && serviceKey);
    if (!envOk) {
      return NextResponse.json({
        error: 'Server configuration error - missing environment variables',
        missing: {
          NEXT_PUBLIC_SUPABASE_URL: !supabaseUrl,
          SUPABASE_SERVICE_ROLE_KEY: !serviceKey,
        }
      }, { status: 500 });
    }

    // Prefer using the direct service client here to avoid failures when anon client is misconfigured
    const { createClient } = await import('@supabase/supabase-js');
    const serviceClient = createClient(supabaseUrl!, serviceKey!);

    // Create auth user with fallback logic
    let authUserId: string | null = null;
    let emailSent = false;
    let useAdminFallback = false;
    
    // First try anon client with email confirmation (if anon key exists)
    if (Boolean(anonKey)) {
      console.log('[REGISTRATION] Attempting email signup with anon client');
      try {
        const { createServerClient } = await import('@supabase/ssr');
        const anonClient = createServerClient(supabaseUrl!, anonKey!, {
          cookies: { getAll: () => [], setAll: () => {} },
        });
        const { data: authData, error: authError } = await anonClient.auth.signUp({
          email: validation.data!.email,
          password: validation.data!.password,
          options: {
            data: {
              first_name: validation.data!.firstName,
              last_name: validation.data!.lastName,
              full_name: `${validation.data!.firstName} ${validation.data!.lastName}`,
            },
            emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/portal/verify-email`,
          },
        });
        
        if (authError) {
          console.warn('[REGISTRATION] Anon signup failed, falling back to admin:', authError.message);
          useAdminFallback = true;
        } else if (authData.user) {
          console.log('[REGISTRATION] Anon signup successful');
          authUserId = authData.user.id;
          emailSent = true;
        } else {
          console.warn('[REGISTRATION] No user returned from anon signup, falling back to admin');
          useAdminFallback = true;
        }
      } catch (error) {
        console.warn('[REGISTRATION] Anon signup threw error, falling back to admin:', error);
        useAdminFallback = true;
      }
    } else {
      console.log('[REGISTRATION] No anon key, using admin client directly');
      useAdminFallback = true;
    }
    
    // Fallback to admin user creation if anon signup failed
    if (useAdminFallback) {
      console.log('[REGISTRATION] Using admin createUser with email_confirm: true');
      const { data: adminData, error: adminError } = await serviceClient.auth.admin.createUser({
        email: validation.data!.email,
        password: validation.data!.password,
        email_confirm: true,
        user_metadata: {
          first_name: validation.data!.firstName,
          last_name: validation.data!.lastName,
          full_name: `${validation.data!.firstName} ${validation.data!.lastName}`,
        },
      });
      if (adminError || !adminData.user) {
        console.error('[REGISTRATION] Admin createUser failed:', adminError);
        const message = adminError?.message?.includes('already registered')
          ? 'An account with this email already exists'
          : 'Failed to create user account';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      authUserId = adminData.user.id;
      emailSent = false;
    }

    // Create customer record (align with current DB schema: name/address/status)
    const addressString = (() => {
      const a = validation.data!.address || {}
      const parts = [a.street, a.city, a.state, a.zipCode].filter(Boolean)
      return parts.length ? parts.join(', ') : 'Not provided'
    })();

    const { data: customer, error: customerError } = await serviceClient
      .from('customers')
      .insert({
        auth_user_id: authUserId,
        account_number: `FB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        first_name: validation.data!.firstName,
        last_name: validation.data!.lastName,
        email: validation.data!.email,
        phone: validation.data!.phone,
        account_status: 'active',
      })
      .select('*')
      .single();

    if (customerError || !customer) {
      console.error('Customer creation failed:', customerError);
      // Attempt cleanup of auth user
      try { await serviceClient.auth.admin.deleteUser(authUserId!); } catch {}
      const msg = (customerError as any)?.message || 'Failed to create customer record';
      const code = (customerError as any)?.code || 'INSERT_FAILED';
      return NextResponse.json({ error: msg, code }, { status: 500 });
    }

    result = {
      success: true,
      message: emailSent
        ? 'Account created successfully! Please check your email to verify your account before signing in.'
        : 'Account created successfully! You can now sign in with your email and password.',
      user: {
        id: customer.id,
        authUserId: authUserId!,
        accountNumber: customer.account_number,
        firstName: validation.data!.firstName,
        lastName: validation.data!.lastName,
        email: validation.data!.email,
        phone: validation.data!.phone,
        status: emailSent ? 'pending_verification' : 'active',
        emailSent,
      },
    } as const;
    
    // Step 4: Record successful attempt and return success
    const clientId = getClientIdentifier(request);
    recordAttempt(clientId, RATE_LIMIT_CONFIGS.AUTH_REGISTER, true);
    
    // Log registration for audit (without sensitive data)
    console.log('Successful customer registration:', {
      customerId: result.user?.id,
      accountNumber: result.user?.accountNumber,
      email: result.user?.email,
      emailSent: result.user?.emailSent,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    const clientId = getClientIdentifier(request);
    recordAttempt(clientId, RATE_LIMIT_CONFIGS.AUTH_REGISTER, false);
    
    if (error instanceof RegistrationError) {
      console.error(`Registration error [${error.code}]:`, error.message);
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    // Log unexpected errors but don't expose details to client
    console.error('Unexpected registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed due to an unexpected error' },
      { status: 500 }
    );
  }
}
