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

import { useCustomerData } from '@/hooks/useCustomerData';

export default function CustomerPortalDashboard() {
  const { customer, loading, error } = useCustomerData();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-white/80">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Unable to Load Dashboard</h2>
          <p className="text-white/80 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="btn-glow">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-white/80">No customer data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Professional Header */}
      <header className="glass border-b border-blue-400 sticky top-0 z-50 glow-blue-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold text-white">
                Fisher Backflows
              </Link>
              <nav className="hidden md:flex space-x-1">
                <Link href="/portal/dashboard" className="px-4 py-2 rounded-2xl glass-btn-primary text-white glow-blue-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/portal/schedule" className="px-4 py-2 rounded-2xl text-white/90 hover:text-white hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm transition-all font-medium">
                  Schedule
                </Link>
                <Link href="/portal/billing" className="px-4 py-2 rounded-2xl text-white/90 hover:text-white hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm transition-all font-medium">
                  Billing
                </Link>
                <Link href="/portal/devices" className="px-4 py-2 rounded-2xl text-white/90 hover:text-white hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm transition-all font-medium">
                  Devices
                </Link>
                <Link href="/portal/reports" className="px-4 py-2 rounded-2xl text-white/90 hover:text-white hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm transition-all font-medium">
                  Reports
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="font-semibold text-white">{customer.name}</p>
                <p className="text-sm text-white/80">Account: {customer.accountNumber}</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-white/80">
                  <Bell className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-white/80">
                  <Settings className="h-5 w-5" />
                </Button>
                <Link href="/">
                  <Button variant="ghost" size="sm" className="text-white/80 hover:text-white/80">
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

      {/* Navigation Header */}
      <header className="glass border-b border-blue-400 glow-blue-sm mb-6">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/portal/dashboard">
              <Button variant="ghost" className="text-blue-300 hover:text-white">
                ← Back to Dashboard
              </Button>
            </Link>
            <nav className="flex space-x-4">
              <Link href="/portal/billing">
                <Button variant="ghost" className="text-blue-300 hover:text-white">Billing</Button>
              </Link>
              <Link href="/portal/devices">
                <Button variant="ghost" className="text-blue-300 hover:text-white">Devices</Button>
              </Link>
              <Link href="/portal/reports">
                <Button variant="ghost" className="text-blue-300 hover:text-white">Reports</Button>
              </Link>
              <Link href="/portal/schedule">
                <Button variant="ghost" className="text-blue-300 hover:text-white">Schedule</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

        {/* Welcome Section */}
        <div className="mb-10">
          <div className="glass rounded-2xl p-8 border border-blue-400">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-white">
                  Welcome back, <span className="text-blue-300">{customer.name}!</span>
                </h1>
                <p className="text-white/90 text-lg mb-4">Your backflow testing is up to date and compliant.</p>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-emerald-500/20 border border-emerald-400 glow-blue-sm0 rounded-full"></div>
                    <span className="text-sm font-medium text-white/80">System Protected</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-full"></div>
                    <span className="text-sm font-medium text-white/80">Fully Compliant</span>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="w-24 h-24 bg-emerald-500/20 border border-emerald-400 glow-blue-sm rounded-2xl flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-emerald-300" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Device Status */}
          <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm hover:glow-blue transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-400 glow-blue-sm rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-emerald-300" />
              </div>
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400 glow-blue-sm text-emerald-700 text-xs font-semibold rounded-full">ACTIVE</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{customer.devices.length}</h3>
            <p className="text-white/80 font-medium">Active Device</p>
            <p className="text-white/80 text-sm mt-2">Last tested: Jan 15, 2024</p>
          </div>

          {/* Next Test */}
          <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm hover:glow-blue transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 border border-blue-400 glow-blue-sm rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-300" />
              </div>
              <span className="px-3 py-1 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 border border-blue-400 glow-blue-sm text-blue-700 text-xs font-semibold rounded-full">UPCOMING</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">45</h3>
            <p className="text-white/80 font-medium">Days Until Test</p>
            <p className="text-white/80 text-sm mt-2">Due: Jan 15, 2025</p>
          </div>

          {/* Account Balance */}
          <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm hover:glow-blue transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/20 border border-green-400 glow-blue-sm rounded-xl flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-green-300" />
              </div>
              <span className="px-3 py-1 bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/20 border border-green-400 glow-blue-sm text-green-700 text-xs font-semibold rounded-full">PAID</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">${customer.balance.toFixed(2)}</h3>
            <p className="text-white/80 font-medium">Account Balance</p>
            <p className="text-white/80 text-sm mt-2">All payments current</p>
          </div>

          {/* Service Status */}
          <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm hover:glow-blue transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-500/20 border border-amber-400 glow-blue-sm rounded-xl flex items-center justify-center">
                <Award className="h-6 w-6 text-amber-300" />
              </div>
              <span className="px-3 py-1 bg-amber-500/20 border border-amber-400 glow-blue-sm text-amber-700 text-xs font-semibold rounded-full">CERTIFIED</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">100%</h3>
            <p className="text-white/80 font-medium">Compliance Rate</p>
            <p className="text-white/80 text-sm mt-2">BAT certified testing</p>
          </div>
        </div>

        {/* Quick Actions and Recent Activity */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
              <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
              <div className="space-y-4">
                <Link href="/portal/schedule" className="block">
                  <div className="flex items-center p-4 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 border border-blue-400 glow-blue-sm rounded-2xl transition-colors border border-blue-200">
                    <Calendar className="h-8 w-8 text-blue-300 mr-4" />
                    <div>
                      <h3 className="font-semibold text-white">Schedule Test</h3>
                      <p className="text-sm text-white/90">Book your annual testing</p>
                    </div>
                  </div>
                </Link>
                
                <Link href="/portal/billing" className="block">
                  <div className="flex items-center p-4 bg-emerald-500/20 border border-emerald-400 glow-blue-sm hover:bg-emerald-500/20 border border-emerald-400 glow-blue-sm rounded-2xl transition-colors border border-emerald-200">
                    <CreditCard className="h-8 w-8 text-emerald-300 mr-4" />
                    <div>
                      <h3 className="font-semibold text-white">Pay Bill</h3>
                      <p className="text-sm text-white/90">Make a payment online</p>
                    </div>
                  </div>
                </Link>
                
                <Link href="/portal/reports" className="block">
                  <div className="flex items-center p-4 bg-amber-50 hover:bg-amber-500/20 border border-amber-400 glow-blue-sm rounded-2xl transition-colors border border-amber-200">
                    <FileText className="h-8 w-8 text-amber-300 mr-4" />
                    <div>
                      <h3 className="font-semibold text-white">View Reports</h3>
                      <p className="text-sm text-white/90">Download test certificates</p>
                    </div>
                  </div>
                </Link>

                <div className="flex items-center p-4 glass hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm rounded-2xl transition-colors border border-blue-400 cursor-pointer">
                  <Phone className="h-8 w-8 text-white/90 mr-4" />
                  <div>
                    <h3 className="font-semibold text-white">Call Support</h3>
                    <p className="text-sm text-white/90">(253) 278-8692</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Device Details and Recent Activity */}
          <div className="lg:col-span-2 space-y-8">
            {/* Current Device */}
            <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
              <h2 className="text-xl font-bold text-white mb-6">Your Backflow Device</h2>
              {customer.devices.map((device) => (
                <div key={device.id} className="border border-blue-400 rounded-2xl p-6 glass">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-white text-lg">{device.location}</h3>
                      <p className="text-white/90">{device.make} {device.model} - {device.size}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      device.status === 'Passed' 
                        ? 'bg-emerald-500/20 border border-emerald-400 glow-blue-sm text-emerald-700' 
                        : 'bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl/20 border border-red-400 glow-blue-sm text-red-700'
                    }`}>
                      {device.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-white/80">Serial Number</p>
                      <p className="font-semibold text-white">{device.serialNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">Last Test</p>
                      <p className="font-semibold text-white">{device.lastTestDate}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">Next Test Due</p>
                      <p className="font-semibold text-white">{device.nextTestDate}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">Days Remaining</p>
                      <p className="font-semibold text-blue-300">{device.daysUntilTest} days</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Link href="/portal/schedule">
                      <Button className="glass-btn-primary hover:glow-blue text-white">
                        Schedule Test
                      </Button>
                    </Link>
                    <Link href="/portal/reports">
                      <Button variant="outline" className="border-blue-400 text-white/80 hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download Report
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Test History */}
            <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
              <h2 className="text-xl font-bold text-white mb-6">Recent Test History</h2>
              <div className="space-y-4">
                {customer.recentTests.map((test) => (
                  <div key={test.id} className="flex items-center justify-between p-4 glass rounded-2xl border border-blue-400">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${test.result === 'Passed' ? 'bg-emerald-500/20 border border-emerald-400 glow-blue-sm0' : 'bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl'}`}></div>
                      <div>
                        <p className="font-semibold text-white">{test.testType}</p>
                        <p className="text-sm text-white/90">{test.location}</p>
                        <p className="text-sm text-white/80">{test.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        test.result === 'Passed' 
                          ? 'bg-emerald-500/20 border border-emerald-400 glow-blue-sm text-emerald-700' 
                          : 'bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl/20 border border-red-400 glow-blue-sm text-red-700'
                      }`}>
                        {test.result}
                      </span>
                      <Button variant="outline" size="sm" className="border-blue-400 text-white/80">
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
        <div className="mt-12 glass rounded-xl p-6 border border-blue-400">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-2">Need Assistance?</h3>
            <p className="text-white/90 mb-4">Our team is here to help with any questions about your backflow testing.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:2532788692" className="flex items-center justify-center space-x-2 glass-btn-primary hover:glow-blue text-white px-6 py-3 rounded-2xl font-semibold transition-colors">
                <Phone className="h-5 w-5" />
                <span>(253) 278-8692</span>
              </a>
              <a href="mailto:service@fisherbackflows.com" className="flex items-center justify-center space-x-2 glass hover:glass text-white/80 px-6 py-3 rounded-2xl font-semibold border border-blue-400 transition-colors">
                <span>service@fisherbackflows.com</span>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}