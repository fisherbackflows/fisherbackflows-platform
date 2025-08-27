'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  FileText,
  CreditCard,
  Droplet,
  MapPin,
  Phone,
  Settings,
  Download,
  Plus,
  Bell,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const [customer, setCustomer] = useState(mockCustomerData);
  const [loading, setLoading] = useState(false);

  // Calculate dashboard stats
  const deviceCount = customer.devices.length;
  const devicesNeedingTest = customer.devices.filter(d => d.daysUntilTest <= 30).length;
  const upcomingCount = customer.upcomingAppointments.length;
  const overdueInvoices = customer.invoices.filter(i => i.status === 'Overdue').length;

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
    <div className="min-h-screen bg-black">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid opacity-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5" />

      {/* Header */}
      <Navigation 
        customerName={customer.name} 
        accountNumber={customer.accountNumber} 
      />

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold gradient-text mb-4">
            Welcome back, {customer.name.split(' ')[0]}!
          </h1>
          <p className="text-white/70 text-lg mb-6">
            Your next test is due in <span className={`font-bold ${getDaysUntilTestColor(customer.devices[0]?.daysUntilTest || 0)}`}>
            {customer.devices[0]?.daysUntilTest || 0} days</span>
          </p>
        </div>

        {/* Primary Action - Schedule Test */}
        <div className="glass-blue rounded-3xl p-12 text-center mb-12 glow-blue pulse-glow">
          <div className="max-w-md mx-auto">
            <div className="glass rounded-full p-6 mx-auto mb-6 w-20 h-20 flex items-center justify-center">
              <Calendar className="h-10 w-10 text-blue-400" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-blue-400">Schedule Your Test</h2>
            <p className="text-white/80 text-lg mb-8">
              Quick and easy online booking. Choose your preferred date and we'll handle the rest.
            </p>
            <Button 
              onClick={() => window.location.href = '/portal/schedule'}
              className="btn-glow py-4 px-12 text-xl rounded-2xl font-bold hover-glow"
            >
              Book Now
            </Button>
            <p className="text-blue-300 text-sm mt-4">
              ⚡ Takes less than 2 minutes
            </p>
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Pay Bill */}
          <div className="glass rounded-2xl p-6 text-center card-hover">
            <div className="glass-blue rounded-full p-3 mx-auto mb-4 w-12 h-12 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Pay Bill</h3>
            <p className="text-white/60 mb-4">Current balance: $0.00</p>
            <Button 
              onClick={() => window.location.href = '/portal/billing'}
              className="btn-glass py-2 px-4 rounded-lg w-full"
            >
              View Bills
            </Button>
          </div>

          {/* Get Help */}
          <div className="glass rounded-2xl p-6 text-center card-hover">
            <div className="glass-blue rounded-full p-3 mx-auto mb-4 w-12 h-12 flex items-center justify-center">
              <Phone className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Get Help</h3>
            <p className="text-white/60 mb-4">Call us anytime</p>
            <Button 
              onClick={() => window.location.href = 'tel:2532788692'}
              className="btn-glass py-2 px-4 rounded-lg w-full"
            >
              (253) 278-8692
            </Button>
          </div>
        </div>

        {/* Device Status - Simple */}
        {customer.devices.length > 0 && (
          <div className="glass rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold gradient-text mb-4">Your Device</h2>
            <div className="glass-darker rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-white mb-1">{customer.devices[0].location}</h3>
                  <p className="text-white/60 text-sm">{customer.devices[0].make} {customer.devices[0].model}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/50 text-sm">Next Test Due</p>
                  <p className={`font-bold ${getDaysUntilTestColor(customer.devices[0].daysUntilTest)}`}>
                    {new Date(customer.devices[0].nextTestDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity - Simple */}
        {customer.recentTests.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <h2 className="text-xl font-bold gradient-text mb-4">Last Test Report</h2>
            <div className="glass-darker rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-white">{customer.recentTests[0].deviceLocation}</h3>
                  <p className="text-white/60 text-sm">
                    {new Date(customer.recentTests[0].date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(customer.recentTests[0].result)}`}>
                    {customer.recentTests[0].result}
                  </span>
                  <Button 
                    onClick={() => alert('Certificate downloaded!')}
                    className="btn-glass px-4 py-2 rounded-lg text-sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Certificate
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}