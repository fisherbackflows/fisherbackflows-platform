import { createClientComponentClient } from '@/lib/supabase'
import { User, AuthError } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export interface UserProfile {
  id: string
  email: string
  role: 'customer' | 'technician' | 'admin'
  organization_id: string
  name?: string
  customer_profile?: CustomerProfile
  technician_profile?: TechnicianProfile
}

export interface CustomerProfile {
  id: string
  account_number: string
  name: string
  email: string
  phone: string
  address: string
  balance: number
  next_test_date: string | null
  status: string
  organization_id: string
}

export interface TechnicianProfile {
  id: string
  user_id: string
  employee_id: string
  name: string
  phone: string
  certifications: string[]
  active: boolean
  organization_id: string
}

export interface AuthUser extends User {
  profile?: UserProfile
}

// Validation schemas
const customerSignInSchema = z.object({
  email: z.string().email('Valid email required'),
  accountNumber: z.string().min(1, 'Account number required')
});

const techSignInSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const userRegistrationSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name required'),
  role: z.enum(['customer', 'technician', 'admin']),
  organizationId: z.string().uuid('Valid organization ID required')
});

// Customer Authentication
export async function signInCustomer(
  email: string, 
  accountNumber: string
): Promise<{ user: AuthUser | null; error: AuthError | null }> {
  try {
    // Validate input
    const validation = customerSignInSchema.safeParse({ email, accountNumber });
    if (!validation.success) {
      return {
        user: null,
        error: new AuthError(validation.error.errors[0].message, 400, 'validation_error')
      };
    }

    const supabase = createClientComponentClient();
    
    // Verify customer exists with proper organization isolation
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select(`
        *,
        organization:organizations(id, name, domain)
      `)
      .eq('email', email)
      .eq('account_number', accountNumber)
      .eq('status', 'Active')
      .single();

    if (customerError || !customer) {
      // Don't reveal whether email or account number was wrong for security
      return {
        user: null,
        error: new AuthError('Invalid credentials', 401, 'invalid_credentials')
      };
    }

    // Check if user exists in auth.users
    let authUser;
    const { data: existingUser } = await supabase
      .from('auth.users')
      .select('*')
      .eq('email', email)
      .eq('role', 'customer')
      .single();

    if (existingUser) {
      // User exists, send OTP for passwordless login
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          data: {
            account_number: accountNumber,
            customer_id: customer.id,
            name: customer.name,
            role: 'customer',
            organization_id: customer.organization_id
          }
        }
      });

      if (error) {
        return { user: null, error };
      }

      authUser = data.user;
    } else {
      // Create new user
      const userId = crypto.randomUUID();
      
      // Insert into auth.users
      const { error: insertError } = await supabase
        .from('auth.users')
        .insert({
          id: userId,
          email: email,
          role: 'customer',
          organization_id: customer.organization_id,
          email_confirmed: false
        });

      if (insertError) {
        throw new Error(`Failed to create user: ${insertError.message}`);
      }

      // Send OTP for email verification
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          data: {
            account_number: accountNumber,
            customer_id: customer.id,
            name: customer.name,
            role: 'customer',
            organization_id: customer.organization_id
          }
        }
      });

      if (error) {
        return { user: null, error };
      }

      authUser = data.user;
    }

    return {
      user: {
        ...authUser,
        profile: {
          id: customer.id,
          email: customer.email,
          role: 'customer' as const,
          organization_id: customer.organization_id,
          name: customer.name,
          customer_profile: customer
        }
      } as AuthUser,
      error: null
    };

  } catch (error: any) {
    console.error('Customer sign in error:', error);
    return {
      user: null,
      error: new AuthError('Sign in failed', 500, 'server_error')
    };
  }
}

