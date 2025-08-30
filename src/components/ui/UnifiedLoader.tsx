'use client';

import React from 'react';
import { cn } from '@/lib/design-system';

interface UnifiedLoaderProps {
  variant?: 'spinner' | 'dots' | 'pulse' | 'wave';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'white' | 'green' | 'yellow' | 'red';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const colorClasses = {
  blue: 'border-blue-400',
  white: 'border-white',
  green: 'border-green-400',
  yellow: 'border-yellow-400',
  red: 'border-red-400',
};

const textColorClasses = {
  blue: 'text-blue-400',
  white: 'text-white',
  green: 'text-green-400',
  yellow: 'text-yellow-400',
  red: 'text-red-400',
};

function SpinnerLoader({ size, color }: { size: string; color: string }) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-t-transparent',
        size,
        color
      )}
    />
  );
}

function DotsLoader({ size, color }: { size: string; color: string }) {
  const dotSize = size === 'h-4 w-4' ? 'h-2 w-2' : size === 'h-6 w-6' ? 'h-3 w-3' : size === 'h-8 w-8' ? 'h-4 w-4' : 'h-6 w-6';
  
  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full animate-pulse',
            dotSize,
            color.replace('border-', 'bg-')
          )}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function PulseLoader({ size, color }: { size: string; color: string }) {
  return (
    <div
      className={cn(
        'rounded-full animate-pulse',
        size,
        color.replace('border-', 'bg-').replace('-400', '-400/50')
      )}
    />
  );
}

function WaveLoader({ size, color }: { size: string; color: string }) {
  const barHeight = size === 'h-4 w-4' ? 'h-8' : size === 'h-6 w-6' ? 'h-12' : size === 'h-8 w-8' ? 'h-16' : 'h-20';
  
  return (
    <div className="flex items-end space-x-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={cn(
            'w-1 animate-pulse rounded-full',
            barHeight,
            color.replace('border-', 'bg-')
          )}
          style={{ 
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.8s'
          }}
        />
      ))}
    </div>
  );
}

export default function UnifiedLoader({
  variant = 'spinner',
  size = 'md',
  color = 'blue',
  text,
  fullScreen = false,
  className,
}: UnifiedLoaderProps) {
  const sizeClass = sizeClasses[size];
  const colorClass = colorClasses[color];
  const textColorClass = textColorClasses[color];
  
  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return <DotsLoader size={sizeClass} color={colorClass} />;
      case 'pulse':
        return <PulseLoader size={sizeClass} color={colorClass} />;
      case 'wave':
        return <WaveLoader size={sizeClass} color={colorClass} />;
      default:
        return <SpinnerLoader size={sizeClass} color={colorClass} />;
    }
  };

  const loaderContent = (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      {renderLoader()}
      {text && (
        <p className={cn('mt-4 text-sm font-medium', textColorClass)}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="p-8 rounded-xl backdrop-blur-md bg-black/20 border border-white/10">
          {loaderContent}
        </div>
      </div>
    );
  }

  return loaderContent;
}