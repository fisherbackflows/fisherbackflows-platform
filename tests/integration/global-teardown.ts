/**
 * Global Teardown for Integration Tests
 * Runs after all integration tests to clean up the test environment
 */

import { createClient } from '@supabase/supabase-js'

export default async function globalTeardown() {
  console.log('🧹 Cleaning up integration test environment...')

  try {
    // Clean up test data from database if available
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )

      // Get cleanup IDs from global state
      const cleanupIds = (global as any).testCleanupIds || {
        customers: [],
        workOrders: [],
        inspections: []
      }

      // Clean up inspections first (child records)
      if (cleanupIds.inspections.length > 0) {
        const { error: inspectionError } = await supabase
          .from('inspections')
          .delete()
          .in('id', cleanupIds.inspections)
        
        if (!inspectionError) {
          console.log(`✅ Cleaned up ${cleanupIds.inspections.length} test inspections`)
        }
      }

      // Clean up work orders
      if (cleanupIds.workOrders.length > 0) {
        const { error: workOrderError } = await supabase
          .from('work_orders')
          .delete()
          .in('id', cleanupIds.workOrders)
        
        if (!workOrderError) {
          console.log(`✅ Cleaned up ${cleanupIds.workOrders.length} test work orders`)
        }
      }

      // Clean up customers last (parent records)
      if (cleanupIds.customers.length > 0) {
        const { error: customerError } = await supabase
          .from('customers')
          .delete()
          .in('id', cleanupIds.customers)
        
        if (!customerError) {
          console.log(`✅ Cleaned up ${cleanupIds.customers.length} test customers`)
        }
      }

      // Clean up any test organizations that might have been created
      const testOrgPattern = 'test-%'
      const { error: orgError } = await supabase
        .from('organizations')
        .delete()
        .ilike('id', testOrgPattern)
      
      if (!orgError) {
        console.log('✅ Cleaned up test organizations')
      }

      // Clean up any test audit logs
      const { error: auditError } = await supabase
        .from('audit_logs')
        .delete()
        .ilike('org_id', testOrgPattern)
      
      if (!auditError) {
        console.log('✅ Cleaned up test audit logs')
      }
    }

    // Clear any cached data or temporary files
    // This would be expanded based on specific cleanup needs

    console.log('✅ Integration test cleanup complete')

  } catch (error) {
    console.error('❌ Integration test cleanup failed:', error)
    // Don't throw error - cleanup failure shouldn't fail the test suite
  }
}