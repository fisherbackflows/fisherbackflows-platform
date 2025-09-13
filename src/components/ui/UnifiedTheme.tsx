'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

// Unified glassmorphism theme matching team portal login
export const THEME = {
  colors: {
    background: 'bg-black',
    surface: 'bg-black/40 backdrop-blur-xl',
    surfaceGlass: 'glass',
    border: 'border-blue-400',
    borderSoft: 'border-blue-500/50',
    text: {
      primary: 'text-white',
      secondary: 'text-white/80',
      muted: 'text-white/60',
      disabled: 'text-white/40'
    },
    accent: {
      primary: 'text-blue-300 hover:text-blue-400',
      hover: 'hover:bg-blue-500/20',
      success: 'text-green-400 bg-green-500/20 border-green-400',
      warning: 'text-amber-400 bg-amber-500/20 border-amber-400',
      danger: 'text-red-400 bg-red-500/20 border-red-400'
    },
    input: 'bg-white/10 text-white placeholder-gray-400',
    glow: 'glow-blue'
  },
  gradients: {
    background: 'bg-gradient-to-br from-black to-gray-900',
    accent: 'bg-gradient-to-r from-blue-600/80 to-blue-500/80',
    success: 'bg-gradient-to-r from-green-600 to-green-500'
  }
};

// Light theme for team portal (white backgrounds)
export const LIGHT_THEME = {
  colors: {
    background: 'bg-white',
    surface: 'bg-slate-400',
    surfaceGlass: 'bg-white/95 backdrop-blur-sm',
    border: 'border-slate-200',
    text: {
      primary: 'text-slate-900',
      secondary: 'text-slate-700',
      muted: 'text-slate-700',
      disabled: 'text-slate-800'
    },
    accent: {
      primary: 'text-blue-800 bg-blue-200 border-blue-200',
      hover: 'hover:bg-blue-300',
      success: 'text-green-800 bg-green-200 border-green-200',
      warning: 'text-amber-600 bg-amber-50 border-amber-200',
      danger: 'text-red-800 bg-red-200 border-red-200'
    }
  },
  gradients: {
    background: 'bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5',
    accent: 'bg-gradient-to-r from-blue-600 to-blue-500',
    success: 'bg-gradient-to-r from-green-600 to-green-500'
  }
};

// Base layout component matching team portal theme
interface UnifiedPageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function UnifiedPageLayout({ children, className = '' }: UnifiedPageLayoutProps) {
  return (
    <div className={`min-h-screen ${THEME.colors.background} ${className}`}>
      {children}
    </div>
  );
}

// Glassmorphism container component
interface GlassContainerProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
}

