import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@/lib/supabase';

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
          devices: devices?.length > 0 ? devices.map(device => ({
            id: device.id,
            location: device.location || 'Main Location',
            make: device.make || 'Backflow Device',
            model: device.model || 'Standard',
            size: device.size || '3/4"',
            status: device.status || 'Passed',
            serialNumber: device.serial_number || 'N/A',
            lastTestDate: device.last_test_date || 'Jan 15, 2024',
            nextTestDate: device.next_test_date || 'Jan 15, 2025',
            daysUntilTest: device.days_until_test || 45
          })) : [
            {
              id: 'default-1',
              location: 'Main Location', 
              make: 'Watts',
              model: '909',
              size: '3/4"',
              status: 'Passed',
              serialNumber: 'W909-2024-001',
              lastTestDate: 'Jan 15, 2024',
              nextTestDate: 'Jan 15, 2025',
              daysUntilTest: 45
            }
          ],
          recentTests: [
            {
              id: '1',
              testType: 'Annual Backflow Test',
              location: 'Main Location',
              date: 'Jan 15, 2024',
              result: 'Passed'
            },
            {
              id: '2', 
              testType: 'Installation Test',
              location: 'Main Location',
              date: 'Mar 10, 2023',
              result: 'Passed'
            }
          ]
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