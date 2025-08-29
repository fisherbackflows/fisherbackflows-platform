/**
 * E2E Authentication Tests
 * Tests customer and team authentication flows
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3010';

describe('Authentication E2E Tests', () => {
  describe('Customer Portal Authentication', () => {
    test('Demo login should work', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'demo',
          type: 'demo'
        })
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.email).toBe('demo@fisherbackflows.com');
      expect(data.redirect).toBe('/portal/dashboard');
    });

    test('Invalid credentials should fail', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'invalid@example.com',
          password: 'wrongpassword'
        })
      });

      expect(response.status).toBe(401);
    });

    test('Missing password should return 400', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'test@example.com'
        })
      });

      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe('Password is required');
    });
  });

  describe('Team Portal Authentication', () => {
    test('Admin login should work', async () => {
      const response = await fetch(`${BASE_URL}/api/team/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@fisherbackflows.com',
          password: 'password'
        })
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.user.email).toBe('admin@fisherbackflows.com');
      expect(data.user.role).toBe('admin');
      expect(data.token).toBeDefined();
    });

    test('Invalid team credentials should fail', async () => {
      const response = await fetch(`${BASE_URL}/api/team/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'notadmin@example.com',
          password: 'wrongpassword'
        })
      });

      expect(response.status).toBe(401);
    });

    test('Authenticated requests should work with token', async () => {
      // First login to get token
      const loginResponse = await fetch(`${BASE_URL}/api/team/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@fisherbackflows.com',
          password: 'password'
        })
      });

      const { token } = await loginResponse.json();

      // Use token to access protected route
      const meResponse = await fetch(`${BASE_URL}/api/team/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      expect(meResponse.status).toBe(200);
    });
  });

  describe('Password Reset Flow', () => {
    test('Forgot password should accept valid email', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com'
        })
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.message).toContain('reset instructions');
    });

    test('Forgot password should reject invalid email', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'notanemail'
        })
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Session Management', () => {
    test('Logout should clear session', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/logout`, {
        method: 'POST'
      });

      expect(response.status).toBe(200);
    });

    test('Protected routes should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/customers`);
      expect(response.status).toBe(401);
    });
  });
});

module.exports = {
  testTimeout: 30000,
  testEnvironment: 'node'
};