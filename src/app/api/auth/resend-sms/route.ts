import 'server-only';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, recordAttempt, getClientIdentifier, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting';

interface ResendRequest {
  phone: string;
}

function validateResendRequest(body: any): { 
  isValid: boolean; 
  data?: ResendRequest; 
  errors?: string[] 
} {
  const errors: string[] = [];
  
  if (!body.phone?.trim()) {
    errors.push('Phone number is required');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return { 
    isValid: true, 
    data: {
      phone: body.phone.trim()
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check (more restrictive for resend)
    const clientId = getClientIdentifier(request);
    const rateLimitCheck = await checkRateLimit(clientId, RATE_LIMIT_CONFIGS.SMS_RESEND);
    
    if (!rateLimitCheck.allowed) {
      return NextResponse.json({
        error: 'Too many resend attempts. Please wait before requesting another code.',
        retryAfter: rateLimitCheck.blockedUntil ? Math.ceil((rateLimitCheck.blockedUntil - Date.now()) / 1000) : undefined
      }, { status: 429 });
    }

    // Parse and validate request
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      recordAttempt(clientId, RATE_LIMIT_CONFIGS.SMS_RESEND, false);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const validation = validateResendRequest(body);
    if (!validation.isValid) {
      recordAttempt(clientId, RATE_LIMIT_CONFIGS.SMS_RESEND, false);
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.errors
      }, { status: 400 });
    }

    // Resend SMS code
    const { resendSMSCode } = await import('@/lib/sms-verification');
    const { sendVerificationSMS, formatPhoneForSMS } = await import('@/lib/sms-service');
    
    const formattedPhone = formatPhoneForSMS(validation.data!.phone);
    const result = await resendSMSCode(formattedPhone, request);
    
    if (!result.success) {
      recordAttempt(clientId, RATE_LIMIT_CONFIGS.SMS_RESEND, false);
      return NextResponse.json({
        error: result.error,
        code: 'RESEND_FAILED'
      }, { status: 400 });
    }

    // Send the new SMS code
    const smsResult = await sendVerificationSMS(formattedPhone, result.code!);
    
    if (!smsResult.success) {
      recordAttempt(clientId, RATE_LIMIT_CONFIGS.SMS_RESEND, false);
      return NextResponse.json({
        error: 'Failed to send SMS. Please try again later.',
        code: 'SMS_SEND_FAILED'
      }, { status: 500 });
    }

    recordAttempt(clientId, RATE_LIMIT_CONFIGS.SMS_RESEND, true);

    return NextResponse.json({
      success: true,
      message: 'New verification code sent to your phone.',
      phone: formattedPhone.replace(/(\+1)(\d{3})(\d{3})(\d{4})/, '$1 ($2) $3-$4') // Format for display
    });

  } catch (error) {
    const clientId = getClientIdentifier(request);
    recordAttempt(clientId, RATE_LIMIT_CONFIGS.SMS_RESEND, false);
    
    console.error('SMS resend error:', error);
    return NextResponse.json({
      error: 'Failed to resend code due to server error',
      code: 'SERVER_ERROR'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}