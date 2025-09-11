import crypto from 'crypto';
import { createRouteHandlerClient } from '@/lib/supabase';
import { NextRequest } from 'next/server';

// Temporary in-memory storage for development (bypasses database table requirement)
const temporarySMSCodes = new Map<string, {
  customerId: string;
  phone: string;
  code: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}>();

// Generate a 6-digit SMS verification code
export function generateSMSCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store SMS verification code temporarily
export async function storeSMSCodeTemp(
  customerId: string, 
  phone: string, 
  code: string,
  request: NextRequest
) {
  // Code expires in 10 minutes
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);
  
  // Store in memory (temporary solution)
  temporarySMSCodes.set(phone, {
    customerId,
    phone,
    code,
    expiresAt,
    attempts: 0,
    createdAt: new Date()
  });
  
  console.log(`📱 TEMP SMS CODE STORED: Phone ${phone} → Code ${code} (expires at ${expiresAt.toLocaleTimeString()})`);
  
  return code;
}

// Verify SMS code and activate customer (temporary version)
export async function verifySMSCodeTemp(phone: string, code: string, request: NextRequest) {
  const supabase = createRouteHandlerClient(request);
  
  // Debug: Show all stored codes
  console.log('📱 DEBUG - Looking for phone:', phone);
  console.log('📱 DEBUG - Stored codes:');
  for (const [storedPhone, data] of temporarySMSCodes.entries()) {
    console.log(`  ${storedPhone}: ${data.code} (expires ${data.expiresAt.toLocaleTimeString()})`);
  }
  
  // Get verification record from memory
  const verification = temporarySMSCodes.get(phone);
  
  if (!verification) {
    return { success: false, error: 'No verification code found for this phone number' };
  }
  
  // Check if code matches
  if (verification.code !== code) {
    // Increment attempt count
    verification.attempts += 1;
    
    if (verification.attempts >= 3) {
      temporarySMSCodes.delete(phone);
      return { success: false, error: 'Too many verification attempts. Please request a new code.' };
    }
    
    return { success: false, error: 'Invalid verification code' };
  }
  
  // Check if code is expired
  if (verification.expiresAt < new Date()) {
    temporarySMSCodes.delete(phone);
    return { success: false, error: 'Verification code has expired' };
  }
  
  // Activate customer account
  const { error: updateError } = await supabase
    .from('customers')
    .update({ 
      account_status: 'active',
      phone_verified_at: new Date().toISOString()
    })
    .eq('id', verification.customerId);
    
  if (updateError) {
    console.error('Failed to activate customer:', updateError);
    return { success: false, error: 'Failed to activate account' };
  }
  
  // Delete used verification code
  temporarySMSCodes.delete(phone);
  
  console.log(`✅ CUSTOMER ACTIVATED: ${verification.customerId} with phone ${phone}`);
  
  return { 
    success: true, 
    customerId: verification.customerId,
    phone: verification.phone 
  };
}

// Resend SMS verification code (temporary version)
export async function resendSMSCodeTemp(phone: string, request: NextRequest) {
  const supabase = createRouteHandlerClient(request);
  
  // Check if there's a recent code (rate limiting)
  const existing = temporarySMSCodes.get(phone);
  if (existing) {
    const oneMinuteAgo = new Date();
    oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);
    
    if (existing.createdAt > oneMinuteAgo) {
      return { 
        success: false, 
        error: 'Please wait 1 minute before requesting a new code' 
      };
    }
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
    await storeSMSCodeTemp(customer.id, phone, newCode, request);
    return { success: true, code: newCode };
  } catch (error) {
    return { 
      success: false, 
      error: 'Failed to generate new verification code' 
    };
  }
}

// Debug function to show current codes
export function debugShowTempCodes() {
  console.log('📱 Current temporary SMS codes:');
  for (const [phone, data] of temporarySMSCodes.entries()) {
    console.log(`  ${phone}: ${data.code} (expires ${data.expiresAt.toLocaleTimeString()})`);
  }
}