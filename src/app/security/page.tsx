'use client'

import { Shield, Lock, Eye, Database, Key, AlertTriangle, CheckCircle, FileText, Users } from 'lucide-react'
import Link from 'next/link'

export default function SecurityPage() {
  const securityFeatures = [
    {
      icon: <Database className="h-6 w-6" />,
      title: 'Complete Data Isolation',
      description: 'Every company\'s data is completely isolated using Row Level Security (RLS) policies. No company can access another company\'s customer data, devices, or reports.'
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: 'Bulletproof RLS Policies',
      description: 'All database tables are protected with strict Row Level Security policies that filter data by company_id at the database level, not just in application code.'
    },
    {
      icon: <Eye className="h-6 w-6" />,
      title: 'Comprehensive Audit Logging',
      description: 'Every data access, modification, and export is logged with full audit trails including user, timestamp, and IP address.'
    },
    {
      icon: <Key className="h-6 w-6" />,
      title: 'Encryption at Rest',
      description: 'Sensitive customer information is encrypted using AES-256 encryption with company-specific keys.'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Prevention of Data Leaks',
      description: 'Database triggers prevent any attempt to change company_id, making cross-company data transfer impossible.'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Role-Based Access Control',
      description: 'Fine-grained permissions ensure team members only see data they\'re authorized to access within their company.'
    }
  ]

  const technicalSafeguards = [
    {
      category: 'Database Level',
      items: [
        'Row Level Security (RLS) on all tables',
        'Company-scoped security policies',
        'Trigger-based prevention of company_id changes',
        'Automatic audit logging of all operations'
      ]
    },
    {
      category: 'Application Level',
      items: [
        'JWT-based authentication with company context',
        'API rate limiting per company',
        'Input validation and sanitization',
        'SQL injection prevention'
      ]
    },
    {
      category: 'Infrastructure Level',
      items: [
        'SSL/TLS encryption in transit',
        'Isolated database connections',
        'Regular security updates',
        'DDoS protection'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-cyan-400/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">BB</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Tester Portal</h1>
                <p className="text-xs text-white/60">Enterprise Security</p>
              </div>
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 bg-emerald-500/20 border border-emerald-400 rounded-full mb-6">
            <Shield className="h-5 w-5 text-emerald-400 mr-2" />
            <span className="text-emerald-300 font-medium">Bank-Grade Security</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Your Data Is <span className="text-cyan-400">100% Isolated</span>
          </h1>
          
          <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
            At Tester Portal, we understand that your customer data is your most valuable asset. 
            That\'s why we\'ve built enterprise-grade security with complete data isolation between companies.
            <strong className="text-white"> No other company can ever access your customer data.</strong>
          </p>

          <div className="inline-flex items-center px-6 py-3 bg-green-500/20 border border-green-400 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-400 mr-3" />
            <span className="text-green-300 font-semibold">Zero Data Leaks Since Launch</span>
          </div>
        </div>
      </section>

      {/* Security Features Grid */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Enterprise Security Features</h2>
            <p className="text-xl text-white/70">Multiple layers of protection ensure your data stays yours</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-cyan-400/30">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-white/70">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Implementation */}
      <section className="py-16 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Technical Safeguards</h2>
            <p className="text-xl text-white/70">Defense in depth with multiple security layers</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {technicalSafeguards.map((safeguard, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-blue-400/30">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Shield className="h-5 w-5 text-blue-400 mr-2" />
                  {safeguard.category}
                </h3>
                <ul className="space-y-2">
                  {safeguard.items.map((item, i) => (
                    <li key={i} className="flex items-start text-white/80">
                      <CheckCircle className="h-4 w-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Zero Trust Architecture */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl p-8 border border-cyan-400/30">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">Zero Trust Architecture</h3>
                <p className="text-white/80 mb-4">
                  We follow a Zero Trust security model where every request is verified, 
                  authenticated, and authorized before any data access is granted.
                </p>
                <ul className="space-y-2 text-white/70">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></span>
                    Every API request is authenticated with JWT tokens
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></span>
                    Company context is verified on every database query
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></span>
                    Row Level Security enforced at the database level
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></span>
                    All actions are logged for audit trails
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Ownership Guarantee */}
      <section className="py-16 px-6 bg-black/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-emerald-400/30">
            <FileText className="h-16 w-16 text-emerald-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-6">Our Data Protection Guarantee</h2>
            <div className="text-left max-w-2xl mx-auto space-y-4 text-white/80">
              <p className="flex items-start">
                <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 mt-0.5 flex-shrink-0" />
                <span><strong className="text-white">Your data is yours:</strong> You maintain complete ownership of all customer data.</span>
              </p>
              <p className="flex items-start">
                <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 mt-0.5 flex-shrink-0" />
                <span><strong className="text-white">Complete isolation:</strong> No other company can ever see or access your data.</span>
              </p>
              <p className="flex items-start">
                <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 mt-0.5 flex-shrink-0" />
                <span><strong className="text-white">Export anytime:</strong> Export all your data at any time with full audit trails.</span>
              </p>
              <p className="flex items-start">
                <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 mt-0.5 flex-shrink-0" />
                <span><strong className="text-white">GDPR compliant:</strong> Full compliance with data protection regulations.</span>
              </p>
              <p className="flex items-start">
                <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 mt-0.5 flex-shrink-0" />
                <span><strong className="text-white">Regular audits:</strong> Quarterly security audits and penetration testing.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Secure Your Backflow Testing Business?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Join companies that trust Tester Portal with their customer data
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all text-lg"
            >
              Start 14-Day Free Trial
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/30 text-white rounded-lg font-semibold hover:bg-white/20 transition-all text-lg"
            >
              Request Security Audit
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center text-white/60">
          <p>© 2025 Tester Portal. Enterprise-grade security for backflow testing companies.</p>
          <p className="mt-2">
            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
            {' • '}
            <Link href="/terms" className="hover:text-white">Terms of Service</Link>
            {' • '}
            <Link href="/security" className="hover:text-white">Security</Link>
          </p>
        </div>
      </footer>
    </div>
  )
}