// SECURITY: Comprehensive input validation and sanitization

import { z } from 'zod';

// Email validation schema
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .max(254, 'Email too long')
  .transform(email => email.toLowerCase().trim());

// Password validation schema
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

// Phone number validation
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .transform(phone => phone.replace(/\D/g, ''));

// Name validation
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name too long')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters')
  .transform(name => name.trim());

// Account number validation
export const accountNumberSchema = z
  .string()
  .min(3, 'Account number too short')
  .max(20, 'Account number too long')
  .regex(/^[A-Z0-9-]+$/, 'Account number can only contain letters, numbers, and hyphens');

// Address validation
export const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required').max(200, 'Street address too long'),
  city: z.string().min(1, 'City is required').max(100, 'City name too long'),
  state: z.string().min(2, 'State is required').max(50, 'State name too long'),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
});

// Login validation schema
export const loginSchema = z.object({
  identifier: z.union([emailSchema, phoneSchema], {
    errorMap: () => ({ message: 'Please enter a valid email or phone number' })
  }),
  password: z.string().min(1, 'Password is required'),
  type: z.enum(['email', 'phone', 'demo']).optional(),
});

// Registration validation schema  
export const registrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  phone: phoneSchema,
  accountNumber: accountNumberSchema.optional(),
  address: addressSchema.optional(),
});

// Admin bypass validation
export const adminBypassSchema = z.object({
  code: z.string()
    .min(32, 'Invalid bypass code format')
    .max(128, 'Invalid bypass code format')
    .regex(/^[a-f0-9]+$/, 'Invalid bypass code format'),
});

// Appointment booking validation
export const appointmentSchema = z.object({
  date: z.string().datetime('Invalid date format'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  serviceType: z.enum(['testing', 'repair', 'installation', 'inspection']),
  customerNotes: z.string().max(1000, 'Notes too long').optional(),
});

// Generic ID validation
export const uuidSchema = z.string().uuid('Invalid ID format');

// Sanitization functions
export function sanitizeHtml(input: string): string {
  // Basic HTML sanitization - remove script tags and dangerous attributes
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '')
    .trim();
}

export function sanitizeFileName(input: string): string {
  // Remove dangerous characters from filenames
  return input
    .replace(/[^a-zA-Z0-9.-_]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255);
}

export function sanitizeSearchQuery(input: string): string {
  // Sanitize search queries to prevent injection
  return input
    .replace(/[<>]/g, '')
    .replace(/['"]/g, '')
    .replace(/;/g, '')
    .trim()
    .substring(0, 200);
}

// Validation middleware wrapper
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  onError?: (errors: z.ZodError) => any
) {
  return (data: unknown): T => {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        if (onError) {
          throw onError(error);
        }
        throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  };
}

// SQL injection prevention
export function escapeSqlString(input: string): string {
  return input.replace(/'/g, "''");
}

// XSS prevention
export function escapeHtml(input: string): string {
  const htmlEscapes: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return input.replace(/[&<>"'/]/g, (match) => htmlEscapes[match]);
}

// URL validation
export const urlSchema = z.string().url('Invalid URL format');

// File upload validation
export const fileUploadSchema = z.object({
  name: z.string().max(255, 'Filename too long'),
  size: z.number().max(10 * 1024 * 1024, 'File too large (max 10MB)'),
  type: z.enum([
    'image/jpeg',
    'image/png', 
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/json'
  ], { errorMap: () => ({ message: 'File type not allowed' }) }),
});