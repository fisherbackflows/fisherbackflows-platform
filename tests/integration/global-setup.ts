/**
 * Global Setup for Integration Tests
 * Runs before all integration tests to prepare the test environment
 */

import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logging/logger'

export default async function globalSetup() {
  console.log('🔧 Setting up integration test environment...')

  try {
    // Verify database connection
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )

      // Test database connection
      const { data, error } = await supabase.from('customers').select('id').limit(1)
      
      if (error) {
        console.warn('⚠️  Database connection failed - tests will use mocks:', error.message)
      } else {
        console.log('✅ Database connection verified')
      }
    }

    // Verify external service connections (optional)
    const services = {
      redis: process.env.UPSTASH_REDIS_REST_URL,
      qstash: process.env.QSTASH_TOKEN,
      resend: process.env.RESEND_API_KEY
    }

    Object.entries(services).forEach(([service, config]) => {
      if (config) {
        console.log(`✅ ${service.toUpperCase()} configuration found`)
      } else {
        console.log(`⚠️  ${service.toUpperCase()} not configured - using mocks`)
      }
    })

    // Set up test data cleanup tracking
    global.testCleanupIds = {
      customers: [],
      workOrders: [],
      inspections: []
    }

    console.log('✅ Integration test environment setup complete')

  } catch (error) {
    console.error('❌ Integration test setup failed:', error)
    throw error
  }
}