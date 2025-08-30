import { NextRequest, NextResponse } from 'next/server';
// TEMP: Disabled for clean builds
// import { generateOTP, generateSecureToken } from '@/lib/auth';

// Mock password reset storage (in production, use Redis or database)
let resetTokens: Map<string, {
  userId: string;
  email: string;
  token: string;
  otp: string;
  expires: Date;
  attempts: number;
}>;

// Mock users for development
function getMockUsers() {
  return [
  {
    id: '1',
    email: 'john.smith@email.com',
    phone: '5550123',
    name: 'John Smith',
    accountNumber: 'FB001'
  },
  {
    id: '2',
    email: 'admin@abccorp.com',
    phone: '5550456',
    name: 'ABC Corporation',
    accountNumber: 'FB002'
  }
  ];
}

function getResetTokens() {
  if (!resetTokens) {
    resetTokens = new Map();
  }
  return resetTokens;
}

export async function POST(request: NextRequest) {
  try {
    const { identifier, type } = await request.json();
    
    if (!identifier || !type) {
      return NextResponse.json(
        { error: 'Email or phone number is required' },
        { status: 400 }
      );
    }
    
    // Find user by email or phone
    let user;
    if (type === 'email') {
      user = getMockUsers().find(u => u.email.toLowerCase() === identifier.toLowerCase());
    } else if (type === 'phone') {
      const normalizedPhone = identifier.replace(/\D/g, '');
      user = getMockUsers().find(u => u.phone.replace(/\D/g, '') === normalizedPhone);
    }
    
    if (!user) {
      // Don't reveal if user exists - always return success for security
      return NextResponse.json({
        success: true,
        message: 'If an account exists with that information, you will receive reset instructions.'
      });
    }
    
    // Generate reset token and OTP
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    // Store reset request
    getResetTokens().set(resetToken, {
      userId: user.id,
      email: user.email,
      token: resetToken,
      otp,
      expires,
      attempts: 0
    });
    
    // In production, send email/SMS here
    console.log(`Password reset for ${user.email}:`);
    console.log(`OTP: ${otp}`);
    console.log(`Reset token: ${resetToken}`);
    console.log(`Expires: ${expires}`);
    
    // For demo purposes, return the OTP (remove in production)
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return NextResponse.json({
      success: true,
      message: 'Reset instructions have been sent to your email/phone.',
      ...(isDevelopment && { 
        debug: { 
          otp, 
          resetToken,
          expires: expires.toISOString() 
        } 
      })
    });
    
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to process reset request' },
      { status: 500 }
    );
  }
}

// Cleanup expired tokens periodically
function cleanupExpiredTokens() {
  const now = new Date();
  for (const [token, data] of getResetTokens().entries()) {
    if (data.expires < now) {
      getResetTokens().delete(token);
    }
  }
}

// Export resetTokens for other auth routes
export { resetTokens }