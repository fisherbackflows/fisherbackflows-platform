import 'server-only';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, recordAttempt, getClientIdentifier, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting';

interface VerifyRequest {
  phone: string;
  code: string;
}

function validateVerifyRequest(body: any): { 
  isValid: boolean; 
  data?: VerifyRequest; 
  errors?: string[] 
} {
  const errors: string[] = [];
  
  if (!body.phone?.trim()) {
    errors.push('Phone number is required');
  }
  
  if (!body.code?.trim()) {
    errors.push('Verification code is required');
  }
  
  if (body.code && !/^\d{6}$/.test(body.code.trim())) {
    errors.push('Verification code must be 6 digits');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return { 
    isValid: true, 
    data: {
      phone: body.phone.trim(),
      code: body.code.trim()
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientId = getClientIdentifier(request);
    const rateLimitCheck = checkRateLimit(clientId, 'login');
    
    if (!rateLimitCheck.allowed) {
      return NextResponse.json({
        error: 'Too many verification attempts. Please try again later.',
        retryAfter: rateLimitCheck.blockedUntil ? Math.ceil((rateLimitCheck.blockedUntil - Date.now()) / 1000) : undefined
      }, { status: 429 });
    }

    // Parse and validate request
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      recordAttempt(clientId, RATE_LIMIT_CONFIGS.AUTH_VERIFY, false);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const validation = validateVerifyRequest(body);
    if (!validation.isValid) {
      recordAttempt(clientId, RATE_LIMIT_CONFIGS.AUTH_VERIFY, false);
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.errors
      }, { status: 400 });
    }

    // Verify SMS code using file-based system
    const { verifySMSCodeFile } = await import('@/lib/sms-verification-file');
    const { formatPhoneForSMS } = await import('@/lib/sms-service');
    
    const formattedPhone = formatPhoneForSMS(validation.data!.phone);
    const result = await verifySMSCodeFile(formattedPhone, validation.data!.code, request);
    
    if (!result.success) {
      recordAttempt(clientId, RATE_LIMIT_CONFIGS.AUTH_VERIFY, false);
      return NextResponse.json({
        error: result.error,
        code: 'VERIFICATION_FAILED'
      }, { status: 400 });
    }

    // Success - also verify the auth user in Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get customer data to find auth user ID
    const { data: customer, error: customerError } = await serviceClient
      .from('customers')
      .select('auth_user_id, first_name, last_name, email, account_number, phone')
      .eq('id', result.customerId)
      .single();

    if (customerError || !customer) {
      console.error('Customer lookup failed after SMS verification:', customerError);
      return NextResponse.json({
        error: 'Account verification failed. Please contact support.',
        code: 'CUSTOMER_NOT_FOUND'
      }, { status: 500 });
    }

    // Confirm email in Supabase Auth (since we're using phone verification)
    if (customer.auth_user_id) {
      const { error: confirmError } = await serviceClient.auth.admin.updateUserById(
        customer.auth_user_id, 
        { email_confirm: true }
      );
      
      if (confirmError) {
        console.warn('Failed to confirm auth user after SMS verification:', confirmError);
      }
    }

    recordAttempt(clientId, RATE_LIMIT_CONFIGS.AUTH_VERIFY, true);

    return NextResponse.json({
      success: true,
      message: 'Phone number verified successfully! You can now sign in.',
      user: {
        id: result.customerId,
        authUserId: customer.auth_user_id,
        firstName: customer.first_name,
        lastName: customer.last_name,
        email: customer.email,
        phone: customer.phone,
        accountNumber: customer.account_number,
        status: 'active',
        phoneVerified: true
      }
    });

  } catch (error) {
    const clientId = getClientIdentifier(request);
    recordAttempt(clientId, RATE_LIMIT_CONFIGS.AUTH_VERIFY, false);
    
    console.error('SMS verification error:', error);
    return NextResponse.json({
      error: 'Verification failed due to server error',
      code: 'SERVER_ERROR'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}