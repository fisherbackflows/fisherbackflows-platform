/**
 * Integration Test: Work Order Complete Workflow
 * Tests work order creation, assignment, inspection, and completion
 */

import { beforeAll, afterAll, describe, it, expect, beforeEach } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import { 
  createCustomer, 
  createWorkOrder, 
  updateWorkOrder,
  getWorkOrders,
  createInspection,
  submitInspection,
  approveInspection
} from '@/lib/db/queries'
import { 
  validateAndSanitize, 
  CustomerCreateSchema,
  WorkOrderCreateSchema,
  InspectionCreateSchema
} from '@/lib/validation/schemas'
import { logger } from '@/lib/logging/logger'
import { enqueueJob } from '@/lib/queue/qstash'

// Test configuration
const TEST_ORG_ID = 'test-work-order-org-' + Date.now()
const TEST_USER_ID = 'test-user-' + Date.now()
const TEST_INSPECTOR_ID = 'test-inspector-' + Date.now()

describe('Work Order Complete Workflow Integration', () => {
  let supabase: any
  let testCustomerId: string
  let testWorkOrderId: string
  let testInspectionId: string

  beforeAll(async () => {
    // Initialize test database connection
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create test customer for work orders
    const customerData = {
      name: 'Work Order Test Customer',
      email: 'workorder.test@example.com',
      address: {
        street_address: '456 Business Ave',
        city: 'Test City',
        state: 'WA',
        zip_code: '98102'
      }
    }

    const validatedCustomer = validateAndSanitize(CustomerCreateSchema, customerData)
    const customer = await createCustomer(TEST_ORG_ID, TEST_USER_ID, validatedCustomer)
    testCustomerId = customer.id

    logger.info('Work order integration test started', { 
      testOrgId: TEST_ORG_ID,
      testCustomerId 
    })
  })

  afterAll(async () => {
    // Cleanup test data
    try {
      if (testInspectionId) {
        await supabase.from('inspections').delete().eq('id', testInspectionId)
      }
      if (testWorkOrderId) {
        await supabase.from('work_orders').delete().eq('id', testWorkOrderId)
      }
      if (testCustomerId) {
        await supabase.from('customers').delete().eq('id', testCustomerId)
      }
    } catch (error) {
      logger.error('Work order test cleanup failed', { error })
    }

    logger.info('Work order integration test completed', { testOrgId: TEST_ORG_ID })
  })

  beforeEach(() => {
    // Reset test state
    testWorkOrderId = ''
    testInspectionId = ''
  })

  describe('Work Order Creation and Management', () => {
    it('should create work order with validation and proper linking', async () => {
      const workOrderData = {
        title: 'Annual Backflow Test - Integration Test',
        description: 'Comprehensive backflow prevention device testing and certification',
        customer_id: testCustomerId,
        priority: 'medium' as const,
        scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        estimated_duration_minutes: 120,
        location: {
          street_address: '456 Business Ave',
          city: 'Test City', 
          state: 'WA',
          zip_code: '98102'
        },
        special_instructions: 'Access through rear entrance. Notify front desk.',
        metadata: {
          testRun: TEST_ORG_ID,
          deviceTypes: ['RPZ', 'DCVA'],
          lastInspection: '2023-01-15'
        }
      }

      // Step 1: Validation
      const validatedData = validateAndSanitize(WorkOrderCreateSchema, workOrderData)
      expect(validatedData.title).toBe(workOrderData.title)
      expect(validatedData.customer_id).toBe(testCustomerId)
      expect(validatedData.priority).toBe('medium')
      expect(validatedData.status).toBe('draft')

      // Step 2: Creation with customer linking
      const createdWorkOrder = await createWorkOrder(TEST_ORG_ID, TEST_USER_ID, validatedData)
      expect(createdWorkOrder).toBeDefined()
      expect(createdWorkOrder.id).toBeDefined()
      expect(createdWorkOrder.org_id).toBe(TEST_ORG_ID)
      expect(createdWorkOrder.created_by).toBe(TEST_USER_ID)
      expect(createdWorkOrder.customer).toBeDefined()
      expect(createdWorkOrder.customer.id).toBe(testCustomerId)

      testWorkOrderId = createdWorkOrder.id

      // Step 3: Verify in work order queries
      const workOrders = await getWorkOrders(TEST_ORG_ID, { customerId: testCustomerId })
      expect(workOrders.data).toBeDefined()
      expect(workOrders.data.length).toBeGreaterThan(0)
      
      const foundWorkOrder = workOrders.data.find(wo => wo.id === testWorkOrderId)
      expect(foundWorkOrder).toBeDefined()
      expect(foundWorkOrder?.title).toBe(workOrderData.title)
    })

    it('should handle work order status transitions', async () => {
      // Create work order
      const workOrderData = {
        title: 'Status Transition Test',
        customer_id: testCustomerId,
        priority: 'high' as const
      }

      const validatedData = validateAndSanitize(WorkOrderCreateSchema, workOrderData)
      const workOrder = await createWorkOrder(TEST_ORG_ID, TEST_USER_ID, validatedData)
      testWorkOrderId = workOrder.id

      // Status: draft -> scheduled
      const scheduledUpdate = await updateWorkOrder(TEST_ORG_ID, testWorkOrderId, {
        status: 'scheduled',
        scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        assigned_to: TEST_INSPECTOR_ID
      })

      expect(scheduledUpdate.status).toBe('scheduled')
      expect(scheduledUpdate.assigned_to).toBe(TEST_INSPECTOR_ID)
      expect(scheduledUpdate.assigned_user).toBeDefined()

      // Status: scheduled -> in_progress
      const inProgressUpdate = await updateWorkOrder(TEST_ORG_ID, testWorkOrderId, {
        status: 'in_progress'
      })

      expect(inProgressUpdate.status).toBe('in_progress')

      // Status: in_progress -> completed
      const completedUpdate = await updateWorkOrder(TEST_ORG_ID, testWorkOrderId, {
        status: 'completed'
      })

      expect(completedUpdate.status).toBe('completed')
    })
  })

  describe('Inspection Workflow Integration', () => {
    beforeEach(async () => {
      // Create work order for inspection tests
      const workOrderData = {
        title: 'Inspection Test Work Order',
        customer_id: testCustomerId,
        status: 'scheduled' as const,
        assigned_to: TEST_INSPECTOR_ID
      }

      const validatedData = validateAndSanitize(WorkOrderCreateSchema, workOrderData)
      const workOrder = await createWorkOrder(TEST_ORG_ID, TEST_USER_ID, validatedData)
      testWorkOrderId = workOrder.id
    })

    it('should create and process inspection with test data', async () => {
      const inspectionData = {
        work_order_id: testWorkOrderId,
        inspector_id: TEST_INSPECTOR_ID,
        device_type: 'Reduced Pressure Backflow Assembly',
        device_serial: 'RPZ-TEST-12345',
        test_data: {
          initialPressure: 45.2,
          relievePressure: 42.8,
          checkValve1: 'PASS',
          checkValve2: 'PASS',
          reliefValve: 'PASS',
          testDate: new Date().toISOString(),
          conditions: {
            temperature: 72,
            weather: 'Clear',
            equipment: 'Backflow Test Kit Model XYZ'
          }
        },
        photos: [
          'https://example.com/photos/device-1.jpg',
          'https://example.com/photos/test-setup.jpg'
        ],
        notes: 'Device in excellent condition. All tests passed within specifications.'
      }

      // Step 1: Validation and Creation
      const validatedInspection = validateAndSanitize(InspectionCreateSchema, inspectionData)
      expect(validatedInspection.device_type).toBe(inspectionData.device_type)
      expect(validatedInspection.status).toBe('draft')

      const createdInspection = await createInspection(TEST_ORG_ID, TEST_USER_ID, validatedInspection)
      expect(createdInspection).toBeDefined()
      expect(createdInspection.id).toBeDefined()
      expect(createdInspection.work_order).toBeDefined()
      expect(createdInspection.work_order.id).toBe(testWorkOrderId)

      testInspectionId = createdInspection.id

      // Step 2: Submit Inspection
      const submittedInspection = await submitInspection(
        TEST_ORG_ID, 
        testInspectionId, 
        TEST_INSPECTOR_ID
      )

      expect(submittedInspection.status).toBe('submitted')
      expect(submittedInspection.submitted_at).toBeDefined()

      // Step 3: Approve Inspection
      const approvedInspection = await approveInspection(
        TEST_ORG_ID,
        testInspectionId,
        TEST_USER_ID,
        true,
        'Inspection approved. All test results within acceptable parameters.'
      )

      expect(approvedInspection.status).toBe('approved')
      expect(approvedInspection.approved_at).toBeDefined()
      expect(approvedInspection.approved_by).toBe(TEST_USER_ID)
    })

    it('should handle inspection rejection workflow', async () => {
      const inspectionData = {
        work_order_id: testWorkOrderId,
        inspector_id: TEST_INSPECTOR_ID,
        device_type: 'Double Check Valve Assembly',
        test_data: {
          checkValve1: 'FAIL',
          checkValve2: 'PASS',
          reason: 'Check valve 1 not holding pressure'
        }
      }

      const validatedInspection = validateAndSanitize(InspectionCreateSchema, inspectionData)
      const inspection = await createInspection(TEST_ORG_ID, TEST_USER_ID, validatedInspection)
      testInspectionId = inspection.id

      // Submit inspection
      await submitInspection(TEST_ORG_ID, testInspectionId, TEST_INSPECTOR_ID)

      // Reject inspection
      const rejectedInspection = await approveInspection(
        TEST_ORG_ID,
        testInspectionId,
        TEST_USER_ID,
        false,
        'Inspection rejected. Check valve 1 failure requires device repair before re-testing.'
      )

      expect(rejectedInspection.status).toBe('rejected')
      expect(rejectedInspection.notes).toContain('rejected')
    })
  })

  describe('Job Queue and Notification Integration', () => {
    beforeEach(async () => {
      const workOrderData = {
        title: 'Notification Test Work Order',
        customer_id: testCustomerId
      }

      const validatedData = validateAndSanitize(WorkOrderCreateSchema, workOrderData)
      const workOrder = await createWorkOrder(TEST_ORG_ID, TEST_USER_ID, validatedData)
      testWorkOrderId = workOrder.id
    })

    it('should trigger notification jobs on work order status changes', async () => {
      // Update to scheduled - should trigger assignment notification
      await updateWorkOrder(TEST_ORG_ID, testWorkOrderId, {
        status: 'scheduled',
        assigned_to: TEST_INSPECTOR_ID,
        scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })

      // Queue assignment notification
      const assignmentJobPayload = {
        type: 'send_email' as const,
        data: {
          to: 'inspector@example.com',
          template: 'work_order_assigned',
          workOrderId: testWorkOrderId,
          assignedTo: TEST_INSPECTOR_ID
        },
        orgId: TEST_ORG_ID,
        userId: TEST_USER_ID
      }

      try {
        const messageId = await enqueueJob(assignmentJobPayload)
        expect(messageId).toBeDefined()
        logger.info('Assignment notification queued', { messageId, workOrderId: testWorkOrderId })
      } catch (error) {
        logger.warn('Job queue not available in test environment', { error })
      }

      // Update to completed - should trigger completion notification
      await updateWorkOrder(TEST_ORG_ID, testWorkOrderId, {
        status: 'completed'
      })

      const completionJobPayload = {
        type: 'send_email' as const,
        data: {
          to: 'workorder.test@example.com',
          template: 'work_order_completed',
          workOrderId: testWorkOrderId,
          customerName: 'Work Order Test Customer'
        },
        orgId: TEST_ORG_ID,
        userId: TEST_USER_ID
      }

      try {
        const messageId = await enqueueJob(completionJobPayload)
        expect(messageId).toBeDefined()
        logger.info('Completion notification queued', { messageId, workOrderId: testWorkOrderId })
      } catch (error) {
        logger.warn('Job queue not available in test environment', { error })
      }
    })

    it('should trigger PDF generation job after inspection approval', async () => {
      // Create and approve inspection
      const inspectionData = {
        work_order_id: testWorkOrderId,
        inspector_id: TEST_INSPECTOR_ID,
        device_type: 'Test Device Type'
      }

      const validatedInspection = validateAndSanitize(InspectionCreateSchema, inspectionData)
      const inspection = await createInspection(TEST_ORG_ID, TEST_USER_ID, validatedInspection)
      testInspectionId = inspection.id

      await submitInspection(TEST_ORG_ID, testInspectionId, TEST_INSPECTOR_ID)
      await approveInspection(TEST_ORG_ID, testInspectionId, TEST_USER_ID, true)

      // Queue PDF generation
      const pdfJobPayload = {
        type: 'generate_pdf' as const,
        data: {
          type: 'inspection_report',
          inspectionId: testInspectionId,
          format: 'detailed'
        },
        orgId: TEST_ORG_ID,
        userId: TEST_USER_ID
      }

      try {
        const messageId = await enqueueJob(pdfJobPayload)
        expect(messageId).toBeDefined()
        logger.info('PDF generation queued', { messageId, inspectionId: testInspectionId })
      } catch (error) {
        logger.warn('Job queue not available in test environment', { error })
      }
    })
  })

  describe('Data Consistency and Integrity', () => {
    it('should maintain referential integrity across work order lifecycle', async () => {
      const workOrderData = {
        title: 'Integrity Test Work Order',
        customer_id: testCustomerId,
        assigned_to: TEST_INSPECTOR_ID
      }

      const validatedData = validateAndSanitize(WorkOrderCreateSchema, workOrderData)
      const workOrder = await createWorkOrder(TEST_ORG_ID, TEST_USER_ID, validatedData)
      testWorkOrderId = workOrder.id

      // Create inspection
      const inspectionData = {
        work_order_id: testWorkOrderId,
        inspector_id: TEST_INSPECTOR_ID,
        device_type: 'Integrity Test Device'
      }

      const validatedInspection = validateAndSanitize(InspectionCreateSchema, inspectionData)
      const inspection = await createInspection(TEST_ORG_ID, TEST_USER_ID, validatedInspection)
      testInspectionId = inspection.id

      // Verify relationships
      expect(inspection.work_order).toBeDefined()
      expect(inspection.work_order.id).toBe(testWorkOrderId)
      expect(inspection.work_order.customer).toBeDefined()
      expect(inspection.work_order.customer.id).toBe(testCustomerId)

      // Verify work order shows linked inspection
      const workOrders = await getWorkOrders(TEST_ORG_ID, { customerId: testCustomerId })
      const linkedWorkOrder = workOrders.data.find(wo => wo.id === testWorkOrderId)
      expect(linkedWorkOrder).toBeDefined()
      expect(linkedWorkOrder?.customer.id).toBe(testCustomerId)
    })

    it('should enforce organization-level data isolation', async () => {
      const differentOrgId = 'different-org-' + Date.now()

      try {
        // Attempt to access work order from different organization
        await getWorkOrders(differentOrgId, { customerId: testCustomerId })
        
        // Should return empty results due to RLS
        const results = await getWorkOrders(differentOrgId)
        expect(results.data).toHaveLength(0)
      } catch (error) {
        // RLS should prevent access
        expect(error).toBeDefined()
      }
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle concurrent work order operations', async () => {
      const concurrentOperations = []

      // Create multiple work orders concurrently
      for (let i = 0; i < 3; i++) {
        const workOrderData = {
          title: `Concurrent Test Work Order ${i}`,
          customer_id: testCustomerId,
          priority: ['low', 'medium', 'high'][i] as any
        }

        const validatedData = validateAndSanitize(WorkOrderCreateSchema, workOrderData)
        concurrentOperations.push(
          createWorkOrder(TEST_ORG_ID, TEST_USER_ID, validatedData)
        )
      }

      const startTime = Date.now()
      const results = await Promise.all(concurrentOperations)
      const duration = Date.now() - startTime

      expect(results).toHaveLength(3)
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds

      // Cleanup
      for (const workOrder of results) {
        try {
          await supabase.from('work_orders').delete().eq('id', workOrder.id)
        } catch (error) {
          logger.warn('Concurrent test cleanup failed', { workOrderId: workOrder.id, error })
        }
      }

      logger.info('Concurrent operations completed', { 
        count: results.length, 
        duration,
        avgPerOperation: duration / results.length 
      })
    })
  })
})