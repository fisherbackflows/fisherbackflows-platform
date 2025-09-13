/**
 * Integration Test Environment Configuration
 * Sets up environment variables for integration testing
 */

// Ensure required environment variables are set
process.env.NODE_ENV = 'test'

// Database configuration
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key'

// App URL for testing
process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'

// Cache configuration (use test values if not set)
process.env.CACHE_TTL_SHORT = process.env.CACHE_TTL_SHORT || '10'
process.env.CACHE_TTL_MEDIUM = process.env.CACHE_TTL_MEDIUM || '30'
process.env.CACHE_TTL_LONG = process.env.CACHE_TTL_LONG || '60'

// Queue configuration (mock values for testing)
process.env.QSTASH_TOKEN = process.env.QSTASH_TOKEN || 'test-qstash-token'
process.env.QSTASH_CURRENT_SIGNING_KEY = process.env.QSTASH_CURRENT_SIGNING_KEY || 'test-current-key'
process.env.QSTASH_NEXT_SIGNING_KEY = process.env.QSTASH_NEXT_SIGNING_KEY || 'test-next-key'

// Email service configuration
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 'test-resend-key'
process.env.RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'test@example.com'

// Redis configuration (mock values for testing)
process.env.UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL || 'https://test-redis.upstash.io'
process.env.UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || 'test-redis-token'

// Logging configuration
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'warn'

// Test database prefix to avoid conflicts
process.env.TEST_DB_PREFIX = 'integration_test_' + Date.now()

export {}