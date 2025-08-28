/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

// Mock console methods in test environment
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock fetch globally
global.fetch = jest.fn();

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/'
  })
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn()
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams()
}));

// Mock environment variables
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  STRIPE_SECRET_KEY: 'sk_test_fake_key',
  STRIPE_WEBHOOK_SECRET: 'whsec_test_secret',
  SENDGRID_API_KEY: 'SG.test_key',
  REDIS_URL: 'redis://localhost:6379',
  JWT_SECRET: 'test-jwt-secret',
  ENCRYPTION_KEY: 'test-encryption-key'
};

// Global test utilities
global.testUtils = {
  // Create a mock user
  createMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    full_name: 'Test User',
    role: 'customer',
    created_at: new Date().toISOString(),
    ...overrides
  }),
  
  // Create a mock customer
  createMockCustomer: (overrides = {}) => ({
    id: 'test-customer-id',
    account_number: 'TEST001',
    contact_name: 'Test Customer',
    email: 'customer@example.com',
    phone: '2532788692',
    service_address: {
      street: '123 Test St',
      city: 'Tacoma',
      state: 'WA',
      zip: '98401'
    },
    balance: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    ...overrides
  }),
  
  // Create a mock appointment
  createMockAppointment: (overrides = {}) => ({
    id: 'test-appointment-id',
    customer_id: 'test-customer-id',
    technician_id: 'test-technician-id',
    status: 'scheduled',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '09:00',
    service_type: 'annual_test',
    created_at: new Date().toISOString(),
    ...overrides
  }),
  
  // Create a mock invoice
  createMockInvoice: (overrides = {}) => ({
    id: 'test-invoice-id',
    customer_id: 'test-customer-id',
    invoice_number: 'INV-202501-0001',
    status: 'sent',
    subtotal: 175.00,
    tax_amount: 17.94,
    total_amount: 192.94,
    balance_due: 192.94,
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    line_items: [
      {
        description: 'Annual Backflow Test',
        quantity: 1,
        unit_price: 175.00,
        amount: 175.00
      }
    ],
    created_at: new Date().toISOString(),
    ...overrides
  }),
  
  // Wait for async operations
  waitFor: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Mock API response
  mockApiResponse: (data, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Map()
  })
};

// Set up fake timers
jest.useFakeTimers('modern');

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});

// Clean up after all tests
afterAll(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});