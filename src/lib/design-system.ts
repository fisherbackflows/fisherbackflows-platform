/**
 * Fisher Backflows Design System
 * Comprehensive design foundation for absolute visual uniformity across all 82 pages
 */

// ============================================================================
// CORE DESIGN TOKENS
// ============================================================================

export const designTokens = {
  // Spacing Scale (8px base)
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
    32: '8rem',     // 128px
  },

  // Typography Scale
  typography: {
    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
      '6xl': '3.75rem',   // 60px
      '7xl': '4.5rem',    // 72px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
    letterSpacing: {
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
    }
  },

  // Border Radius Scale
  borderRadius: {
    none: '0',
    sm: '0.125rem',     // 2px
    base: '0.25rem',    // 4px
    md: '0.375rem',     // 6px
    lg: '0.5rem',       // 8px
    xl: '0.75rem',      // 12px
    '2xl': '1rem',      // 16px
    '3xl': '1.5rem',    // 24px
    full: '9999px',
  },

  // Shadow Scale
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },

  // Z-Index Scale
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  }
} as const;

// ============================================================================
// COMPONENT VARIANTS
// ============================================================================

export const componentVariants = {
  // Glass Effect Variants
  glass: {
    base: 'backdrop-blur-sm bg-white/5 border border-white/10',
    strong: 'backdrop-blur-md bg-white/10 border border-white/20',
    subtle: 'backdrop-blur-sm bg-white/2 border border-white/5',
    dark: 'backdrop-blur-sm bg-black/20 border border-white/10',
    blue: 'backdrop-blur-sm bg-blue-500/10 border border-blue-500/20',
    green: 'backdrop-blur-sm bg-green-500/10 border border-green-500/20',
    yellow: 'backdrop-blur-sm bg-yellow-500/10 border border-yellow-500/20',
    red: 'backdrop-blur-sm bg-red-500/10 border border-red-500/20',
    emerald: 'backdrop-blur-sm bg-emerald-500/10 border border-emerald-500/20',
  },

  // Button Variants
  button: {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white border border-blue-400/20',
    secondary: 'bg-white/5 hover:bg-white/10 text-white border border-white/20 hover:border-white/30',
    ghost: 'bg-transparent hover:bg-white/5 text-white border border-transparent hover:border-white/10',
    success: 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white border border-green-400/20',
    warning: 'bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-white border border-yellow-400/20',
    danger: 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white border border-red-400/20',
    glass: 'backdrop-blur-sm bg-white/5 hover:bg-white/10 text-white border border-white/20 hover:border-white/30',
  },

  // Input Variants
  input: {
    default: 'bg-black/20 border border-white/20 text-white placeholder:text-white/40 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20',
    error: 'bg-black/20 border border-red-400/50 text-white placeholder:text-white/40 focus:border-red-400 focus:ring-2 focus:ring-red-400/20',
    success: 'bg-black/20 border border-green-400/50 text-white placeholder:text-white/40 focus:border-green-400 focus:ring-2 focus:ring-green-400/20',
  },

  // Card Variants
  card: {
    base: 'backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl',
    elevated: 'backdrop-blur-md bg-white/10 border border-white/20 rounded-xl shadow-xl',
    interactive: 'backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer',
    glow: 'backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl shadow-lg shadow-blue-500/10',
  },

  // Text Variants
  text: {
    primary: 'text-white',
    secondary: 'text-white/80',
    muted: 'text-white/60',
    subtle: 'text-white/40',
    accent: 'text-blue-400',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    danger: 'text-red-400',
    gradient: 'bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent',
  }
} as const;

// ============================================================================
// LAYOUT SYSTEM
// ============================================================================

export const layouts = {
  container: {
    base: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    narrow: 'max-w-3xl mx-auto px-4 sm:px-6 lg:px-8',
    wide: 'max-w-full mx-auto px-4 sm:px-6 lg:px-8',
  },

  grid: {
    cols1: 'grid grid-cols-1 gap-6',
    cols2: 'grid grid-cols-1 md:grid-cols-2 gap-6',
    cols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    cols4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
    cols6: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6',
  },

  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-center justify-start',
    end: 'flex items-center justify-end',
    col: 'flex flex-col',
    colCenter: 'flex flex-col items-center justify-center',
  },

  section: {
    base: 'py-12 px-4',
    large: 'py-20 px-4',
    hero: 'py-24 px-4',
  }
} as const;

// ============================================================================
// ANIMATION SYSTEM
// ============================================================================

export const animations = {
  transition: {
    fast: 'transition-all duration-150 ease-out',
    normal: 'transition-all duration-300 ease-out',
    slow: 'transition-all duration-500 ease-out',
  },

  transform: {
    hover: 'hover:scale-105 hover:-translate-y-1',
    press: 'active:scale-95 active:translate-y-0',
    float: 'animate-float',
  },

  glow: {
    blue: 'shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30',
    green: 'shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30',
    yellow: 'shadow-lg shadow-yellow-500/20 hover:shadow-xl hover:shadow-yellow-500/30',
    red: 'shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30',
    white: 'shadow-lg shadow-white/10 hover:shadow-xl hover:shadow-white/20',
  },

  pulse: {
    base: 'animate-pulse',
    glow: 'animate-pulse-glow',
  }
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getSpacing(key: keyof typeof designTokens.spacing): string {
  return designTokens.spacing[key];
}

export function getFontSize(key: keyof typeof designTokens.typography.fontSize): string {
  return designTokens.typography.fontSize[key];
}

export function getBorderRadius(key: keyof typeof designTokens.borderRadius): string {
  return designTokens.borderRadius[key];
}

export function getVariant<T extends keyof typeof componentVariants>(
  component: T,
  variant: keyof typeof componentVariants[T]
): string {
  return componentVariants[component][variant] as string;
}

// ============================================================================
// RESPONSIVE BREAKPOINTS
// ============================================================================

export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================================
// THEME CONSTANTS
// ============================================================================

export const theme = {
  colors: {
    brand: {
      primary: '#0d1b2a',
      secondary: '#1b3a5f',
      accent: '#4a90e2',
    },
    status: {
      success: '#15a34a',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#3b82f6',
    }
  },
  fonts: {
    sans: 'Inter, ui-sans-serif, system-ui',
    mono: 'ui-monospace, SFMono-Regular, Consolas',
  }
} as const;