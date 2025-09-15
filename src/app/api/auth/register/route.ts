import 'server-only';
export const runtime = 'nodejs'; // Force Node.js runtime for service role access

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, recordAttempt, getClientIdentifier, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting';
import {
  CustomerRegistrationService,
  RegistrationError,
  type RegistrationData
} from '@/lib/auth/registration';
import crypto from 'crypto';

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

  // Clean and structure the data with sanitization
  function sanitizeString(input: string): string {
    return input.replace(/[<>'"&]/g, '').trim();
  }

  const data: RegistrationData = {
    firstName: sanitizeString(body.firstName),
    lastName: sanitizeString(body.lastName),
    email: body.email.trim().toLowerCase(),
    phone: body.phone.replace(/\D/g, ''), // Keep only digits
    password: body.password,
    address: body.address ? {
      street: body.address.street ? sanitizeString(body.address.street) : undefined,
      city: body.address.city ? sanitizeString(body.address.city) : undefined,
      state: body.address.state ? sanitizeString(body.address.state) : undefined,
      zipCode: body.address.zipCode ? body.address.zipCode.replace(/\D/g, '') : undefined,
    } : undefined,
    propertyType: body.propertyType ? sanitizeString(body.propertyType) : undefined
  };

  return { isValid: true, data };
}

export async function POST(request: NextRequest) {
  try {
    // EMERGENCY BYPASS - Simple, robust registration path
    console.log('[EMERGENCY] service key present?', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('[EMERGENCY] supabase url present?', !!process.env.NEXT_PUBLIC_SUPABASE_URL);

    // Step 1: Parse request body - simplified for production
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      console.error('[REGISTRATION] Failed to parse JSON:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
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

    // Create auth user with email verification required
    console.log('[REGISTRATION] Creating user with email verification required');
    const { data: adminData, error: adminError } = await serviceClient.auth.admin.createUser({
      email: validation.data!.email,
      password: validation.data!.password,
      email_confirm: false, // Require email verification
      user_metadata: {
        first_name: validation.data!.firstName,
        last_name: validation.data!.lastName,
        full_name: `${validation.data!.firstName} ${validation.data!.lastName}`,
      },
    });
    
    if (adminError || !adminData.user) {
      console.error('[REGISTRATION] User creation failed:', adminError);
      const message = adminError?.message?.includes('already registered')
        ? 'An account with this email already exists'
        : 'Failed to create user account';
      return NextResponse.json({ error: message }, { status: 400 });
    }
    
    const authUserId = adminData.user.id;

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
        account_number: `FB-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        first_name: validation.data!.firstName,
        last_name: validation.data!.lastName,
        email: validation.data!.email,
        phone: validation.data!.phone,
        address_line1: validation.data!.address?.street || 'Not provided',
        city: validation.data!.address?.city || 'Not provided',
        state: validation.data!.address?.state || 'Not provided',
        zip_code: validation.data!.address?.zipCode || 'Not provided',
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

    // SMS VERIFICATION: Send SMS code to verify phone number
    let smsSent = false;
    let smsCode = '';
    
    try {
      const { generateSMSCode, storeSMSCodeFile } = await import('@/lib/sms-verification-file');
      const { sendVerificationSMS, formatPhoneForSMS, isValidPhoneNumber } = await import('@/lib/sms-service');
      
      // Format and validate phone number
      const formattedPhone = formatPhoneForSMS(validation.data!.phone);
      if (!isValidPhoneNumber(formattedPhone)) {
        return NextResponse.json({ 
          error: 'Invalid phone number format',
          code: 'INVALID_PHONE'
        }, { status: 400 });
      }
      
      // Generate SMS verification code
      smsCode = generateSMSCode();
      
      // Store SMS code in file
      await storeSMSCodeFile(customer.id, formattedPhone, smsCode, request);
      
      // Send SMS verification code
      const smsResult = await sendVerificationSMS(formattedPhone, smsCode);
      smsSent = smsResult.success;
      
      if (!smsResult.success) {
        console.warn('SMS verification failed to send:', smsResult.error);
      } else {
        console.log(`📱 SMS verification code sent to ${formattedPhone}`);
      }
      
    } catch (smsError) {
      console.error('Failed to send SMS verification:', smsError);
    }

    result = {
      success: true,
      message: smsSent 
        ? 'Account created successfully! Please check your phone for a verification code.'
        : 'Account created successfully! SMS verification could not be sent. Please contact support.',
      user: {
        id: customer.id,
        authUserId: authUserId!,
        accountNumber: customer.account_number,
        firstName: validation.data!.firstName,
        lastName: validation.data!.lastName,
        email: validation.data!.email,
        phone: validation.data!.phone,
        status: 'pending_verification',
        smsSent,
        verificationMethod: 'sms'
      },
      requiresVerification: true,
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
