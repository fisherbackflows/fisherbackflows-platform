'use client';

import React from 'react';
import { 
  Calendar, 
  CreditCard,
  Phone,
  Download
} from 'lucide-react';
import {
  UnifiedLayout,
  UnifiedButton,
  UnifiedCard,
  UnifiedH1,
  UnifiedText,
  UnifiedGrid,
  UnifiedHeader,
  UnifiedContainer
} from '@/components/ui';
import Navigation from '@/components/portal/Navigation';

// Mock customer data focused on backflow testing
const mockCustomerData = {
  id: '1',
  name: 'John Smith',
  email: 'john.smith@email.com',
  phone: '(253) 555-0123',
  accountNumber: 'FB001',
  address: '123 Main St, Tacoma, WA 98401',
  balance: 0.00,
  nextTestDate: '2025-01-15',
  devices: [
    {
      id: 'dev1',
      location: '123 Main St - Backyard',
      serialNumber: 'BF-2023-001',
      size: '3/4"',
      make: 'Watts',
      model: 'Series 909',
      installDate: '2023-01-15',
      lastTestDate: '2024-01-15',
      nextTestDate: '2025-01-15',
      status: 'Passed',
      daysUntilTest: 45
    }
  ],
  upcomingAppointments: [
    {
      id: 'apt1',
      date: '2025-01-15',
      time: '10:00 AM',
      type: 'Annual Test',
      technician: 'Mike Fisher',
      deviceLocation: '123 Main St - Backyard',
      status: 'Scheduled'
    }
  ],
  recentTests: [
    {
      id: 'test1',
      date: '2024-01-15',
      deviceLocation: '123 Main St - Backyard',
      result: 'Passed',
      technician: 'Mike Fisher',
      certificateId: 'CERT-2024-001'
    }
  ],
  invoices: []
};

