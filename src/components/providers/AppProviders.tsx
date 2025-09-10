'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';
import { logger } from '@/lib/logger';
import PWAProvider from '@/components/pwa/PWAProvider';
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt';
import PWAUpdatePrompt from '@/components/pwa/PWAUpdatePrompt';

interface AppProvidersProps {
  children: React.ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  React.useEffect(() => {
    // Basic global error handlers
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error('Unhandled promise rejection', {
        error: event.reason,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
      event.preventDefault();
    };

    const handleError = (event: ErrorEvent) => {
      logger.error('Unhandled JavaScript error', {
        error: {
          message: event.message,
          filename: event.filename,
          stack: event.error?.stack
        },
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <PWAProvider>
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            border: '1px solid #374151'
          }
        }}
      />
      
      {/* PWA Features */}
      <PWAInstallPrompt />
      <PWAUpdatePrompt />
      
      {children}
    </PWAProvider>
  );
}