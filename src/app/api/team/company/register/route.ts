import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { headers } from 'next/headers';
import crypto from 'crypto';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { attempts: number; lastAttempt: number }>();

// Security configuration
const SECURITY_CONFIG = {
  maxRequestsPerWindow: 3,
  rateLimitWindowMs: 60 * 60 * 1000, // 1 hour
  passwordMinLength: 12,
  sessionDurationMs: 4 * 60 * 60 * 1000, // 4 hours
};

interface CompanyRegistrationData {
  // Company basics
  name: string;
  businessType: string;
  email: string;
  phone: string;
  website: string;

  // Address
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;

  // Business details
  licenseNumber: string;
  certificationLevel: string;

  // Admin user
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;

  // Plan selection
  planType: 'starter' | 'professional' | 'enterprise';
}

// Get client IP address
async function getClientIP(request: NextRequest): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get('x-forwarded-for');
  const real = headersList.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (real) {
    return real;
  }
  return request.ip || 'unknown';
}

// Rate limiting check
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record) {
    rateLimitStore.set(ip, { attempts: 1, lastAttempt: now });
    return false;
  }

  // Reset if window expired
  if (now - record.lastAttempt > SECURITY_CONFIG.rateLimitWindowMs) {
    rateLimitStore.set(ip, { attempts: 1, lastAttempt: now });
    return false;
  }

  // Check rate limit
  if (record.attempts >= SECURITY_CONFIG.maxRequestsPerWindow) {
    return true;
  }

  record.attempts++;
  record.lastAttempt = now;
  return false;
}

// Validate registration data
function validateRegistrationData(data: CompanyRegistrationData): string[] {
  const errors: string[] = [];

  // Required fields
  if (!data.name?.trim()) errors.push('Company name is required');
  if (!data.email?.trim()) errors.push('Company email is required');
  if (!data.phone?.trim()) errors.push('Phone number is required');
  if (!data.addressLine1?.trim()) errors.push('Address is required');
  if (!data.city?.trim()) errors.push('City is required');
  if (!data.state?.trim()) errors.push('State is required');
  if (!data.zipCode?.trim()) errors.push('ZIP code is required');
  if (!data.adminFirstName?.trim()) errors.push('Admin first name is required');
  if (!data.adminLastName?.trim()) errors.push('Admin last name is required');
  if (!data.adminEmail?.trim()) errors.push('Admin email is required');
  if (!data.adminPassword?.trim()) errors.push('Admin password is required');

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.email && !emailRegex.test(data.email.trim())) {
    errors.push('Invalid company email format');
  }
  if (data.adminEmail && !emailRegex.test(data.adminEmail.trim())) {
    errors.push('Invalid admin email format');
  }

  // Password validation
  if (data.adminPassword && data.adminPassword.length < SECURITY_CONFIG.passwordMinLength) {
    errors.push(`Password must be at least ${SECURITY_CONFIG.passwordMinLength} characters`);
  }

  // Business type validation
  const validBusinessTypes = ['testing_service', 'plumbing', 'municipal', 'contractor', 'other'];
  if (data.businessType && !validBusinessTypes.includes(data.businessType)) {
    errors.push('Invalid business type');
  }

  // Plan validation
  const validPlans = ['starter', 'professional', 'enterprise'];
  if (data.planType && !validPlans.includes(data.planType)) {
    errors.push('Invalid plan type');
  }

  return errors;
}

// Generate company slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
}

// Get plan details
function getPlanDetails(planType: string) {
  const plans = {
    starter: { maxUsers: 3, price: 2900 },
    professional: { maxUsers: 15, price: 7900 },
    enterprise: { maxUsers: 100, price: 19900 }
  };

  return plans[planType as keyof typeof plans] || plans.professional;
}

