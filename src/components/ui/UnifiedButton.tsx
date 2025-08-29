'use client';

import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn, componentVariants, animations, designTokens } from '@/lib/design-system';

interface UnifiedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'warning' | 'danger' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glow?: boolean;
  hover?: boolean;
  asChild?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-base rounded-lg',
  lg: 'px-6 py-3 text-lg rounded-xl',
  xl: 'px-8 py-4 text-xl rounded-2xl',
};

export default function UnifiedButton({
  children,
  variant = 'primary',
  size = 'md',
  glow = false,
  hover = true,
  asChild = false,
  loading = false,
  icon,
  iconPosition = 'left',
  className,
  disabled,
  ...props
}: UnifiedButtonProps) {
  const Comp = asChild ? Slot : 'button';
  
  const variantClass = componentVariants.button[variant];
  const sizeClass = sizeClasses[size];
  const hoverClass = hover ? animations.transform.hover : '';
  const glowClass = glow ? 'shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30' : '';
  const transitionClass = animations.transition.normal;
  
  const baseClasses = cn(
    'inline-flex items-center justify-center font-semibold',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
    'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
    variantClass,
    sizeClass,
    hoverClass,
    glowClass,
    transitionClass,
    className
  );

  const iconSize = size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : size === 'lg' ? 'h-6 w-6' : 'h-7 w-7';

  return (
    <Comp
      className={baseClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className={cn('animate-spin border-2 border-current border-t-transparent rounded-full mr-2', iconSize)} />
      )}
      {icon && iconPosition === 'left' && !loading && (
        <span className={cn('mr-2', iconSize)}>{icon}</span>
      )}
      {children}
      {icon && iconPosition === 'right' && !loading && (
        <span className={cn('ml-2', iconSize)}>{icon}</span>
      )}
    </Comp>
  );
}