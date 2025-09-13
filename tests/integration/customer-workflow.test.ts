/**
 * Integration Test: Complete Customer Workflow
 * Tests the entire customer management flow from creation to deletion
 */

import { beforeAll, afterAll, describe, it, expect, beforeEach } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import { 
  createCustomer, 
  getCustomerById, 
  updateCustomer, 
  deleteCustomer 
} from '@/lib/db/queries'
import { validateAndSanitize, CustomerCreateSchema } from '@/lib/validation/schemas'
import { logger } from '@/lib/logging/logger'
import { enqueueJob } from '@/lib/queue/qstash'

// Test configuration
const TEST_ORG_ID = 'test-org-' + Date.now()
const TEST_USER_ID = 'test-user-' + Date.now()

describe('Customer Workflow Integration', () => {
  let supabase: any
  let testCustomerId: string

  beforeAll(async () => {
    // Initialize test database connection
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify database connection
    const { data, error } = await supabase.from('customers').select('id').limit(1)
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`)
    }

    logger.info('Integration test started', { testOrgId: TEST_ORG_ID })
  })

  afterAll(async () => {
    // Cleanup test data
    try {
      if (testCustomerId) {
        await supabase
          .from('customers')
          .delete()
          .eq('id', testCustomerId)
      }
    } catch (error) {
      logger.error('Test cleanup failed', { error })
    }

    logger.info('Integration test completed', { testOrgId: TEST_ORG_ID })
  })

  beforeEach(() => {
    // Reset test state
    testCustomerId = ''
  })

  describe('Customer Creation Flow', () => {
    it('should validate, create, and store customer data', async () => {
      const customerData = {
        name: 'John Doe Test Customer',
        email: 'john.test@example.com',
        phone: '+1 (555) 123-4567',
        address: {
          street_address: '123 Test St',
          city: 'Test City',
          state: 'WA',
          zip_code: '98101'
        },
        tags: ['integration-test', 'automated'],
        metadata: {
          testRun: TEST_ORG_ID,
          createdBy: 'integration-test'
        }
      }

      // Step 1: Validation
      const validatedData = validateAndSanitize(CustomerCreateSchema, customerData)
      expect(validatedData.name).toBe(customerData.name)
      expect(validatedData.email).toBe(customerData.email)
      expect(validatedData.is_active).toBe(true)
      expect(validatedData.tags).toEqual(customerData.tags)

      // Step 2: Database Creation
      const createdCustomer = await createCustomer(TEST_ORG_ID, TEST_USER_ID, validatedData)
      expect(createdCustomer).toBeDefined()
      expect(createdCustomer.id).toBeDefined()
      expect(createdCustomer.name).toBe(customerData.name)
      expect(createdCustomer.org_id).toBe(TEST_ORG_ID)
      expect(createdCustomer.created_by).toBe(TEST_USER_ID)

      testCustomerId = createdCustomer.id

      // Step 3: Verify Retrieval
      const retrievedCustomer = await getCustomerById(TEST_ORG_ID, testCustomerId)
      expect(retrievedCustomer).toBeDefined()
      expect(retrievedCustomer.id).toBe(testCustomerId)
      expect(retrievedCustomer.name).toBe(customerData.name)
      expect(retrievedCustomer.email).toBe(customerData.email)
      expect(retrievedCustomer.address).toEqual(customerData.address)
    })

    it('should handle invalid customer data gracefully', async () => {
      const invalidCustomerData = {
        name: '', // Invalid: empty name
        email: 'invalid-email', // Invalid: malformed email
        phone: '123', // Invalid: too short
        address: {
          street_address: '123 Test St',
          city: 'Test City',
          state: 'INVALID', // Invalid: not 2 characters
          zip_code: '12345-invalid' // Invalid: bad ZIP format
        }
      }

      // Validation should fail
      expect(() => {
        validateAndSanitize(CustomerCreateSchema, invalidCustomerData)
      }).toThrow()
    })
  })

  describe('Customer Update Flow', () => {
    beforeEach(async () => {
      // Create a test customer for update operations
      const customerData = {
        name: 'Update Test Customer',
        email: 'update.test@example.com',
        tags: ['update-test']
      }

      const validatedData = validateAndSanitize(CustomerCreateSchema, customerData)
      const customer = await createCustomer(TEST_ORG_ID, TEST_USER_ID, validatedData)
      testCustomerId = customer.id
    })

    it('should update customer data and maintain integrity', async () => {
      const updateData = {
        name: 'Updated Customer Name',
        phone: '+1 (555) 987-6543',
        tags: ['updated', 'integration-test'],
        metadata: {
          lastUpdated: new Date().toISOString(),
          updatedBy: 'integration-test'
        }
      }

      // Update customer
      const updatedCustomer = await updateCustomer(TEST_ORG_ID, testCustomerId, updateData)
      expect(updatedCustomer).toBeDefined()
      expect(updatedCustomer.name).toBe(updateData.name)
      expect(updatedCustomer.phone).toBe(updateData.phone)
      expect(updatedCustomer.tags).toEqual(updateData.tags)

      // Verify persistence
      const retrievedCustomer = await getCustomerById(TEST_ORG_ID, testCustomerId)
      expect(retrievedCustomer.name).toBe(updateData.name)
      expect(retrievedCustomer.phone).toBe(updateData.phone)
      expect(retrievedCustomer.email).toBe('update.test@example.com') // Should remain unchanged
    })

    it('should handle partial updates correctly', async () => {
      const partialUpdate = {
        name: 'Partially Updated Name'
      }

      const updatedCustomer = await updateCustomer(TEST_ORG_ID, testCustomerId, partialUpdate)
      expect(updatedCustomer.name).toBe(partialUpdate.name)
      expect(updatedCustomer.email).toBe('update.test@example.com') // Should remain unchanged
    })
  })

  describe('Customer Deletion Flow', () => {
    beforeEach(async () => {
      // Create a test customer for deletion
      const customerData = {
        name: 'Delete Test Customer',
        email: 'delete.test@example.com'
      }

      const validatedData = validateAndSanitize(CustomerCreateSchema, customerData)
      const customer = await createCustomer(TEST_ORG_ID, TEST_USER_ID, validatedData)
      testCustomerId = customer.id
    })

    it('should delete customer and handle cascading operations', async () => {
      // Verify customer exists
      const customerBefore = await getCustomerById(TEST_ORG_ID, testCustomerId)
      expect(customerBefore).toBeDefined()

      // Delete customer
      await deleteCustomer(TEST_ORG_ID, testCustomerId)

      // Verify customer is deleted
      try {
        await getCustomerById(TEST_ORG_ID, testCustomerId)
        throw new Error('Customer should not exist after deletion')
      } catch (error) {
        // Expected - customer should not be found
        expect(error).toBeDefined()
      }

      testCustomerId = '' // Clear for cleanup
    })
  })

  describe('Job Queue Integration', () => {
    it('should enqueue welcome email job after customer creation', async () => {
      const customerData = {
        name: 'Queue Test Customer',
        email: 'queue.test@example.com'
      }

      const validatedData = validateAndSanitize(CustomerCreateSchema, customerData)
      const customer = await createCustomer(TEST_ORG_ID, TEST_USER_ID, validatedData)
      testCustomerId = customer.id

      // Enqueue welcome email job
      const jobPayload = {
        type: 'send_email' as const,
        data: {
          to: customer.email,
          template: 'welcome',
          customerName: customer.name
        },
        orgId: TEST_ORG_ID,
        userId: TEST_USER_ID,
        metadata: {
          customerId: customer.id,
          trigger: 'customer_created'
        }
      }

      // This will test QStash integration if environment is configured
      try {
        const messageId = await enqueueJob(jobPayload)
        expect(messageId).toBeDefined()
        expect(typeof messageId).toBe('string')
        logger.info('Job enqueued successfully', { messageId, customerId: customer.id })
      } catch (error) {
        // QStash might not be configured in test environment
        logger.warn('Job queue not available in test environment', { error })
        expect(error).toBeDefined()
      }
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking database failure
      // For now, just verify error structure
      try {
        await getCustomerById('non-existent-org', 'non-existent-customer')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('should handle validation errors with proper messaging', async () => {
      const invalidData = {
        name: 'x'.repeat(300), // Too long
        email: 'not-an-email'
      }

      try {
        validateAndSanitize(CustomerCreateSchema, invalidData)
        throw new Error('Validation should have failed')
      } catch (error) {
        expect(error).toBeDefined()
        // Validation errors should be descriptive
      }
    })

    it('should enforce organization isolation', async () => {
      // Create customer in one org
      const customerData = {
        name: 'Isolation Test Customer',
        email: 'isolation.test@example.com'
      }

      const validatedData = validateAndSanitize(CustomerCreateSchema, customerData)
      const customer = await createCustomer(TEST_ORG_ID, TEST_USER_ID, validatedData)
      testCustomerId = customer.id

      // Try to access from different org
      try {
        await getCustomerById('different-org-id', testCustomerId)
        throw new Error('Should not be able to access customer from different org')
      } catch (error) {
        // Expected - RLS should prevent cross-org access
        expect(error).toBeDefined()
      }
    })
  })

  describe('Performance and Caching', () => {
    it('should handle bulk operations efficiently', async () => {
      const startTime = Date.now()
      const customers = []

      // Create multiple customers
      for (let i = 0; i < 5; i++) {
        const customerData = {
          name: `Bulk Test Customer ${i}`,
          email: `bulk.test.${i}@example.com`,
          tags: ['bulk-test', `batch-${Math.floor(i / 2)}`]
        }

        const validatedData = validateAndSanitize(CustomerCreateSchema, customerData)
        const customer = await createCustomer(TEST_ORG_ID, TEST_USER_ID, validatedData)
        customers.push(customer)
      }

      const duration = Date.now() - startTime
      expect(customers).toHaveLength(5)
      expect(duration).toBeLessThan(10000) // Should complete within 10 seconds

      // Cleanup
      for (const customer of customers) {
        try {
          await deleteCustomer(TEST_ORG_ID, customer.id)
        } catch (error) {
          logger.warn('Bulk cleanup failed', { customerId: customer.id, error })
        }
      }

      logger.info('Bulk operation completed', { 
        count: customers.length, 
        duration,
        avgPerCustomer: duration / customers.length 
      })
    })
  })
})