export default function CustomerDashboard() {
  // Calculate dashboard stats
  const deviceCount = mockCustomerData.devices.length;
  const devicesNeedingTest = mockCustomerData.devices.filter(d => d.daysUntilTest <= 30).length;
  const upcomingCount = mockCustomerData.upcomingAppointments.length;
  const overdueInvoices = mockCustomerData.invoices.filter(i => i.status === 'Overdue').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Passed': return 'text-green-400 bg-green-400/20';
      case 'Failed': return 'text-red-400 bg-red-400/20';
      case 'Due Soon': return 'text-yellow-400 bg-yellow-400/20';
      default: return 'text-blue-400 bg-blue-400/20';
    }
  };

  const getDaysUntilTestColor = (days: number) => {
    if (days <= 7) return 'text-red-400';
    if (days <= 30) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <UnifiedLayout background="grid">
      {/* Header */}
      <Navigation 
        customerName={mockCustomerData.name} 
        accountNumber={mockCustomerData.accountNumber} 
      />

      <UnifiedContainer className="py-8">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <UnifiedH1 variant="gradient" align="center" className="mb-4">
            Welcome back, {mockCustomerData.name.split(' ')[0]}!
          </UnifiedH1>
          <UnifiedText variant="secondary" size="lg" align="center" className="mb-6">
            Your next test is due in <span className={`font-bold ${getDaysUntilTestColor(mockCustomerData.devices[0]?.daysUntilTest || 0)}`}>
            {mockCustomerData.devices[0]?.daysUntilTest || 0} days</span>
          </UnifiedText>
        </div>

        {/* Primary Action - Schedule Test */}
        <UnifiedCard 
          variant="glow" 
          glow="blue" 
          size="xl" 
          className="text-center mb-12 glass-blue pulse-glow rounded-3xl"
        >
          <div className="max-w-md mx-auto">
            <div className="glass rounded-full p-6 mx-auto mb-6 w-20 h-20 flex items-center justify-center">
              <Calendar className="h-10 w-10 text-blue-400" />
            </div>
            <UnifiedText size="3xl" weight="bold" variant="accent" className="mb-4">
              Schedule Your Test
            </UnifiedText>
            <UnifiedText variant="secondary" size="lg" className="mb-8">
              Quick and easy online booking. Choose your preferred date and we'll handle the rest.
            </UnifiedText>
            <UnifiedButton 
              variant="primary"
              size="xl"
              glow
              onClick={() => window.location.href = '/portal/schedule'}
              className="btn-glow font-bold"
            >
              Book Now
            </UnifiedButton>
            <UnifiedText variant="accent" size="sm" className="mt-4">
              ⚡ Takes less than 2 minutes
            </UnifiedText>
          </div>
        </UnifiedCard>

        {/* Secondary Actions */}
        <UnifiedGrid cols={2} className="mb-12">
          {/* Pay Bill */}
          <UnifiedCard variant="interactive" hover className="text-center">
            <div className="glass-blue rounded-full p-3 mx-auto mb-4 w-12 h-12 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-blue-400" />
            </div>
            <UnifiedText size="lg" weight="bold" className="mb-2">Pay Bill</UnifiedText>
            <UnifiedText variant="muted" className="mb-4">Current balance: $0.00</UnifiedText>
            <UnifiedButton 
              variant="glass"
              onClick={() => window.location.href = '/portal/billing'}
              className="w-full"
            >
              View Bills
            </UnifiedButton>
          </UnifiedCard>

          {/* Get Help */}
          <UnifiedCard variant="interactive" hover className="text-center">
            <div className="glass-blue rounded-full p-3 mx-auto mb-4 w-12 h-12 flex items-center justify-center">
              <Phone className="h-6 w-6 text-blue-400" />
            </div>
            <UnifiedText size="lg" weight="bold" className="mb-2">Get Help</UnifiedText>
            <UnifiedText variant="muted" className="mb-4">Call us anytime</UnifiedText>
            <UnifiedButton 
              variant="glass"
              onClick={() => window.location.href = 'tel:2532788692'}
              className="w-full"
            >
              (253) 278-8692
            </UnifiedButton>
          </UnifiedCard>
        </UnifiedGrid>

        {/* Device Status - Simple */}
        {mockCustomerData.devices.length > 0 && (
          <UnifiedCard className="mb-8">
            <UnifiedText size="xl" weight="bold" variant="gradient" className="mb-4">Your Device</UnifiedText>
            <div className="glass-darker rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <UnifiedText weight="semibold" className="mb-1">{mockCustomerData.devices[0].location}</UnifiedText>
                  <UnifiedText variant="muted" size="sm">{mockCustomerData.devices[0].make} {mockCustomerData.devices[0].model}</UnifiedText>
                </div>
                <div className="text-right">
                  <UnifiedText variant="subtle" size="sm">Next Test Due</UnifiedText>
                  <UnifiedText weight="bold" className={getDaysUntilTestColor(mockCustomerData.devices[0].daysUntilTest)}>
                    {new Date(mockCustomerData.devices[0].nextTestDate).toLocaleDateString()}
                  </UnifiedText>
                </div>
              </div>
            </div>
          </UnifiedCard>
        )}

        {/* Recent Activity - Simple */}
        {mockCustomerData.recentTests.length > 0 && (
          <UnifiedCard>
            <UnifiedText size="xl" weight="bold" variant="gradient" className="mb-4">Last Test Report</UnifiedText>
            <div className="glass-darker rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <UnifiedText weight="medium">{mockCustomerData.recentTests[0].deviceLocation}</UnifiedText>
                  <UnifiedText variant="muted" size="sm">
                    {new Date(mockCustomerData.recentTests[0].date).toLocaleDateString()}
                  </UnifiedText>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(mockCustomerData.recentTests[0].result)}`}>
                    {mockCustomerData.recentTests[0].result}
                  </span>
                  <UnifiedButton 
                    variant="glass"
                    size="sm"
                    onClick={() => alert('Certificate downloaded!')}
                    icon={<Download className="h-4 w-4" />}
                  >
                    Certificate
                  </UnifiedButton>
                </div>
              </div>
            </div>
          </UnifiedCard>
        )}
      </UnifiedContainer>
    </UnifiedLayout>
  );
}