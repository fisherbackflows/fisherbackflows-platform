import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkRateLimit, recordAttempt, getClientIdentifier, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting';
import { adminBypassSchema, validateInput } from '@/lib/input-validation';

// SECURITY: Admin bypass code must be provided via environment; no default
const ADMIN_BYPASS_CODE = process.env.ADMIN_BYPASS_CODE;

export async function POST(request: NextRequest) {
  try {
    // Block if not configured
    if (!ADMIN_BYPASS_CODE) {
      return NextResponse.json(
        { error: 'Admin bypass not configured' },
        { status: 503 }
      );
    }
    // SECURITY: Rate limiting for admin bypass attempts
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(clientId, 'ADMIN_BYPASS');
    
    if (!rateLimitResult.allowed) {
      const retryAfterSeconds = rateLimitResult.blockedUntil
        ? Math.ceil((rateLimitResult.blockedUntil - Date.now()) / 1000)
        : 86400;

      return NextResponse.json(
        {
          error: 'Too many bypass attempts. Access temporarily blocked.',
          retryAfter: retryAfterSeconds
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfterSeconds.toString(),
          }
        }
      );
    }
    
    const body = await request.json();
    
    // SECURITY: Input validation
    try {
      const validatedInput = validateInput(adminBypassSchema)(body);
      const { code } = validatedInput;
    } catch (error) {
      recordAttempt(clientId, 'ADMIN_BYPASS', false);
      return NextResponse.json(
        { error: 'Invalid input format' },
        { status: 400 }
      );
    }
    
    const { code } = validateInput(adminBypassSchema)(body);

    // Verify the bypass code
    if (code !== ADMIN_BYPASS_CODE) {
      // SECURITY: Record failed bypass attempt
      recordAttempt(clientId, 'ADMIN_BYPASS', false);
      
      return NextResponse.json(
        { error: 'Invalid access code' },
        { status: 401 }
      );
    }
    
    // SECURITY: Record successful bypass
    recordAttempt(clientId, 'ADMIN_BYPASS', true);

    // Set admin bypass cookie
    const cookieStore = await cookies();
    cookieStore.set('admin-bypass', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    return NextResponse.json({
      success: true,
      message: 'Admin access granted'
    });

  } catch (error) {
    console.error('Admin bypass error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
