'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { getCurrentUser, signOut, AuthUser } from '@/lib/auth';
import { 
  Home, 
  Calendar, 
  FileText, 
  CreditCard, 
  Settings,
  Menu,
  X,
  LogOut,
  Droplet,
  User,
  Phone
} from 'lucide-react';
import LanguageSelector from '@/components/ui/LanguageSelector';
import { useI18n } from '@/contexts/I18nProvider';

interface NavigationProps {
  customerName?: string;
  accountNumber?: string;
}

export default function Navigation({ customerName, accountNumber }: NavigationProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const { t } = useI18n();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigationItems = [
    { href: '/portal/dashboard', icon: Home, label: t('nav.dashboard') },
    { href: '/portal/schedule', icon: Calendar, label: t('appointments.appointments') },
    { href: '/portal/billing', icon: CreditCard, label: t('billing.billing') }
  ];

  const isActive = (href: string) => pathname === href;

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      try {
        await signOut();
        router.push('/login');
      } catch (error) {
        console.error('Logout error:', error);
        // Fallback logout
        router.push('/login');
      }
    }
  };

  // Use props if provided, otherwise use authenticated user data
  const displayName = customerName || user?.customer_profile?.name || 'Customer';
  const displayAccount = accountNumber || user?.customer_profile?.account_number || '';

  if (loading) {
    return (
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-center">
            <div className="animate-pulse text-white/60">Loading...</div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="glass border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/portal/dashboard">
            <Logo width={160} height={128} />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6 items-center">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'text-blue-400 bg-blue-700/20'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop User Info & Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSelector />
            <div className="text-right">
              <p className="text-white/80 font-medium text-sm">{displayName}</p>
              {displayAccount && (
                <p className="text-white/50 text-xs">Account: {displayAccount}</p>
              )}
            </div>
            <Button
              onClick={handleLogout}
              className="btn-glass px-3 py-2 rounded-lg text-sm"
              title={t('auth.logout')}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white/80 hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 glass-darker rounded-lg p-4">
            {/* Mobile User Info */}
            <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-white/10">
              <div className="glass-blue rounded-lg p-2">
                <User className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white/80 font-medium text-sm">{displayName}</p>
                {displayAccount && (
                  <p className="text-white/50 text-xs">Account: {displayAccount}</p>
                )}
              </div>
            </div>

            {/* Mobile Navigation */}
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'text-blue-400 bg-blue-700/20'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Language Selector */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <LanguageSelector variant="buttons" className="w-full justify-center" />
            </div>

            {/* Mobile Actions */}
            <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
              <a
                href="tel:2532788692"
                className="flex items-center space-x-3 px-3 py-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Phone className="h-5 w-5" />
                <span>Call Support</span>
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-3 py-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors w-full text-left"
              >
                <LogOut className="h-5 w-5" />
                <span>{t('auth.logout')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}