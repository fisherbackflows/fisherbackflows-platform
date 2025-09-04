'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/ui/Logo';
import { 
  Mail,
  CheckCircle,
  Clock,
  RefreshCw,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

export default function VerifyEmailPage() {
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get email from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    
    if (emailParam) {
      setEmail(emailParam);
    } else {
      // Try to get from registration data
      const registrationData = localStorage.getItem('registration_data');
      if (registrationData) {
        try {
          const data = JSON.parse(registrationData);
          setEmail(data.email || '');
        } catch {
          // ignore parse errors
        }
      }
    }
  }, []);

  const handleResendEmail = async () => {
    if (!email) {
      setError('Email address is required to resend verification');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok) {
        setResent(true);
        setTimeout(() => setResent(false), 5000);
      } else {
        setError(result.error || 'Failed to resend verification email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="glass border-b border-blue-400 glow-blue-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/">
              <Logo width={160} height={128} />
            </Link>
            <Link href="/portal">
              <Button variant="ghost" className="px-5 py-2.5 rounded-2xl text-white/80 hover:text-white hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm transition-all duration-200 font-medium">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center min-h-[calc(100vh-100px)] p-6">
        <div className="w-full max-w-md">
          <div className="glass rounded-3xl border border-blue-400 glow-blue-sm p-8 text-center">
            {/* Email Icon */}
            <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl border border-blue-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Mail className="h-10 w-10 text-white" />
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-white mb-4">
              Check Your Email
            </h1>

            {/* Description */}
            <p className="text-white/80 mb-6 leading-relaxed">
              We've sent a verification link to:
            </p>
            
            {email && (
              <div className="bg-blue-600/20 border border-blue-400 rounded-xl px-4 py-3 mb-6">
                <p className="text-blue-300 font-medium break-all">
                  {email}
                </p>
              </div>
            )}

            <p className="text-white/80 mb-8 leading-relaxed">
              Click the verification link in the email to activate your account and complete registration.
            </p>

            {/* Instructions */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start text-left">
                <div className="bg-blue-600/20 rounded-full p-1 mr-3 mt-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                </div>
                <p className="text-white/80 text-sm">
                  Check your inbox (and spam folder) for an email from Fisher Backflows
                </p>
              </div>
              <div className="flex items-start text-left">
                <div className="bg-blue-600/20 rounded-full p-1 mr-3 mt-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                </div>
                <p className="text-white/80 text-sm">
                  Click the "Verify Email" button in the email
                </p>
              </div>
              <div className="flex items-start text-left">
                <div className="bg-blue-600/20 rounded-full p-1 mr-3 mt-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                </div>
                <p className="text-white/80 text-sm">
                  Return here to log in to your customer portal
                </p>
              </div>
            </div>

            {/* Resend Button */}
            <div className="space-y-4">
              {error && (
                <div className="flex items-center justify-center bg-red-600/20 border border-red-400 rounded-xl px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
                  <span className="text-red-300 text-sm">{error}</span>
                </div>
              )}

              {resent && (
                <div className="flex items-center justify-center bg-green-600/20 border border-green-400 rounded-xl px-4 py-3">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  <span className="text-green-300 text-sm">Verification email sent!</span>
                </div>
              )}

              <Button
                onClick={handleResendEmail}
                disabled={loading || !email}
                variant="outline"
                className="w-full border-blue-400 text-white hover:bg-blue-600/20 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Didn't receive it? Resend email
                  </>
                )}
              </Button>

              <p className="text-white/60 text-xs">
                It may take a few minutes for the email to arrive
              </p>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-blue-400/30">
              <p className="text-white/60 text-sm">
                Need help?{' '}
                <Link 
                  href="tel:(253)278-8692" 
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Call (253) 278-8692
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}