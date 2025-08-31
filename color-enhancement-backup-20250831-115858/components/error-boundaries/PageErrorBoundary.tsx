'use client';

import React, { Component, ErrorInfo } from 'react';
import { AlertCircle, RefreshCw, ArrowLeft, Bug } from 'lucide-react';
import { auditLogger, AuditEventType } from '@/lib/audit-logger';

interface Props {
  children: React.ReactNode;
  pageName?: string;
  fallbackTitle?: string;
  showDebugInfo?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class PageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `page_err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`🚨 Page Error Boundary (${this.props.pageName || 'Unknown'}) caught an error:`, error);

    // Log to audit system with page context
    this.logPageError(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  private async logPageError(error: Error, errorInfo: ErrorInfo) {
    try {
      await auditLogger.logEvent({
        eventType: AuditEventType.SYSTEM_ERROR,
        severity: 'high', // Page errors are high severity but not critical like global errors
        success: false,
        errorMessage: error.message,
        metadata: {
          errorId: this.state.errorId,
          pageName: this.props.pageName || 'unknown',
          errorStack: error.stack,
          componentStack: errorInfo.componentStack,
          errorBoundary: 'PageErrorBoundary',
          timestamp: new Date().toISOString(),
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
          url: typeof window !== 'undefined' ? window.location.href : 'unknown'
        },
        timestamp: new Date()
      });
    } catch (logError) {
      console.error('Failed to log page error:', logError);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      const showDebug = this.props.showDebugInfo ?? isDevelopment;

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-grid opacity-10" />
          <div className="fixed inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-orange-500/5" />
          
          <div className="max-w-xl w-full relative z-10">
            <div className="glass rounded-3xl p-8 glow-orange text-center">
              {/* Error Icon */}
              <div className="glass-orange rounded-full p-4 mx-auto mb-6 w-16 h-16 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-orange-400" />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-white mb-3">
                {this.props.fallbackTitle || `Error loading ${this.props.pageName || 'page'}`}
              </h2>
              
              <p className="text-white/70 mb-6">
                This page encountered an error and couldn't load properly. You can try refreshing or go back to continue.
              </p>

              {/* Error ID */}
              <div className="glass-darker rounded-lg p-3 mb-6">
                <p className="text-white/60 text-xs mb-1">Error ID:</p>
                <code className="text-orange-300 font-mono text-sm">
                  {this.state.errorId}
                </code>
              </div>

              {/* Development Error Details */}
              {showDebug && (
                <div className="glass-darker rounded-lg p-4 mb-6 text-left">
                  <h4 className="text-white font-medium mb-2 flex items-center text-sm">
                    <Bug className="h-3 w-3 mr-2" />
                    Debug Information
                  </h4>
                  <div className="text-orange-300 text-xs font-mono bg-black/30 p-2 rounded max-h-32 overflow-auto">
                    <div><strong>Error:</strong> {this.state.error.message}</div>
                    {this.state.error.stack && (
                      <div className="mt-1">
                        <strong>Stack:</strong>
                        <pre className="text-xs mt-1 whitespace-pre-wrap opacity-70">
                          {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                          {this.state.error.stack.split('\n').length > 5 && '\n...'}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.resetError}
                  className="btn-glow py-2 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 hover-glow"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Try Again</span>
                </button>

                <button
                  onClick={() => window.history.back()}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 py-2 px-4 rounded-lg font-medium text-white transition-colors flex items-center justify-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Go Back</span>
                </button>
              </div>

              {/* Page Context */}
              {this.props.pageName && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <p className="text-white/50 text-xs">
                    Page: {this.props.pageName}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PageErrorBoundary;