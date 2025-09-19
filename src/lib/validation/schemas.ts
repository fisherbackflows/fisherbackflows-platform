/**
 * Validation Schemas - Fisher Backflows
 * Comprehensive Zod schemas for data validation
 */

import { z } from 'zod';

// ============================================
// BASE SCHEMAS
// ============================================

export const UUIDSchema = z.string().uuid();
export const EmailSchema = z.string().email().max(254);
export const PhoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone format').min(10).max(20);
export const URLSchema = z.string().url();

export const AddressSchema = z.object({
  street_address: z.string().min(1).max(255),
  city: z.string().min(1).max(100),
  state: z.string().length(2),
  zip_code: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
  country: z.string().default('US')
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

// ============================================
// ORGANIZATION SCHEMAS
// ============================================

export const OrganizationCreateSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens').min(2).max(50),
  subscription_tier: z.enum(['free', 'basic', 'premium', 'enterprise']).default('free'),
  settings: z.record(z.unknown()).optional()
});

export const UserOrgMembershipCreateSchema = z.object({
  org_id: UUIDSchema,
  user_id: UUIDSchema,
  role: z.enum(['admin', 'manager', 'inspector', 'technician', 'coordinator', 'viewer']),
  is_active: z.boolean().default(true)
});

// ============================================
// CUSTOMER SCHEMAS
// ============================================

export const CustomerCreateSchema = z.object({
  name: z.string().min(1).max(255),
  email: EmailSchema.optional(),
  phone: PhoneSchema.optional(),
  address: AddressSchema.optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional()
});

export const CustomerUpdateSchema = CustomerCreateSchema.partial();

export const CustomerQuerySchema = z.object({
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
  ...PaginationSchema.shape
});

// ============================================
// WORK ORDER SCHEMAS
// ============================================

export const WorkOrderCreateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  customer_id: UUIDSchema,
  assigned_to: UUIDSchema.optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['draft', 'scheduled', 'in_progress', 'completed', 'cancelled']).default('draft'),
  scheduled_at: z.string().datetime().optional(),
  estimated_duration_minutes: z.number().int().positive().optional(),
  location: AddressSchema.optional(),
  special_instructions: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

export const WorkOrderUpdateSchema = WorkOrderCreateSchema.partial();

