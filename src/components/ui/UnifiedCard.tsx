'use client';

import React from 'react';
import { cn, componentVariants, animations } from '@/lib/design-system';

interface UnifiedCardProps {
  children: React.ReactNode;
  variant?: 'base' | 'elevated' | 'interactive' | 'glow';
  glow?: 'blue' | 'green' | 'yellow' | 'red' | 'white' | 'emerald';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

const sizeClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-12',
};

export default function UnifiedCard({
  children,
  variant = 'base',
  glow,
  size = 'md',
  className,
  onClick,
  hover = false,
}: UnifiedCardProps) {
  const baseClasses = componentVariants.card[variant];
  const sizeClass = sizeClasses[size];
  const glowClass = glow ? animations.glow[glow] : '';
  const hoverClass = hover ? animations.transform.hover : '';
  const transitionClass = animations.transition.normal;
  
  return (
    <div
      className={cn(
        baseClasses,
        sizeClass,
        glowClass,
        hoverClass,
        transitionClass,
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}