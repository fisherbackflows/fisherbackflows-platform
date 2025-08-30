'use client';

import React, { useState } from 'react';
import { Bug, Zap, Wifi, AlertTriangle } from 'lucide-react';
import { PageErrorBoundary, AsyncErrorBoundary } from '@/components/error-boundaries';

// Test component that throws different types of errors
function ErrorThrowingComponent({ errorType }: { errorType: string }) {
  const throwError = () => {
    switch (errorType) {
      case 'render':
        throw new Error('Test render error - This is a simulated component error');
      
      case 'async':
        Promise.reject(new Error('Test async error - This is a simulated promise rejection'));
        break;
      
      case 'network':
        throw new Error('NetworkError: Failed to fetch - This simulates a network error');
      
      case 'timeout':
        throw new Error('Request timeout - This simulates a timeout error');
      
      case 'reference':
        // @ts-ignore - intentionally cause reference error
        const obj = null;
        return obj.someProperty;
      
      default:
        throw new Error('Generic test error');
    }
  };

  React.useEffect(() => {
    if (errorType === 'async') {
      throwError();
    }
  }, [errorType]);

  if (errorType !== 'async') {
    throwError();
  }

  return <div>This should not render</div>;
}

// Component to test error boundaries
export default function ErrorBoundaryTest() {
  const [testError, setTestError] = useState<string | null>(null);

  const triggerError = (type: string) => {
    setTestError(type);
    // Reset after a brief delay to allow testing multiple errors
    setTimeout(() => setTestError(null), 100);
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <div className="glass rounded-3xl p-8 mb-8">
          <h1 className="text-3xl font-bold text-white mb-4 flex items-center">
            <Bug className="h-8 w-8 mr-3 text-red-400" />
            Error Boundary Test Suite
          </h1>
          
          <p className="text-white/70 mb-8">
            Click the buttons below to test different error scenarios. Each error should be caught by the appropriate error boundary.
          </p>

          {/* Test Controls */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <button
              onClick={() => triggerError('render')}
              className="btn-red py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 hover-glow"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Render Error</span>
            </button>

            <button
              onClick={() => triggerError('async')}
              className="btn-orange py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 hover-glow"
            >
              <Zap className="h-4 w-4" />
              <span>Async Error</span>
            </button>

            <button
              onClick={() => triggerError('network')}
              className="btn-yellow py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 hover-glow"
            >
              <Wifi className="h-4 w-4" />
              <span>Network Error</span>
            </button>

            <button
              onClick={() => triggerError('reference')}
              className="btn-purple py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 hover-glow"
            >
              <Bug className="h-4 w-4" />
              <span>Reference Error</span>
            </button>
          </div>

          {/* Development Info */}
          <div className="glass-darker rounded-lg p-4 mb-8">
            <h3 className="text-white font-medium mb-2">Expected Behavior:</h3>
            <ul className="text-white/70 text-sm space-y-1">
              <li>• <strong>Render Error:</strong> Should show page-level error boundary</li>
              <li>• <strong>Async Error:</strong> Should be caught by async error boundary</li>
              <li>• <strong>Network Error:</strong> Should show network-specific error UI</li>
              <li>• <strong>Reference Error:</strong> Should show page-level error boundary</li>
            </ul>
          </div>
        </div>

        {/* Test Areas */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Page Error Boundary Test */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Page Error Boundary Test
            </h2>
            <PageErrorBoundary
              pageName="Error Boundary Test - Page Level"
              showDebugInfo={true}
            >
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                {testError && ['render', 'reference'].includes(testError) ? (
                  <ErrorThrowingComponent errorType={testError} />
                ) : (
                  <p className="text-blue-300">
                    Page-level content is working normally.
                    <br />
                    <span className="text-xs text-blue-400">
                      This area will show an error boundary if render/reference errors are triggered.
                    </span>
                  </p>
                )}
              </div>
            </PageErrorBoundary>
          </div>

          {/* Async Error Boundary Test */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Async Error Boundary Test
            </h2>
            <AsyncErrorBoundary>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 text-center">
                {testError && ['async', 'network'].includes(testError) ? (
                  <ErrorThrowingComponent errorType={testError} />
                ) : (
                  <p className="text-orange-300">
                    Async content is working normally.
                    <br />
                    <span className="text-xs text-orange-400">
                      This area will show an async error boundary if async/network errors are triggered.
                    </span>
                  </p>
                )}
              </div>
            </AsyncErrorBoundary>
          </div>
        </div>

        {/* Instructions */}
        <div className="glass-darker rounded-xl p-6 mt-8">
          <h3 className="text-white font-medium mb-3">Testing Instructions:</h3>
          <ol className="text-white/70 text-sm space-y-2">
            <li>1. Click each error button to test different error scenarios</li>
            <li>2. Verify that appropriate error boundaries catch the errors</li>
            <li>3. Check that error IDs are generated and logged to console</li>
            <li>4. Test the "Try Again" functionality in error UIs</li>
            <li>5. Verify that the app doesn't crash completely</li>
          </ol>
          
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-white/50 text-xs">
              💡 Check the browser console for error logging details and audit trail entries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}