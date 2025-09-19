'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function DebugContent() {
  const searchParams = useSearchParams();
  
  // Get all URL parameters
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="glass border border-blue-400 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-6">Verification Debug</h1>
          
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-blue-300 mb-2">Current URL:</h2>
              <p className="text-white/80 text-sm break-all">
                {typeof window !== 'undefined' ? window.location.href : 'Loading...'}
              </p>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold text-blue-300 mb-2">URL Parameters:</h2>
              {Object.keys(params).length > 0 ? (
                <div className="bg-black/50 rounded-lg p-4">
                  {Object.entries(params).map(([key, value]) => (
                    <div key={key} className="mb-2">
                      <span className="text-blue-400">{key}:</span>{' '}
                      <span className="text-white/80 break-all">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/60">No parameters found</p>
              )}
            </div>
            
            <div>
              <h2 className="text-lg font-semibold text-blue-300 mb-2">What you need:</h2>
              <ul className="text-white/80 space-y-1 text-sm">
                <li>• token_hash or token parameter</li>
                <li>• type parameter (should be "signup" or "email")</li>
              </ul>
            </div>
            
            <div className="pt-4">
              <Link href="/auth/verify" className="text-blue-300 hover:text-blue-400">
                ← Back to Verification Page
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DebugPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><p className="text-white">Loading...</p></div>}>
      <DebugContent />
    </Suspense>
  );
}