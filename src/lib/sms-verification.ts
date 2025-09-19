import crypto from 'crypto';
import { createRouteHandlerClient } from '@/lib/supabase';
import { NextRequest } from 'next/server';

// Generate a 6-digit SMS verification code
export function generateSMSCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store SMS verification code in database
export async function storeSMSCode(
  customerId: string, 
  phone: string, 
  code: string,
  request: NextRequest
) {
  const supabase = createRouteHandlerClient(request);
  
  // Code expires in 10 minutes
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);
  
  // First, clean up any existing codes for this phone
  await supabase
    .from('sms_verifications')
    .delete()
    .eq('phone', phone);
  
  // Store new verification code
  const { error } = await supabase
    .from('sms_verifications')
    .insert({
      customer_id: customerId,
      phone,
      code,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
      attempts: 0
    });
    
  if (error) {
    console.error('Failed to store SMS verification code:', error);
    throw error;
  }
  
  return code;
}

// Verify SMS code and activate customer
export async function verifySMSCode(phone: string, code: string, request: NextRequest) {
  const supabase = createRouteHandlerClient(request);
  
  // Get verification record
  const { data: verification, error: fetchError } = await supabase
    .from('sms_verifications')
    .select('*')
    .eq('phone', phone)
    .eq('code', code)
    .single();
    
  if (fetchError || !verification) {
    return { success: false, error: 'Invalid verification code' };
  }
  
  // Check if code is expired
  if (new Date(verification.expires_at) < new Date()) {
    // Clean up expired code
    await supabase
      .from('sms_verifications')
      .delete()
      .eq('id', verification.id);
    return { success: false, error: 'Verification code has expired' };
  }
  
  // Check attempt limit (max 3 attempts)
  if (verification.attempts >= 3) {
    return { success: false, error: 'Too many verification attempts. Please request a new code.' };
  }
  
  // Activate customer account
  const { error: updateError } = await supabase
    .from('customers')
    .update({ 
      account_status: 'active',
      phone_verified_at: new Date().toISOString()
    })
    .eq('id', verification.customer_id);
    
  if (updateError) {
    // Increment attempt count
    await supabase
      .from('sms_verifications')
      .update({ attempts: verification.attempts + 1 })
      .eq('id', verification.id);
    return { success: false, error: 'Failed to activate account' };
  }
  
  // Delete used verification code
  await supabase
    .from('sms_verifications')
    .delete()
    .eq('id', verification.id);
  
  return { 
    success: true, 
    customerId: verification.customer_id,
    phone: verification.phone 
  };
}

// Resend SMS verification code
export async function resendSMSCode(phone: string, request: NextRequest) {
  const supabase = createRouteHandlerClient(request);
  
  // Check if there's a recent code (rate limiting)
  const oneMinuteAgo = new Date();
  oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);
  
  const { data: recentCode } = await supabase
    .from('sms_verifications')
    .select('created_at')
    .eq('phone', phone)
    .gte('created_at', oneMinuteAgo.toISOString())
    .single();
    
  if (recentCode) {
    return { 
      success: false, 
      error: 'Please wait 1 minute before requesting a new code' 
    };
  }
  
  // Get customer for this phone
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id')
    .eq('phone', phone)
    .eq('account_status', 'pending_verification')
    .single();
    
  if (customerError || !customer) {
    return { 
      success: false, 
      error: 'No pending verification found for this phone number' 
    };
  }
  
  // Generate and store new code
  const newCode = generateSMSCode();
  try {
    await storeSMSCode(customer.id, phone, newCode, request);
    return { success: true, code: newCode };
  } catch (error) {
    return { 
      success: false, 
      error: 'Failed to generate new verification code' 
    };
  }
}