'use client';

import React from 'react';
import { cn, componentVariants, designTokens } from '@/lib/design-system';

interface UnifiedTextProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'muted' | 'subtle' | 'accent' | 'success' | 'warning' | 'danger' | 'gradient';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  className?: string;
}

const sizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm', 
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl',
  '6xl': 'text-6xl',
  '7xl': 'text-7xl',
};

const weightClasses = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export default function UnifiedText({
  children,
  variant = 'primary',
  size = 'base',
  weight = 'normal',
  align = 'left',
  as = 'p',
  className,
}: UnifiedTextProps) {
  const Component = as;
  
  const variantClass = componentVariants.text[variant];
  const sizeClass = sizeClasses[size];
  const weightClass = weightClasses[weight];
  const alignClass = alignClasses[align];
  
  return (
    <Component
      className={cn(
        variantClass,
        sizeClass,
        weightClass,
        alignClass,
        className
      )}
    >
      {children}
    </Component>
  );
}

// Predefined heading components for consistent typography hierarchy
export function UnifiedH1({ children, className, ...props }: Omit<UnifiedTextProps, 'size' | 'as'>) {
  return (
    <UnifiedText 
      as="h1" 
      size="5xl" 
      weight="bold" 
      className={className}
      {...props}
    >
      {children}
    </UnifiedText>
  );
}

export function UnifiedH2({ children, className, ...props }: Omit<UnifiedTextProps, 'size' | 'as'>) {
  return (
    <UnifiedText 
      as="h2" 
      size="4xl" 
      weight="bold" 
      className={className}
      {...props}
    >
      {children}
    </UnifiedText>
  );
}

export function UnifiedH3({ children, className, ...props }: Omit<UnifiedTextProps, 'size' | 'as'>) {
  return (
    <UnifiedText 
      as="h3" 
      size="3xl" 
      weight="semibold" 
      className={className}
      {...props}
    >
      {children}
    </UnifiedText>
  );
}

export function UnifiedH4({ children, className, ...props }: Omit<UnifiedTextProps, 'size' | 'as'>) {
  return (
    <UnifiedText 
      as="h4" 
      size="2xl" 
      weight="semibold" 
      className={className}
      {...props}
    >
      {children}
    </UnifiedText>
  );
}

export function UnifiedH5({ children, className, ...props }: Omit<UnifiedTextProps, 'size' | 'as'>) {
  return (
    <UnifiedText 
      as="h5" 
      size="xl" 
      weight="medium" 
      className={className}
      {...props}
    >
      {children}
    </UnifiedText>
  );
}

export function UnifiedH6({ children, className, ...props }: Omit<UnifiedTextProps, 'size' | 'as'>) {
  return (
    <UnifiedText 
      as="h6" 
      size="lg" 
      weight="medium" 
      className={className}
      {...props}
    >
      {children}
    </UnifiedText>
  );
}