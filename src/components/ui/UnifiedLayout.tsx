'use client';

import React from 'react';
import { cn, layouts } from '@/lib/design-system';

interface UnifiedLayoutProps {
  children: React.ReactNode;
  variant?: 'base' | 'narrow' | 'wide';
  section?: 'base' | 'large' | 'hero';
  background?: 'default' | 'gradient' | 'grid' | 'none';
  className?: string;
}

interface UnifiedContainerProps {
  children: React.ReactNode;
  variant?: 'base' | 'narrow' | 'wide';
  className?: string;
}

interface UnifiedGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface UnifiedFlexProps {
  children: React.ReactNode;
  variant?: 'center' | 'between' | 'start' | 'end' | 'col' | 'colCenter';
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

const backgroundVariants = {
  default: 'min-h-screen bg-black text-white',
  gradient: 'min-h-screen bg-black text-white relative',
  grid: 'min-h-screen bg-black text-white relative',
  none: '',
};

const gapClasses = {
  sm: 'gap-3',
  md: 'gap-6',
  lg: 'gap-8',
};

// Main Layout Component
export function UnifiedLayout({
  children,
  variant = 'base',
  section = 'base',
  background = 'default',
  className,
}: UnifiedLayoutProps) {
  const containerClass = layouts.container[variant];
  const sectionClass = layouts.section[section];
  const backgroundClass = backgroundVariants[background];
  
  return (
    <div className={cn(backgroundClass, className)}>
      {/* Background Effects */}
      {background === 'gradient' && (
        <>
          <div className="fixed inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5" />
          <div className="fixed inset-0 bg-gradient-to-tr from-transparent via-blue-900/5 to-transparent" />
        </>
      )}
      
      {background === 'grid' && (
        <>
          <div className="fixed inset-0 bg-grid opacity-10" />
          <div className="fixed inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5" />
        </>
      )}
      
      {/* Content */}
      <div className={cn(containerClass, sectionClass, 'relative z-10')}>
        {children}
      </div>
    </div>
  );
}

// Container Component
export function UnifiedContainer({
  children,
  variant = 'base',
  className,
}: UnifiedContainerProps) {
  return (
    <div className={cn(layouts.container[variant], className)}>
      {children}
    </div>
  );
}

// Grid Component
export function UnifiedGrid({
  children,
  cols = 3,
  gap = 'md',
  className,
}: UnifiedGridProps) {
  const gridClass = layouts.grid[`cols${cols}` as keyof typeof layouts.grid];
  const gapClass = gapClasses[gap];
  
  return (
    <div className={cn(gridClass.replace('gap-6', gapClass), className)}>
      {children}
    </div>
  );
}

// Flex Component
export function UnifiedFlex({
  children,
  variant = 'center',
  gap = 'md',
  className,
}: UnifiedFlexProps) {
  const flexClass = layouts.flex[variant];
  const gapClass = gapClasses[gap];
  
  return (
    <div className={cn(flexClass, gapClass, className)}>
      {children}
    </div>
  );
}

// Section Component
export function UnifiedSection({
  children,
  variant = 'base',
  className,
}: {
  children: React.ReactNode;
  variant?: 'base' | 'large' | 'hero';
  className?: string;
}) {
  const sectionClass = layouts.section[variant];
  
  return (
    <section className={cn(sectionClass, className)}>
      {children}
    </section>
  );
}