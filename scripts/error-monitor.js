#!/usr/bin/env node

/**
 * Error Monitoring Setup for Fisher Backflows
 * Captures and logs all errors for debugging
 */

const fs = require('fs');
const path = require('path');

// Create error logs directory
const errorLogDir = path.join(__dirname, '../logs');
if (!fs.existsSync(errorLogDir)) {
  fs.mkdirSync(errorLogDir, { recursive: true });
}

// Error log file paths
const errorLogFile = path.join(errorLogDir, 'errors.log');
const apiErrorFile = path.join(errorLogDir, 'api-errors.log');
const buildErrorFile = path.join(errorLogDir, 'build-errors.log');

// Initialize log files
const initMessage = `=== Error Monitoring Initialized - ${new Date().toISOString()} ===\n`;
fs.writeFileSync(errorLogFile, initMessage);
fs.writeFileSync(apiErrorFile, initMessage);
fs.writeFileSync(buildErrorFile, initMessage);

console.log('✅ Error monitoring setup complete');
console.log('📁 Log files created in: ./logs/');
console.log('   - errors.log (general errors)');
console.log('   - api-errors.log (API errors)');
console.log('   - build-errors.log (build errors)');

// Create error tracking middleware
const errorMiddleware = `
// Add this to your API routes
export function logError(error, context = {}) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    context,
    url: context.url || 'unknown',
    method: context.method || 'unknown'
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', errorLog);
  }
  
  // In production, you would send to a service like Sentry
  return errorLog;
}
`;

// Save middleware template
fs.writeFileSync(
  path.join(__dirname, '../lib/error-logger.js'),
  errorMiddleware
);

console.log('✅ Error middleware created at: ./lib/error-logger.js');