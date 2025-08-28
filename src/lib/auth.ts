import { createClientComponentClient } from '@/lib/supabase'
import { User, AuthError } from '@supabase/supabase-js'

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
}

export interface AuthUser extends User {
  customer_profile?: CustomerProfile
}

// Customer Authentication
export async function signInCustomer(email: string, accountNumber: string): Promise<{ user: AuthUser | null; error: AuthError | null }> {
  try {
    const supabase = createClientComponentClient()
    
    // First, verify the customer exists with this email and account number
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .eq('account_number', accountNumber)
      .single()

    if (customerError || !customer) {
      return {
        user: null,
        error: new AuthError('Invalid email or account number', 401, 'invalid_credentials')
      }
    }

    // Create or sign in the user using Supabase Auth
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        data: {
          account_number: accountNumber,
          customer_id: customer.id,
          name: customer.name
        }
      }
    })

    if (error) {
      return { user: null, error }
    }

    // Return user with customer profile
    return {
      user: {
        ...data.user,
        customer_profile: customer
      } as AuthUser,
      error: null
    }

  } catch (error) {
    console.error('Sign in error:', error)
    return {
      user: null,
      error: new AuthError('Sign in failed', 500, 'server_error')
    }
  }
}

// Get current authenticated user
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = createClientComponentClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    const customerProfile = await getCustomerProfile(user.id)
    
    return {
      ...user,
      customer_profile: customerProfile
    } as AuthUser

  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Get customer profile from database
export async function getCustomerProfile(userId: string): Promise<CustomerProfile | null> {
  try {
    const supabase = createClientComponentClient()
    
    // First try to get from user metadata
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user?.user_metadata?.customer_id) {
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', user.user_metadata.customer_id)
        .single()

      if (!error && customer) {
        return customer as CustomerProfile
      }
    }

    // Fallback: try to find by email
    if (user?.email) {
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('email', user.email)
        .single()

      if (!error && customer) {
        return customer as CustomerProfile
      }
    }

    return null

  } catch (error) {
    console.error('Error getting customer profile:', error)
    return null
  }
}

// Sign out
export async function signOut(): Promise<{ error: AuthError | null }> {
  try {
    const supabase = createClientComponentClient()
    const { error } = await supabase.auth.signOut()
    return { error }
  } catch (error) {
    console.error('Sign out error:', error)
    return { error: new AuthError('Sign out failed', 500, 'server_error') }
  }
}

// SECURE AUTHENTICATION - Import from secure-auth module
import { 
  signInTechnician, 
  getCurrentUser as getSecureCurrentUser,
  signOut as secureSignOut,
  validateSession
} from './auth/secure-auth'

// Field Tech Authentication - SECURE VERSION
export async function signInTech(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, error } = await signInTechnician(email, password);
    
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };

  } catch (error: any) {
    console.error('Tech sign in error:', error);
    return { success: false, error: 'Sign in failed' };
  }
}

// Check if tech is authenticated - SECURE VERSION
export async function isAuthenticatedTech(): Promise<boolean> {
  try {
    const { isValid } = await validateSession();
    return isValid;
  } catch {
    return false;
  }
}

// Get current tech user - SECURE VERSION
export async function getCurrentTech() {
  try {
    const user = await getSecureCurrentUser();
    if (user?.profile && ['technician', 'admin'].includes(user.profile.role)) {
      return {
        username: user.profile.email,
        name: user.profile.name || user.profile.email,
        role: user.profile.role,
        id: user.profile.id,
        organization_id: user.profile.organization_id
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Sign out tech - SECURE VERSION
export async function signOutTech() {
  try {
    await secureSignOut();
    // Clear any legacy localStorage items
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tech_session');
    }
  } catch (error: any) {
    console.error('Tech sign out error:', error);
  }
}