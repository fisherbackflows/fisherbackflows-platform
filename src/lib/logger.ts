/**
 * Simple Logger - Fisher Backflows
 * Minimal but functional logging
 */

export const logger = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, data || '');
    }
  },
  
  error: (message: string, error?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ERROR] ${message}`, error || '');
    }
    // In production, could send to error monitoring service
  },
  
  warn: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[WARN] ${message}`, data || '');
    }
  },
  
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data || '');
    }
  }
};