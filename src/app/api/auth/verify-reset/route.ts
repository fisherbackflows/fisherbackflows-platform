import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Simple in-memory token store for demo (use Redis in production)
const resetTokens = new Map<string, { otp: string; email: string; expiresAt: number }>();

export async function POST(request: NextRequest) {
  try {
    const { token, otp } = await request.json();
    
    if (!token || !otp) {
      return NextResponse.json(
        { error: 'Token and OTP are required' },
        { status: 400 }
      );
    }
    
    // Find reset request
    const resetData = resetTokens.get(token);
    
    if (!resetData) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }
    
    // Check if expired
    if (new Date() > resetData.expires) {
      resetTokens.delete(token);
      return NextResponse.json(
        { error: 'Reset token has expired. Please request a new one.' },
        { status: 400 }
      );
    }
    
    // Check attempts
    if (resetData.attempts >= 5) {
      resetTokens.delete(token);
      return NextResponse.json(
        { error: 'Too many failed attempts. Please request a new reset.' },
        { status: 429 }
      );
    }
    
    // Verify OTP
    if (resetData.otp !== otp) {
      resetData.attempts += 1;
      return NextResponse.json(
        { error: `Invalid OTP. ${5 - resetData.attempts} attempts remaining.` },
        { status: 400 }
      );
    }
    
    // OTP verified successfully
    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully. You can now set a new password.',
      userId: resetData.userId,
      email: resetData.email
    });
    
  } catch (error) {
    console.error('Reset verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify reset code' },
      { status: 500 }
    );
  }
}