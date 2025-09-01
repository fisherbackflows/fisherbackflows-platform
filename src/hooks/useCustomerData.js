import { useState, useEffect } from 'react';

export function useCustomerData() {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadCustomerData() {
      try {
        setLoading(true);
        
        // Check if we already have a token
        let token = localStorage.getItem('portal_token');
        
        if (!token) {
          // Authenticate with demo mode
          const authResponse = await fetch('/api/auth/portal', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              identifier: 'demo',
              type: 'email'
            })
          });
          
          if (!authResponse.ok) {
            throw new Error('Authentication failed');
          }
          
          const authData = await authResponse.json();
          
          if (!authData.success) {
            throw new Error(authData.error || 'Authentication failed');
          }
          
          token = authData.token;
          localStorage.setItem('portal_token', token);
        }
        
        // Get customer data with devices
        const customerResponse = await fetch('/api/auth/portal', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!customerResponse.ok) {
          if (customerResponse.status === 401) {
            // Token expired, clear it and retry
            localStorage.removeItem('portal_token');
            throw new Error('Session expired, please refresh the page');
          }
          throw new Error('Failed to fetch customer data');
        }
        
        const customerData = await customerResponse.json();
        
        if (!customerData.success) {
          throw new Error(customerData.error || 'Failed to fetch customer data');
        }
        
        setCustomer(customerData.customer);
        
      } catch (error) {
        console.error('Failed to load customer data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadCustomerData();
  }, []);

  return { customer, loading, error };
}