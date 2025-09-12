'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Zap, Users, BarChart3 } from 'lucide-react'

export default function UpgradePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Upgrade Your Tester Portal
          </h1>
          <p className="text-xl text-cyan-200">
            Unlock powerful features to grow your backflow testing business
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Customer Management */}
          <div className="bg-white/5 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Customer Management</h3>
            <p className="text-cyan-200 mb-4">Advanced customer tools and database management</p>
            <div className="text-2xl font-bold text-cyan-400 mb-4">$29/month</div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center text-cyan-200">
                <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                Unlimited customers
              </li>
              <li className="flex items-center text-cyan-200">
                <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                Data import/export
              </li>
              <li className="flex items-center text-cyan-200">
                <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                Lead management
              </li>
            </ul>
            <button className="w-full bg-cyan-600 text-white py-2 rounded-lg font-semibold hover:bg-cyan-700 transition-colors">
              Subscribe
            </button>
          </div>

          {/* Analytics */}
          <div className="bg-white/5 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Analytics & Reports</h3>
            <p className="text-cyan-200 mb-4">Business intelligence and performance insights</p>
            <div className="text-2xl font-bold text-blue-400 mb-4">$49/month</div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center text-cyan-200">
                <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                Advanced dashboards
              </li>
              <li className="flex items-center text-cyan-200">
                <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                Custom reports
              </li>
              <li className="flex items-center text-cyan-200">
                <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                Data export
              </li>
            </ul>
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Subscribe
            </button>
          </div>

          {/* All Features */}
          <div className="bg-gradient-to-b from-cyan-500/20 to-blue-500/20 border-2 border-cyan-400 rounded-xl p-6">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Complete Package</h3>
            <p className="text-cyan-200 mb-4">All features included - best value</p>
            <div className="text-2xl font-bold text-cyan-400 mb-4">$99/month</div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center text-cyan-200">
                <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                Everything included
              </li>
              <li className="flex items-center text-cyan-200">
                <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                Priority support
              </li>
              <li className="flex items-center text-cyan-200">
                <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                Custom integrations
              </li>
            </ul>
            <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-2 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all">
              Subscribe
            </button>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link
            href="/tester-portal/dashboard"
            className="text-cyan-400 hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
