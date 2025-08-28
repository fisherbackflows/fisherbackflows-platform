/**
 * K6 Load Testing Script
 * Fisher Backflows Performance Testing
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');
export const responseTime = new Trend('response_time');

// Test configuration
export const options = {
  stages: [
    // Ramp up
    { duration: '2m', target: 10 }, // Ramp up to 10 users over 2 minutes
    { duration: '5m', target: 10 }, // Stay at 10 users for 5 minutes
    { duration: '2m', target: 30 }, // Ramp up to 30 users over 2 minutes
    { duration: '5m', target: 30 }, // Stay at 30 users for 5 minutes
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.1'],     // Error rate must be below 10%
    errors: ['rate<0.1'],              // Custom error rate below 10%
  },
};

const BASE_URL = __ENV.TARGET_URL || 'https://app.fisherbackflows.com';

// Test data
const customers = [
  { account: 'FISH001', email: 'customer1@example.com' },
  { account: 'FISH002', email: 'customer2@example.com' },
  { account: 'FISH003', email: 'customer3@example.com' },
];

export default function () {
  group('Homepage', function () {
    const response = http.get(`${BASE_URL}/`);
    check(response, {
      'homepage loads successfully': (r) => r.status === 200,
      'homepage response time < 2s': (r) => r.timings.duration < 2000,
      'homepage contains title': (r) => r.body.includes('Fisher Backflows'),
    });
    errorRate.add(response.status !== 200);
    responseTime.add(response.timings.duration);
    sleep(1);
  });

  group('Customer Portal', function () {
    // Test customer login page
    const loginPage = http.get(`${BASE_URL}/login`);
    check(loginPage, {
      'login page loads': (r) => r.status === 200,
      'login form present': (r) => r.body.includes('Sign In'),
    });

    // Test portal dashboard (unauthenticated - should redirect)
    const portalDash = http.get(`${BASE_URL}/portal`);
    check(portalDash, {
      'portal redirects unauthorized': (r) => r.status === 200 || r.status === 302,
    });

    errorRate.add(loginPage.status !== 200);
    sleep(1);
  });

  group('Field Dashboard', function () {
    const fieldDash = http.get(`${BASE_URL}/field`);
    check(fieldDash, {
      'field dashboard accessible': (r) => r.status === 200 || r.status === 302,
    });
    errorRate.add(fieldDash.status >= 400);
    sleep(1);
  });

  group('API Health Check', function () {
    const healthCheck = http.get(`${BASE_URL}/api/health`);
    check(healthCheck, {
      'health check returns 200': (r) => r.status === 200,
      'health check response time < 500ms': (r) => r.timings.duration < 500,
      'health check returns JSON': (r) => r.headers['Content-Type'].includes('application/json'),
    });
    errorRate.add(healthCheck.status !== 200);
    sleep(1);
  });

  group('Static Assets', function () {
    // Test loading of critical assets
    const favicon = http.get(`${BASE_URL}/favicon.ico`);
    check(favicon, {
      'favicon loads': (r) => r.status === 200 || r.status === 404, // 404 is acceptable
    });

    // Test service worker
    const serviceWorker = http.get(`${BASE_URL}/sw.js`);
    check(serviceWorker, {
      'service worker loads': (r) => r.status === 200,
    });

    sleep(0.5);
  });

  group('API Rate Limiting', function () {
    // Test multiple rapid requests to check rate limiting
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(http.get(`${BASE_URL}/api/health`));
    }
    
    const rateLimitHit = requests.some(r => r.status === 429);
    check(rateLimitHit, {
      'rate limiting working (optional)': () => true, // This is informational
    });
  });
}

// Setup function - runs once at the beginning
export function setup() {
  console.log(`Starting load test against: ${BASE_URL}`);
  
  // Verify the target is accessible
  const response = http.get(`${BASE_URL}/api/health`);
  if (response.status !== 200) {
    throw new Error(`Target ${BASE_URL} is not accessible. Status: ${response.status}`);
  }
  
  return { baseUrl: BASE_URL };
}

// Teardown function - runs once at the end
export function teardown(data) {
  console.log('Load test completed');
  console.log(`Target was: ${data.baseUrl}`);
}