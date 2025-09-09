import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function useCustomerData() {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const supabase = createClientComponentClient();
    
    async function loadCustomerData() {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          setError('Please login to view your devices');
          setLoading(false);
          return;
        }
        
        // Get customer record
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();
          
        if (customerError || !customerData) {
          setError('Unable to load customer data');
          setLoading(false);
          return;
        }
        
        // Get customer's devices
        const { data: devices, error: devicesError } = await supabase
          .from('devices')
          .select('*')
          .eq('customer_id', customerData.id);
          
        // Format customer data
        const formattedCustomer = {
          id: customerData.id,
          name: `${customerData.first_name} ${customerData.last_name}`,
          email: customerData.email,
          accountNumber: customerData.account_number,
          phone: customerData.phone,
          status: customerData.account_status || 'active',
          balance: customerData.balance || 0,
          devices: devices || []
        };
        
        setCustomer(formattedCustomer);
        setLoading(false);
        
      } catch (err) {
        console.error('Error loading customer data:', err);
        setError('Failed to load customer data');
        setLoading(false);
      }
    }
    
    loadCustomerData();
  }, []);

  return { customer, loading, error };
}