export function GlassContainer({ children, className = '', glow = true, padding = 'lg' }: GlassContainerProps) {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6', 
    lg: 'p-8',
    xl: 'p-12'
  };

  return (
    <div className={`glass border border-blue-400 rounded-2xl ${glow ? 'glow-blue' : ''} ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}

// Page content wrapper matching team portal layout
interface ContentSectionProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function ContentSection({ children, className = '', maxWidth = 'md' }: ContentSectionProps) {
  const maxWidthClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg', 
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full'
  };

  return (
    <main className={`flex items-center justify-center min-h-[calc(100vh-100px)] p-6 ${className}`}>
      <div className={`w-full ${maxWidthClasses[maxWidth]}`}>
        {children}
      </div>
    </main>
  );
}

// Unified header component
interface UnifiedHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backHref?: string;
  rightActions?: React.ReactNode;
}

export function UnifiedHeader({ 
  title, 
  subtitle, 
  showBackButton = false, 
  backHref = '/', 
  rightActions 
}: UnifiedHeaderProps) {
  return (
    <header className={`relative z-50 ${THEME.colors.border} border-b ${THEME.colors.surfaceGlass}`}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Link href={backHref}>
                <Button variant="ghost" size="sm" className={`${THEME.colors.text.secondary} hover:${THEME.colors.text.primary} hover:bg-white/10`}>
                  ← Back
                </Button>
              </Link>
            )}
            <div>
              <h1 className={`text-2xl font-bold ${THEME.colors.text.primary}`}>{title}</h1>
              {subtitle && (
                <p className={`${THEME.colors.text.muted} mt-1`}>{subtitle}</p>
              )}
            </div>
          </div>
          {rightActions && (
            <div className="flex items-center space-x-4">
              {rightActions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// Unified card component
interface UnifiedCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
  padding?: 'sm' | 'md' | 'lg';
}

export function UnifiedCard({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'md' 
}: UnifiedCardProps) {
  const paddingClass = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }[padding];

  const variantClass = {
    default: `${THEME.colors.surfaceGlass} ${THEME.colors.border} border`,
    accent: `${THEME.colors.accent.primary} border`,
    success: `${THEME.colors.accent.success} border`,
    warning: `${THEME.colors.accent.warning} border`,
    danger: `${THEME.colors.accent.danger} border`
  }[variant];

  return (
    <div className={`rounded-xl ${variantClass} ${paddingClass} ${className}`}>
      {children}
    </div>
  );
}

// Unified navigation item
interface UnifiedNavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  theme?: typeof THEME;
  section?: string;
}

export function UnifiedNavItem({ href, icon: Icon, label, isActive = false, onClick, theme = THEME, section = '' }: UnifiedNavItemProps) {
  const hoverBg = section === 'team-portal' ? 'hover:bg-slate-300' : 'hover:bg-white/10';
  
  const content = (
    <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      isActive 
        ? `${theme.colors.accent.primary} shadow-lg shadow-blue-500/25`
        : `${theme.colors.text.secondary} hover:${theme.colors.text.primary} ${hoverBg}`
    }`}>
      <Icon className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </div>
  );

  // Handle both navigation and onClick (for mobile menu closing)
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    }
    // Let the Link handle navigation naturally
  };

  return (
    <Link href={href} onClick={handleClick}>
      {content}
    </Link>
  );
}

// Unified section header
interface UnifiedSectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function UnifiedSectionHeader({ title, subtitle, action }: UnifiedSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className={`text-xl font-bold ${THEME.colors.text.primary} mb-1`}>{title}</h2>
        {subtitle && (
          <p className={`${THEME.colors.text.muted} text-sm`}>{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

// Unified stat card
interface UnifiedStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: string;
    type: 'increase' | 'decrease' | 'neutral';
  };
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
}

export function UnifiedStatCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  variant = 'default' 
}: UnifiedStatCardProps) {
  const changeColor = change ? {
    increase: 'text-green-400',
    decrease: 'text-red-400',
    neutral: 'text-gray-800'
  }[change.type] : '';

  return (
    <UnifiedCard variant={variant} padding="md">
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm ${THEME.colors.text.muted} mb-1`}>{title}</p>
          <p className={`text-2xl font-bold ${THEME.colors.text.primary}`}>{value}</p>
          {change && (
            <p className={`text-xs ${changeColor} mt-1`}>
              {change.value}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${variant === 'default' ? THEME.colors.accent.primary : ''}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </UnifiedCard>
  );
}

// Unified button variants
export const UNIFIED_BUTTON_VARIANTS = {
  primary: `${THEME.gradients.accent} text-white hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/25`,
  secondary: `${THEME.colors.surfaceGlass} ${THEME.colors.border} border ${THEME.colors.text.primary} hover:bg-white/10`,
  accent: `${THEME.colors.accent.primary} hover:${THEME.colors.accent.hover}`,
  success: `${THEME.colors.accent.success} hover:bg-green-700/30`,
  warning: `${THEME.colors.accent.warning} hover:bg-amber-600/30`,
  danger: `${THEME.colors.accent.danger} hover:bg-red-600/30`
};

// Unified table styles
export const UNIFIED_TABLE_STYLES = {
  wrapper: `${THEME.colors.surfaceGlass} rounded-xl ${THEME.colors.border} border overflow-hidden`,
  header: `${THEME.colors.surface} ${THEME.colors.border} border-b`,
  headerCell: `px-6 py-4 text-left text-sm font-medium ${THEME.colors.text.secondary} uppercase tracking-wider`,
  row: `${THEME.colors.border} border-b hover:bg-white/5 transition-colors`,
  cell: `px-6 py-4 whitespace-nowrap text-sm ${THEME.colors.text.primary}`
};