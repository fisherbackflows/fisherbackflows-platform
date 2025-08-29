/**
 * Customer Registration and Authentication
 */

import { createClientComponentClient } from './supabase';
import bcrypt from 'bcryptjs';

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