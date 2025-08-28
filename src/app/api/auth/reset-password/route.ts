import { NextRequest, NextResponse } from 'next/server';
// TEMP: Disabled for clean builds
// import { hashPassword, generateToken, setAuthCookie } from '@/lib/auth';
import { resetTokens } from '../forgot-password/route';

// Mock users database (in production, use real database)
const mockUsers = [
  {
    id: '1',
    email: 'john.smith@email.com',
    phone: '5550123',
    name: 'John Smith',
    accountNumber: 'FB001',
    role: 'customer' as const
  },
  {
    id: '2',
    email: 'admin@abccorp.com',
    phone: '5550456',
    name: 'ABC Corporation',
    accountNumber: 'FB002',
    role: 'customer' as const
  }
];

export async function POST(request: NextRequest) {
  try {
    const { token, password, confirmPassword } = await request.json();
    
    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }
    
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }
    
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    
    // Find and validate reset token
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
        { error: 'Reset token has expired. Please start the reset process again.' },
        { status: 400 }
      );
    }
    
    // Find user
    const user = mockUsers.find(u => u.id === resetData.userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(password);
    
    // In production: Update user password in database
    console.log(`Password updated for user ${user.email}: ${hashedPassword}`);
    
    // Clean up reset token
    resetTokens.delete(token);
    
    // Generate new auth token and log user in
    const authToken = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });
    
    // Set authentication cookie
    await setAuthCookie(authToken);
    
    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You are now logged in.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        accountNumber: user.accountNumber
      },
      token: authToken
    });
    
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}