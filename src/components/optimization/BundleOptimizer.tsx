/**
 * Bundle Optimization Component
 * Handles preloading, chunk error recovery, and performance monitoring
 */

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  preloadCriticalChunks,
  setupChunkErrorRecovery,
  logBundleMetrics,
  routeComponents
} from '@/lib/utils/dynamic-imports';

interface BundleOptimizerProps {
  children: React.ReactNode;
}

export default function BundleOptimizer({ children }: BundleOptimizerProps) {
  const pathname = usePathname();

  useEffect(() => {
    // Setup chunk error recovery
    setupChunkErrorRecovery();

    // Log bundle metrics in development
    if (process.env.NODE_ENV === 'development') {
      logBundleMetrics();
    }

    // Preload critical chunks
    preloadCriticalChunks();

    // Preload next likely routes based on current path
    preloadNextLikelyRoutes(pathname);

  }, [pathname]);

  return <>{children}</>;
}

/**
 * Preload routes that users are likely to visit next
 */
function preloadNextLikelyRoutes(currentPath: string) {
  const preloadMap: Record<string, string[]> = {
    '/': ['/portal', '/team-portal', '/field'],
    '/portal': ['/portal/appointments', '/portal/billing', '/portal/devices'],
    '/portal/login': ['/portal'],
    '/portal/register': ['/portal'],
    '/team-portal': ['/team-portal/customers', '/team-portal/schedule'],
    '/team-portal/login': ['/team-portal'],
    '/field': ['/field/dashboard'],
    '/field/login': ['/field'],
    '/admin': ['/admin/dashboard'],
  };

  const routesToPreload = preloadMap[currentPath] || [];

  routesToPreload.forEach(route => {
    const importFunction = routeComponents[route as keyof typeof routeComponents];
    if (importFunction) {
      // Preload with a small delay to avoid blocking current page
      setTimeout(() => {
        importFunction().catch(() => {
          // Silently fail preloading
        });
      }, 1000);
    }
  });
}

/**
 * Route-specific bundle optimization hints
 */
export function RouteBundleHints({ route }: { route: string }) {
  useEffect(() => {
    // Add route-specific optimization hints
    const hints: Record<string, () => void> = {
      '/portal/billing': () => {
        // Preload Stripe components
        import('stripe').catch(() => {});
      },
      '/portal/appointments': () => {
        // Preload calendar components
        import('date-fns').catch(() => {});
      },
      '/team-portal/customers': () => {
        // Preload data table components
        import('papaparse').catch(() => {});
      },
      '/admin/analytics': () => {
        // Preload chart libraries
        import('recharts').catch(() => {});
      },
    };

    const hint = hints[route];
    if (hint) {
      setTimeout(hint, 500);
    }
  }, [route]);

  return null;
}

/**
 * Performance monitoring component
 */
export function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
      return;
    }

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        // Log large resource loads
        if (entry.entryType === 'resource' && entry.transferSize > 100000) {
          console.warn('Large resource loaded:', {
            name: entry.name,
            size: `${(entry.transferSize / 1024).toFixed(2)} KB`,
            duration: `${entry.duration.toFixed(2)} ms`,
          });
        }

        // Log slow script executions
        if (entry.entryType === 'measure' && entry.duration > 100) {
          console.warn('Slow operation:', {
            name: entry.name,
            duration: `${entry.duration.toFixed(2)} ms`,
          });
        }
      });
    });

    observer.observe({ entryTypes: ['resource', 'measure'] });

    return () => observer.disconnect();
  }, []);

  return null;
}

/**
 * Critical resource preloader
 */
export function CriticalResourcePreloader() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Preload critical fonts
    const fontPreloads = [
      '/fonts/inter-var.woff2',
      '/fonts/geist-sans.woff2',
    ];

    fontPreloads.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = font;
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    // Preload critical images
    const imagePreloads = [
      '/icons/icon-192x192.png',
      '/icons/icon-512x512.png',
    ];

    imagePreloads.forEach(image => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = image;
      link.as = 'image';
      document.head.appendChild(link);
    });

  }, []);

  return null;
}