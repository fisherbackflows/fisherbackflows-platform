'use client';

import React from 'react';
import { UnifiedLayout, UnifiedCard, UnifiedButton } from '@/components/ui/unified-layout';
import { 
  Calendar, 
  CreditCard,
  Phone,
  Download,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  MapPin,
  User
} from 'lucide-react';

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
  const deviceCount = mockCustomerData.devices.length;
  const devicesNeedingTest = mockCustomerData.devices.filter(d => d.daysUntilTest <= 30).length;
  const upcomingCount = mockCustomerData.upcomingAppointments.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Passed': return 'text-green-400 bg-green-400/20 border-green-500/30';
      case 'Failed': return 'text-red-400 bg-red-400/20 border-red-500/30';
      case 'Due Soon': return 'text-yellow-400 bg-yellow-400/20 border-yellow-500/30';
      default: return 'text-blue-400 bg-blue-400/20 border-blue-500/30';
    }
  };

  const getDaysUntilTestColor = (days: number) => {
    if (days <= 7) return 'text-red-400';
    if (days <= 30) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <UnifiedLayout
      title={`Welcome back, ${mockCustomerData.name}`}
      subtitle={`Account: ${mockCustomerData.accountNumber}`}
      showUserActions={true}
    >
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <UnifiedCard padding="p-6" className="text-center">
            <div className="bg-blue-600/20 border border-blue-500/30 rounded-full p-3 w-12 h-12 mx-auto mb-3">
              <MapPin className="h-6 w-6 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">{deviceCount}</div>
            <div className="text-white/60 text-sm">Registered Devices</div>
          </UnifiedCard>

          <UnifiedCard padding="p-6" className="text-center">
            <div className="bg-green-600/20 border border-green-500/30 rounded-full p-3 w-12 h-12 mx-auto mb-3">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">Current</div>
            <div className="text-white/60 text-sm">Test Status</div>
          </UnifiedCard>

          <UnifiedCard padding="p-6" className="text-center">
            <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-full p-3 w-12 h-12 mx-auto mb-3">
              <Calendar className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">{upcomingCount}</div>
            <div className="text-white/60 text-sm">Upcoming Tests</div>
          </UnifiedCard>

          <UnifiedCard padding="p-6" className="text-center">
            <div className="bg-green-600/20 border border-green-500/30 rounded-full p-3 w-12 h-12 mx-auto mb-3">
              <CreditCard className="h-6 w-6 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">$0.00</div>
            <div className="text-white/60 text-sm">Outstanding Balance</div>
          </UnifiedCard>
        </div>

        {/* Quick Actions */}
        <UnifiedCard>
          <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <UnifiedButton variant="primary" className="flex items-center justify-center p-4">
              <Calendar className="h-5 w-5 mr-2" />
              Schedule Test
            </UnifiedButton>
            <UnifiedButton variant="secondary" className="flex items-center justify-center p-4">
              <CreditCard className="h-5 w-5 mr-2" />
              Make Payment
            </UnifiedButton>
            <UnifiedButton variant="outline" className="flex items-center justify-center p-4">
              <Download className="h-5 w-5 mr-2" />
              Download Reports
            </UnifiedButton>
            <UnifiedButton variant="outline" className="flex items-center justify-center p-4">
              <Phone className="h-5 w-5 mr-2" />
              Contact Us
            </UnifiedButton>
          </div>
        </UnifiedCard>

        {/* Devices and Upcoming Tests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Your Devices */}
          <UnifiedCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Your Devices</h2>
              <UnifiedButton variant="ghost" size="sm">
                View All
              </UnifiedButton>
            </div>
            
            <div className="space-y-4">
              {mockCustomerData.devices.map((device) => (
                <div key={device.id} className="border border-gray-600 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-white">{device.location}</h3>
                      <p className="text-white/60 text-sm">{device.make} {device.model} - {device.size}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(device.status)}`}>
                      {device.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-white/50">Serial Number</p>
                      <p className="text-white/80">{device.serialNumber}</p>
                    </div>
                    <div>
                      <p className="text-white/50">Next Test Due</p>
                      <p className={`font-medium ${getDaysUntilTestColor(device.daysUntilTest)}`}>
                        {new Date(device.nextTestDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </UnifiedCard>

          {/* Upcoming Appointments */}
          <UnifiedCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Upcoming Appointments</h2>
              <UnifiedButton variant="ghost" size="sm">
                View All
              </UnifiedButton>
            </div>
            
            {mockCustomerData.upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {mockCustomerData.upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="border border-gray-600 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-white">{appointment.type}</h3>
                        <p className="text-white/60 text-sm">{appointment.deviceLocation}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">{new Date(appointment.date).toLocaleDateString()}</p>
                        <p className="text-white/60 text-sm">{appointment.time}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-white/70">
                        <User className="h-4 w-4 mr-1" />
                        {appointment.technician}
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-400/20 text-blue-400 border border-blue-500/30">
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-white/60">No upcoming appointments</p>
                <UnifiedButton variant="secondary" className="mt-4">
                  Schedule Test
                </UnifiedButton>
              </div>
            )}
          </UnifiedCard>
        </div>

        {/* Recent Test Results */}
        <UnifiedCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Recent Test Results</h2>
            <UnifiedButton variant="ghost" size="sm">
              View All Reports
            </UnifiedButton>
          </div>
          
          {mockCustomerData.recentTests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left text-white/70 font-medium py-3">Date</th>
                    <th className="text-left text-white/70 font-medium py-3">Location</th>
                    <th className="text-left text-white/70 font-medium py-3">Result</th>
                    <th className="text-left text-white/70 font-medium py-3">Technician</th>
                    <th className="text-left text-white/70 font-medium py-3">Certificate</th>
                  </tr>
                </thead>
                <tbody>
                  {mockCustomerData.recentTests.map((test) => (
                    <tr key={test.id} className="border-b border-gray-700">
                      <td className="py-4 text-white/80">{new Date(test.date).toLocaleDateString()}</td>
                      <td className="py-4 text-white/80">{test.deviceLocation}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(test.result)}`}>
                          {test.result}
                        </span>
                      </td>
                      <td className="py-4 text-white/80">{test.technician}</td>
                      <td className="py-4">
                        <UnifiedButton variant="ghost" size="sm" className="text-blue-400">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </UnifiedButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-white/60">No test results available</p>
            </div>
          )}
        </UnifiedCard>
      </div>
    </UnifiedLayout>
  );
}