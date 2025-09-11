'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import LoginForm from '@/components/auth/LoginForm'
import { useCompanyBrandingBySlug } from '@/hooks/useCompanyBranding'
import { 
  Shield,
  CheckCircle,
  CreditCard,
  Calendar,
  FileText,
  AlertTriangle,
  ExternalLink
} from 'lucide-react'

export default function CompanyPortalPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  
  const { branding, isLoading, error } = useCompanyBrandingBySlug(slug)
  const [companyNotFound, setCompanyNotFound] = useState(false)

  useEffect(() => {
    if (error && error.includes('Company not found')) {
      setCompanyNotFound(true)
    }
  }, [error])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-white/80">Loading {slug} portal...</p>
        </div>
      </div>
    )
  }

  // Show company not found error
  if (companyNotFound || !branding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900 flex items-center justify-center p-6">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-red-400/30">
            <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4">Company Not Found</h1>
            <p className="text-white/80 mb-6">
              The company "{slug}" could not be found or is no longer active.
            </p>
            <div className="space-y-3">
              <Link 
                href="https://backflowbuddy.com"
                className="block w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all"
              >
                Go to Backflow Buddy
              </Link>
              <Link 
                href="https://backflowbuddy.com/signup"
                className="block w-full px-6 py-3 bg-white/10 border border-white/30 text-white rounded-lg font-semibold hover:bg-white/20 transition-all"
              >
                Sign Up Your Company
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen"
      style={{
        background: branding.background_color 
          ? branding.background_color 
          : 'linear-gradient(135deg, #0f172a 0%, #164e63 100%)'
      }}
    >
      {/* Header */}
      <header className="custom-glass-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {branding.logo_url ? (
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
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: branding.primary_color }}
                >
                  {branding.company_name?.charAt(0) || 'B'}
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold custom-text">
                  {branding.company_name}
                </h1>
                <p className="text-xs custom-text-muted">
                  {branding.portal_title}
                </p>
              </div>
            </div>
            
            {/* Company Website Link */}
            {branding.domain && (
              <Link
                href={`https://${branding.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center space-x-2 px-4 py-2 custom-glass hover:custom-bg-primary rounded-lg transition-all custom-text-muted hover:custom-text"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Visit Website</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center min-h-[calc(100vh-100px)] p-4 sm:p-6">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Company Info */}
          <div className="hidden lg:block">
            <div className="mb-8">
              <div 
                className="inline-block backdrop-blur-xl custom-border px-4 py-2 rounded-full text-sm font-semibold mb-6"
                style={{ backgroundColor: branding.primary_color + '20' }}
              >
                <Shield className="h-4 w-4 mr-2 inline custom-primary" />
                Secure Customer Portal
              </div>
              <h1 className="text-4xl font-bold mb-6 custom-text">
                <span>Welcome to</span><br />
                <span className="custom-primary">{branding.company_name}</span>
                <br />
                <span className="text-3xl">Customer Portal</span>
              </h1>
            </div>
            
            <p className="text-xl custom-text mb-8 leading-relaxed">
              {branding.portal_description}
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="custom-glass-border rounded-xl p-6 hover:scale-105 transition-all duration-200">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: branding.primary_color + '20' }}
                >
                  <CreditCard className="h-6 w-6" style={{ color: branding.primary_color }} />
                </div>
                <h3 className="font-semibold mb-2 custom-text">Secure Payments</h3>
                <p className="custom-text-muted text-sm leading-relaxed">Pay bills online with multiple payment options</p>
              </div>
              
              <div className="custom-glass-border rounded-xl p-6 hover:scale-105 transition-all duration-200">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: branding.secondary_color + '20' }}
                >
                  <Calendar className="h-6 w-6" style={{ color: branding.secondary_color }} />
                </div>
                <h3 className="font-semibold mb-2 custom-text">Easy Scheduling</h3>
                <p className="custom-text-muted text-sm leading-relaxed">Book appointments 24/7 at your convenience</p>
              </div>
              
              <div className="custom-glass-border rounded-xl p-6 hover:scale-105 transition-all duration-200">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: branding.accent_color + '20' }}
                >
                  <FileText className="h-6 w-6" style={{ color: branding.accent_color }} />
                </div>
                <h3 className="font-semibold mb-2 custom-text">Test Records</h3>
                <p className="custom-text-muted text-sm leading-relaxed">Access all certificates and compliance documents</p>
              </div>
              
              <div className="custom-glass-border rounded-xl p-6 hover:scale-105 transition-all duration-200">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: branding.primary_color + '20' }}
                >
                  <Shield className="h-6 w-6" style={{ color: branding.primary_color }} />
                </div>
                <h3 className="font-semibold mb-2 custom-text">Account Management</h3>
                <p className="custom-text-muted text-sm leading-relaxed">Track service history and upcoming tests</p>
              </div>
            </div>

            {/* Security Notice */}
            <div className="custom-glass-border rounded-xl p-4" style={{ backgroundColor: branding.primary_color + '10' }}>
              <div className="flex items-center space-x-3 text-sm">
                <Shield className="h-5 w-5 flex-shrink-0" style={{ color: branding.primary_color }} />
                <span className="custom-text-muted">
                  Your information is protected with bank-level security and encryption.
                </span>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full">
            <LoginForm 
              redirectTo={`/portal/company/${slug}/dashboard`}
              companySlug={slug}
            />
            
            {/* Mobile Features Preview */}
            <div className="lg:hidden mt-8 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div 
                  className="custom-border rounded-xl p-4 mb-2"
                  style={{ backgroundColor: branding.primary_color + '20' }}
                >
                  <CreditCard className="h-6 w-6 mx-auto" style={{ color: branding.primary_color }} />
                </div>
                <div className="custom-text-muted text-sm">Easy Payments</div>
              </div>
              <div className="text-center">
                <div 
                  className="custom-border rounded-xl p-4 mb-2"
                  style={{ backgroundColor: branding.secondary_color + '20' }}
                >
                  <Calendar className="h-6 w-6 mx-auto" style={{ color: branding.secondary_color }} />
                </div>
                <div className="custom-text-muted text-sm">Schedule Tests</div>
              </div>
              <div className="text-center">
                <div 
                  className="custom-border rounded-xl p-4 mb-2"
                  style={{ backgroundColor: branding.accent_color + '20' }}
                >
                  <CheckCircle className="h-6 w-6 mx-auto" style={{ color: branding.accent_color }} />
                </div>
                <div className="custom-text-muted text-sm">Track Status</div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="mt-8 text-center custom-text-muted text-sm">
              <p>Need help accessing your account?</p>
              <p className="mt-2">
                {branding.contact_phone && (
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
                {branding.contact_phone && branding.contact_email && ' or '}
                {branding.contact_email && (
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

      {/* Footer */}
      <footer className="mt-auto border-t custom-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              {branding.footer_text ? (
                <p className="custom-text-muted text-sm">{branding.footer_text}</p>
              ) : (
                <p className="custom-text-muted text-sm">
                  © {new Date().getFullYear()} {branding.company_name}. All rights reserved.
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-6">
              {branding.address && (
                <span className="custom-text-muted text-sm">{branding.address}</span>
              )}
              
              {/* Backflow Buddy attribution (unless hidden) */}
              {!branding.hide_backflow_buddy_branding && (
                <div className="flex items-center space-x-2">
                  <span className="custom-text-muted text-xs">Powered by</span>
                  <Link 
                    href="https://backflowbuddy.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="custom-primary hover:custom-secondary text-xs font-medium transition-colors"
                  >
                    Backflow Buddy
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}