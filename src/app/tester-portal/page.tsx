'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Code, 
  Key, 
  Globe, 
  Users, 
  BarChart3, 
  Zap, 
  Shield, 
  CheckCircle,
  ArrowRight,
  Database,
  Webhook,
  Settings
} from 'lucide-react'

export default function BackflowBuddyPage() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900">
      {/* Header */}
      <header className="border-b border-cyan-400/20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
                <span className="text-white font-semibold">Fisher Backflows</span>
              </Link>
              <div className="hidden sm:block w-px h-6 bg-cyan-400/30"></div>
              <div className="flex items-center space-x-2">
                <Code className="h-5 w-5 text-cyan-400" />
                <span className="text-cyan-400 font-semibold">Tester Portal API</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/team-portal"
                className="text-cyan-400 hover:text-white transition-colors"
              >
                Team Portal
              </Link>
              <Link
                href="/tester-portal/signup"
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all"
              >
                Get API Access
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center space-x-2 bg-cyan-500/20 border border-cyan-400/30 rounded-full px-4 py-2 text-cyan-400 text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              <span>Powerful API for Backflow Testing</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Tester Portal
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                API Platform
              </span>
            </h1>
            <p className="text-xl text-cyan-100 max-w-3xl mx-auto mb-8">
              Integrate professional backflow testing management into your existing website. 
              Complete customer management, scheduling, compliance, and billing APIs.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/tester-portal/docs"
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-cyan-600 hover:to-blue-600 transition-all flex items-center justify-center"
            >
              View API Docs
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/tester-portal/demo"
              className="border border-cyan-400 text-cyan-400 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-cyan-400/10 transition-all"
            >
              Try Live Demo
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">99.9%</div>
              <div className="text-cyan-300">API Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">&lt;200ms</div>
              <div className="text-cyan-300">Average Response</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <div className="text-cyan-300">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-cyan-100 max-w-2xl mx-auto">
              Complete backflow testing management APIs designed for easy integration
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Customer Management */}
            <div className="bg-white/5 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6 hover:border-cyan-400/40 transition-all">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Customer Management</h3>
              <p className="text-cyan-200 mb-4">
                Complete customer lifecycle APIs - registration, profiles, device tracking, and communication.
              </p>
              <ul className="space-y-2 text-sm text-cyan-300">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-400" />Customer CRUD operations</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-400" />Device & location management</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-400" />Automated notifications</li>
              </ul>
            </div>

            {/* Scheduling */}
            <div className="bg-white/5 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6 hover:border-cyan-400/40 transition-all">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center mb-4">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Smart Scheduling</h3>
              <p className="text-cyan-200 mb-4">
                Intelligent appointment scheduling with technician routing and customer preferences.
              </p>
              <ul className="space-y-2 text-sm text-cyan-300">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-400" />Automated scheduling</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-400" />Route optimization</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-400" />Calendar integrations</li>
              </ul>
            </div>

            {/* Compliance */}
            <div className="bg-white/5 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6 hover:border-cyan-400/40 transition-all">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Compliance Automation</h3>
              <p className="text-cyan-200 mb-4">
                Automated compliance reporting and water district submissions with audit trails.
              </p>
              <ul className="space-y-2 text-sm text-cyan-300">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-400" />Automated reporting</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-400" />Water district integration</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-400" />Audit trail logging</li>
              </ul>
            </div>

            {/* Billing */}
            <div className="bg-white/5 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6 hover:border-cyan-400/40 transition-all">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center mb-4">
                <Database className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Billing & Payments</h3>
              <p className="text-cyan-200 mb-4">
                Complete billing automation with Stripe integration and recurring payment management.
              </p>
              <ul className="space-y-2 text-sm text-cyan-300">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-400" />Automated invoicing</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-400" />Payment processing</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-400" />Subscription management</li>
              </ul>
            </div>

            {/* Analytics */}
            <div className="bg-white/5 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6 hover:border-cyan-400/40 transition-all">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Analytics & Reporting</h3>
              <p className="text-cyan-200 mb-4">
                Comprehensive business intelligence with real-time dashboards and custom reports.
              </p>
              <ul className="space-y-2 text-sm text-cyan-300">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-400" />Real-time dashboards</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-400" />Custom reporting</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-400" />Data export APIs</li>
              </ul>
            </div>

            {/* Webhooks */}
            <div className="bg-white/5 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6 hover:border-cyan-400/40 transition-all">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center mb-4">
                <Webhook className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Real-time Webhooks</h3>
              <p className="text-cyan-200 mb-4">
                Stay synchronized with real-time event notifications for all critical business events.
              </p>
              <ul className="space-y-2 text-sm text-cyan-300">
                <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-400" />Event notifications</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-400" />Custom webhooks</li>
                <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-400" />Retry mechanisms</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-cyan-100">
              Pay only for what you use. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="bg-white/5 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
                <div className="text-4xl font-bold text-cyan-400 mb-2">$99<span className="text-lg text-cyan-300">/mo</span></div>
                <p className="text-cyan-200">Up to 500 customers</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-cyan-200">
                  <CheckCircle className="h-5 w-5 mr-3 text-green-400" />
                  Customer Management API
                </li>
                <li className="flex items-center text-cyan-200">
                  <CheckCircle className="h-5 w-5 mr-3 text-green-400" />
                  Basic Scheduling
                </li>
                <li className="flex items-center text-cyan-200">
                  <CheckCircle className="h-5 w-5 mr-3 text-green-400" />
                  Standard Support
                </li>
                <li className="flex items-center text-cyan-200">
                  <CheckCircle className="h-5 w-5 mr-3 text-green-400" />
                  10,000 API calls/mo
                </li>
              </ul>
              <Link
                href="/tester-portal/signup?plan=starter"
                className="block w-full text-center bg-cyan-600 text-white py-3 rounded-lg font-semibold hover:bg-cyan-700 transition-colors"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Professional */}
            <div className="bg-gradient-to-b from-cyan-500/20 to-blue-500/20 border-2 border-cyan-400 rounded-xl p-8 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-2 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Professional</h3>
                <div className="text-4xl font-bold text-cyan-400 mb-2">$299<span className="text-lg text-cyan-300">/mo</span></div>
                <p className="text-cyan-200">Up to 2,000 customers</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-cyan-200">
                  <CheckCircle className="h-5 w-5 mr-3 text-green-400" />
                  Everything in Starter
                </li>
                <li className="flex items-center text-cyan-200">
                  <CheckCircle className="h-5 w-5 mr-3 text-green-400" />
                  Advanced Scheduling & Routing
                </li>
                <li className="flex items-center text-cyan-200">
                  <CheckCircle className="h-5 w-5 mr-3 text-green-400" />
                  Compliance Automation
                </li>
                <li className="flex items-center text-cyan-200">
                  <CheckCircle className="h-5 w-5 mr-3 text-green-400" />
                  Priority Support
                </li>
                <li className="flex items-center text-cyan-200">
                  <CheckCircle className="h-5 w-5 mr-3 text-green-400" />
                  50,000 API calls/mo
                </li>
              </ul>
              <Link
                href="/tester-portal/signup?plan=professional"
                className="block w-full text-center bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-white/5 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
                <div className="text-4xl font-bold text-cyan-400 mb-2">Custom</div>
                <p className="text-cyan-200">Unlimited customers</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-cyan-200">
                  <CheckCircle className="h-5 w-5 mr-3 text-green-400" />
                  Everything in Professional
                </li>
                <li className="flex items-center text-cyan-200">
                  <CheckCircle className="h-5 w-5 mr-3 text-green-400" />
                  Custom Integrations
                </li>
                <li className="flex items-center text-cyan-200">
                  <CheckCircle className="h-5 w-5 mr-3 text-green-400" />
                  Dedicated Support
                </li>
                <li className="flex items-center text-cyan-200">
                  <CheckCircle className="h-5 w-5 mr-3 text-green-400" />
                  Unlimited API calls
                </li>
              </ul>
              <Link
                href="/tester-portal/contact"
                className="block w-full text-center bg-cyan-600 text-white py-3 rounded-lg font-semibold hover:bg-cyan-700 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-black/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-cyan-100 mb-8">
            Join backflow testing companies already using our API to grow their business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/tester-portal/signup"
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-cyan-600 hover:to-blue-600 transition-all"
            >
              Start Free Trial
            </Link>
            <Link
              href="/tester-portal/demo"
              className="border border-cyan-400 text-cyan-400 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-cyan-400/10 transition-all"
            >
              Schedule Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}