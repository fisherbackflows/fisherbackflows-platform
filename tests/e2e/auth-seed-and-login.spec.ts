import { test, expect } from '@playwright/test'

test.describe('Auth E2E: seed → login', () => {
  test('seeds a test user and logs in via API', async ({ request }) => {
    const adminSeedKey = process.env.ADMIN_SEED_KEY
    test.skip(!adminSeedKey, 'ADMIN_SEED_KEY not set in environment')

    // Health check first to avoid noisy failures
    const health = await request.get('/api/auth/health')
    expect(health.ok()).toBeTruthy()
    const healthJson = await health.json()
    expect(healthJson?.env?.NEXT_PUBLIC_SUPABASE_URL).toBeTruthy()
    expect(healthJson?.env?.SUPABASE_SERVICE_ROLE_KEY).toBeTruthy()

    const email = `e2e+${Date.now()}@example.com`
    const password = 'TestPassword123!'

    // Seed or upsert a working test user
    const seed = await request.post('/api/auth/seed-test-user', {
      headers: { 'x-admin-seed-key': adminSeedKey!, 'content-type': 'application/json' },
      data: { email, password, firstName: 'E2E', lastName: 'User' },
    })
    expect(seed.ok()).toBeTruthy()
    const seedJson = await seed.json()
    expect(seedJson?.success).toBeTruthy()
    expect(seedJson?.user?.customerId).toBeTruthy()

    // Login with seeded credentials
    const login = await request.post('/api/auth/login', {
      headers: { 'content-type': 'application/json' },
      data: { email, password },
    })
    expect(login.ok()).toBeTruthy()
    const loginJson = await login.json()
    expect(loginJson?.success).toBeTruthy()
    expect(loginJson?.user?.email).toBe(email)
  })
})

