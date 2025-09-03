'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@/lib/supabase';
import { CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/ui/Logo';
import Link from 'next/link';

function VerifyContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');

        if (!tokenHash || !type) {
          setStatus('error');
          setMessage('Invalid verification link. Please check your email and try again.');
          return;
        }

        // Verify the email confirmation token
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as any
        });

        if (error) {
          setStatus('error');
          setMessage(error.message || 'Verification failed. The link may have expired.');
          return;
        }

        if (data.user) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
          
          // Auto-redirect to customer portal after 3 seconds
          setTimeout(() => {
            setIsLoggingIn(true);
            router.push('/portal');
          }, 3000);
        } else {
          setStatus('error');
          setMessage('Verification failed. Please try again.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams, router, supabase]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <Logo width={120} height={96} className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Email Verification</h1>
        </div>

        <div className="glass border border-blue-400 rounded-2xl p-8 text-center glow-blue">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 text-blue-400 animate-spin mx-auto mb-6" />
              <h2 className="text-xl font-semibold text-white mb-4">Verifying Your Email...</h2>
              <p className="text-white/80">Please wait while we confirm your account.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-6" />
              <h2 className="text-xl font-semibold text-white mb-4">Verification Successful!</h2>
              <p className="text-white/80 mb-6">
                Welcome to Fisher Backflows! Your email has been verified and your account is now active.
              </p>
              
              <div className="bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl border border-green-200 rounded-xl p-4 mb-6">
                <p className="text-green-100 text-sm">
                  <strong>🎉 Account Activated!</strong><br />
                  You can now schedule backflow testing appointments and access all customer portal features.
                </p>
              </div>

              {isLoggingIn ? (
                <div className="flex items-center justify-center space-x-2 text-blue-300">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Redirecting to Customer Portal...</span>
                </div>
              ) : (
                <>
                  <p className="text-white/70 text-sm mb-4">
                    You'll be automatically redirected to your customer portal in a few seconds.
                  </p>
                  <Button 
                    onClick={() => {
                      setIsLoggingIn(true);
                      router.push('/portal');
                    }}
                    className="glass-btn-primary hover:glow-blue w-full py-3"
                  >
                    Access Customer Portal Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-6" />
              <h2 className="text-xl font-semibold text-white mb-4">Verification Failed</h2>
              <p className="text-white/80 mb-6">{message}</p>
              
              <div className="bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-100 text-sm">
                  <strong>Need Help?</strong><br />
                  Contact us at service@fisherbackflows.com or (253) 555-0123
                </p>
              </div>

              <div className="space-y-3">
                <Link href="/portal/register">
                  <Button variant="outline" className="w-full border-blue-400 text-white hover:bg-blue-600/20">
                    Create New Account
                  </Button>
                </Link>
                <Link href="/portal">
                  <Button className="glass-btn-primary hover:glow-blue w-full py-3">
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-white/60 text-sm">
            Fisher Backflows - Professional Backflow Testing & Prevention<br />
            <a href="https://www.fisherbackflows.com" className="text-blue-300 hover:text-blue-400">
              www.fisherbackflows.com
            </a> | (253) 555-0123
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white">Loading verification...</p>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}