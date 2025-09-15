'use client';

import React, { memo, useMemo } from 'react';
import { cn } from '@/lib/design-system';

interface UnifiedLoaderProps {
  variant?: 'spinner' | 'dots' | 'pulse' | 'wave' | 'skeleton';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'white' | 'green' | 'yellow' | 'red' | 'slate';
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  inline?: boolean;
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
  slate: 'border-slate-400',
};

const textColorClasses = {
  blue: 'text-blue-400',
  white: 'text-white',
  green: 'text-green-400',
  yellow: 'text-yellow-400',
  red: 'text-red-400',
  slate: 'text-slate-400',
};

const SpinnerLoader = memo(function SpinnerLoader({ size, color }: { size: string; color: string }) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-t-transparent',
        size,
        color
      )}
    />
  );
});

const DotsLoader = memo(function DotsLoader({ size, color }: { size: string; color: string }) {
  const dotSize = useMemo(() => {
    if (size === 'h-4 w-4') return 'h-2 w-2';
    if (size === 'h-6 w-6') return 'h-3 w-3';
    if (size === 'h-8 w-8') return 'h-4 w-4';
    return 'h-6 w-6';
  }, [size]);

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
});

const PulseLoader = memo(function PulseLoader({ size, color }: { size: string; color: string }) {
  return (
    <div
      className={cn(
        'rounded-full animate-pulse',
        size,
        color.replace('border-', 'bg-').replace('-400', '-400/50')
      )}
    />
  );
});

const WaveLoader = memo(function WaveLoader({ size, color }: { size: string; color: string }) {
  const barHeight = useMemo(() => {
    if (size === 'h-4 w-4') return 'h-8';
    if (size === 'h-6 w-6') return 'h-12';
    if (size === 'h-8 w-8') return 'h-16';
    return 'h-20';
  }, [size]);

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
});

const SkeletonLoader = memo(function SkeletonLoader({ size }: { size: string }) {
  return (
    <div className="space-y-3">
      <div className={cn('bg-slate-300 dark:bg-slate-700 animate-pulse rounded', size)} />
      <div className="space-y-2">
        <div className="h-3 bg-slate-300 dark:bg-slate-700 animate-pulse rounded w-3/4" />
        <div className="h-3 bg-slate-300 dark:bg-slate-700 animate-pulse rounded w-1/2" />
      </div>
    </div>
  );
});

const UnifiedLoader = memo(function UnifiedLoader({
  variant = 'spinner',
  size = 'md',
  color = 'blue',
  text,
  fullScreen = false,
  overlay = false,
  inline = false,
  className,
}: UnifiedLoaderProps) {
  const sizeClass = sizeClasses[size];
  const colorClass = colorClasses[color];
  const textColorClass = textColorClasses[color];

  const renderLoader = useMemo(() => {
    switch (variant) {
      case 'dots':
        return <DotsLoader size={sizeClass} color={colorClass} />;
      case 'pulse':
        return <PulseLoader size={sizeClass} color={colorClass} />;
      case 'wave':
        return <WaveLoader size={sizeClass} color={colorClass} />;
      case 'skeleton':
        return <SkeletonLoader size={sizeClass} />;
      default:
        return <SpinnerLoader size={sizeClass} color={colorClass} />;
    }
  }, [variant, sizeClass, colorClass]);

  const loaderContent = useMemo(() => (
    <div className={cn(
      'flex flex-col items-center justify-center',
      inline && 'flex-row space-x-2',
      className
    )}>
      {renderLoader}
      {text && (
        <p className={cn(
          'text-sm font-medium',
          inline ? 'mt-0' : 'mt-4',
          textColorClass
        )}>
          {text}
        </p>
      )}
    </div>
  ), [renderLoader, text, textColorClass, inline, className]);

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="p-8 rounded-xl backdrop-blur-md bg-black/20 border border-white/10">
          {loaderContent}
        </div>
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm">
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
});

export default UnifiedLoader;