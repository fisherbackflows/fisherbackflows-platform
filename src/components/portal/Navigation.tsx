'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
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

interface NavigationProps {
  customerName?: string;
  accountNumber?: string;
}

export default function Navigation({ customerName = 'Customer', accountNumber = '' }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navigationItems = [
    { href: '/portal/dashboard', icon: Home, label: 'Home' },
    { href: '/portal/schedule', icon: Calendar, label: 'Schedule' },
    { href: '/portal/billing', icon: CreditCard, label: 'Pay Bill' }
  ];

  const isActive = (href: string) => pathname === href;

  const handleLogout = () => {
    // Mock logout - replace with actual logout logic
    if (confirm('Are you sure you want to log out?')) {
      window.location.href = '/portal';
    }
  };

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
                      ? 'text-blue-400 bg-blue-500/20'
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
            <div className="text-right">
              <p className="text-white/80 font-medium text-sm">{customerName}</p>
              {accountNumber && (
                <p className="text-white/50 text-xs">Account: {accountNumber}</p>
              )}
            </div>
            <Button
              onClick={handleLogout}
              className="btn-glass px-3 py-2 rounded-lg text-sm"
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
                <p className="text-white/80 font-medium text-sm">{customerName}</p>
                {accountNumber && (
                  <p className="text-white/50 text-xs">Account: {accountNumber}</p>
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
                        ? 'text-blue-400 bg-blue-500/20'
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
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}