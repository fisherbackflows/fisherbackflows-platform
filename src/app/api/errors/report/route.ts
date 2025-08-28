import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/error-handling/error-middleware';
import { handleError, ErrorCategory, ErrorSeverity } from '@/lib/error-handling/error-manager';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const ErrorReportSchema = z.object({
  errorId: z.string(),
  error: z.object({
    name: z.string(),
    message: z.string(),
    stack: z.string().optional()
  }),
  errorInfo: z.object({
    componentStack: z.string()
  }),
  context: z.object({
    url: z.string(),
    userAgent: z.string(),
    timestamp: z.string(),
    sessionId: z.string()
  })
});

async function handleErrorReport(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ErrorReportSchema.parse(body);

    // Log the error with full context
    logger.error('Client error reported', {
      errorId: validatedData.errorId,
      error: validatedData.error,
      componentStack: validatedData.errorInfo.componentStack,
      context: validatedData.context,
      severity: 'high',
      category: 'client_error'
    });

    // Store in database for analysis
    const { supabase } = await import('@/lib/supabase');
    await supabase.from('client_errors').insert({
      error_id: validatedData.errorId,
      error_name: validatedData.error.name,
      error_message: validatedData.error.message,
      error_stack: validatedData.error.stack,
      component_stack: validatedData.errorInfo.componentStack,
      url: validatedData.context.url,
      user_agent: validatedData.context.userAgent,
      session_id: validatedData.context.sessionId,
      reported_at: validatedData.context.timestamp,
      created_at: new Date().toISOString()
    });

    // Send to external error monitoring service if configured
    // TEMP: Disabled for clean builds
    /*
    if (process.env.SENTRY_DSN) {
      try {
        const Sentry = await import('@sentry/nextjs');
        Sentry.captureException(new Error(`${validatedData.error.name}: ${validatedData.error.message}`), {
          contexts: {
            error: {
              errorId: validatedData.errorId,
              componentStack: validatedData.errorInfo.componentStack
            },
            browser: {
              url: validatedData.context.url,
              userAgent: validatedData.context.userAgent
            }
          },
          tags: {
            errorId: validatedData.errorId,
            source: 'error-boundary'
          }
        });
      } catch (sentryError) {
        logger.warn('Failed to report to Sentry', { error: sentryError });
      }
    }
    */

    // Check for critical errors that need immediate attention
    const isCritical = validatedData.error.name === 'ChunkLoadError' || 
                      validatedData.error.message.includes('Loading chunk') ||
                      validatedData.error.message.includes('Network Error') ||
                      validatedData.context.url.includes('/field/');

    if (isCritical) {
      logger.error('CRITICAL: High-priority client error detected', {
        errorId: validatedData.errorId,
        error: validatedData.error,
        context: validatedData.context
      });

      // Could send alerts to team here
    }

    return NextResponse.json({
      success: true,
      errorId: validatedData.errorId,
      message: 'Error report received'
    });

  } catch (error: any) {
    logger.error('Failed to process error report', { 
      error: error.message,
      originalError: error 
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to process error report'
    }, { status: 500 });
  }
}

export const POST = withErrorHandler(handleErrorReport);