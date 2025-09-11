'use client';

import Link from 'next/link';
import Image from 'next/image';
import LoginForm from '@/components/auth/LoginForm';
import Logo from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { useCustomerPortalBranding } from '@/hooks/useCompanyBranding';
import { 
  Shield,
  CheckCircle,
  CreditCard,
  Calendar,
  FileText
} from 'lucide-react';

export default function CustomerPortalLoginPage() {
  const { branding, isLoading } = useCustomerPortalBranding();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-white/80">Loading portal...</p>
        </div>
      </div>
    );
  }

  const backgroundStyle = branding?.background_color 
    ? { backgroundColor: branding.background_color }
    : {};

  return (
    <div 
      className="min-h-screen"
      style={{
        background: branding?.background_color 
          ? branding.background_color 
          : 'linear-gradient(135deg, #0f172a 0%, #164e63 100%)'
      }}
    >
      {/* Header */}
      <header className="custom-glass-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-3">
              {branding?.logo_url ? (
                <div className="relative w-12 h-12">
                  <Image
                    src={branding.logo_url}
                    alt={`${branding.company_name} Logo`}
                    width={48}
                    height={48}
                    className="rounded-lg"
                  />
                </div>
              ) : (
                <Logo width={48} height={48} className="" />
              )}
              <div>
                <h1 className="text-lg font-bold custom-text">
                  {branding?.company_name || 'Backflow Buddy'}
                </h1>
                <p className="text-xs custom-text-muted">
                  {branding?.portal_title || 'Customer Portal'}
                </p>
              </div>
            </Link>
            <nav className="hidden lg:flex space-x-1">
              <Link href="/">
                <Button variant="ghost" className="px-5 py-2.5 rounded-2xl custom-text-muted hover:custom-text hover:custom-glass transition-all duration-200 font-medium">
                  Home
                </Button>
              </Link>
              <Link href="/team-portal">
                <Button variant="ghost" className="px-5 py-2.5 rounded-2xl custom-text-muted hover:custom-text hover:custom-glass transition-all duration-200 font-medium">
                  Business Login
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center min-h-[calc(100vh-100px)] p-4 sm:p-6 custom-glass">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Info */}
          <div className="hidden lg:block">
            <div className="mb-8">
              <div 
                className="inline-block backdrop-blur-xl custom-border px-4 py-2 rounded-full text-sm font-semibold mb-6"
                style={{ backgroundColor: branding?.primary_color + '20' }}
              >
                <Shield className="h-4 w-4 mr-2 inline custom-primary" />
                Secure Customer Portal
              </div>
              <h1 className="text-4xl font-bold mb-6 custom-text">
                <span>Welcome to</span><br />
                <span className="custom-primary">{branding?.company_name || 'Your'} Portal</span>
              </h1>
            </div>
            
            <p className="text-xl custom-text mb-8 leading-relaxed">
              {branding?.portal_description || 
                'Manage your backflow testing services, pay bills, schedule appointments, and access all your test records in one secure place.'}
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
            <div className="mt-8 text-center custom-text-muted text-sm">
              <p>Need help accessing your account?</p>
              <p className="mt-2">
                {branding?.contact_phone && (
                  <>
                    Call us at{' '}
                    <a 
                      href={`tel:${branding.contact_phone.replace(/\D/g, '')}`}
                      className="custom-primary hover:custom-secondary transition-colors font-semibold"
                    >
                      {branding.contact_phone}
                    </a>
                  </>
                )}
                {branding?.contact_phone && branding?.contact_email && ' or '}
                {branding?.contact_email && (
                  <>
                    email{' '}
                    <a 
                      href={`mailto:${branding.contact_email}`}
                      className="custom-primary hover:custom-secondary transition-colors font-semibold"
                    >
                      {branding.contact_email}
                    </a>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}