export async function POST(request: NextRequest) {
  const clientIP = await getClientIP(request);

  try {
    // Rate limiting
    if (isRateLimited(clientIP)) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body: CompanyRegistrationData = await request.json();

    // Validate input data
    const validationErrors = validateRegistrationData(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Database connection
    const dbClient = supabaseAdmin || supabase;
    if (!dbClient) {
      console.error('Database connection unavailable');
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Check if company email already exists
    const { data: existingCompany } = await dbClient
      .from('companies')
      .select('id')
      .eq('email', body.email.toLowerCase().trim())
      .single();

    if (existingCompany) {
      return NextResponse.json(
        { error: 'A company with this email already exists' },
        { status: 409 }
      );
    }

    // Check if admin email already exists
    const { data: existingUser } = await dbClient
      .from('team_users')
      .select('id')
      .eq('email', body.adminEmail.toLowerCase().trim())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this admin email already exists' },
        { status: 409 }
      );
    }

    // Generate unique slug
    let slug = generateSlug(body.name);
    let slugSuffix = 1;

    while (true) {
      const { data: existingSlug } = await dbClient
        .from('companies')
        .select('id')
        .eq('slug', slug)
        .single();

      if (!existingSlug) break;

      slug = `${generateSlug(body.name)}-${slugSuffix}`;
      slugSuffix++;
    }

    const planDetails = getPlanDetails(body.planType);

    // Create company
    const { data: company, error: companyError } = await dbClient
      .from('companies')
      .insert({
        name: body.name.trim(),
        slug,
        email: body.email.toLowerCase().trim(),
        phone: body.phone.trim(),
        website: body.website?.trim() || null,
        address_line1: body.addressLine1.trim(),
        address_line2: body.addressLine2?.trim() || null,
        city: body.city.trim(),
        state: body.state.trim(),
        zip_code: body.zipCode.trim(),
        business_type: body.businessType,
        license_number: body.licenseNumber?.trim() || null,
        certification_level: body.certificationLevel,
        plan_type: body.planType,
        max_users: planDetails.maxUsers,
        status: 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
        features: JSON.stringify({
          reports: true,
          scheduling: true,
          billing: body.planType !== 'starter',
          gps_tracking: body.planType === 'professional' || body.planType === 'enterprise',
          api_access: body.planType === 'enterprise',
          custom_branding: body.planType !== 'starter'
        }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (companyError) {
      console.error('Error creating company:', companyError);
      return NextResponse.json(
        { error: 'Failed to create company' },
        { status: 500 }
      );
    }

    // Hash admin password
    const hashedPassword = await bcrypt.hash(body.adminPassword, 12);

    // Create admin user
    const { data: adminUser, error: userError } = await dbClient
      .from('team_users')
      .insert({
        company_id: company.id,
        email: body.adminEmail.toLowerCase().trim(),
        password_hash: hashedPassword,
        first_name: body.adminFirstName.trim(),
        last_name: body.adminLastName.trim(),
        role: 'company_admin',
        is_active: true,
        permissions: JSON.stringify({
          manage_users: true,
          manage_settings: true,
          manage_billing: true,
          view_reports: true,
          manage_customers: true,
          manage_appointments: true
        }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (userError) {
      console.error('Error creating admin user:', userError);

      // Rollback: Delete company if user creation failed
      await dbClient.from('companies').delete().eq('id', company.id);

      return NextResponse.json(
        { error: 'Failed to create admin account' },
        { status: 500 }
      );
    }

    // Company settings will be auto-created by trigger

    // Log successful registration
    try {
      await dbClient.from('audit_logs').insert({
        event_type: 'company_registered',
        user_id: adminUser.id,
        company_id: company.id,
        event_data: {
          company_name: company.name,
          plan_type: company.plan_type,
          admin_email: adminUser.email,
          ip_address: clientIP
        },
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log registration:', logError);
      // Don't fail the registration for logging errors
    }

    // Return success (excluding sensitive data)
    const response = NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        plan_type: company.plan_type,
        trial_ends_at: company.trial_ends_at
      },
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        first_name: adminUser.first_name,
        last_name: adminUser.last_name,
        role: adminUser.role
      }
    });

    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');

    return response;

  } catch (error) {
    console.error('Company registration error:', error);

    return NextResponse.json(
      { error: 'Registration service error' },
      {
        status: 500,
        headers: {
          'X-Content-Type-Options': 'nosniff'
        }
      }
    );
  }
}