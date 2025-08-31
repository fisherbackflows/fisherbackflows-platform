import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Settings } from 'lucide-react';
import Link from 'next/link';

interface UnifiedLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backHref?: string;
  showUserActions?: boolean;
  className?: string;
}

export function UnifiedLayout({ 
  children, 
  title, 
  subtitle, 
  showBackButton = false,
  backHref = '/',
  showUserActions = false,
  className = ''
}: UnifiedLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5" />
      
      {/* Header */}
      <header className="relative z-50 border-b border-gray-500/20 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {showBackButton && (
                <Link href={backHref}>
                  <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </Link>
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">{title}</h1>
                {subtitle && (
                  <p className="text-white/60 mt-1">{subtitle}</p>
                )}
              </div>
            </div>
            
            {showUserActions && (
              <div className="flex items-center space-x-4">
                <Link href="/portal/dashboard">
                  <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
                    <User className="h-4 w-4 mr-2" />
                    Account
                  </Button>
                </Link>
                <Link href="/portal/settings">
                  <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`relative z-10 ${className}`}>
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-900/50 border-t border-gray-500/20 py-8 px-4 backdrop-blur-sm mt-16">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-white/50 text-sm">
            © {new Date().getFullYear()} Fisher Backflows LLC. All rights reserved.
          </p>
          <div className="mt-4 flex justify-center space-x-6">
            <Link href="/" className="text-white/40 hover:text-white/70 text-sm transition-colors">
              Home
            </Link>
            <Link href="/portal" className="text-white/40 hover:text-white/70 text-sm transition-colors">
              Portal
            </Link>
            <Link href="/portal/help" className="text-white/40 hover:text-white/70 text-sm transition-colors">
              Help
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function UnifiedCard({ 
  children, 
  className = '',
  padding = 'p-8'
}: { 
  children: React.ReactNode;
  className?: string;
  padding?: string;
}) {
  return (
    <div className={`bg-gray-900/50 border border-gray-500/20 rounded-xl ${padding} backdrop-blur-sm hover:border-gray-400/30 transition-all ${className}`}>
      {children}
    </div>
  );
}

export function UnifiedButton({ 
  children, 
  variant = 'primary',
  size = 'default',
  className = '',
  ...props
}: any) {
  const baseClasses = "rounded-lg transition-all font-medium";
  
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white",
    secondary: "bg-blue-700/20 border border-blue-500/30 text-blue-400 hover:bg-blue-700/30",
    success: "bg-green-700/20 border border-green-500/30 text-green-400 hover:bg-green-700/30",
    outline: "border border-gray-500/30 text-white/80 hover:bg-white/10 hover:text-white",
    ghost: "text-white/80 hover:bg-white/10 hover:text-white"
  };
  
  const sizes = {
    sm: "px-3 py-2 text-sm",
    default: "px-4 py-2",
    lg: "px-6 py-3 text-lg"
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}