import fs from 'fs';
import path from 'path';
import { createRouteHandlerClient } from '@/lib/supabase';
import { NextRequest } from 'next/server';

// File-based storage for SMS codes (temporary solution)
const SMS_CODES_FILE = path.join(process.cwd(), '.sms-codes.json');

interface StoredSMSCode {
  customerId: string;
  phone: string;
  code: string;
  expiresAt: string;
  attempts: number;
  createdAt: string;
}

// Read SMS codes from file
function readSMSCodes(): Record<string, StoredSMSCode> {
  try {
    if (!fs.existsSync(SMS_CODES_FILE)) {
      return {};
    }
    const data = fs.readFileSync(SMS_CODES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.warn('Failed to read SMS codes file:', error);
    return {};
  }
}

// Write SMS codes to file
function writeSMSCodes(codes: Record<string, StoredSMSCode>) {
  try {
    fs.writeFileSync(SMS_CODES_FILE, JSON.stringify(codes, null, 2));
  } catch (error) {
    console.error('Failed to write SMS codes file:', error);
  }
}

// Generate a 6-digit SMS verification code
export function generateSMSCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store SMS verification code in file
export async function storeSMSCodeFile(
  customerId: string, 
  phone: string, 
  code: string,
  request: NextRequest
) {
  // Code expires in 10 minutes
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);
  
  // Read existing codes
  const codes = readSMSCodes();
  
  // Store new code
  codes[phone] = {
    customerId,
    phone,
    code,
    expiresAt: expiresAt.toISOString(),
    attempts: 0,
    createdAt: new Date().toISOString()
  };
  
  // Write back to file
  writeSMSCodes(codes);
  
  console.log(`📱 FILE SMS CODE STORED: Phone ${phone} → Code ${code} (expires at ${expiresAt.toLocaleTimeString()})`);
  
  return code;
}

// Verify SMS code and activate customer (file-based version)
export async function verifySMSCodeFile(phone: string, code: string, request: NextRequest) {
  const supabase = createRouteHandlerClient(request);
  
  // Read codes from file
  const codes = readSMSCodes();
  
  console.log(`📱 DEBUG FILE v3 FIXED - Looking for phone: ${phone}`);
  console.log('📱 DEBUG FILE v3 FIXED - Stored codes:');
  for (const [storedPhone, data] of Object.entries(codes)) {
    console.log(`  FILE FIXED: ${storedPhone}: ${data.code} (expires ${new Date(data.expiresAt).toLocaleTimeString()})`);
  }
  
  const verification = codes[phone];
  
  if (!verification) {
    return { success: false, error: 'No verification code found for this phone number' };
  }
  
  // Check if code matches
  if (verification.code !== code) {
    // Increment attempt count
    verification.attempts += 1;
    
    if (verification.attempts >= 3) {
      delete codes[phone];
      writeSMSCodes(codes);
      return { success: false, error: 'Too many verification attempts. Please request a new code.' };
    }
    
    writeSMSCodes(codes);
    return { success: false, error: 'Invalid verification code' };
  }
  
  // Check if code is expired
  if (new Date(verification.expiresAt) < new Date()) {
    delete codes[phone];
    writeSMSCodes(codes);
    return { success: false, error: 'Verification code has expired' };
  }
  
  // Activate customer account - FIXED VERSION
  const { data: updateData, error: updateError } = await supabase
    .from('customers')
    .update({ 
      account_status: 'active'
      // Note: phone_verified_at column doesn't exist in customers table
    })
    .eq('id', verification.customerId)
    .select();
    
  if (updateError) {
    console.error('❌ FAILED to activate customer:', updateError);
    return { success: false, error: 'Failed to activate account' };
  }
  
  console.log('✅ Customer account status updated successfully:', updateData);
  
  // Delete used verification code
  delete codes[phone];
  writeSMSCodes(codes);
  
  console.log(`🎉 CUSTOMER ACTIVATED SUCCESSFULLY: ${verification.customerId} with phone ${phone}`);
  
  return { 
    success: true, 
    customerId: verification.customerId,
    phone: verification.phone 
  };
}

// Resend SMS verification code (file-based version)
export async function resendSMSCodeFile(phone: string, request: NextRequest) {
  const supabase = createRouteHandlerClient(request);
  
  // Read codes from file
  const codes = readSMSCodes();
  const existing = codes[phone];
  
  if (existing) {
    const oneMinuteAgo = new Date();
    oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);
    
    if (new Date(existing.createdAt) > oneMinuteAgo) {
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
    await storeSMSCodeFile(customer.id, phone, newCode, request);
    return { success: true, code: newCode };
  } catch (error) {
    return { 
      success: false, 
      error: 'Failed to generate new verification code' 
    };
  }
}