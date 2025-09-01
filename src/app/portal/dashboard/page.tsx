'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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
  User,
  Bell,
  Settings,
  Shield,
  Award,
  Home,
  LogOut
} from 'lucide-react';

// Mock customer data 
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
  recentTests: [
    {
      id: 'test1',
      date: '2024-01-15',
      location: '123 Main St - Backyard',
      result: 'Passed',
      testType: 'Annual Test',
      reportUrl: '/reports/2024-001.pdf'
    }
  ]
};

export default function CustomerPortalDashboard() {
  const [customer, setCustomer] = useState(mockCustomerData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading user data
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-slate-700">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Professional Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold text-slate-900">
                Fisher Backflows
              </Link>
              <nav className="hidden md:flex space-x-1">
                <Link href="/portal/dashboard" className="px-4 py-2 rounded-lg bg-blue-200 text-blue-700 border border-blue-200 font-medium">
                  Dashboard
                </Link>
                <Link href="/portal/schedule" className="px-4 py-2 rounded-lg text-slate-800 hover:text-slate-900 hover:bg-slate-300 transition-all font-medium">
                  Schedule
                </Link>
                <Link href="/portal/billing" className="px-4 py-2 rounded-lg text-slate-800 hover:text-slate-900 hover:bg-slate-300 transition-all font-medium">
                  Billing
                </Link>
                <Link href="/portal/devices" className="px-4 py-2 rounded-lg text-slate-800 hover:text-slate-900 hover:bg-slate-300 transition-all font-medium">
                  Devices
                </Link>
                <Link href="/portal/reports" className="px-4 py-2 rounded-lg text-slate-800 hover:text-slate-900 hover:bg-slate-300 transition-all font-medium">
                  Reports
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="font-semibold text-slate-900">{customer.name}</p>
                <p className="text-sm text-slate-700">Account: {customer.accountNumber}</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" className="text-slate-700 hover:text-slate-700">
                  <Bell className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-slate-700 hover:text-slate-700">
                  <Settings className="h-5 w-5" />
                </Button>
                <Link href="/">
                  <Button variant="ghost" size="sm" className="text-slate-700 hover:text-slate-700">
                    <LogOut className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-10">
          <div className="bg-white rounded-2xl p-8 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-slate-900">
                  Welcome back, <span className="text-blue-800">{customer.name}!</span>
                </h1>
                <p className="text-slate-800 text-lg mb-4">Your backflow testing is up to date and compliant.</p>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm font-medium text-slate-700">System Protected</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-700 rounded-full"></div>
                    <span className="text-sm font-medium text-slate-700">Fully Compliant</span>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="w-24 h-24 bg-emerald-100 rounded-2xl flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-emerald-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Device Status */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-emerald-600" />
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">ACTIVE</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">{customer.devices.length}</h3>
            <p className="text-slate-700 font-medium">Active Device</p>
            <p className="text-slate-700 text-sm mt-2">Last tested: Jan 15, 2024</p>
          </div>

          {/* Next Test */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-300 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-800" />
              </div>
              <span className="px-3 py-1 bg-blue-300 text-blue-700 text-xs font-semibold rounded-full">UPCOMING</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">45</h3>
            <p className="text-slate-700 font-medium">Days Until Test</p>
            <p className="text-slate-700 text-sm mt-2">Due: Jan 15, 2025</p>
          </div>

          {/* Account Balance */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-300 rounded-xl flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-green-800" />
              </div>
              <span className="px-3 py-1 bg-green-300 text-green-700 text-xs font-semibold rounded-full">PAID</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">${customer.balance.toFixed(2)}</h3>
            <p className="text-slate-700 font-medium">Account Balance</p>
            <p className="text-slate-700 text-sm mt-2">All payments current</p>
          </div>

          {/* Service Status */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Award className="h-6 w-6 text-amber-600" />
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">CERTIFIED</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">100%</h3>
            <p className="text-slate-700 font-medium">Compliance Rate</p>
            <p className="text-slate-700 text-sm mt-2">BAT certified testing</p>
          </div>
        </div>

        {/* Quick Actions and Recent Activity */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Quick Actions</h2>
              <div className="space-y-4">
                <Link href="/portal/schedule" className="block">
                  <div className="flex items-center p-4 bg-blue-200 hover:bg-blue-300 rounded-lg transition-colors border border-blue-200">
                    <Calendar className="h-8 w-8 text-blue-800 mr-4" />
                    <div>
                      <h3 className="font-semibold text-slate-900">Schedule Test</h3>
                      <p className="text-sm text-slate-800">Book your annual testing</p>
                    </div>
                  </div>
                </Link>
                
                <Link href="/portal/billing" className="block">
                  <div className="flex items-center p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200">
                    <CreditCard className="h-8 w-8 text-emerald-600 mr-4" />
                    <div>
                      <h3 className="font-semibold text-slate-900">Pay Bill</h3>
                      <p className="text-sm text-slate-800">Make a payment online</p>
                    </div>
                  </div>
                </Link>
                
                <Link href="/portal/reports" className="block">
                  <div className="flex items-center p-4 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200">
                    <FileText className="h-8 w-8 text-amber-600 mr-4" />
                    <div>
                      <h3 className="font-semibold text-slate-900">View Reports</h3>
                      <p className="text-sm text-slate-800">Download test certificates</p>
                    </div>
                  </div>
                </Link>

                <div className="flex items-center p-4 bg-slate-50 hover:bg-slate-300 rounded-lg transition-colors border border-slate-200 cursor-pointer">
                  <Phone className="h-8 w-8 text-slate-800 mr-4" />
                  <div>
                    <h3 className="font-semibold text-slate-900">Call Support</h3>
                    <p className="text-sm text-slate-800">(253) 278-8692</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Device Details and Recent Activity */}
          <div className="lg:col-span-2 space-y-8">
            {/* Current Device */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Your Backflow Device</h2>
              {customer.devices.map((device) => (
                <div key={device.id} className="border border-slate-200 rounded-lg p-6 bg-slate-50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{device.location}</h3>
                      <p className="text-slate-800">{device.make} {device.model} - {device.size}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      device.status === 'Passed' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-red-300 text-red-700'
                    }`}>
                      {device.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Serial Number</p>
                      <p className="font-semibold text-slate-900">{device.serialNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Last Test</p>
                      <p className="font-semibold text-slate-900">{device.lastTestDate}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Next Test Due</p>
                      <p className="font-semibold text-slate-900">{device.nextTestDate}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Days Remaining</p>
                      <p className="font-semibold text-blue-800">{device.daysUntilTest} days</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Link href="/portal/schedule">
                      <Button className="bg-blue-700 hover:bg-blue-700 text-white">
                        Schedule Test
                      </Button>
                    </Link>
                    <Link href="/portal/reports">
                      <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-300">
                        <Download className="h-4 w-4 mr-2" />
                        Download Report
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Test History */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Test History</h2>
              <div className="space-y-4">
                {customer.recentTests.map((test) => (
                  <div key={test.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${test.result === 'Passed' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                      <div>
                        <p className="font-semibold text-slate-900">{test.testType}</p>
                        <p className="text-sm text-slate-800">{test.location}</p>
                        <p className="text-sm text-slate-700">{test.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        test.result === 'Passed' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-red-300 text-red-700'
                      }`}>
                        {test.result}
                      </span>
                      <Button variant="outline" size="sm" className="border-slate-300 text-slate-700">
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-slate-50 rounded-xl p-6 border border-slate-200">
          <div className="text-center">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Need Assistance?</h3>
            <p className="text-slate-800 mb-4">Our team is here to help with any questions about your backflow testing.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:2532788692" className="flex items-center justify-center space-x-2 bg-blue-700 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                <Phone className="h-5 w-5" />
                <span>(253) 278-8692</span>
              </a>
              <a href="mailto:service@fisherbackflows.com" className="flex items-center justify-center space-x-2 bg-white hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-lg font-semibold border border-slate-300 transition-colors">
                <span>service@fisherbackflows.com</span>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}