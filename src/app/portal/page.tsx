'use client';

import Link from 'next/link';
import LoginForm from '@/components/auth/LoginForm';
import Logo from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { 
  Shield,
  CheckCircle,
  CreditCard,
  Calendar,
  FileText
} from 'lucide-react';

export default function CustomerPortalLoginPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="glass border-b border-blue-400 glow-blue-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/">
              <Logo width={160} height={128} />
            </Link>
            <nav className="hidden md:flex space-x-1">
              <Link href="/">
                <Button variant="ghost" className="px-5 py-2.5 rounded-2xl text-white/80 hover:text-white hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm transition-all duration-200 font-medium">
                  Home
                </Button>
              </Link>
              <Link href="/team-portal">
                <Button variant="ghost" className="px-5 py-2.5 rounded-2xl text-white/80 hover:text-white hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm transition-all duration-200 font-medium">
                  Business Login
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center min-h-[calc(100vh-100px)] p-6 glass">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Info */}
          <div className="hidden lg:block">
            <div className="mb-8">
              <div className="inline-block bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl border border-blue-200 px-4 py-2 rounded-full text-blue-700 text-sm font-semibold mb-6">
                <Shield className="h-4 w-4 mr-2 inline" />
                Secure Customer Portal
              </div>
              <h1 className="text-4xl font-bold mb-6 text-white">
                <span>Welcome to Your</span><br />
                <span className="glass bg-clip-text text-transparent">Customer Portal</span>
              </h1>
            </div>
            
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Manage your backflow testing services, pay bills, schedule appointments, 
              and access all your test records in one secure place.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm hover:glow-blue transition-all duration-200">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 border border-blue-400 glow-blue-sm rounded-xl flex items-center justify-center mb-4">
                  <CreditCard className="h-6 w-6 text-blue-300" />
                </div>
                <h3 className="font-semibold mb-2 text-white">Secure Payments</h3>
                <p className="text-white/90 text-sm leading-relaxed">Pay bills online with multiple payment options</p>
              </div>
              
              <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm hover:glow-blue transition-all duration-200">
                <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-400 glow-blue-sm rounded-xl flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-emerald-300" />
                </div>
                <h3 className="font-semibold mb-2 text-white">Easy Scheduling</h3>
                <p className="text-white/90 text-sm leading-relaxed">Book appointments 24/7 at your convenience</p>
              </div>
              
              <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm hover:glow-blue transition-all duration-200">
                <div className="w-12 h-12 bg-amber-500/20 border border-amber-400 glow-blue-sm rounded-xl flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-amber-300" />
                </div>
                <h3 className="font-semibold mb-2 text-white">Test Records</h3>
                <p className="text-white/90 text-sm leading-relaxed">Access all certificates and compliance documents</p>
              </div>
              
              <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm hover:glow-blue transition-all duration-200">
                <div className="w-12 h-12 bg-purple-500/20 border border-purple-400 glow-blue-sm rounded-xl flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-purple-300" />
                </div>
                <h3 className="font-semibold mb-2 text-white">Account Management</h3>
                <p className="text-white/90 text-sm leading-relaxed">Track service history and upcoming tests</p>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-emerald-500/20 border border-emerald-400 glow-blue-sm border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center space-x-3 text-sm text-emerald-700">
                <Shield className="h-5 w-5 flex-shrink-0" />
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
                <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 border border-blue-400 glow-blue-sm border border-blue-200 rounded-xl p-4 mb-2">
                  <CreditCard className="h-6 w-6 mx-auto text-blue-300" />
                </div>
                <div className="text-white/90 text-sm">Easy Payments</div>
              </div>
              <div className="text-center">
                <div className="bg-emerald-500/20 border border-emerald-400 glow-blue-sm border border-emerald-200 rounded-xl p-4 mb-2">
                  <Calendar className="h-6 w-6 mx-auto text-emerald-300" />
                </div>
                <div className="text-white/90 text-sm">Schedule Tests</div>
              </div>
              <div className="text-center">
                <div className="bg-amber-500/20 border border-amber-400 glow-blue-sm border border-amber-200 rounded-xl p-4 mb-2">
                  <CheckCircle className="h-6 w-6 mx-auto text-amber-300" />
                </div>
                <div className="text-white/90 text-sm">Track Status</div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="mt-8 text-center text-white/80 text-sm">
              <p>Need help accessing your account?</p>
              <p className="mt-2">
                Call us at{' '}
                <a 
                  href="tel:2532788692" 
                  className="text-blue-300 hover:text-blue-700 transition-colors font-semibold"
                >
                  (253) 278-8692
                </a>
                {' '}or email{' '}
                <a 
                  href="mailto:service@fisherbackflows.com" 
                  className="text-blue-300 hover:text-blue-700 transition-colors font-semibold"
                >
                  service@fisherbackflows.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}