export const WorkOrderQuerySchema = z.object({
  customer_id: UUIDSchema.optional(),
  assigned_to: UUIDSchema.optional(),
  status: z.enum(['draft', 'scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  scheduled_from: z.string().datetime().optional(),
  scheduled_to: z.string().datetime().optional(),
  ...PaginationSchema.shape
});

// ============================================
// INSPECTION SCHEMAS
// ============================================

export const InspectionCreateSchema = z.object({
  work_order_id: UUIDSchema,
  inspector_id: UUIDSchema,
  device_type: z.string().min(1).max(100),
  device_serial: z.string().optional(),
  test_data: z.record(z.unknown()).optional(),
  photos: z.array(z.string()).default([]),
  notes: z.string().optional(),
  status: z.enum(['draft', 'in_progress', 'submitted', 'approved', 'rejected']).default('draft')
});

export const InspectionUpdateSchema = z.object({
  test_data: z.record(z.unknown()).optional(),
  photos: z.array(z.string()).optional(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'in_progress', 'submitted', 'approved', 'rejected']).optional()
});

export const InspectionQuerySchema = z.object({
  work_order_id: UUIDSchema.optional(),
  inspector_id: UUIDSchema.optional(),
  status: z.enum(['draft', 'in_progress', 'submitted', 'approved', 'rejected']).optional(),
  ...PaginationSchema.shape
});

// ============================================
// INVOICE SCHEMAS
// ============================================

export const InvoiceLineItemSchema = z.object({
  description: z.string().min(1).max(255),
  quantity: z.number().positive().default(1),
  unit_price_cents: z.number().int().nonnegative(),
  total_cents: z.number().int().nonnegative()
});

export const InvoiceCreateSchema = z.object({
  customer_id: UUIDSchema,
  work_order_id: UUIDSchema.optional(),
  invoice_number: z.string().min(1).max(50),
  due_date: z.string().datetime(),
  line_items: z.array(InvoiceLineItemSchema).min(1),
  subtotal_cents: z.number().int().nonnegative(),
  tax_cents: z.number().int().nonnegative().default(0),
  total_cents: z.number().int().nonnegative(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).default('draft'),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

export const InvoiceUpdateSchema = InvoiceCreateSchema.partial();

// ============================================
// REPORT SCHEMAS
// ============================================

export const ReportCreateSchema = z.object({
  type: z.enum(['inspection_report', 'invoice', 'work_order_summary']),
  inspection_id: UUIDSchema.optional(),
  invoice_id: UUIDSchema.optional(),
  work_order_id: UUIDSchema.optional(),
  url: URLSchema,
  sha256: z.string().length(64),
  size_bytes: z.number().int().positive(),
  metadata: z.record(z.unknown()).optional()
});

// ============================================
// JOB SCHEMAS
// ============================================

export const JobCreateSchema = z.object({
  type: z.enum(['send_email', 'generate_pdf', 'process_webhook', 'nightly_sync', 'cleanup_temp']),
  payload: z.record(z.unknown()),
  scheduled_for: z.string().datetime().optional(),
  max_attempts: z.number().int().positive().default(3),
  metadata: z.record(z.unknown()).optional()
});

export type JobType = 'send_email' | 'generate_pdf' | 'process_webhook' | 'nightly_sync' | 'cleanup_temp';

export const JobUpdateSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional(),
  result: z.record(z.unknown()).optional(),
  error: z.string().optional(),
  started_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
  attempts: z.number().int().nonnegative().optional()
});

// ============================================
// PAYMENT SCHEMAS
// ============================================

export const PaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('usd'),
  customer_email: z.string().email(),
  description: z.string().optional(),
  metadata: z.record(z.string()).optional()
});

export const StripePaymentSchema = z.object({
  payment_intent_id: z.string(),
  amount: z.number().positive(),
  currency: z.string(),
  status: z.enum(['pending', 'succeeded', 'failed', 'canceled'])
});

export const RefundSchema = z.object({
  payment_intent_id: z.string(),
  amount: z.number().positive().optional(),
  reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer']).optional()
});

// ============================================
// EMAIL SCHEMAS
// ============================================

export const EmailSendSchema = z.object({
  to: z.union([EmailSchema, z.array(EmailSchema)]),
  subject: z.string().min(1).max(255),
  html: z.string().optional(),
  text: z.string().optional(),
  template_id: z.string().optional(),
  template_data: z.record(z.unknown()).optional(),
  tags: z.array(z.object({
    name: z.string(),
    value: z.string()
  })).optional()
});

// ============================================
// AUDIT LOG SCHEMAS
// ============================================

export const AuditLogCreateSchema = z.object({
  user_id: UUIDSchema.optional(),
  action: z.string().min(1).max(100),
  entity_type: z.string().min(1).max(50),
  entity_id: UUIDSchema.optional(),
  changes: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional()
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
} {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

// Type exports for TypeScript
export type CustomerCreate = z.infer<typeof CustomerCreateSchema>;
export type CustomerUpdate = z.infer<typeof CustomerUpdateSchema>;
export type WorkOrderCreate = z.infer<typeof WorkOrderCreateSchema>;
export type WorkOrderUpdate = z.infer<typeof WorkOrderUpdateSchema>;
export type InspectionCreate = z.infer<typeof InspectionCreateSchema>;
export type InspectionUpdate = z.infer<typeof InspectionUpdateSchema>;
export type InvoiceCreate = z.infer<typeof InvoiceCreateSchema>;
export type JobCreate = z.infer<typeof JobCreateSchema>;
export type JobUpdate = z.infer<typeof JobUpdateSchema>;
export type EmailSend = z.infer<typeof EmailSendSchema>;
export type AuditLogCreate = z.infer<typeof AuditLogCreateSchema>;