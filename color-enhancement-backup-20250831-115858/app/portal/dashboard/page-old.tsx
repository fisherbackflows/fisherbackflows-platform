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
  Zap,
  Shield,
  TrendingUp,
  Star,
  Award
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
  recentReports: [
    {
      id: 'rpt1',
      date: '2024-01-15',
      testType: 'Annual Test',
      result: 'Passed',
      deviceLocation: '123 Main St - Backyard',
      nextTestDue: '2025-01-15'
    }
  ]
};

export default function PortalDashboard() {
  const [mounted, setMounted] = useState(false);
  const [customer] = useState(mockCustomerData);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 text-white">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-500/10 to-transparent rounded-full animate-pulse delay-1000"></div>
      </div>

      {/* Modern Navigation Header */}
      <nav className="relative z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                Fisher Backflows
              </Link>
              <div className="hidden md:flex space-x-1">
                <Link href="/portal/dashboard" className="px-4 py-2 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30">
                  Dashboard
                </Link>
                <Link href="/portal/schedule" className="px-4 py-2 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all">
                  Schedule
                </Link>
                <Link href="/portal/billing" className="px-4 py-2 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all">
                  Billing
                </Link>
                <Link href="/portal/devices" className="px-4 py-2 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all">
                  Devices
                </Link>
                <Link href="/portal/reports" className="px-4 py-2 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all">
                  Reports
                </Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="font-semibold text-white">{customer.name}</p>
                <p className="text-sm text-slate-400">Account: {customer.accountNumber}</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  <Bell className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  <Settings className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Dashboard Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-600/30 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  Welcome back, <span className="text-emerald-400">{customer.name}!</span>
                </h1>
                <p className="text-slate-300 text-lg">Your backflow testing dashboard</p>
                <div className="flex items-center space-x-4 mt-4">
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <Shield className="h-5 w-5" />
                    <span className="text-sm font-medium">Protected</span>
                  </div>
                  <div className="flex items-center space-x-2 text-blue-400">
                    <Award className="h-5 w-5" />
                    <span className="text-sm font-medium">Compliant</span>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="bg-emerald-600/20 rounded-2xl p-6 border border-emerald-500/30">
                  <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Device Status */}
          <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 backdrop-blur-sm border border-emerald-400/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Shield className="h-12 w-12 text-emerald-400" />
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full">ACTIVE</span>
            </div>
            <h3 className="text-2xl font-bold text-white">{customer.devices.length}</h3>
            <p className="text-emerald-300 font-medium">Active Device</p>
            <p className="text-slate-400 text-sm mt-1">Last tested: Jan 15, 2024</p>
          </div>

          {/* Next Test */}
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="h-12 w-12 text-blue-400" />
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full">UPCOMING</span>
            </div>
            <h3 className="text-2xl font-bold text-white">45</h3>
            <p className="text-blue-300 font-medium">Days Until Test</p>
            <p className="text-slate-400 text-sm mt-1">Due: Jan 15, 2025</p>
          </div>

          {/* Account Balance */}
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <CreditCard className="h-12 w-12 text-purple-400" />
              <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs font-semibold rounded-full">PAID</span>
            </div>
            <h3 className="text-2xl font-bold text-white">${customer.balance.toFixed(2)}</h3>
            <p className="text-purple-300 font-medium">Account Balance</p>
            <p className="text-slate-400 text-sm mt-1">No outstanding charges</p>
          </div>

          {/* Compliance Status */}
          <div className="bg-gradient-to-br from-amber-600/20 to-amber-800/20 backdrop-blur-sm border border-amber-400/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Award className="h-12 w-12 text-amber-400" />
              <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs font-semibold rounded-full">COMPLIANT</span>
            </div>
            <h3 className="text-2xl font-bold text-white">100%</h3>
            <p className="text-amber-300 font-medium">Compliance Rate</p>
            <p className="text-slate-400 text-sm mt-1">All devices current</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Quick Actions & Device Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-600/30 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Zap className="h-6 w-6 text-emerald-400 mr-3" />
                Quick Actions
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Link href="/portal/schedule">
                  <div className="bg-gradient-to-br from-emerald-600/10 to-emerald-800/10 border border-emerald-400/20 rounded-xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer group">
                    <Calendar className="h-12 w-12 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold text-white mb-2">Schedule Test</h3>
                    <p className="text-slate-300">Book your next backflow test appointment</p>
                  </div>
                </Link>

                <Link href="/portal/billing">
                  <div className="bg-gradient-to-br from-blue-600/10 to-blue-800/10 border border-blue-400/20 rounded-xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer group">
                    <CreditCard className="h-12 w-12 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold text-white mb-2">Pay Bills</h3>
                    <p className="text-slate-300">View and pay outstanding invoices</p>
                  </div>
                </Link>

                <Link href="/portal/reports">
                  <div className="bg-gradient-to-br from-purple-600/10 to-purple-800/10 border border-purple-400/20 rounded-xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer group">
                    <FileText className="h-12 w-12 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold text-white mb-2">View Reports</h3>
                    <p className="text-slate-300">Access your test certificates</p>
                  </div>
                </Link>

                <a href="tel:2532788692">
                  <div className="bg-gradient-to-br from-amber-600/10 to-amber-800/10 border border-amber-400/20 rounded-xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer group">
                    <Phone className="h-12 w-12 text-amber-400 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold text-white mb-2">Call Support</h3>
                    <p className="text-slate-300">(253) 278-8692</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Device Information */}
            <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-600/30 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Shield className="h-6 w-6 text-blue-400 mr-3" />
                Your Backflow Device
              </h2>
              {customer.devices.map((device) => (
                <div key={device.id} className="bg-gradient-to-br from-slate-700/30 to-slate-800/30 rounded-xl p-6 border border-slate-600/20">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{device.make} {device.model}</h3>
                      <p className="text-slate-300 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {device.location}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-green-500/20 text-green-300 text-sm font-semibold rounded-full">
                      {device.status}
                    </span>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-slate-400 text-sm">Serial Number</p>
                      <p className="text-white font-medium">{device.serialNumber}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Size</p>
                      <p className="text-white font-medium">{device.size}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Last Test</p>
                      <p className="text-white font-medium">{device.lastTestDate}</p>
                    </div>
                  </div>
                  
                  <div className="bg-emerald-600/10 border border-emerald-500/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-emerald-300 font-medium">Next Test Due</p>
                        <p className="text-white text-lg font-bold">{device.nextTestDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-300 text-2xl font-bold">{device.daysUntilTest}</p>
                        <p className="text-emerald-400 text-sm">days remaining</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Upcoming & Recent */}
          <div className="space-y-8">
            {/* Upcoming Appointments */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/30 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Clock className="h-5 w-5 text-emerald-400 mr-2" />
                Upcoming Appointments
              </h3>
              {customer.upcomingAppointments.length > 0 ? (
                customer.upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="bg-emerald-600/10 border border-emerald-500/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded">
                        {apt.status}
                      </span>
                      <span className="text-slate-400 text-sm">{apt.date}</span>
                    </div>
                    <h4 className="font-semibold text-white">{apt.type}</h4>
                    <p className="text-slate-300 text-sm">{apt.time} with {apt.technician}</p>
                    <p className="text-slate-400 text-xs mt-1">{apt.deviceLocation}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">No upcoming appointments</p>
                  <Link href="/portal/schedule">
                    <Button className="mt-3 bg-emerald-600 hover:bg-emerald-700">
                      Schedule Now
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Reports */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/30 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <FileText className="h-5 w-5 text-blue-400 mr-2" />
                Recent Reports
              </h3>
              {customer.recentReports.map((report) => (
                <div key={report.id} className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-4 mb-4 hover:bg-blue-600/20 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      report.result === 'Passed' 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {report.result}
                    </span>
                    <span className="text-slate-400 text-sm">{report.date}</span>
                  </div>
                  <h4 className="font-semibold text-white">{report.testType}</h4>
                  <p className="text-slate-400 text-xs">{report.deviceLocation}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-blue-300 text-sm">Next due: {report.nextTestDue}</span>
                    <Button size="sm" variant="ghost" className="text-blue-300 hover:text-blue-200">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Support Card */}
            <div className="bg-gradient-to-br from-amber-600/20 to-amber-800/20 backdrop-blur-sm border border-amber-400/30 rounded-2xl p-6 text-center shadow-xl">
              <Award className="h-12 w-12 text-amber-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Need Help?</h3>
              <p className="text-slate-300 text-sm mb-4">Our certified technicians are here to help</p>
              <div className="space-y-2">
                <a href="tel:2532788692">
                  <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                    <Phone className="h-4 w-4 mr-2" />
                    Call (253) 278-8692
                  </Button>
                </a>
                <a href="mailto:service@fisherbackflows.com">
                  <Button variant="outline" className="w-full border-amber-400/30 text-amber-300 hover:bg-amber-600/10">
                    Email Support
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}