'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { useCustomerPortalBranding } from '@/hooks/useCompanyBranding'
import { User, Settings, LogOut, Home } from 'lucide-react'

interface BrandedPortalLayoutProps {
  children: ReactNode
  currentPath?: string
  showNavigation?: boolean
}

export default function BrandedPortalLayout({ 
  children, 
  currentPath = '', 
  showNavigation = true 
}: BrandedPortalLayoutProps) {
  const params = useParams()
  const companySlug = params?.slug as string
  const { branding, theme, isLoading } = useCustomerPortalBranding()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-white/80">Loading...</p>
        </div>
      </div>
    )
  }

  // Use custom background or default gradient
  const backgroundStyle = branding?.background_color 
    ? { backgroundColor: branding.background_color }
    : {}

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Logo and Company Name */}
            <Link href={companySlug ? `/portal/company/${companySlug}/dashboard` : "/portal"} className="flex items-center space-x-3">
              {branding?.logo_url ? (
                <div className="relative w-10 h-10">
                  <Image
                    src={branding.logo_url}
                    alt={`${branding.company_name} Logo`}
                    width={40}
                    height={40}
                    className="rounded-lg"
                  />
                </div>
              ) : (
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: branding?.primary_color || '#0ea5e9' }}
                >
                  {branding?.company_name?.charAt(0) || 'B'}
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold custom-text">
                  {branding?.company_name || 'Tester Portal'}
                </h1>
                <p className="text-xs custom-text-muted">
                  {branding?.portal_title || 'Customer Portal'}
                </p>
              </div>
            </Link>

            {/* Navigation */}
            {showNavigation && (
              <nav className="hidden md:flex items-center space-x-1">
                <Link 
                  href={companySlug ? `/portal/company/${companySlug}/dashboard` : "/portal/dashboard"}
                  className={`px-4 py-2 rounded-2xl transition-all duration-200 font-medium ${
                    currentPath.includes('/dashboard')
                      ? 'custom-bg-primary text-white'
                      : 'custom-text-muted hover:custom-text hover:custom-glass'
                  }`}
                >
                  Dashboard
                </Link>
                <Link 
                  href={companySlug ? `/portal/company/${companySlug}/appointments` : "/portal/appointments"}
                  className={`px-4 py-2 rounded-2xl transition-all duration-200 font-medium ${
                    currentPath.includes('/appointments')
                      ? 'custom-bg-primary text-white'
                      : 'custom-text-muted hover:custom-text hover:custom-glass'
                  }`}
                >
                  Appointments
                </Link>
                <Link 
                  href={companySlug ? `/portal/company/${companySlug}/devices` : "/portal/devices"}
                  className={`px-4 py-2 rounded-2xl transition-all duration-200 font-medium ${
                    currentPath.includes('/devices')
                      ? 'custom-bg-primary text-white'
                      : 'custom-text-muted hover:custom-text hover:custom-glass'
                  }`}
                >
                  Devices
                </Link>
                <Link 
                  href={companySlug ? `/portal/company/${companySlug}/billing` : "/portal/billing"}
                  className={`px-4 py-2 rounded-2xl transition-all duration-200 font-medium ${
                    currentPath.includes('/billing')
                      ? 'custom-bg-primary text-white'
                      : 'custom-text-muted hover:custom-text hover:custom-glass'
                  }`}
                >
                  Billing
                </Link>
                <Link 
                  href={companySlug ? `/portal/company/${companySlug}/reports` : "/portal/reports"}
                  className={`px-4 py-2 rounded-2xl transition-all duration-200 font-medium ${
                    currentPath.includes('/reports')
                      ? 'custom-bg-primary text-white'
                      : 'custom-text-muted hover:custom-text hover:custom-glass'
                  }`}
                >
                  Reports
                </Link>
              </nav>
            )}

            {/* User Menu */}
            <div className="flex items-center space-x-2">
              <Link
                href={companySlug ? `/portal/company/${companySlug}/settings` : "/portal/settings"}
                className="p-2 custom-glass hover:custom-bg-primary rounded-lg transition-all"
                title="Settings"
              >
                <Settings className="h-5 w-5 custom-text" />
              </Link>
              <button
                onClick={() => {
                  if (companySlug) {
                    // For company portals, clear JWT token and redirect to company login
                    localStorage.removeItem('customerToken')
                    window.location.href = `/portal/company/${companySlug}`
                  } else {
                    // For regular portal, use standard logout
                    window.location.href = '/portal/logout'
                  }
                }}
                className="p-2 custom-glass hover:bg-red-500/20 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut className="h-5 w-5 custom-text" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="custom-border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              {branding?.footer_text ? (
                <p className="custom-text-muted">{branding.footer_text}</p>
              ) : (
                <p className="custom-text-muted">
                  © {new Date().getFullYear()} {branding?.company_name || 'Tester Portal'}. 
                  All rights reserved.
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-6">
              {branding?.contact_email && (
                <a 
                  href={`mailto:${branding.contact_email}`}
                  className="custom-text-muted hover:custom-primary transition-colors"
                >
                  Contact
                </a>
              )}
              {branding?.contact_phone && (
                <a 
                  href={`tel:${branding.contact_phone}`}
                  className="custom-text-muted hover:custom-primary transition-colors"
                >
                  {branding.contact_phone}
                </a>
              )}
              
              {/* Tester Portal attribution (unless hidden) */}
              {!branding?.hide_backflow_buddy_branding && (
                <div className="flex items-center space-x-2">
                  <span className="custom-text-muted text-sm">Powered by</span>
                  <Link 
                    href="https://tester-portal.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="custom-primary hover:custom-secondary text-sm font-medium transition-colors"
                  >
                    Tester Portal
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

// Mobile navigation component
export function MobileNavigation({ currentPath = '' }: { currentPath?: string }) {
  const navItems = [
    { href: '/portal/dashboard', label: 'Dashboard', icon: Home },
    { href: '/portal/appointments', label: 'Appointments', icon: User },
    { href: '/portal/devices', label: 'Devices', icon: Settings },
    { href: '/portal/billing', label: 'Billing', icon: User },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 custom-glass-border">
      <div className="grid grid-cols-4 gap-1 p-2">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
              currentPath.includes(href.split('/')[2])
                ? 'custom-bg-primary text-white'
                : 'custom-text-muted hover:custom-text'
            }`}
          >
            <Icon className="h-5 w-5 mb-1" />
            <span className="text-xs">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}