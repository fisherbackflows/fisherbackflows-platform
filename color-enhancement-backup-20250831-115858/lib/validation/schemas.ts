/**
 * Validation Schemas - Fisher Backflows
 * Zod schemas for data validation
 */

import { z } from 'zod';

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

export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}