import { useState } from 'react';

export function useCustomerData() {
  const [customer, setCustomer] = useState({
    id: 'temp-customer',
    name: 'Customer Dashboard',
    email: 'customer@fisherbackflows.com',
    accountNumber: 'TEMP-001',
    phone: '(253) 278-8692',
    status: 'active',
    balance: 0,
    devices: [
      {
        id: 'device-1',
        location: 'Main Building - Water Service',
        make: 'Watts',
        model: 'Series 909',
        size: '3/4"',
        serialNumber: 'WTS-2024-001',
        lastTestDate: 'Jan 15, 2024',
        nextTestDate: 'Jan 15, 2025',
        status: 'Passed',
        daysUntilTest: 45
      }
    ],
    recentTests: [
      {
        id: 'test-1',
        testType: 'Annual Compliance Test',
        location: 'Main Building - Water Service',
        date: 'Jan 15, 2024',
        result: 'Passed'
      },
      {
        id: 'test-2',
        testType: 'Follow-up Test',
        location: 'Main Building - Water Service',
        date: 'Feb 10, 2023',
        result: 'Passed'
      }
    ]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  return { customer, loading, error };
}