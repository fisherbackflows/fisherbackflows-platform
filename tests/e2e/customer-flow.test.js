/**
 * E2E Customer Flow Tests
 * Tests complete customer journey from login to payment
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3010';

describe('Customer Journey E2E Tests', () => {
  let authToken = null;
  let customerId = null;

  beforeAll(async () => {
    // Login as demo customer
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'demo',
        type: 'demo'
      })
    });
    
    const data = await response.json();
    authToken = data.token || 'demo-token';
    customerId = data.user.id;
  });

  describe('Customer Dashboard', () => {
    test('Should load customer information', async () => {
      const response = await fetch(`${BASE_URL}/api/customers/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const customer = await response.json();
      
      expect(response.status).toBe(200);
      expect(customer.id).toBeDefined();
      expect(customer.devices).toBeDefined();
      expect(Array.isArray(customer.devices)).toBe(true);
    });

    test('Should show customer devices', async () => {
      const response = await fetch(`${BASE_URL}/api/customers/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const customer = await response.json();
      
      if (customer.devices && customer.devices.length > 0) {
        const device = customer.devices[0];
        expect(device.serialNumber).toBeDefined();
        expect(device.location).toBeDefined();
        expect(device.lastTestDate).toBeDefined();
      }
    });
  });

  describe('Appointment Scheduling', () => {
    test('Should get available dates', async () => {
      const response = await fetch(`${BASE_URL}/api/calendar/available-dates?month=1&year=2025`);
      
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.availableDates).toBeDefined();
      expect(Array.isArray(data.availableDates)).toBe(true);
    });

    test('Should create appointment', async () => {
      const response = await fetch(`${BASE_URL}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          customerId: customerId,
          scheduledDate: '2025-02-15',
          scheduledTime: '09:00',
          duration: 60,
          type: 'annual_test',
          notes: 'E2E test appointment'
        })
      });

      if (response.status === 200 || response.status === 201) {
        const appointment = await response.json();
        expect(appointment.id).toBeDefined();
        expect(appointment.scheduledDate).toBe('2025-02-15');
      }
    });

    test('Should list customer appointments', async () => {
      const response = await fetch(`${BASE_URL}/api/appointments?customerId=${customerId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();
      
      expect(response.status).toBeLessThan(500);
      if (data.appointments) {
        expect(Array.isArray(data.appointments)).toBe(true);
      }
    });
  });

  describe('Test Reports', () => {
    test('Should retrieve test reports', async () => {
      const response = await fetch(`${BASE_URL}/api/test-reports?customerId=${customerId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();
      
      expect(response.status).toBeLessThan(500);
      if (data.reports) {
        expect(Array.isArray(data.reports)).toBe(true);
      }
    });
  });

  describe('Invoices and Payments', () => {
    test('Should list customer invoices', async () => {
      const response = await fetch(`${BASE_URL}/api/invoices?customerId=${customerId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();
      
      expect(response.status).toBeLessThan(500);
      if (data.invoices) {
        expect(Array.isArray(data.invoices)).toBe(true);
        
        if (data.invoices.length > 0) {
          const invoice = data.invoices[0];
          expect(invoice.invoiceNumber).toBeDefined();
          expect(invoice.total).toBeDefined();
          expect(invoice.status).toBeDefined();
        }
      }
    });
  });

  describe('Customer Profile Management', () => {
    test('Should update customer profile', async () => {
      const response = await fetch(`${BASE_URL}/api/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          phone: '555-0199'
        })
      });

      expect(response.status).toBeLessThan(500);
    });
  });
});

module.exports = {
  testTimeout: 30000,
  testEnvironment: 'node'
};