/**
 * Enhanced Customer Registration and Authentication
 * Fisher Backflows - Complete customer auth system with session management
 */

import { createClientComponentClient } from './supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export interface CustomerRegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  preferredContactMethod?: 'email' | 'phone' | 'text';
}

export async function registerCustomer(data: CustomerRegistrationData) {
  const supabase = createClientComponentClient();

  try {
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(data.password, saltRounds);

    // Create customer record
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        email: data.email,
        password_hash: passwordHash,
        first_name: data.firstName,
        last_name: data.lastName,
        company_name: data.companyName,
        phone: data.phone,
        address_line1: data.addressLine1,
        address_line2: data.addressLine2,
        city: data.city,
        state: data.state,
        zip_code: data.zipCode,
        preferred_contact_method: data.preferredContactMethod || 'email'
      })
      .select()
      .single();

    if (customerError) {
      if (customerError.code === '23505') {
        return { 
          success: false, 
          error: 'An account with this email already exists' 
        };
      }
      return { 
        success: false, 
        error: customerError.message 
      };
    }

    // Create Supabase Auth user
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          role: 'customer',
          customer_id: customer.id,
          first_name: data.firstName,
          last_name: data.lastName
        }
      }
    });

    if (authError) {
      // If auth fails, clean up the customer record
      await supabase.from('customers').delete().eq('id', customer.id);
      return { 
        success: false, 
        error: authError.message 
      };
    }

    return {
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        accountNumber: customer.account_number
      },
      authUser: authUser.user
    };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Registration failed' 
    };
  }
}

export async function getCustomerProfile(customerId: string) {
  const supabase = createClientComponentClient();

  const { data, error } = await supabase
    .from('customers')
    .select(`
      *,
      devices:devices(count),
      appointments:appointments(count)
    `)
    .eq('id', customerId)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, customer: data };
}

export async function updateCustomerProfile(customerId: string, updates: Partial<CustomerRegistrationData>) {
  const supabase = createClientComponentClient();

  const { data, error } = await supabase
    .from('customers')
    .update({
      first_name: updates.firstName,
      last_name: updates.lastName,
      company_name: updates.companyName,
      phone: updates.phone,
      address_line1: updates.addressLine1,
      address_line2: updates.addressLine2,
      city: updates.city,
      state: updates.state,
      zip_code: updates.zipCode,
      preferred_contact_method: updates.preferredContactMethod
    })
    .eq('id', customerId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, customer: data };
}

// ============================================================================
// ENHANCED SESSION MANAGEMENT
// ============================================================================

export interface CustomerSession {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  accountNumber: string;
  phone: string;
  role: 'customer';
  sessionId: string;
  expiresAt: Date;
}

export interface AuthResult {
  success: boolean;
  user?: CustomerSession;
  error?: string;
  requiresPasswordReset?: boolean;
}

// Session configuration
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const JWT_SECRET = process.env.JWT_SECRET || 'fisher-backflows-dev-secret-key-change-in-production';

/**
 * Enhanced authentication with secure session management
 */
export async function authenticateCustomer(identifier: string, password: string): Promise<AuthResult> {
  const supabase = createClientComponentClient();
  
  try {
    // Determine if identifier is email or phone
    const isEmail = identifier.includes('@');
    
    // Find customer
    let query = supabase
      .from('customers')
      .select('id, email, first_name, last_name, account_number, phone, password_hash, account_status')
      .eq('account_status', 'active');

    if (isEmail) {
      query = query.eq('email', identifier.toLowerCase());
    } else {
      // Normalize phone number for search
      const normalizedPhone = identifier.replace(/\D/g, '');
      query = query.eq('phone', normalizedPhone);
    }

    const { data: customer, error } = await query.single();

    if (error || !customer) {
      return {
        success: false,
        error: 'Invalid email/phone or password'
      };
    }

    // Verify password
    if (!(customer as any).password_hash) {
      return {
        success: false,
        error: 'Account requires password setup. Please contact us.',
        requiresPasswordReset: true
      };
    }

    const passwordMatch = await bcrypt.compare(password, (customer as any).password_hash);
    if (!passwordMatch) {
      return {
        success: false,
        error: 'Invalid email/phone or password'
      };
    }

    // Create session
    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + SESSION_DURATION);

    // Create user session object
    const userSession: CustomerSession = {
      id: (customer as any).id,
      email: (customer as any).email,
      firstName: (customer as any).first_name,
      lastName: (customer as any).last_name,
      accountNumber: (customer as any).account_number,
      phone: (customer as any).phone,
      role: 'customer',
      sessionId,
      expiresAt
    };

    return {
      success: true,
      user: userSession
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication service temporarily unavailable'
    };
  }
}

/**
 * Create secure JWT token for session
 */
export function createSessionToken(user: CustomerSession): string {
  const payload = {
    sessionId: user.sessionId,
    userId: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(user.expiresAt.getTime() / 1000)
  };

  return jwt.sign(payload, JWT_SECRET);
}

/**
 * Validate session token
 */
export function validateSessionToken(token: string): CustomerSession | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Check if token is expired
    if (decoded.exp * 1000 < Date.now()) {
      return null;
    }

    return {
      id: decoded.userId,
      email: decoded.email,
      firstName: '', // Would need to fetch from DB for complete info
      lastName: '',
      accountNumber: '',
      phone: '',
      role: decoded.role,
      sessionId: decoded.sessionId,
      expiresAt: new Date(decoded.exp * 1000)
    };
  } catch (error) {
    return null;
  }
}

/**
 * Password reset functionality
 */
export async function requestPasswordReset(identifier: string): Promise<{ success: boolean; message: string }> {
  const supabase = createClientComponentClient();
  
  try {
    // Find customer (similar logic to authentication)
    const isEmail = identifier.includes('@');
    let query = supabase
      .from('customers')
      .select('id, email, first_name')
      .eq('account_status', 'active');

    if (isEmail) {
      query = query.eq('email', identifier.toLowerCase());
    } else {
      const normalizedPhone = identifier.replace(/\D/g, '');
      query = query.eq('phone', normalizedPhone);
    }

    const { data: customer } = await query.single();

    // Always return success for security (don't reveal if customer exists)
    const message = 'If an account exists with that information, you will receive reset instructions.';

    if (customer) {
      // Generate reset token and store it
      const resetToken = generateResetToken();
      console.log(`Password reset token for ${(customer as any).email}: ${resetToken}`);
      
      // In production, send email with reset link
      // TODO: Integrate with notification service
    }

    return { success: true, message };
  } catch (error) {
    return { 
      success: false, 
      message: 'Password reset service temporarily unavailable' 
    };
  }
}

// Helper functions
function generateSessionId(): string {
  return 'cust_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function generateResetToken(): string {
  return 'reset_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}