'use client';

import React from 'react';
import { cn, componentVariants, animations } from '@/lib/design-system';
import Logo from './Logo';

interface UnifiedHeaderProps {
  children?: React.ReactNode;
  variant?: 'homepage' | 'portal' | 'team' | 'admin' | 'field';
  sticky?: boolean;
  transparent?: boolean;
  className?: string;
}

const headerVariants = {
  homepage: 'fixed top-0 w-full z-50 backdrop-blur-md bg-black/20 border-b border-white/10',
  portal: 'sticky top-0 z-50 backdrop-blur-md bg-black/40 border-b border-blue-500/20',
  team: 'sticky top-0 z-50 backdrop-blur-md bg-black/40 border-b border-green-500/20',
  admin: 'sticky top-0 z-50 backdrop-blur-md bg-black/40 border-b border-purple-500/20',
  field: 'sticky top-0 z-50 backdrop-blur-md bg-black/40 border-b border-yellow-500/20',
};

const containerPadding = {
  homepage: 'py-4 px-4 sm:px-6 lg:px-8',
  portal: 'py-4 px-4 sm:px-6 lg:px-8',
  team: 'py-3 px-4 sm:px-6 lg:px-8',
  admin: 'py-3 px-4 sm:px-6 lg:px-8',
  field: 'py-3 px-4 sm:px-6 lg:px-8',
};

export default function UnifiedHeader({
  children,
  variant = 'portal',
  sticky = true,
  transparent = false,
  className,
}: UnifiedHeaderProps) {
  const headerClass = headerVariants[variant];
  const paddingClass = containerPadding[variant];
  const transitionClass = animations.transition.normal;
  
  const finalHeaderClass = cn(
    headerClass,
    transitionClass,
    transparent && 'bg-transparent border-transparent',
    !sticky && 'relative',
    className
  );

  return (
    <header className={finalHeaderClass}>
      <div className={cn('max-w-7xl mx-auto', paddingClass)}>
        {children || (
          <div className="flex items-center justify-between">
            <Logo width={200} height={160} priority />
            <nav className="flex items-center space-x-6">
              {/* Default navigation - can be overridden by children */}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}