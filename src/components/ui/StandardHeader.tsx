'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface StandardHeaderProps {
  children: React.ReactNode;
  variant?: 'homepage' | 'portal' | 'business' | 'subpage';
  className?: string;
  sticky?: boolean;
}

export default function StandardHeader({ 
  children, 
  variant = 'portal', 
  className = '',
  sticky = false 
}: StandardHeaderProps) {
  const baseClasses = "relative z-10 transition-all duration-300";
  
  const variantClasses = {
    homepage: "fixed top-0 w-full z-50 nav-blur py-4",
    portal: "glass border-b border-white/10",
    business: "bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-2xl",
    subpage: "glass border-b border-white/10"
  };

  const containerClasses = {
    homepage: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
    portal: "max-w-7xl mx-auto px-4 py-4",
    business: "max-w-7xl mx-auto px-4 py-4",
    subpage: "max-w-7xl mx-auto px-4 py-4"
  };

  const headerClasses = cn(
    baseClasses,
    variantClasses[variant],
    sticky && variant !== 'homepage' && 'sticky top-0 z-50',
    className
  );

  return (
    <header className={headerClasses}>
      <div className={containerClasses[variant]}>
        {children}
      </div>
    </header>
  );
}