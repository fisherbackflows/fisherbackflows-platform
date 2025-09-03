'use client';

import Link from 'next/link';
import { AlertCircle, RefreshCw, ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

function VerificationErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Verification failed';
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const handleResendVerification = async () => {
    if (!userEmail) {
      alert('Please enter your email address');
      return;
    }

    setResending(true);
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      });

      if (response.ok) {
        setResendSuccess(true);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to resend verification email');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-grid opacity-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-red-600/5 via-transparent to-blue-500/5" />
      
      <div className="glass rounded-2xl p-8 border border-red-400 glow-red-sm max-w-md w-full relative z-10">
        <div className="text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl/20 border border-red-400 glow-red-sm mb-4">
              <AlertCircle className="h-8 w-8 text-red-300" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Verification Failed
            </h1>
            <p className="text-white/80 mb-4">
              {error}
            </p>
          </div>
          
          {!resendSuccess ? (
            <div className="space-y-4 mb-6">
              <p className="text-sm text-white/70">
                Don't worry! You can request a new verification email below:
              </p>
              
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/90 border border-blue-400 text-black placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                />
                
                <Button 
                  onClick={handleResendVerification}
                  disabled={resending || !userEmail}
                  className="w-full btn-glow"
                >
                  {resending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-400/30">
              <p className="text-green-400 text-sm">
                ✓ Verification email sent! Please check your inbox and spam folder.
              </p>
            </div>
          )}
          
          <div className="space-y-3">
            <Link href="/portal/register">
              <Button variant="outline" className="w-full btn-glass">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Registration
              </Button>
            </Link>
            
            <Link href="/portal/login">
              <Button variant="ghost" className="w-full">
                Already verified? Sign In
              </Button>
            </Link>
          </div>
          
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-white/60">
              Still having trouble? Contact us at{' '}
              <a href="mailto:support@fisherbackflows.com" className="text-blue-400 hover:underline">
                support@fisherbackflows.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerificationErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="glass rounded-2xl p-8 border border-blue-400 glow-blue-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-white mt-4 text-center">Loading...</p>
        </div>
      </div>
    }>
      <VerificationErrorContent />
    </Suspense>
  );
}