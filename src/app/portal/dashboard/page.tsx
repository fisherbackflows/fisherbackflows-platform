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
import { PortalNavigation } from '@/components/navigation/UnifiedNavigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function CustomerPortalDashboard() {
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
      <div className="fixed inset-0 bg-grid opacity-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600/80/5 via-transparent to-blue-500/80/5" />

      <PortalNavigation userInfo={{
        name: customer?.name,
        email: customer?.email,
        accountNumber: customer?.accountNumber
      }} />

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">

        {/* Welcome Section */}
        <div className="mb-8 sm:mb-10">
          <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-blue-400">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-white">
                  Welcome back, <span className="text-blue-300">{customer.name}!</span>
                </h1>
                <p className="text-white/90 text-base sm:text-lg mb-4">Your backflow testing is up to date and compliant.</p>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-emerald-500/20 border border-emerald-400 glow-blue-sm rounded-full"></div>
                    <span className="text-sm font-medium text-white/80">System Protected</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-full"></div>
                    <span className="text-sm font-medium text-white/80">Fully Compliant</span>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block flex-shrink-0 mt-4 lg:mt-0 lg:ml-6">
                <div className="w-24 h-24 bg-emerald-500/20 border border-emerald-400 glow-blue-sm rounded-2xl flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-emerald-300" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-10">
          {/* Device Status - Clickable */}
          <Link href="/portal/devices" className="block">
            <div className="glass border border-blue-400 rounded-xl p-4 sm:p-6 glow-blue-sm hover:glow-blue transition-all duration-200 cursor-pointer transform hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-400 glow-blue-sm rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-emerald-300" />
                </div>
                <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400 glow-blue-sm text-emerald-200 text-xs font-semibold rounded-full">ACTIVE</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">{customer.devices.length}</h3>
              <p className="text-white/80 font-medium">Active Device</p>
              <p className="text-white/80 text-sm mt-2">Last tested: Jan 15, 2024</p>
            </div>
          </Link>

          {/* Next Test - Clickable */}
          <Link href="/portal/schedule" className="block">
            <div className="glass border border-blue-400 rounded-xl p-4 sm:p-6 glow-blue-sm hover:glow-blue transition-all duration-200 cursor-pointer transform hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 border border-blue-400 glow-blue-sm rounded-xl flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-300" />
                </div>
                <span className="px-3 py-1 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 border border-blue-400 glow-blue-sm text-blue-200 text-xs font-semibold rounded-full">UPCOMING</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">45</h3>
              <p className="text-white/80 font-medium">Days Until Test</p>
              <p className="text-white/80 text-sm mt-2">Due: Jan 15, 2025</p>
            </div>
          </Link>

          {/* Account Balance - Clickable */}
          <Link href="/portal/billing" className="block">
            <div className="glass border border-blue-400 rounded-xl p-4 sm:p-6 glow-blue-sm hover:glow-blue transition-all duration-200 cursor-pointer transform hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/20 border border-green-400 glow-blue-sm rounded-xl flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-green-300" />
                </div>
                <span className="px-3 py-1 bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/20 border border-green-400 glow-blue-sm text-green-200 text-xs font-semibold rounded-full">PAID</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">${customer.balance.toFixed(2)}</h3>
              <p className="text-white/80 font-medium">Account Balance</p>
              <p className="text-white/80 text-sm mt-2">All payments current</p>
            </div>
          </Link>

          {/* Service Status - Clickable */}
          <Link href="/portal/reports" className="block">
            <div className="glass border border-blue-400 rounded-xl p-4 sm:p-6 glow-blue-sm hover:glow-blue transition-all duration-200 cursor-pointer transform hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-amber-500/20 border border-amber-400 glow-blue-sm rounded-xl flex items-center justify-center">
                  <Award className="h-6 w-6 text-amber-300" />
                </div>
                <span className="px-3 py-1 bg-amber-500/20 border border-amber-400 glow-blue-sm text-amber-200 text-xs font-semibold rounded-full">CERTIFIED</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">100%</h3>
              <p className="text-white/80 font-medium">Compliance Rate</p>
              <p className="text-white/80 text-sm mt-2">BAT certified testing</p>
            </div>
          </Link>
        </div>

        {/* Quick Actions and Recent Activity */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="glass border border-blue-400 rounded-xl p-4 md:p-6 glow-blue-sm">
              <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 md:space-y-4 md:gap-0 md:grid-cols-1">
                <Link href="/portal/schedule" className="block">
                  <div className="flex items-center p-3 md:p-4 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl hover:bg-gradient-to-r from-blue-600/70 to-blue-500/70 backdrop-blur-xl border border-blue-400 glow-blue-sm rounded-xl md:rounded-2xl transition-colors">
                    <Calendar className="h-6 w-6 md:h-8 md:w-8 text-blue-300 mr-3 md:mr-4 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm md:text-base font-semibold text-white">Schedule Test</h3>
                      <p className="text-xs md:text-sm text-white/90">Book your annual testing</p>
                    </div>
                  </div>
                </Link>
                
                <Link href="/portal/billing" className="block">
                  <div className="flex items-center p-3 md:p-4 bg-emerald-500/20 border border-emerald-400 glow-blue-sm hover:bg-emerald-500/30 rounded-xl md:rounded-2xl transition-colors">
                    <CreditCard className="h-6 w-6 md:h-8 md:w-8 text-emerald-300 mr-3 md:mr-4 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm md:text-base font-semibold text-white">Pay Bill</h3>
                      <p className="text-xs md:text-sm text-white/90">Make a payment online</p>
                    </div>
                  </div>
                </Link>
                
                <Link href="/portal/reports" className="block">
                  <div className="flex items-center p-3 md:p-4 bg-amber-500/20 border border-amber-400 glow-blue-sm hover:bg-amber-500/30 rounded-xl md:rounded-2xl transition-colors">
                    <FileText className="h-6 w-6 md:h-8 md:w-8 text-amber-300 mr-3 md:mr-4 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm md:text-base font-semibold text-white">View Reports</h3>
                      <p className="text-xs md:text-sm text-white/90">Download test certificates</p>
                    </div>
                  </div>
                </Link>

                <div className="flex items-center p-3 md:p-4 glass hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm rounded-xl md:rounded-2xl transition-colors border border-blue-400 cursor-pointer sm:col-span-2 lg:col-span-1">
                  <Phone className="h-6 w-6 md:h-8 md:w-8 text-white/90 mr-3 md:mr-4 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm md:text-base font-semibold text-white">Call Support</h3>
                    <p className="text-xs md:text-sm text-white/90">(253) 278-8692</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Device Details and Recent Activity */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            {/* Current Device */}
            <div className="glass border border-blue-400 rounded-xl p-4 sm:p-6 glow-blue-sm">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Your Backflow Device</h2>
              {customer.devices.map((device) => (
                <div key={device.id} className="border border-blue-400 rounded-xl sm:rounded-2xl p-4 sm:p-6 glass">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 space-y-2 sm:space-y-0">
                    <div>
                      <h3 className="font-bold text-white text-base sm:text-lg">{device.location}</h3>
                      <p className="text-white/90 text-sm sm:text-base">{device.make} {device.model} - {device.size}</p>
                    </div>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                      device.status === 'Passed' 
                        ? 'bg-emerald-500/20 border border-emerald-400 glow-blue-sm text-emerald-200' 
                        : 'bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl/20 border border-red-400 glow-blue-sm text-red-200'
                    }`}>
                      {device.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-white/80">Serial Number</p>
                      <p className="font-semibold text-white text-sm sm:text-base">{device.serialNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-white/80">Last Test</p>
                      <p className="font-semibold text-white text-sm sm:text-base">{device.lastTestDate}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-white/80">Next Test Due</p>
                      <p className="font-semibold text-white text-sm sm:text-base">{device.nextTestDate}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-white/80">Days Remaining</p>
                      <p className="font-semibold text-blue-300 text-sm sm:text-base">{device.daysUntilTest} days</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Link href="/portal/schedule" className="w-full sm:w-auto">
                      <Button className="w-full sm:w-auto glass-btn-primary hover:glow-blue text-white text-sm">
                        Schedule Test
                      </Button>
                    </Link>
                    <Link href="/portal/reports" className="w-full sm:w-auto">
                      <Button variant="outline" className="w-full sm:w-auto border-blue-400 text-white/80 hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm text-sm">
                        <Download className="h-3 w-3 mr-1" />
                        Report
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Test History */}
            <div className="glass border border-blue-400 rounded-xl p-4 sm:p-6 glow-blue-sm">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Recent Test History</h2>
              <div className="space-y-3">
                {customer.recentTests.map((test) => (
                  <div key={test.id} className="glass rounded-xl border border-blue-400 p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      {/* Test Info */}
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${test.result === 'Passed' ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm sm:text-base truncate">{test.testType}</p>
                          <p className="text-xs sm:text-sm text-white/80">{test.location} • {test.date}</p>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-2 pl-5 sm:pl-0">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          test.result === 'Passed' 
                            ? 'bg-emerald-500/20 text-emerald-200' 
                            : 'bg-red-500/20 text-red-200'
                        }`}>
                          {test.result}
                        </span>
                        <Button variant="outline" size="sm" className="h-7 px-2 border-blue-400 text-white/80 text-xs">
                          <Download className="h-3 w-3 mr-1" />
                          PDF
                        </Button>
                      </div>
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

export default function CustomerPortalDashboardWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <CustomerPortalDashboard />
    </ErrorBoundary>
  )
}