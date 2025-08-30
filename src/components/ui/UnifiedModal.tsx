'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn, animations } from '@/lib/design-system';
import UnifiedButton from './UnifiedButton';

interface UnifiedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeButton?: boolean;
  overlay?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-7xl mx-4',
};

export default function UnifiedModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeButton = true,
  overlay = true,
  className,
}: UnifiedModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      {overlay && (
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Modal */}
      <div
        className={cn(
          'relative w-full max-h-[90vh] overflow-hidden',
          'backdrop-blur-md bg-black/40 border border-white/20 rounded-2xl',
          'shadow-2xl shadow-black/50',
          animations.transition.normal,
          sizeClasses[size],
          className
        )}
      >
        {/* Header */}
        {(title || closeButton) && (
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            {title && (
              <h2 className="text-xl font-bold text-white">{title}</h2>
            )}
            {closeButton && (
              <UnifiedButton
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10"
                icon={<X className="h-5 w-5" />}
              />
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {children}
        </div>
      </div>
    </div>
  );
}

// Predefined modal variants for common use cases
export function UnifiedConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'warning' | 'danger';
}) {
  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
    >
      <div className="text-center">
        <p className="text-white/80 mb-6">{message}</p>
        
        <div className="flex justify-center space-x-4">
          <UnifiedButton
            variant="secondary"
            onClick={onClose}
          >
            {cancelText}
          </UnifiedButton>
          <UnifiedButton
            variant={variant}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </UnifiedButton>
        </div>
      </div>
    </UnifiedModal>
  );
}

// Success modal
export function UnifiedSuccessModal({
  isOpen,
  onClose,
  title = 'Success',
  message,
  buttonText = 'Continue',
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  buttonText?: string;
}) {
  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
    >
      <div className="text-center">
        <div className="mx-auto mb-4 p-3 rounded-full bg-green-500/20 w-16 h-16 flex items-center justify-center">
          <svg className="h-8 w-8 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-white/80 mb-6">{message}</p>
        <UnifiedButton
          variant="success"
          onClick={onClose}
          className="w-full"
        >
          {buttonText}
        </UnifiedButton>
      </div>
    </UnifiedModal>
  );
}