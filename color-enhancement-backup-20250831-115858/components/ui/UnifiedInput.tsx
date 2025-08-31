'use client';

import React from 'react';
import { cn, componentVariants, animations } from '@/lib/design-system';

interface UnifiedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'error' | 'success';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  error?: string;
  success?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-base rounded-lg',
  lg: 'px-4 py-3 text-lg rounded-xl',
};

export default function UnifiedInput({
  variant = 'default',
  size = 'md',
  label,
  error,
  success,
  icon,
  iconPosition = 'left',
  className,
  ...props
}: UnifiedInputProps) {
  const variantClass = componentVariants.input[variant];
  const sizeClass = sizeClasses[size];
  const transitionClass = animations.transition.fast;
  
  const inputClasses = cn(
    'w-full font-medium backdrop-blur-sm',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black',
    variantClass,
    sizeClass,
    transitionClass,
    icon && iconPosition === 'left' && 'pl-10',
    icon && iconPosition === 'right' && 'pr-10',
    className
  );

  const iconSize = size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-white/80 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className={cn(
            'absolute inset-y-0 flex items-center pointer-events-none text-white/40',
            iconPosition === 'left' ? 'left-3' : 'right-3'
          )}>
            <span className={iconSize}>{icon}</span>
          </div>
        )}
        
        <input
          className={inputClasses}
          {...props}
        />
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-400 flex items-center">
          <svg className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      
      {success && (
        <p className="mt-2 text-sm text-green-400 flex items-center">
          <svg className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {success}
        </p>
      )}
    </div>
  );
}