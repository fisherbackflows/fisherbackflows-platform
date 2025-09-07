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
    // EMERGENCY BYPASS - Simple registration that works
    console.log('[EMERGENCY] service key present?', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('[EMERGENCY] supabase url present?', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        error: 'Server configuration error - missing environment variables',
        debug: {
          url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      }, { status: 500 });
    }
    
    // Skip rate limiting for emergency diagnosis
    console.log('[EMERGENCY] Bypassing rate limiting');
    
    // Step 2: Parse and validate input
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const validation = validateRegistrationData(body);
    if (!validation.isValid) {
      recordAttempt(clientId, RATE_LIMIT_CONFIGS.AUTH_REGISTER, false);
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.errors 
        },
        { status: 400 }
      );
    }

    // Step 3: Process registration
    const registrationService = new CustomerRegistrationService(request);
    const result = await registrationService.register(validation.data!);
    
    // Step 4: Record successful attempt and return success
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