/*
  Production Auth Verifier
  - Checks health endpoint
  - Seeds a test user via seed endpoint
  - Logs in with seeded credentials

  Usage:
    PROD_URL=https://fisherbackflows.com ADMIN_SEED_KEY=your-secret-key \
    node scripts/prod-auth-verify.js
*/

const fetch = require('node-fetch')

function log(title, data) {
  console.log(`\n=== ${title} ===`)
  console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2))
}

async function main() {
  const baseUrl = process.env.PROD_URL || process.env.TEST_URL
  const seedKey = process.env.ADMIN_SEED_KEY
  if (!baseUrl) throw new Error('Set PROD_URL (e.g., https://fisherbackflows.com)')
  if (!seedKey) throw new Error('Set ADMIN_SEED_KEY (same as in Vercel Production env)')

  const email = `prodtest+${Date.now()}@example.com`
  const password = 'TestPassword123!'

  // 1) Health
  const healthRes = await fetch(`${baseUrl}/api/auth/health`)
  const healthJson = await healthRes.json().catch(() => ({}))
  log('Health Status', { status: healthRes.status, body: healthJson })
  if (!healthRes.ok || !healthJson?.env?.NEXT_PUBLIC_SUPABASE_URL || !healthJson?.db?.connected) {
    throw new Error('Health check failed — fix envs or DB connectivity and try again')
  }

  // 2) Seed test user
  const seedRes = await fetch(`${baseUrl}/api/auth/seed-test-user`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-admin-seed-key': seedKey,
    },
    body: JSON.stringify({ email, password, firstName: 'Prod', lastName: 'Test' }),
  })
  const seedJson = await seedRes.json().catch(() => ({}))
  log('Seed Result', { status: seedRes.status, body: seedJson })
  if (!seedRes.ok || !seedJson?.success) {
    throw new Error('Seeding failed — check ADMIN_SEED_KEY and server logs')
  }

  // 3) Login
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const loginJson = await loginRes.json().catch(() => ({}))
  log('Login Result', { status: loginRes.status, body: loginJson })
  if (!loginRes.ok || !loginJson?.success) {
    throw new Error('Login failed — investigate server logs')
  }

  console.log(`\n✅ Production auth E2E verified for ${email}`)
}

main().catch((err) => {
  console.error('\n❌ Verification failed:', err?.message || err)
  process.exit(1)
})

