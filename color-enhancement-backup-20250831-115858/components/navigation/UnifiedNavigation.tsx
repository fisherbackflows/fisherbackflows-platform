'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Logo from '@/components/ui/Logo';
import { THEME, LIGHT_THEME, UnifiedNavItem } from '@/components/ui/UnifiedTheme';
import { 
  Home, 
  Calendar, 
  FileText, 
  CreditCard, 
  Users,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  Phone,
  BarChart,
  Wrench,
  MapPin,
  Shield,
  Database,
  Mail,
  Zap,
  Activity
} from 'lucide-react';

// Navigation configurations for different sections
const NAVIGATION_CONFIG = {
  portal: [
    { href: '/portal/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/portal/schedule', icon: Calendar, label: 'Schedule' },
    { href: '/portal/billing', icon: CreditCard, label: 'Billing' },
    { href: '/portal/devices', icon: Settings, label: 'Devices' },
    { href: '/portal/reports', icon: FileText, label: 'Reports' }
  ],
  'team-portal': [
    { href: '/team-portal/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/team-portal/customers', icon: Users, label: 'Customers' },
    { href: '/team-portal/schedule', icon: Calendar, label: 'Schedule' },
    { href: '/team-portal/invoices', icon: CreditCard, label: 'Invoices' },
    { href: '/team-portal/test-report', icon: FileText, label: 'Test Reports' }
  ],
  admin: [
    { href: '/admin/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/admin/analytics', icon: BarChart, label: 'Analytics' },
    { href: '/admin/reports', icon: FileText, label: 'Reports' },
    { href: '/admin/health', icon: Activity, label: 'System Health' },
    { href: '/admin/audit-logs', icon: Shield, label: 'Audit Logs' }
  ],
  field: [
    { href: '/field/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/field/appointments', icon: Calendar, label: 'Appointments' },
    { href: '/field/test-report', icon: FileText, label: 'Test Reports' },
    { href: '/field/route', icon: MapPin, label: 'Route' }
  ]
};

interface UnifiedNavigationProps {
  section: 'portal' | 'team-portal' | 'admin' | 'field';
  userInfo?: {
    name?: string;
    email?: string;
    role?: string;
    accountNumber?: string;
  };
}

export default function UnifiedNavigation({ section, userInfo }: UnifiedNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = NAVIGATION_CONFIG[section] || [];
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  // Use light theme for team portal (white backgrounds), dark theme for others
  const currentTheme = section === 'team-portal' ? LIGHT_THEME : THEME;

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      try {
        // Different logout endpoints for different sections
        const logoutEndpoint = section === 'portal' 
          ? '/api/auth/logout' 
          : '/api/team/auth/logout';
          
        await fetch(logoutEndpoint, { method: 'POST' });
        
        // Redirect to appropriate login page
        const loginPage = section === 'portal' 
          ? '/login' 
          : `/${section}/login`;
        router.push(loginPage);
      } catch (error) {
        console.error('Logout error:', error);
        // Fallback redirect
        router.push(section === 'portal' ? '/login' : `/${section}/login`);
      }
    }
  };

  const getSectionTitle = () => {
    switch (section) {
      case 'portal': return 'Customer Portal';
      case 'team-portal': return 'Team Portal';
      case 'admin': return 'Admin Panel';
      case 'field': return 'Field App';
      default: return 'Fisher Backflows';
    }
  };

  const getHomeLink = () => {
    switch (section) {
      case 'portal': return '/portal/dashboard';
      case 'team-portal': return '/team-portal/dashboard';
      case 'admin': return '/admin/dashboard';
      case 'field': return '/field/dashboard';
      default: return '/';
    }
  };

  return (
    <header className={`sticky top-0 z-50 ${currentTheme.colors.surfaceGlass} ${currentTheme.colors.border} border-b`}>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo and Section Title */}
          <Link href={getHomeLink()} className="flex items-center space-x-3">
            <Logo width={40} height={32} />
            <div>
              <h1 className={`text-lg font-bold ${currentTheme.colors.text.primary}`}>Fisher Backflows</h1>
              <p className={`text-xs ${currentTheme.colors.text.muted}`}>{getSectionTitle()}</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <UnifiedNavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={isActive(item.href)}
                theme={currentTheme}
                section={section}
              />
            ))}
          </nav>

          {/* Desktop User Info & Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {userInfo && (
              <div className="text-right">
                <p className={`font-medium text-sm ${currentTheme.colors.text.secondary}`}>
                  {userInfo.name || userInfo.email}
                </p>
                {userInfo.accountNumber && (
                  <p className={`text-xs ${currentTheme.colors.text.muted}`}>
                    Account: {userInfo.accountNumber}
                  </p>
                )}
                {userInfo.role && (
                  <p className={`text-xs ${currentTheme.colors.text.muted} capitalize`}>
                    {userInfo.role}
                  </p>
                )}
              </div>
            )}
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className={`${currentTheme.colors.text.secondary} hover:${currentTheme.colors.text.primary} ${section === 'team-portal' ? 'hover:bg-slate-100' : 'hover:bg-white/10'}`}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden ${currentTheme.colors.text.secondary} hover:${currentTheme.colors.text.primary} p-2`}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`md:hidden mt-4 ${currentTheme.colors.surfaceGlass} rounded-xl p-4 ${currentTheme.colors.border} border`}>
            {/* Mobile User Info */}
            {userInfo && (
              <div className={`flex items-center space-x-3 mb-4 pb-4 ${currentTheme.colors.border} border-b`}>
                <div className={`p-2 rounded-lg ${currentTheme.colors.accent.primary}`}>
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className={`font-medium text-sm ${currentTheme.colors.text.primary}`}>
                    {userInfo.name || userInfo.email}
                  </p>
                  {userInfo.accountNumber && (
                    <p className={`text-xs ${currentTheme.colors.text.muted}`}>
                      Account: {userInfo.accountNumber}
                    </p>
                  )}
                  {userInfo.role && (
                    <p className={`text-xs ${currentTheme.colors.text.muted} capitalize`}>
                      {userInfo.role}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Navigation */}
            <nav className="space-y-1 mb-4">
              {navigationItems.map((item) => (
                <UnifiedNavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  isActive={isActive(item.href)}
                  onClick={() => setMobileMenuOpen(false)}
                  theme={currentTheme}
                  section={section}
                />
              ))}
            </nav>

            {/* Mobile Actions */}
            <div className={`pt-4 ${currentTheme.colors.border} border-t space-y-1`}>
              <a
                href="tel:2532788692"
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${currentTheme.colors.text.secondary} hover:${currentTheme.colors.text.primary} ${section === 'team-portal' ? 'hover:bg-slate-100' : 'hover:bg-white/10'} transition-colors`}
              >
                <Phone className="h-5 w-5" />
                <span>Call Support</span>
              </a>
              <button
                onClick={handleLogout}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${currentTheme.colors.text.secondary} hover:${currentTheme.colors.text.primary} ${section === 'team-portal' ? 'hover:bg-slate-100' : 'hover:bg-white/10'} transition-colors w-full text-left`}
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// Section-specific navigation components
export function PortalNavigation(props: { userInfo?: any }) {
  return <UnifiedNavigation section="portal" {...props} />;
}

export function TeamPortalNavigation(props: { userInfo?: any }) {
  return <UnifiedNavigation section="team-portal" {...props} />;
}

export function AdminNavigation(props: { userInfo?: any }) {
  return <UnifiedNavigation section="admin" {...props} />;
}

export function FieldNavigation(props: { userInfo?: any }) {
  return <UnifiedNavigation section="field" {...props} />;
}