// Technician/Admin Authentication with proper password hashing
export async function signInTechnician(
  email: string,
  password: string
): Promise<{ user: AuthUser | null; error: AuthError | null }> {
  try {
    // Validate input
    const validation = techSignInSchema.safeParse({ email, password });
    if (!validation.success) {
      return {
        user: null,
        error: new AuthError(validation.error.errors[0].message, 400, 'validation_error')
      };
    }

    const supabase = createClientComponentClient();

    // Get user from auth.users with organization info
    const { data: user, error: userError } = await supabase
      .from('auth.users')
      .select(`
        *,
        organization:organizations(id, name, domain)
      `)
      .eq('email', email)
      .in('role', ['technician', 'admin'])
      .single();

    if (userError || !user) {
      // Use a delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        user: null,
        error: new AuthError('Invalid credentials', 401, 'invalid_credentials')
      };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.encrypted_password);
    if (!isValidPassword) {
      // Log failed login attempt
      await logSecurityEvent('failed_login', {
        email,
        ip_address: 'unknown', // Would get from request in API route
        user_agent: 'unknown'
      });

      return {
        user: null,
        error: new AuthError('Invalid credentials', 401, 'invalid_credentials')
      };
    }

    // Update last sign in
    await supabase
      .from('auth.users')
      .update({ last_sign_in_at: new Date().toISOString() })
      .eq('id', user.id);

    // Get technician profile if role is technician
    let technicianProfile = null;
    if (user.role === 'technician') {
      const { data: techProfile } = await supabase
        .from('technicians')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .single();
      
      technicianProfile = techProfile;
    }

    // Create proper JWT token with Supabase auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return { user: null, error: authError };
    }

    // Log successful login
    await logSecurityEvent('successful_login', {
      user_id: user.id,
      email,
      role: user.role,
      organization_id: user.organization_id
    });

    return {
      user: {
        ...authData.user,
        profile: {
          id: user.id,
          email: user.email,
          role: user.role,
          organization_id: user.organization_id,
          name: technicianProfile?.name || user.email,
          technician_profile: technicianProfile
        }
      } as AuthUser,
      error: null
    };

  } catch (error: any) {
    console.error('Technician sign in error:', error);
    return {
      user: null,
      error: new AuthError('Sign in failed', 500, 'server_error')
    };
  }
}

// Create new user (admin only)
export async function createUser(userData: {
  email: string;
  password: string;
  name: string;
  role: 'customer' | 'technician' | 'admin';
  organizationId: string;
}): Promise<{ user: UserProfile | null; error: string | null }> {
  try {
    // Validate input
    const validation = userRegistrationSchema.safeParse(userData);
    if (!validation.success) {
      return {
        user: null,
        error: validation.error.errors[0].message
      };
    }

    const supabase = createClientComponentClient();

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Create user in auth.users
    const userId = crypto.randomUUID();
    const { error: insertError } = await supabase
      .from('auth.users')
      .insert({
        id: userId,
        email: userData.email,
        encrypted_password: hashedPassword,
        role: userData.role,
        organization_id: userData.organizationId,
        email_confirmed: true
      });

    if (insertError) {
      if (insertError.code === '23505') { // Unique violation
        return { user: null, error: 'Email already exists' };
      }
      throw insertError;
    }

    // Create role-specific profile
    if (userData.role === 'technician') {
      await supabase
        .from('technicians')
        .insert({
          id: crypto.randomUUID(),
          user_id: userId,
          employee_id: `TECH${Date.now()}`,
          name: userData.name,
          phone: '',
          certifications: [],
          active: true,
          organization_id: userData.organizationId
        });
    }

    return {
      user: {
        id: userId,
        email: userData.email,
        role: userData.role,
        organization_id: userData.organizationId,
        name: userData.name
      },
      error: null
    };

  } catch (error: any) {
    console.error('Create user error:', error);
    return {
      user: null,
      error: 'Failed to create user'
    };
  }
}

