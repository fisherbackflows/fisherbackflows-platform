/**
 * Unit Tests - Validation Schemas
 */

import { 
  validateSchema, 
  ValidationError,
  CustomerSchema,
  AppointmentSchema,
  InvoiceSchema,
  PaymentSchema,
  sanitizeInput,
  validateAndSanitize
} from '@/lib/validation/schemas';

describe('Validation Schemas', () => {
  describe('validateSchema', () => {
    it('should validate valid data', () => {
      const data = { email: 'test@example.com' };
      const schema = { safeParse: jest.fn().mockReturnValue({ success: true, data }) };
      
      const result = validateSchema(schema, data);
      
      expect(result).toBe(data);
      expect(schema.safeParse).toHaveBeenCalledWith(data);
    });
    
    it('should throw ValidationError for invalid data', () => {
      const errors = [{ message: 'Invalid email' }];
      const schema = { safeParse: jest.fn().mockReturnValue({ success: false, error: { errors } }) };
      
      expect(() => validateSchema(schema, {})).toThrow(ValidationError);
    });
  });

  describe('CustomerSchema', () => {
    const validCustomer = {
      accountNumber: 'FISH001',
      contactName: 'John Doe',
      email: 'john@example.com',
      phone: '+12532788692',
      serviceAddress: {
        street: '123 Main St',
        city: 'Tacoma',
        state: 'WA',
        zip: '98401'
      }
    };

    it('should validate a valid customer', () => {
      const result = CustomerSchema.safeParse(validCustomer);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidCustomer = { ...validCustomer, email: 'invalid-email' };
      const result = CustomerSchema.safeParse(invalidCustomer);
      expect(result.success).toBe(false);
    });

    it('should reject invalid phone', () => {
      const invalidCustomer = { ...validCustomer, phone: '123' };
      const result = CustomerSchema.safeParse(invalidCustomer);
      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const invalidCustomer = { email: 'test@example.com' };
      const result = CustomerSchema.safeParse(invalidCustomer);
      expect(result.success).toBe(false);
    });
  });

  describe('AppointmentSchema', () => {
    const validAppointment = {
      customerId: '123e4567-e89b-12d3-a456-426614174000',
      status: 'scheduled',
      scheduledDate: '2025-01-15',
      scheduledTime: '09:00',
      serviceType: 'annual_test'
    };

    it('should validate a valid appointment', () => {
      const result = AppointmentSchema.safeParse(validAppointment);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const invalidAppointment = { ...validAppointment, customerId: 'invalid-uuid' };
      const result = AppointmentSchema.safeParse(invalidAppointment);
      expect(result.success).toBe(false);
    });

    it('should reject invalid date format', () => {
      const invalidAppointment = { ...validAppointment, scheduledDate: '01/15/2025' };
      const result = AppointmentSchema.safeParse(invalidAppointment);
      expect(result.success).toBe(false);
    });

    it('should reject invalid time format', () => {
      const invalidAppointment = { ...validAppointment, scheduledTime: '9:00 AM' };
      const result = AppointmentSchema.safeParse(invalidAppointment);
      expect(result.success).toBe(false);
    });
  });

  describe('InvoiceSchema', () => {
    const validInvoice = {
      customerId: '123e4567-e89b-12d3-a456-426614174000',
      dueDate: '2025-02-15',
      lineItems: [
        {
          description: 'Backflow Test',
          quantity: 1,
          unitPrice: 175.00,
          amount: 175.00
        }
      ],
      subtotal: 175.00,
      totalAmount: 192.94
    };

    it('should validate a valid invoice', () => {
      const result = InvoiceSchema.safeParse(validInvoice);
      expect(result.success).toBe(true);
    });

    it('should reject negative amounts', () => {
      const invalidInvoice = { ...validInvoice, subtotal: -100 };
      const result = InvoiceSchema.safeParse(invalidInvoice);
      expect(result.success).toBe(false);
    });

    it('should reject empty line items', () => {
      const invalidInvoice = { ...validInvoice, lineItems: [] };
      const result = InvoiceSchema.safeParse(invalidInvoice);
      expect(result.success).toBe(false);
    });
  });

  describe('PaymentSchema', () => {
    const validPayment = {
      customerId: '123e4567-e89b-12d3-a456-426614174000',
      amount: 175.00,
      paymentMethod: 'credit_card'
    };

    it('should validate a valid payment', () => {
      const result = PaymentSchema.safeParse(validPayment);
      expect(result.success).toBe(true);
    });

    it('should reject zero or negative amounts', () => {
      const invalidPayment = { ...validPayment, amount: 0 };
      const result = PaymentSchema.safeParse(invalidPayment);
      expect(result.success).toBe(false);
    });

    it('should reject invalid payment method', () => {
      const invalidPayment = { ...validPayment, paymentMethod: 'bitcoin' };
      const result = PaymentSchema.safeParse(invalidPayment);
      expect(result.success).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove dangerous characters', () => {
      const malicious = "'; DROP TABLE users; --";
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).toBe(' DROP TABLE users ');
    });

    it('should remove SQL injection attempts', () => {
      const malicious = "admin' OR '1'='1";
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).toBe("admin OR 1=1");
    });

    it('should trim whitespace', () => {
      const input = '  test  ';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe('test');
    });

    it('should handle normal strings', () => {
      const input = 'John Doe';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe('John Doe');
    });
  });

  describe('validateAndSanitize', () => {
    const testSchema = {
      safeParse: jest.fn().mockReturnValue({
        success: true,
        data: { name: 'John' }
      })
    };

    it('should sanitize string inputs before validation', () => {
      const data = { name: "'; DROP TABLE;" };
      
      validateAndSanitize(testSchema, data);
      
      expect(testSchema.safeParse).toHaveBeenCalledWith({
        name: ' DROP TABLE'
      });
    });

    it('should handle non-string values', () => {
      const data = { age: 25, active: true };
      
      validateAndSanitize(testSchema, data);
      
      expect(testSchema.safeParse).toHaveBeenCalledWith(data);
    });
  });
});