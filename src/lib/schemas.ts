/**
 * Enterprise Validation Schemas for Fisher Backflows
 * Using Zod for runtime validation and TypeScript type inference
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════
// COMMON SCHEMAS
// ═══════════════════════════════════════════════════════════════════════

export const UUIDSchema = z.string().uuid();
export const EmailSchema = z.string().email().toLowerCase();
export const PhoneSchema = z.string().regex(/^\+?1?\d{10,14}$/);
export const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const TimeSchema = z.string().regex(/^\d{2}:\d{2}$/);
export const CurrencySchema = z.number().positive().multipleOf(0.01);
export const PercentageSchema = z.number().min(0).max(100);

export const AddressSchema = z.object({
  street: z.string().min(1).max(255),
  unit: z.string().optional(),
  city: z.string().min(1).max(100),
  state: z.string().length(2).toUpperCase(),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/),
  country: z.string().default('USA'),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }).optional()
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('asc')
});

// ═══════════════════════════════════════════════════════════════════════
// USER & AUTH SCHEMAS
// ═══════════════════════════════════════════════════════════════════════

export const UserRoleSchema = z.enum([
  'super_admin',
  'admin',
  'technician',
  'customer',
  'viewer'
]);

export const SignUpSchema = z.object({
  email: EmailSchema,
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  fullName: z.string().min(2).max(255),
  phone: PhoneSchema.optional(),
  role: UserRoleSchema.default('customer'),
  organizationId: UUIDSchema.optional()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const SignInSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
  mfaCode: z.string().length(6).optional()
});

export const CustomerSignInSchema = z.object({
  email: EmailSchema,
  accountNumber: z.string().regex(/^[A-Z0-9]{6,20}$/),
  rememberMe: z.boolean().default(false)
});

export const PasswordResetSchema = z.object({
  email: EmailSchema
});

export const NewPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string()
    .min(12)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// ═══════════════════════════════════════════════════════════════════════
// CUSTOMER SCHEMAS
// ═══════════════════════════════════════════════════════════════════════

export const CustomerSchema = z.object({
  id: UUIDSchema.optional(),
  accountNumber: z.string().regex(/^[A-Z0-9]{6,20}$/),
  companyName: z.string().max(255).optional(),
  contactName: z.string().min(2).max(255),
  email: EmailSchema,
  phone: PhoneSchema,
  alternatePhone: PhoneSchema.optional(),
  serviceAddress: AddressSchema,
  billingAddress: AddressSchema.optional(),
  propertyType: z.enum(['residential', 'commercial', 'industrial', 'municipal']).optional(),
  backflowCount: z.number().int().positive().default(1),
  testFrequencyMonths: z.number().int().min(1).max(12).default(12),
  taxExempt: z.boolean().default(false),
  taxId: z.string().optional(),
  notes: z.string().max(5000).optional(),
  tags: z.array(z.string()).optional()
});

export const CustomerSearchSchema = z.object({
  query: z.string().optional(),
  accountNumber: z.string().optional(),
  email: EmailSchema.optional(),
  phone: PhoneSchema.optional(),
  status: z.enum(['active', 'inactive', 'all']).default('active'),
  hasOverdue: z.boolean().optional(),
  pagination: PaginationSchema.optional()
});

// ═══════════════════════════════════════════════════════════════════════
// TECHNICIAN SCHEMAS
// ═══════════════════════════════════════════════════════════════════════

export const TechnicianSchema = z.object({
  id: UUIDSchema.optional(),
  userId: UUIDSchema,
  employeeId: z.string().min(1).max(50),
  certificationNumber: z.string().max(100).optional(),
  certificationExpiry: DateSchema.optional(),
  specializations: z.array(z.string()).optional(),
  serviceAreas: z.array(z.string()).optional(),
  hourlyRate: CurrencySchema.optional(),
  commissionRate: PercentageSchema.optional(),
  vehicleId: z.string().max(50).optional(),
  isAvailable: z.boolean().default(true),
  isOnCall: z.boolean().default(false)
});

export const TechnicianAvailabilitySchema = z.object({
  technicianId: UUIDSchema,
  date: DateSchema,
  timeSlots: z.array(z.object({
    start: TimeSchema,
    end: TimeSchema,
    available: z.boolean()
  }))
});

// ═══════════════════════════════════════════════════════════════════════
// DEVICE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════

export const DeviceTypeSchema = z.enum([
  'rpz',
  'dc',
  'pvb',
  'svb',
  'vba',
  'air_gap'
]);

export const HazardLevelSchema = z.enum([
  'high',
  'moderate',
  'low'
]);

export const DeviceSchema = z.object({
  id: UUIDSchema.optional(),
  customerId: UUIDSchema,
  serialNumber: z.string().min(1).max(100),
  manufacturer: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  size: z.string().max(20).optional(),
  type: DeviceTypeSchema.optional(),
  location: z.string().max(500).optional(),
  installationDate: DateSchema.optional(),
  testFrequencyMonths: z.number().int().min(1).max(12).default(12),
  waterMeterNumber: z.string().max(50).optional(),
  hazardLevel: HazardLevelSchema.optional(),
  notes: z.string().max(5000).optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional()
});

// ═══════════════════════════════════════════════════════════════════════
// APPOINTMENT SCHEMAS
// ═══════════════════════════════════════════════════════════════════════

export const AppointmentStatusSchema = z.enum([
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'rescheduled',
  'no_show'
]);

export const PriorityLevelSchema = z.enum([
  'low',
  'normal',
  'high',
  'urgent',
  'emergency'
]);

export const ServiceTypeSchema = z.enum([
  'annual_test',
  'repair',
  'installation',
  'removal',
  'consultation',
  'emergency'
]);

export const AppointmentSchema = z.object({
  id: UUIDSchema.optional(),
  customerId: UUIDSchema,
  technicianId: UUIDSchema.optional(),
  deviceId: UUIDSchema.optional(),
  status: AppointmentStatusSchema.default('scheduled'),
  priority: PriorityLevelSchema.default('normal'),
  scheduledDate: DateSchema,
  scheduledTime: TimeSchema,
  estimatedDuration: z.number().int().min(15).max(480).default(60),
  serviceType: ServiceTypeSchema,
  serviceAddress: AddressSchema.optional(),
  notes: z.string().max(5000).optional(),
  customerNotes: z.string().max(5000).optional(),
  requiresParts: z.boolean().default(false),
  weatherDependency: z.boolean().default(false)
});

export const AppointmentSearchSchema = z.object({
  customerId: UUIDSchema.optional(),
  technicianId: UUIDSchema.optional(),
  status: AppointmentStatusSchema.optional(),
  dateFrom: DateSchema.optional(),
  dateTo: DateSchema.optional(),
  serviceType: ServiceTypeSchema.optional(),
  priority: PriorityLevelSchema.optional(),
  pagination: PaginationSchema.optional()
});

export const RescheduleAppointmentSchema = z.object({
  appointmentId: UUIDSchema,
  newDate: DateSchema,
  newTime: TimeSchema,
  reason: z.string().max(500).optional(),
  notifyCustomer: z.boolean().default(true)
});

// ═══════════════════════════════════════════════════════════════════════
// TEST REPORT SCHEMAS
// ═══════════════════════════════════════════════════════════════════════

export const TestResultSchema = z.enum([
  'pass',
  'fail',
  'inconclusive',
  'pending'
]);

export const ValveCheckSchema = z.object({
  condition: z.enum(['good', 'fair', 'poor', 'failed']),
  leakRate: z.number().optional(),
  notes: z.string().optional()
});

export const TestReportSchema = z.object({
  id: UUIDSchema.optional(),
  appointmentId: UUIDSchema.optional(),
  deviceId: UUIDSchema,
  technicianId: UUIDSchema,
  customerId: UUIDSchema,
  testDate: DateSchema,
  testTime: TimeSchema,
  testResult: TestResultSchema,
  initialPressure: z.number().positive().optional(),
  finalPressure: z.number().positive().optional(),
  pressureDrop: z.number().optional(),
  checkValve1: ValveCheckSchema.optional(),
  checkValve2: ValveCheckSchema.optional(),
  reliefValve: ValveCheckSchema.optional(),
  shutOffValves: z.object({
    inlet: ValveCheckSchema,
    outlet: ValveCheckSchema
  }).optional(),
  observations: z.string().max(5000).optional(),
  repairsNeeded: z.boolean().default(false),
  repairNotes: z.string().max(5000).optional(),
  followUpRequired: z.boolean().default(false),
  followUpDate: DateSchema.optional(),
  photos: z.array(z.string().url()).optional(),
  weatherConditions: z.object({
    temperature: z.number(),
    condition: z.string(),
    humidity: z.number().optional()
  }).optional()
});

export const TestReportSubmissionSchema = z.object({
  reportId: UUIDSchema,
  signature: z.string(), // Base64 encoded signature
  customerEmail: EmailSchema.optional(),
  sendCopy: z.boolean().default(true),
  submitToWaterDept: z.boolean().default(true)
});

// ═══════════════════════════════════════════════════════════════════════
// INVOICE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════

export const InvoiceStatusSchema = z.enum([
  'draft',
  'sent',
  'viewed',
  'paid',
  'partial',
  'overdue',
  'cancelled',
  'refunded'
]);

export const LineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unitPrice: CurrencySchema,
  amount: CurrencySchema,
  taxable: z.boolean().default(true)
});

export const InvoiceSchema = z.object({
  id: UUIDSchema.optional(),
  customerId: UUIDSchema,
  appointmentId: UUIDSchema.optional(),
  testReportId: UUIDSchema.optional(),
  status: InvoiceStatusSchema.default('draft'),
  issueDate: DateSchema.optional(),
  dueDate: DateSchema,
  lineItems: z.array(LineItemSchema).min(1),
  subtotal: CurrencySchema,
  taxRate: z.number().min(0).max(1).default(0.1025),
  taxAmount: CurrencySchema.optional(),
  discountAmount: CurrencySchema.default(0),
  totalAmount: CurrencySchema,
  paymentTerms: z.number().int().min(0).max(90).default(30),
  notes: z.string().max(5000).optional(),
  internalNotes: z.string().max(5000).optional()
});

export const InvoiceSearchSchema = z.object({
  customerId: UUIDSchema.optional(),
  status: InvoiceStatusSchema.optional(),
  dateFrom: DateSchema.optional(),
  dateTo: DateSchema.optional(),
  minAmount: CurrencySchema.optional(),
  maxAmount: CurrencySchema.optional(),
  overdue: z.boolean().optional(),
  pagination: PaginationSchema.optional()
});

// ═══════════════════════════════════════════════════════════════════════
// PAYMENT SCHEMAS
// ═══════════════════════════════════════════════════════════════════════

export const PaymentStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded',
  'cancelled'
]);

export const PaymentMethodSchema = z.enum([
  'credit_card',
  'debit_card',
  'ach',
  'check',
  'cash',
  'wire',
  'other'
]);

export const PaymentSchema = z.object({
  id: UUIDSchema.optional(),
  customerId: UUIDSchema,
  invoiceId: UUIDSchema.optional(),
  status: PaymentStatusSchema.default('pending'),
  amount: CurrencySchema,
  paymentMethod: PaymentMethodSchema,
  paymentDate: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().max(5000).optional()
});

export const StripePaymentSchema = z.object({
  invoiceId: UUIDSchema,
  paymentMethodId: z.string(),
  amount: CurrencySchema,
  savePaymentMethod: z.boolean().default(false)
});

export const RefundSchema = z.object({
  paymentId: UUIDSchema,
  amount: CurrencySchema,
  reason: z.string().max(500),
  notifyCustomer: z.boolean().default(true)
});

// ═══════════════════════════════════════════════════════════════════════
// NOTIFICATION SCHEMAS
// ═══════════════════════════════════════════════════════════════════════

export const NotificationTypeSchema = z.enum([
  'email',
  'sms',
  'push',
  'in_app'
]);

export const NotificationCategorySchema = z.enum([
  'appointment_reminder',
  'test_due',
  'invoice',
  'payment',
  'system',
  'marketing'
]);

export const NotificationSchema = z.object({
  userId: UUIDSchema.optional(),
  customerId: UUIDSchema.optional(),
  type: NotificationTypeSchema,
  category: NotificationCategorySchema,
  subject: z.string().max(255).optional(),
  message: z.string().min(1).max(10000),
  priority: PriorityLevelSchema.default('normal'),
  scheduledFor: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export const BulkNotificationSchema = z.object({
  recipients: z.array(UUIDSchema).min(1),
  type: NotificationTypeSchema,
  category: NotificationCategorySchema,
  subject: z.string().max(255).optional(),
  message: z.string().min(1).max(10000),
  priority: PriorityLevelSchema.default('normal'),
  scheduledFor: z.string().optional()
});

// ═══════════════════════════════════════════════════════════════════════
// API RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════

export const ApiSuccessSchema = <T extends z.ZodType>(dataSchema: T) => z.object({
  success: z.literal(true),
  data: dataSchema,
  metadata: z.object({
    timestamp: z.string(),
    version: z.string(),
    requestId: z.string()
  }).optional()
});

export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.any()).optional(),
    stack: z.string().optional()
  }),
  metadata: z.object({
    timestamp: z.string(),
    version: z.string(),
    requestId: z.string()
  }).optional()
});

export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) => z.object({
  success: z.literal(true),
  data: z.array(itemSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrevious: z.boolean()
  }),
  metadata: z.object({
    timestamp: z.string(),
    version: z.string(),
    requestId: z.string()
  }).optional()
});

// ═══════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════

export type Address = z.infer<typeof AddressSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type SignUp = z.infer<typeof SignUpSchema>;
export type SignIn = z.infer<typeof SignInSchema>;
export type CustomerSignIn = z.infer<typeof CustomerSignInSchema>;
export type Customer = z.infer<typeof CustomerSchema>;
export type Technician = z.infer<typeof TechnicianSchema>;
export type Device = z.infer<typeof DeviceSchema>;
export type Appointment = z.infer<typeof AppointmentSchema>;
export type TestReport = z.infer<typeof TestReportSchema>;
export type Invoice = z.infer<typeof InvoiceSchema>;
export type Payment = z.infer<typeof PaymentSchema>;
export type Notification = z.infer<typeof NotificationSchema>;

// ═══════════════════════════════════════════════════════════════════════
// VALIDATION UTILITIES
// ═══════════════════════════════════════════════════════════════════════

export function validateSchema<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Validation failed', result.error.errors);
  }
  return result.data;
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: z.ZodError['errors']
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function sanitizeInput(input: string): string {
  // Remove any potential SQL injection attempts
  return input
    .replace(/['";\\]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .trim();
}

export function validateAndSanitize<T>(
  schema: z.ZodType<T>,
  data: unknown
): T {
  // First sanitize string inputs
  if (typeof data === 'object' && data !== null) {
    const dataObj = data as Record<string, unknown>;
    Object.keys(dataObj).forEach(key => {
      if (typeof dataObj[key] === 'string') {
        dataObj[key] = sanitizeInput(dataObj[key] as string);
      }
    });
  }
  
  // Then validate with schema
  return validateSchema(schema, data);
}