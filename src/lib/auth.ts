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

// Field Tech Authentication
export async function signInTech(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Simple tech authentication - in production use proper auth
    const validTechs = {
      'mike': 'fisher123',
      'tech1': 'backflow2024',
      'admin': 'admin123'
    }

    if (validTechs[username as keyof typeof validTechs] !== password) {
      return { success: false, error: 'Invalid technician credentials' }
    }

    // Store tech session in localStorage for now
    localStorage.setItem('tech_session', JSON.stringify({
      username,
      name: username === 'mike' ? 'Mike Fisher' : `Tech ${username}`,
      role: 'technician',
      login_time: new Date().toISOString()
    }))

    return { success: true }

  } catch (error) {
    console.error('Tech sign in error:', error)
    return { success: false, error: 'Sign in failed' }
  }
}

// Check if tech is authenticated
export function isAuthenticatedTech(): boolean {
  try {
    if (typeof window === 'undefined') return false
    const session = localStorage.getItem('tech_session')
    return !!session
  } catch {
    return false
  }
}

// Get current tech user
export function getCurrentTech() {
  try {
    if (typeof window === 'undefined') return null
    const session = localStorage.getItem('tech_session')
    return session ? JSON.parse(session) : null
  } catch {
    return null
  }
}

// Sign out tech
export function signOutTech() {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tech_session')
    }
  } catch (error) {
    console.error('Tech sign out error:', error)
  }
}