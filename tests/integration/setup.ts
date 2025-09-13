/**
 * Integration Test Setup
 * Global setup for integration tests with database and external services
 */

import { jest } from '@jest/globals'

// Extend Jest timeout for integration tests
jest.setTimeout(30000)

// Mock external services that might not be available in test environment
beforeAll(() => {
  // Mock Upstash Redis if not available
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    jest.mock('@upstash/redis', () => ({
      Redis: jest.fn().mockImplementation(() => ({
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        setex: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
        keys: jest.fn().mockResolvedValue([]),
        incr: jest.fn().mockResolvedValue(1),
        expire: jest.fn().mockResolvedValue(1),
        mget: jest.fn().mockResolvedValue([]),
        pipeline: jest.fn().mockReturnValue({
          setex: jest.fn(),
          set: jest.fn(),
          exec: jest.fn().mockResolvedValue([])
        })
      }))
    }))
  }

  // Mock QStash if not available
  if (!process.env.QSTASH_TOKEN) {
    jest.mock('@upstash/qstash', () => ({
      Client: jest.fn().mockImplementation(() => ({
        publishJSON: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
        messages: {
          get: jest.fn().mockResolvedValue({ status: 'delivered' })
        },
        schedules: {
          create: jest.fn().mockResolvedValue({ scheduleId: 'mock-schedule-id' }),
          delete: jest.fn().mockResolvedValue(true)
        },
        dlq: {
          get: jest.fn().mockResolvedValue({ messages: [] }),
          delete: jest.fn().mockResolvedValue(true)
        }
      })),
      Receiver: jest.fn().mockImplementation(() => ({
        verify: jest.fn().mockResolvedValue(true)
      }))
    }))
  }

  // Mock Resend if not available
  if (!process.env.RESEND_API_KEY) {
    jest.mock('resend', () => ({
      Resend: jest.fn().mockImplementation(() => ({
        emails: {
          send: jest.fn().mockResolvedValue({ 
            id: 'mock-email-id',
            from: 'test@example.com',
            to: ['recipient@example.com'],
            subject: 'Test Email'
          })
        },
        batch: {
          send: jest.fn().mockResolvedValue([
            { id: 'mock-batch-id-1' },
            { id: 'mock-batch-id-2' }
          ])
        }
      }))
    }))
  }

  // Console overrides for cleaner test output
  const originalConsole = console
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: originalConsole.warn,
    error: originalConsole.error
  }
})

afterAll(() => {
  // Restore original console
  global.console = console
})