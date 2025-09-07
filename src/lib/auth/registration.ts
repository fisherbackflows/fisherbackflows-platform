import { createRouteHandlerClient, supabaseAdmin } from '@/lib/supabase';
import { generateId } from '@/lib/utils';
import { NextRequest } from 'next/server';

export interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  propertyType?: string;
}

export interface RegistrationResult {
  success: boolean;
  message: string;
  user?: {
    id: string;
    authUserId: string;
    accountNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: 'pending_verification' | 'active';
    emailSent: boolean;
  };
  error?: string;
}

export class RegistrationError extends Error {
  constructor(
    message: string, 
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'RegistrationError';
  }
}

export class EmailService {
  private static async canSendEmail(): Promise<boolean> {
    return Boolean(process.env.RESEND_API_KEY);
  }

  static async validateEmailService(): Promise<{ canSend: boolean; reason?: string }> {
    const canSend = await this.canSendEmail();
    if (!canSend) {
      return { 
        canSend: false, 
        reason: 'Email service not configured (missing RESEND_API_KEY)' 
      };
    }
    return { canSend: true };
  }
}

export class CustomerRegistrationService {
  private supabase;
  
  constructor(request: NextRequest) {
    this.supabase = createRouteHandlerClient(request);
  }

  async register(data: RegistrationData): Promise<RegistrationResult> {
    try {
      // Step 1: Check email service availability
      const emailService = await EmailService.validateEmailService();
      
      // Step 2: Create auth user (with or without email)
      const authResult = await this.createAuthUser(data, emailService.canSend);
      
      // Step 3: Create customer record
      const customer = await this.createCustomerRecord(data, authResult);
      
      // Step 4: Return success response
      return {
        success: true,
        message: this.getSuccessMessage(emailService.canSend, authResult.emailSent),
        user: {
          id: customer.id,
          authUserId: authResult.userId,
          accountNumber: customer.account_number,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          status: authResult.emailSent ? 'pending_verification' : 'active',
          emailSent: authResult.emailSent
        }
      };
      
    } catch (error) {
      if (error instanceof RegistrationError) {
        throw error;
      }
      
      console.error('Unexpected registration error:', error);
      throw new RegistrationError(
        'Registration failed due to an unexpected error',
        'UNEXPECTED_ERROR',
        500
      );
    }
  }

  private async createAuthUser(
    data: RegistrationData, 
    canSendEmail: boolean
  ): Promise<{ userId: string; emailSent: boolean }> {
    
    if (!canSendEmail) {
      // Email service unavailable - use service role client for admin operations
      const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true, // Skip email confirmation
        user_metadata: {
          first_name: data.firstName,
          last_name: data.lastName,
          full_name: `${data.firstName} ${data.lastName}`
        }
      });

      if (error || !authData.user) {
        console.error('Auth user creation failed (no email):', error);
        
        if (error.message?.includes('already registered')) {
          throw new RegistrationError(
            'An account with this email already exists',
            'USER_ALREADY_EXISTS',
            400
          );
        }
        
        throw new RegistrationError(
          'Failed to create user account',
          'AUTH_CREATION_FAILED',
          500
        );
      }

      return { 
        userId: authData.user.id, 
        emailSent: false 
      };
    }

    // Email service available - normal flow with email confirmation
    const { data: authData, error } = await this.supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          full_name: `${data.firstName} ${data.lastName}`
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/portal/verify-email`
      }
    });

    if (error) {
      console.error('Auth user creation failed (with email):', error);
      
      if (error.code === 'weak_password') {
        throw new RegistrationError(
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
          'WEAK_PASSWORD',
          400
        );
      }
      
      if (error.code === 'user_already_exists') {
        throw new RegistrationError(
          'An account with this email already exists',
          'USER_ALREADY_EXISTS',
          400
        );
      }
      
      if (error.code === 'over_email_send_rate_limit') {
        // Fall back to no-email creation
        return this.createAuthUser(data, false);
      }
      
      throw new RegistrationError(
        'Failed to create user account',
        'AUTH_CREATION_FAILED',
        500
      );
    }

    if (!authData.user) {
      throw new RegistrationError(
        'User creation succeeded but no user data returned',
        'AUTH_DATA_MISSING',
        500
      );
    }

    return { 
      userId: authData.user.id, 
      emailSent: true 
    };
  }

  private async createCustomerRecord(
    data: RegistrationData,
    authResult: { userId: string; emailSent: boolean }
  ) {
    const accountNumber = generateId('FB');
    
    const customerData = {
      auth_user_id: authResult.userId,
      account_number: accountNumber,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      address_line1: data.address?.street || 'Not provided',
      city: data.address?.city || 'Not provided',
      state: data.address?.state || 'TX',
      zip_code: data.address?.zipCode || '00000',
      account_status: authResult.emailSent ? 'pending_verification' : 'active'
    };

    const { data: customer, error } = await supabaseAdmin
      .from('customers')
      .insert(customerData)
      .select()
      .single();

    if (error || !customer) {
      console.error('Customer creation failed:', error);
      
      // Clean up auth user if customer creation fails
      try {
        await supabaseAdmin.auth.admin.deleteUser(authResult.userId);
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError);
      }
      
      throw new RegistrationError(
        'Failed to create customer record',
        'CUSTOMER_CREATION_FAILED',
        500
      );
    }

    return customer;
  }

  private getSuccessMessage(canSendEmail: boolean, emailSent: boolean): string {
    if (!canSendEmail || !emailSent) {
      return 'Account created successfully! You can now sign in with your email and password.';
    }
    return 'Account created successfully! Please check your email to verify your account before signing in.';
  }
}