/**
 * Dynamic Import Utilities
 * Optimized lazy loading for better bundle splitting
 */

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
  </div>
);

// Error fallback component
const ErrorFallback = ({ error, retry }: { error: Error; retry: () => void }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <div className="text-red-400 mb-4">Failed to load component</div>
    <button
      onClick={retry}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Retry
    </button>
  </div>
);

/**
 * Enhanced dynamic import with optimized settings
 */
export function createDynamicComponent<P = {}>(
  importFunction: () => Promise<{ default: ComponentType<P> }>,
  options: {
    loading?: ComponentType;
    ssr?: boolean;
    fallback?: ComponentType<{ error: Error; retry: () => void }>;
  } = {}
) {
  return dynamic(importFunction, {
    loading: options.loading || LoadingFallback,
    ssr: options.ssr ?? true,
    // Add error boundary for failed chunks
    ...(options.fallback && {
      onError: (error: Error, retry: () => void) => {
        console.error('Dynamic import failed:', error);
        return options.fallback!({ error, retry });
      }
    })
  });
}

/**
 * Lazy load heavy chart components
 */
export const LazyRevenueChart = createDynamicComponent(
  () => import('@/components/charts/RevenueChart'),
  { ssr: false }
);

export const LazyAppointmentChart = createDynamicComponent(
  () => import('@/components/charts/AppointmentChart'),
  { ssr: false }
);

export const LazyAnalyticsDashboard = createDynamicComponent(
  () => import('@/components/analytics/AnalyticsDashboard'),
  { ssr: false }
);

/**
 * Lazy load PDF generation components
 */
export const LazyPDFViewer = createDynamicComponent(
  () => import('@/components/pdf/PDFViewer'),
  { ssr: false }
);

export const LazyInvoicePDF = createDynamicComponent(
  () => import('@/components/pdf/InvoicePDF'),
  { ssr: false }
);

/**
 * Lazy load admin components
 */
export const LazyAdminPanel = createDynamicComponent(
  () => import('@/components/admin/AdminPanel'),
  { ssr: false }
);

export const LazyAuditLogViewer = createDynamicComponent(
  () => import('@/components/admin/AuditLogViewer'),
  { ssr: false }
);

/**
 * Lazy load field app components
 */
export const LazyFieldTestForm = createDynamicComponent(
  () => import('@/components/field/TestForm'),
  { ssr: false }
);

export const LazyGPSTracker = createDynamicComponent(
  () => import('@/components/field/GPSTracker'),
  { ssr: false }
);

/**
 * Lazy load team portal components
 */
export const LazyCustomerManager = createDynamicComponent(
  () => import('@/components/team/CustomerManager'),
  { ssr: true }
);

export const LazyScheduleManager = createDynamicComponent(
  () => import('@/components/team/ScheduleManager'),
  { ssr: true }
);

/**
 * Lazy load large data components
 */
export const LazyDataExporter = createDynamicComponent(
  () => import('@/components/data/DataExporter'),
  { ssr: false }
);

export const LazyDataImporter = createDynamicComponent(
  () => import('@/components/data/DataImporter'),
  { ssr: false }
);

/**
 * Preload critical chunks for better performance
 */
export function preloadCriticalChunks() {
  if (typeof window !== 'undefined') {
    // Preload customer portal components
    import('@/components/portal/Dashboard');
    import('@/components/portal/AppointmentBooking');

    // Preload team portal components
    import('@/components/team/Dashboard');

    // Preload auth components
    import('@/components/auth/LoginForm');
  }
}

/**
 * Route-based code splitting utility
 */
export const routeComponents = {
  // Customer Portal Routes
  '/portal': () => import('@/app/portal/page'),
  '/portal/appointments': () => import('@/app/portal/appointments/page'),
  '/portal/billing': () => import('@/app/portal/billing/page'),
  '/portal/devices': () => import('@/app/portal/devices/page'),

  // Team Portal Routes
  '/team-portal': () => import('@/app/team-portal/page'),
  '/team-portal/customers': () => import('@/app/team-portal/customers/page'),
  '/team-portal/schedule': () => import('@/app/team-portal/schedule/page'),
  '/team-portal/admin': () => import('@/app/team-portal/admin/page'),

  // Field App Routes
  '/field': () => import('@/app/field/page'),
  '/field/dashboard': () => import('@/app/field/dashboard/page'),

  // Admin Routes
  '/admin': () => import('@/app/admin/page'),
  '/admin/dashboard': () => import('@/app/admin/dashboard/page'),
};

/**
 * Chunk loading error recovery
 */
export function setupChunkErrorRecovery() {
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      // Check if it's a chunk loading error
      if (event.reason?.name === 'ChunkLoadError' ||
          event.reason?.message?.includes('Loading chunk')) {
        console.warn('Chunk loading failed, attempting recovery:', event.reason);

        // Prevent the error from being logged
        event.preventDefault();

        // Reload the page to recover from chunk loading errors
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    });
  }
}

/**
 * Bundle size monitoring
 */
export function logBundleMetrics() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          console.log('Bundle Metrics:', {
            loadTime: entry.loadEventEnd - entry.loadEventStart,
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            transferSize: entry.transferSize,
          });
        }
      });
    });

    observer.observe({ entryTypes: ['navigation'] });
  }
}