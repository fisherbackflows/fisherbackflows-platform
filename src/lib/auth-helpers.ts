import { NextRequest } from 'next/server';
import { createRouteHandlerClient } from './supabase';

export interface AuthResult {
  success: boolean;
  user?: any;
  customerId?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Authenticate request and return customer data
 * Used for API endpoints that require authentication
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    const supabase = createRouteHandlerClient(request);

    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required',
        statusCode: 401
      };
    }

    // Get customer record
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, account_status, first_name, last_name, email')
      .eq('auth_user_id', user.id)
      .single();

    if (customerError || !customer) {
      return {
        success: false,
        error: 'Customer record not found',
        statusCode: 404
      };
    }

    // Check if account is active
    if (customer.account_status !== 'active') {
      return {
        success: false,
        error: 'Account is not active',
        statusCode: 403
      };
    }

    return {
      success: true,
      user,
      customerId: customer.id
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed',
      statusCode: 500
    };
  }
}

/**
 * Verify customer has access to specified customer ID
 * Prevents customers from accessing other customer data
 */
export async function verifyCustomerAccess(
  request: NextRequest,
  targetCustomerId: string
): Promise<AuthResult> {
  const authResult = await authenticateRequest(request);

  if (!authResult.success) {
    return authResult;
  }

  if (authResult.customerId !== targetCustomerId) {
    return {
      success: false,
      error: 'Access denied: insufficient permissions',
      statusCode: 403
    };
  }

  return authResult;
}