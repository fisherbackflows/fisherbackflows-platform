'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function UniformHeader() {
  const pathname = usePathname();
  
  // Determine which portal we're in based on path
  const isTeamPortal = pathname?.startsWith('/team-portal');
  const isCustomerPortal = pathname?.startsWith('/portal');
  const isAdminPortal = pathname?.startsWith('/admin');
  const isFieldPortal = pathname?.startsWith('/field');
  
  return (
    <header className="relative z-50 glass border-b border-blue-400 sticky top-0 glow-blue-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/" className="relative">
              <Image
                src="/fisher-backflows-logo.png"
                alt="Fisher Backflows LLC"
                width={180}
                height={144}
                priority
                className="drop-glow-blue-sm"
              />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500/20 border border-emerald-400 glow-blue-sm0 rounded-full"></div>
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-1">
            <Link 
              href="/#services" 
              className="px-5 py-2.5 rounded-2xl text-white/80 hover:text-white hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm transition-all duration-200 font-medium"
            >
              Services
            </Link>
            <Link 
              href="/#about" 
              className="px-5 py-2.5 rounded-2xl text-white/80 hover:text-white hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm transition-all duration-200 font-medium"
            >
              About
            </Link>
            <Link 
              href="/#contact" 
              className="px-5 py-2.5 rounded-2xl text-white/80 hover:text-white hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm transition-all duration-200 font-medium"
            >
              Contact
            </Link>
            <div className="w-px h-8 bg-black/40 backdrop-blur-xl mx-2"></div>
            
            {/* Show appropriate portal button based on current location */}
            {isTeamPortal ? (
              <Link 
                href="/team-portal/dashboard" 
                className="px-6 py-2.5 rounded-2xl glass-btn-primary hover:glow-blue text-white transition-all duration-200 font-semibold glow-blue-sm"
              >
                Team Dashboard
              </Link>
            ) : isCustomerPortal ? (
              <Link 
                href="/portal/dashboard" 
                className="px-6 py-2.5 rounded-2xl glass-btn-primary hover:glow-blue text-white transition-all duration-200 font-semibold glow-blue-sm"
              >
                My Account
              </Link>
            ) : isAdminPortal ? (
              <Link 
                href="/admin/dashboard" 
                className="px-6 py-2.5 rounded-2xl glass-btn-primary hover:glow-blue text-white transition-all duration-200 font-semibold glow-blue-sm"
              >
                Admin Panel
              </Link>
            ) : isFieldPortal ? (
              <Link 
                href="/field/dashboard" 
                className="px-6 py-2.5 rounded-2xl glass-btn-primary hover:glow-blue text-white transition-all duration-200 font-semibold glow-blue-sm"
              >
                Field Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  href="/portal" 
                  className="px-6 py-2.5 rounded-2xl glass-btn-primary hover:glow-blue text-white transition-all duration-200 font-semibold glow-blue-sm"
                >
                  Customer Portal
                </Link>
                <Link 
                  href="/team-portal" 
                  className="px-6 py-2.5 rounded-2xl bg-black/40 backdrop-blur-xl hover:bg-black/40 backdrop-blur-xl text-white transition-all duration-200 font-semibold glow-blue-sm"
                >
                  Team Login
                </Link>
              </>
            )}
          </nav>
          
          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-lg glass border border-blue-400">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}