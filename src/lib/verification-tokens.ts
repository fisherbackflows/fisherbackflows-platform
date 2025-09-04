import crypto from 'crypto';
import { createRouteHandlerClient } from '@/lib/supabase';
import { NextRequest } from 'next/server';

// Generate a secure verification token
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Store verification token in database
export async function storeVerificationToken(
  userId: string, 
  email: string, 
  token: string,
  request: NextRequest
) {
  const supabase = createRouteHandlerClient(request);
  
  // Store token with expiration (24 hours)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  
  const { error } = await supabase
    .from('email_verifications')
    .upsert({
      user_id: userId,
      email,
      token,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString()
    });
    
  if (error) {
    console.error('Failed to store verification token:', error);
    throw error;
  }
  
  return token;
}

// Verify token and mark email as verified
export async function verifyEmailToken(token: string, request: NextRequest) {
  const supabase = createRouteHandlerClient(request);
  
  // Get token from database
  const { data: verification, error: fetchError } = await supabase
    .from('email_verifications')
    .select('*')
    .eq('token', token)
    .single();
    
  if (fetchError || !verification) {
    return { success: false, error: 'Invalid or expired verification token' };
  }
  
  // Check if token is expired
  if (new Date(verification.expires_at) < new Date()) {
    return { success: false, error: 'Verification token has expired' };
  }
  
  // Mark customer as verified
  const { error: updateError } = await supabase
    .from('customers')
    .update({ 
      account_status: 'active',
      email_verified_at: new Date().toISOString()
    })
    .eq('id', verification.user_id);
    
  if (updateError) {
    return { success: false, error: 'Failed to update account status' };
  }
  
  // Delete used token
  await supabase
    .from('email_verifications')
    .delete()
    .eq('token', token);
  
  return { 
    success: true, 
    userId: verification.user_id,
    email: verification.email 
  };
}