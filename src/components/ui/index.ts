// Fisher Backflows Unified UI Component Library
// Export all unified components for easy importing

// Core Components
export { default as UnifiedButton } from './UnifiedButton';
export { default as UnifiedInput } from './UnifiedInput';
export { default as UnifiedCard } from './UnifiedCard';
export { default as UnifiedModal, UnifiedConfirmModal, UnifiedSuccessModal } from './UnifiedModal';
export { default as UnifiedLoader } from './UnifiedLoader';

// Layout Components
export { 
  UnifiedLayout, 
  UnifiedContainer, 
  UnifiedGrid, 
  UnifiedFlex, 
  UnifiedSection 
} from './UnifiedLayout';

// Typography Components
export { 
  default as UnifiedText,
  UnifiedH1,
  UnifiedH2,
  UnifiedH3,
  UnifiedH4,
  UnifiedH5,
  UnifiedH6
} from './UnifiedText';

// Navigation Components
export { default as UnifiedHeader } from './UnifiedHeader';

// Legacy Components (maintained for backwards compatibility)
export { Button } from './button';
export { Input } from './input';
export { default as Logo } from './Logo';
export { default as StandardHeader } from './StandardHeader';

// Design System
export * from '@/lib/design-system';

// Re-export utility function
export { cn } from '@/lib/utils';