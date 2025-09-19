import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { createRouteHandlerClient } from '@/lib/supabase';

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
    
    const supabase = createRouteHandlerClient(request);
    
    // Use Supabase auth to verify and reset password with token
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'recovery'
    });
    
    if (error || !data.user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }
    
    // Update password using Supabase auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    });
    
    if (updateError) {
      console.error('Password update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }
    
    // Get user profile from database
    const { data: userProfile, error: profileError } = await supabase
      .from('auth_users')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    if (profileError) {
      console.error('Profile fetch error:', profileError);
      // Continue with basic user data from auth
    }
    
    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You are now logged in.',
      user: {
        id: data.user.id,
        email: data.user.email,
        name: userProfile?.name || data.user.user_metadata?.name || 'User',
        role: userProfile?.role || 'customer'
      }
    });
    
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}