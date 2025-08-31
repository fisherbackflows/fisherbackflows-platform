'use client';

import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, Clock, XCircle, Info, Zap } from 'lucide-react';

interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'pending' | 'processing';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  animate?: boolean;
  className?: string;
}

export default function StatusIndicator({
  status,
  label,
  size = 'md',
  showIcon = true,
  animate = true,
  className
}: StatusIndicatorProps) {
  const configs = {
    success: {
      icon: CheckCircle,
      color: 'text-green-400',
      bg: 'bg-green-700/20',
      border: 'border-green-500/30',
      glow: 'shadow-green-500/20'
    },
    warning: {
      icon: AlertCircle,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500/30',
      glow: 'shadow-yellow-500/20'
    },
    error: {
      icon: XCircle,
      color: 'text-red-400',
      bg: 'bg-red-500/20',
      border: 'border-red-500/30',
      glow: 'shadow-red-500/20'
    },
    info: {
      icon: Info,
      color: 'text-blue-400',
      bg: 'bg-blue-700/20',
      border: 'border-blue-500/30',
      glow: 'shadow-blue-500/20'
    },
    pending: {
      icon: Clock,
      color: 'text-gray-800',
      bg: 'bg-gray-500/20',
      border: 'border-gray-500/30',
      glow: 'shadow-gray-500/20'
    },
    processing: {
      icon: Zap,
      color: 'text-purple-400',
      bg: 'bg-purple-500/20',
      border: 'border-purple-500/30',
      glow: 'shadow-purple-500/20'
    }
  };

  const sizes = {
    sm: {
      container: 'px-3 py-1.5 text-sm',
      icon: 'h-4 w-4',
      gap: 'gap-2'
    },
    md: {
      container: 'px-4 py-2 text-base',
      icon: 'h-5 w-5',
      gap: 'gap-2'
    },
    lg: {
      container: 'px-6 py-3 text-lg',
      icon: 'h-6 w-6',
      gap: 'gap-3'
    }
  };

  const config = configs[status];
  const sizeConfig = sizes[size];
  const IconComponent = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border backdrop-blur-sm',
        'transition-all duration-300',
        config.bg,
        config.border,
        sizeConfig.container,
        sizeConfig.gap,
        animate && status === 'processing' && 'animate-pulse',
        animate && 'hover:scale-105',
        `shadow-lg ${config.glow}`,
        className
      )}
    >
      {showIcon && (
        <IconComponent
          className={cn(
            sizeConfig.icon,
            config.color,
            animate && status === 'processing' && 'animate-spin'
          )}
        />
      )}
      {label && (
        <span className={cn('font-medium', config.color)}>
          {label}
        </span>
      )}
    </div>
  );
}