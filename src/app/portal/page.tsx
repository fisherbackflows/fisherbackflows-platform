'use client';

import Link from 'next/link';
import LoginForm from '@/components/auth/LoginForm';
import Logo from '@/components/ui/Logo';
import { 
  Shield,
  CheckCircle,
  Clock,
  CreditCard,
  Droplet
} from 'lucide-react';

export default function CustomerPortalLoginPage() {
  return (
    <div className="min-h-screen bg-black relative">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid opacity-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-blue-500/5" />
      
      {/* Header */}
      <header className="glass border-b border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/">
              <Logo width={180} height={144} />
            </Link>
            <nav className="hidden md:flex space-x-4">
              <Link href="/" className="glass border border-white/20 px-4 py-2 rounded-lg text-white/90 hover:text-white hover:border-white/40 transition-all duration-300 hover:bg-white/10 hover:scale-105">
                Home
              </Link>
              <Link href="/app" className="glass border border-blue-400/30 px-4 py-2 rounded-lg text-blue-400 hover:text-white hover:border-blue-400/60 transition-all duration-300 hover:bg-blue-400/20 hover:scale-105 glow-blue-sm">
                Team App
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center min-h-[calc(100vh-100px)] p-4 relative z-10">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Info */}
          <div className="hidden lg:block">
            <h1 className="text-4xl font-bold mb-6">
              <span className="text-white">Welcome to Your</span><br />
              <span className="gradient-text text-glow">Customer Portal</span>
            </h1>
            
            <p className="text-xl text-white/70 mb-8 leading-relaxed">
              Manage your backflow testing services, pay bills, schedule appointments, 
              and access all your test records in one secure place.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="glass rounded-lg p-6 card-hover">
                <CreditCard className="h-8 w-8 text-blue-400 mb-3" />
                <h3 className="font-semibold mb-2">Secure Payments</h3>
                <p className="text-white/60 text-sm">Pay bills online with multiple payment options</p>
              </div>
              
              <div className="glass rounded-lg p-6 card-hover">
                <Clock className="h-8 w-8 text-blue-400 mb-3" />
                <h3 className="font-semibold mb-2">Easy Scheduling</h3>
                <p className="text-white/60 text-sm">Book appointments 24/7 at your convenience</p>
              </div>
              
              <div className="glass rounded-lg p-6 card-hover">
                <CheckCircle className="h-8 w-8 text-blue-400 mb-3" />
                <h3 className="font-semibold mb-2">Test Records</h3>
                <p className="text-white/60 text-sm">Access all certificates and compliance documents</p>
              </div>
              
              <div className="glass rounded-lg p-6 card-hover">
                <Shield className="h-8 w-8 text-blue-400 mb-3" />
                <h3 className="font-semibold mb-2">Account Management</h3>
                <p className="text-white/60 text-sm">Track service history and upcoming tests</p>
              </div>
            </div>

            {/* Security Notice */}
            <div className="glass-blue rounded-lg p-4">
              <div className="flex items-center space-x-3 text-white/90 text-sm">
                <Shield className="h-5 w-5 flex-shrink-0 text-blue-400" />
                <span>
                  Your information is protected with bank-level security and encryption.
                </span>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full">
            <LoginForm redirectTo="/portal/dashboard" />
            
            {/* Mobile Features Preview */}
            <div className="lg:hidden mt-8 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="glass rounded-lg p-4 mb-2">
                  <CreditCard className="h-6 w-6 text-blue-400 mx-auto" />
                </div>
                <div className="text-white/80 text-sm">Easy Payments</div>
              </div>
              <div className="text-center">
                <div className="glass rounded-lg p-4 mb-2">
                  <Clock className="h-6 w-6 text-blue-400 mx-auto" />
                </div>
                <div className="text-white/80 text-sm">Schedule Tests</div>
              </div>
              <div className="text-center">
                <div className="glass rounded-lg p-4 mb-2">
                  <CheckCircle className="h-6 w-6 text-blue-400 mx-auto" />
                </div>
                <div className="text-white/80 text-sm">Track Status</div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="mt-8 text-center text-white/60 text-sm">
              <p>Need help accessing your account?</p>
              <p className="mt-1">
                Call us at{' '}
                <a 
                  href="tel:2532788692" 
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  (253) 278-8692
                </a>
                {' '}or email{' '}
                <a 
                  href="mailto:service@fisherbackflows.com" 
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  service@fisherbackflows.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}