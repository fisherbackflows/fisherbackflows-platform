/**
 * SECURITY FIX: Comprehensive input validation and sanitization
 * Prevents SQL injection, XSS, and other injection attacks
 */

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// ===== COMMON VALIDATION SCHEMAS =====

export const emailSchema = z.string()
  .email('Invalid email format')
  .max(255, 'Email too long')
  .toLowerCase()
  .transform(val => val.trim());

export const phoneSchema = z.string()
  .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number')
  .min(10, 'Phone number too short')
  .max(20, 'Phone number too long')
  .transform(val => val.replace(/\D/g, ''));

export const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name too long')
  .regex(/^[a-zA-Z\s\-\']+$/, 'Name contains invalid characters')
  .transform(val => val.trim());

export const addressSchema = z.object({
  street: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  state: z.string().length(2).toUpperCase(),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code')
});

export const uuidSchema = z.string()
  .uuid('Invalid ID format');

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password too long')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character');

export const amountSchema = z.number()
  .positive('Amount must be positive')
  .max(999999.99, 'Amount exceeds maximum')
  .multipleOf(0.01, 'Invalid currency amount');

// ===== SQL INJECTION PREVENTION =====

/**
 * Sanitize string to prevent SQL injection
 * Use parameterized queries instead when possible
 */
export function sanitizeSQLString(input: string): string {
  if (!input) return '';

  // Remove or escape dangerous SQL characters
  return input
    .replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
      switch (char) {
        case "\0": return "\\0";
        case "\x08": return "\\b";
        case "\x09": return "\\t";
        case "\x1a": return "\\z";
        case "\n": return "\\n";
        case "\r": return "\\r";
        case "\"":
        case "'":
        case "\\":
        case "%":
          return "\\" + char;
        default:
          return char;
      }
    });
}

// ===== XSS PREVENTION =====

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHTML(input: string): string {
  if (!input) return '';

  // Use DOMPurify with strict configuration
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    ALLOW_SELF_CLOSE_IN_ATTR: false,
    SAFE_FOR_JQUERY: true,
    SAFE_FOR_TEMPLATES: true,
    WHOLE_DOCUMENT: false,
    RETURN_TRUSTED_TYPE: false,
    FORCE_BODY: false,
    SANITIZE_DOM: true,
    KEEP_CONTENT: true
  });
}

// ===== PATH TRAVERSAL PREVENTION =====

/**
 * Sanitize file paths to prevent directory traversal
 */
export function sanitizePath(input: string): string {
  if (!input) return '';

  // Remove path traversal attempts
  return input
    .replace(/\.\./g, '')
    .replace(/[^a-zA-Z0-9\-_\.]/g, '')
    .substring(0, 255);
}

// ===== NOSQL INJECTION PREVENTION =====

/**
 * Sanitize JSON queries to prevent NoSQL injection
 */
export function sanitizeJSON(input: any): any {
  if (typeof input !== 'object') return input;

  const cleaned: any = Array.isArray(input) ? [] : {};

  for (const key in input) {
    if (key.startsWith('$')) {
      continue; // Skip MongoDB operators
    }

    if (typeof input[key] === 'object' && input[key] !== null) {
      cleaned[key] = sanitizeJSON(input[key]);
    } else if (typeof input[key] === 'string') {
      cleaned[key] = sanitizeSQLString(input[key]);
    } else {
      cleaned[key] = input[key];
    }
  }

  return cleaned;
}

// ===== REQUEST VALIDATION SCHEMAS =====

export const customerRegistrationSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  address: addressSchema,
  propertyType: z.enum(['residential', 'commercial', 'industrial']),
  companyName: z.string().max(200).optional()
});

export const appointmentBookingSchema = z.object({
  customerId: uuidSchema,
  deviceId: uuidSchema,
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/),
  appointmentType: z.enum(['annual_test', 'repair', 'installation', 'emergency']),
  specialInstructions: z.string().max(500).optional()
});

export const paymentRequestSchema = z.object({
  customerId: uuidSchema,
  amount: amountSchema,
  currency: z.enum(['USD', 'CAD']).default('USD'),
  paymentMethodId: z.string().optional(),
  invoiceId: uuidSchema.optional(),
  metadata: z.record(z.string()).optional()
});

export const searchQuerySchema = z.object({
  q: z.string().max(200).transform(val => sanitizeSQLString(val)),
  limit: z.number().int().min(1).max(100).default(10),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['date', 'name', 'amount']).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});

// ===== VALIDATION HELPERS =====

/**
 * Validate and sanitize request data
 */
export async function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; error: string; details?: any }> {
  try {
    const validated = await schema.parseAsync(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      };
    }
    return { success: false, error: 'Invalid input data' };
  }
}

/**
 * Sanitize all string fields in an object
 */
export function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized: any = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      sanitized[key] = sanitizeHTML(obj[key]);
    } else if (typeof obj[key] === 'object') {
      sanitized[key] = sanitizeObject(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  }

  return sanitized;
}

// ===== RATE LIMITING HELPER =====

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || record.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

export default {
  sanitizeSQL: sanitizeSQLString,
  sanitizeHTML,
  sanitizePath,
  sanitizeJSON,
  sanitizeObject,
  validateRequest,
  checkRateLimit,
  schemas: {
    email: emailSchema,
    phone: phoneSchema,
    name: nameSchema,
    address: addressSchema,
    uuid: uuidSchema,
    password: passwordSchema,
    amount: amountSchema,
    customerRegistration: customerRegistrationSchema,
    appointmentBooking: appointmentBookingSchema,
    paymentRequest: paymentRequestSchema,
    searchQuery: searchQuerySchema
  }
};