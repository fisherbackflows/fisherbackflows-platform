'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SmartButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  glow?: boolean;
  children: React.ReactNode;
}

export default function SmartButton({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  glow = false,
  children,
  disabled,
  ...props
}: SmartButtonProps) {
  const baseStyles = `
    relative inline-flex items-center justify-center font-medium rounded-xl 
    transition-all duration-300 ease-out transform focus:outline-none focus:ring-2 
    focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
    active:scale-98 disabled:cursor-not-allowed disabled:opacity-50
  `;

  const variants = {
    primary: `
      bg-gradient-to-r from-blue-600 to-blue-700 text-white 
      hover:from-blue-500 hover:to-blue-600 hover:scale-105
      shadow-lg hover:shadow-xl active:shadow-md
      ${glow ? 'shadow-blue-500/25 hover:shadow-blue-500/40' : ''}
    `,
    secondary: `
      bg-white/10 text-white border border-white/20 backdrop-blur-sm
      hover:bg-white/20 hover:scale-105
      shadow-lg hover:shadow-xl active:shadow-md
    `,
    ghost: `
      text-white/80 hover:text-white hover:bg-white/10
      hover:scale-105
    `,
    danger: `
      bg-gradient-to-r from-red-600 to-red-700 text-white
      hover:from-red-500 hover:to-red-600 hover:scale-105
      shadow-lg hover:shadow-xl active:shadow-md
      ${glow ? 'shadow-red-500/25 hover:shadow-red-500/40' : ''}
    `,
    success: `
      bg-gradient-to-r from-green-600 to-green-700 text-white
      hover:from-green-500 hover:to-green-600 hover:scale-105
      shadow-lg hover:shadow-xl active:shadow-md
      ${glow ? 'shadow-green-500/25 hover:shadow-green-500/40' : ''}
    `
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm gap-2',
    md: 'px-6 py-3 text-base gap-3',
    lg: 'px-8 py-4 text-lg gap-4',
    xl: 'px-10 py-5 text-xl gap-4'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5', 
    lg: 'h-6 w-6',
    xl: 'h-7 w-7'
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <span className={cn(iconSizes[size])}>{icon}</span>
      )}
      
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
      
      {!loading && icon && iconPosition === 'right' && (
        <span className={cn(iconSizes[size])}>{icon}</span>
      )}

      {/* Glow effect overlay */}
      {glow && !disabled && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
      )}
    </button>
  );
}