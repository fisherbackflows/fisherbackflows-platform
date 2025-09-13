import { describe, it, expect } from '@jest/globals'
import {
  CustomerCreateSchema,
  CustomerUpdateSchema,
  WorkOrderCreateSchema,
  InspectionCreateSchema,
  EmailSchema,
  PhoneSchema,
  AddressSchema,
  validateAndSanitize,
  safeValidate
} from '@/lib/validation/schemas'

describe('Validation Schemas', () => {
  describe('EmailSchema', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name+label@domain.co.uk',
        'user123@test-domain.com'
      ]

      validEmails.forEach(email => {
        expect(() => EmailSchema.parse(email)).not.toThrow()
      })
    })

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        'a'.repeat(250) + '@domain.com' // Too long
      ]

      invalidEmails.forEach(email => {
        expect(() => EmailSchema.parse(email)).toThrow()
      })
    })
  })

  describe('PhoneSchema', () => {
    it('should accept valid phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '(555) 123-4567',
        '555-123-4567',
        '+44 20 7123 4567',
        '206 123 4567'
      ]

      validPhones.forEach(phone => {
        expect(() => PhoneSchema.parse(phone)).not.toThrow()
      })
    })

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        'abc123',
        '123', // Too short
        'a'.repeat(25), // Too long
        ''
      ]

      invalidPhones.forEach(phone => {
        expect(() => PhoneSchema.parse(phone)).toThrow()
      })
    })
  })

  describe('AddressSchema', () => {
    const validAddress = {
      street_address: '123 Main St',
      city: 'Seattle',
      state: 'WA',
      zip_code: '98101'
    }

    it('should accept valid address', () => {
      expect(() => AddressSchema.parse(validAddress)).not.toThrow()
    })

    it('should accept address with ZIP+4', () => {
      const addressWithZip4 = {
        ...validAddress,
        zip_code: '98101-1234'
      }
      expect(() => AddressSchema.parse(addressWithZip4)).not.toThrow()
    })

    it('should default country to US', () => {
      const parsed = AddressSchema.parse(validAddress)
      expect(parsed.country).toBe('US')
    })

    it('should reject invalid ZIP codes', () => {
      const invalidZipCodes = ['1234', '123456', 'ABCDE', '98101-123']

      invalidZipCodes.forEach(zip => {
        expect(() => AddressSchema.parse({
          ...validAddress,
          zip_code: zip
        })).toThrow()
      })
    })

    it('should reject invalid state codes', () => {
      const invalidStates = ['Washington', 'W', 'WAA']

      invalidStates.forEach(state => {
        expect(() => AddressSchema.parse({
          ...validAddress,
          state
        })).toThrow()
      })
    })
  })

  describe('CustomerCreateSchema', () => {
    const validCustomer = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '(555) 123-4567',
      address: {
        street_address: '123 Main St',
        city: 'Seattle',
        state: 'WA',
        zip_code: '98101'
      }
    }

    it('should accept valid customer data', () => {
      expect(() => CustomerCreateSchema.parse(validCustomer)).not.toThrow()
    })

    it('should accept minimal customer data (name only)', () => {
      const minimalCustomer = { name: 'John Doe' }
      const parsed = CustomerCreateSchema.parse(minimalCustomer)
      
      expect(parsed.name).toBe('John Doe')
      expect(parsed.tags).toEqual([])
      expect(parsed.is_active).toBe(true)
    })

    it('should reject empty name', () => {
      expect(() => CustomerCreateSchema.parse({
        ...validCustomer,
        name: ''
      })).toThrow()
    })

    it('should reject name that is too long', () => {
      expect(() => CustomerCreateSchema.parse({
        ...validCustomer,
        name: 'a'.repeat(256)
      })).toThrow()
    })

    it('should validate nested address', () => {
      expect(() => CustomerCreateSchema.parse({
        ...validCustomer,
        address: {
          ...validCustomer.address,
          zip_code: 'invalid'
        }
      })).toThrow()
    })
  })

  describe('WorkOrderCreateSchema', () => {
    const validWorkOrder = {
      title: 'Backflow Inspection',
      description: 'Annual backflow prevention device inspection',
      customer_id: '123e4567-e89b-12d3-a456-426614174000',
      priority: 'medium' as const,
      location: {
        street_address: '456 Oak Ave',
        city: 'Portland',
        state: 'OR',
        zip_code: '97201'
      }
    }

    it('should accept valid work order data', () => {
      expect(() => WorkOrderCreateSchema.parse(validWorkOrder)).not.toThrow()
    })

    it('should set default values', () => {
      const minimalWorkOrder = {
        title: 'Test Work Order',
        customer_id: '123e4567-e89b-12d3-a456-426614174000'
      }
      
      const parsed = WorkOrderCreateSchema.parse(minimalWorkOrder)
      expect(parsed.priority).toBe('medium')
      expect(parsed.status).toBe('draft')
    })

    it('should validate UUID format for customer_id', () => {
      expect(() => WorkOrderCreateSchema.parse({
        ...validWorkOrder,
        customer_id: 'invalid-uuid'
      })).toThrow()
    })

    it('should validate priority enum', () => {
      expect(() => WorkOrderCreateSchema.parse({
        ...validWorkOrder,
        priority: 'invalid-priority'
      })).toThrow()
    })

    it('should validate scheduled_at as datetime', () => {
      expect(() => WorkOrderCreateSchema.parse({
        ...validWorkOrder,
        scheduled_at: 'invalid-date'
      })).toThrow()

      // Should accept valid ISO datetime
      expect(() => WorkOrderCreateSchema.parse({
        ...validWorkOrder,
        scheduled_at: '2024-01-15T10:00:00Z'
      })).not.toThrow()
    })
  })

  describe('InspectionCreateSchema', () => {
    const validInspection = {
      work_order_id: '123e4567-e89b-12d3-a456-426614174000',
      inspector_id: '123e4567-e89b-12d3-a456-426614174001',
      device_type: 'Reduced Pressure Backflow Assembly',
      device_serial: 'RPA-12345'
    }

    it('should accept valid inspection data', () => {
      expect(() => InspectionCreateSchema.parse(validInspection)).not.toThrow()
    })

    it('should set default values', () => {
      const parsed = InspectionCreateSchema.parse(validInspection)
      expect(parsed.photos).toEqual([])
      expect(parsed.status).toBe('draft')
    })

    it('should validate UUID format for IDs', () => {
      expect(() => InspectionCreateSchema.parse({
        ...validInspection,
        work_order_id: 'invalid-uuid'
      })).toThrow()

      expect(() => InspectionCreateSchema.parse({
        ...validInspection,
        inspector_id: 'invalid-uuid'
      })).toThrow()
    })

    it('should validate device_type length', () => {
      expect(() => InspectionCreateSchema.parse({
        ...validInspection,
        device_type: 'a'.repeat(101)
      })).toThrow()
    })
  })

  describe('validateAndSanitize utility', () => {
    it('should return parsed data for valid input', () => {
      const input = { name: 'John Doe' }
      const result = validateAndSanitize(CustomerCreateSchema, input)
      
      expect(result.name).toBe('John Doe')
      expect(result.is_active).toBe(true) // Default value
    })

    it('should throw error for invalid input', () => {
      const input = { name: '' } // Empty name should fail
      
      expect(() => validateAndSanitize(CustomerCreateSchema, input)).toThrow()
    })
  })

  describe('safeValidate utility', () => {
    it('should return success for valid input', () => {
      const input = { name: 'John Doe' }
      const result = safeValidate(CustomerCreateSchema, input)
      
      expect(result.success).toBe(true)
      expect(result.data?.name).toBe('John Doe')
      expect(result.errors).toBeUndefined()
    })

    it('should return error for invalid input', () => {
      const input = { name: '' } // Empty name should fail
      const result = safeValidate(CustomerCreateSchema, input)
      
      expect(result.success).toBe(false)
      expect(result.data).toBeUndefined()
      expect(result.errors).toBeDefined()
    })
  })

  describe('Complex validation scenarios', () => {
    it('should handle partial updates', () => {
      const partialUpdate = { name: 'Updated Name' }
      expect(() => CustomerUpdateSchema.parse(partialUpdate)).not.toThrow()
    })

    it('should validate nested objects in partial updates', () => {
      const partialUpdate = {
        address: {
          street_address: '789 New St',
          city: 'Vancouver',
          state: 'WA',
          zip_code: '98665'
        }
      }
      
      expect(() => CustomerUpdateSchema.parse(partialUpdate)).not.toThrow()
      
      // Should still validate nested address structure
      expect(() => CustomerUpdateSchema.parse({
        address: {
          street_address: '789 New St',
          city: 'Vancouver',
          state: 'WA',
          zip_code: 'invalid'
        }
      })).toThrow()
    })

    it('should handle arrays correctly', () => {
      const customerWithTags = {
        name: 'John Doe',
        tags: ['vip', 'commercial', 'priority']
      }
      
      const parsed = CustomerCreateSchema.parse(customerWithTags)
      expect(parsed.tags).toEqual(['vip', 'commercial', 'priority'])
    })

    it('should handle metadata objects', () => {
      const customerWithMetadata = {
        name: 'John Doe',
        metadata: {
          source: 'website',
          notes: 'Found through Google search',
          preferences: {
            contactMethod: 'email',
            timeZone: 'PST'
          }
        }
      }
      
      expect(() => CustomerCreateSchema.parse(customerWithMetadata)).not.toThrow()
    })
  })
})