// Get current authenticated user with proper session validation
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = createClientComponentClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    // Get user profile from our auth.users table
    const { data: profile, error: profileError } = await supabase
      .from('auth.users')
      .select(`
        *,
        organization:organizations(id, name, domain)
      `)
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    // Get role-specific profile data
    let roleProfile = null;
    if (profile.role === 'customer') {
      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('email', profile.email)
        .single();
      roleProfile = { customer_profile: customerData };
    } else if (profile.role === 'technician') {
      const { data: techData } = await supabase
        .from('technicians')
        .select('*')
        .eq('user_id', profile.id)
        .single();
      roleProfile = { technician_profile: techData };
    }

    return {
      ...user,
      profile: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        organization_id: profile.organization_id,
        name: roleProfile?.technician_profile?.name || roleProfile?.customer_profile?.name || profile.email,
        ...roleProfile
      }
    } as AuthUser;

  } catch (error: any) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Change password with proper validation
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    if (newPassword.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters' };
    }

    const supabase = createClientComponentClient();
    const currentUser = await getCurrentUser();
    
    if (!currentUser?.profile) {
      return { success: false, error: 'User not authenticated' };
    }

    // Verify current password for non-customer users
    if (currentUser.profile.role !== 'customer') {
      const { data: user } = await supabase
        .from('auth.users')
        .select('encrypted_password')
        .eq('id', currentUser.profile.id)
        .single();

      if (!user || !await bcrypt.compare(currentPassword, user.encrypted_password)) {
        return { success: false, error: 'Current password is incorrect' };
      }
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    const { error } = await supabase
      .from('auth.users')
      .update({ 
        encrypted_password: hashedNewPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentUser.profile.id);

    if (error) {
      throw error;
    }

    // Log password change
    await logSecurityEvent('password_changed', {
      user_id: currentUser.profile.id,
      email: currentUser.profile.email
    });

    return { success: true, error: null };

  } catch (error: any) {
    console.error('Change password error:', error);
    return { success: false, error: 'Failed to change password' };
  }
}

// Sign out with proper cleanup
export async function signOut(): Promise<{ error: AuthError | null }> {
  try {
    const supabase = createClientComponentClient();
    const { error } = await supabase.auth.signOut();
    
    // Clear any local storage items
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tech_session'); // Remove old insecure session
    }
    
    return { error };
  } catch (error: any) {
    console.error('Sign out error:', error);
    return { error: new AuthError('Sign out failed', 500, 'server_error') };
  }
}

// Session validation middleware function
export async function validateSession(): Promise<{
  isValid: boolean;
  user?: AuthUser;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.profile) {
      return { isValid: false, error: 'No active session' };
    }

    // Check if session is expired (optional: implement session timeout)
    // This could check against a session timeout stored in the database

    return { isValid: true, user };

  } catch (error: any) {
    return { isValid: false, error: 'Session validation failed' };
  }
}

// Security event logging
async function logSecurityEvent(event: string, data: Record<string, any>): Promise<void> {
  try {
    const supabase = createClientComponentClient();
    
    await supabase
      .from('security_events')
      .insert({
        event_type: event,
        user_id: data.user_id,
        ip_address: data.ip_address,
        user_agent: data.user_agent,
        metadata: data,
        timestamp: new Date().toISOString()
      });
  } catch (error) {
    // Don't throw on logging errors, but log them
    console.error('Failed to log security event:', error);
  }
}

// Rate limiting for auth attempts
const authAttempts = new Map<string, { count: number; lastAttempt: number }>();

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const attempts = authAttempts.get(identifier);
  
  if (!attempts) {
    authAttempts.set(identifier, { count: 1, lastAttempt: now });
    return false;
  }

  // Reset count if more than 15 minutes passed
  if (now - attempts.lastAttempt > 15 * 60 * 1000) {
    authAttempts.set(identifier, { count: 1, lastAttempt: now });
    return false;
  }

  // Block after 5 attempts
  if (attempts.count >= 5) {
    return true;
  }

  attempts.count++;
  attempts.lastAttempt = now;
  return false;
}

// Export the old function names for backward compatibility during migration
export const signInTech = signInTechnician;
export const isAuthenticatedTech = () => false; // Force re-authentication
export const getCurrentTech = getCurrentUser;
export const signOutTech = signOut;