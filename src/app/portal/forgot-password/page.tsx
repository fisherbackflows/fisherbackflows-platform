'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Shield, CheckCircle, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Basic email validation
    if (!email.trim()) {
      setError('Email address is required');
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      const data = await response.json();

      if (response.status === 429) {
        setError('Too many password reset attempts. Please try again later.');
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setSuccess(true);
      setEmail('');

    } catch (error: any) {
      setError(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-3 mb-6">
              <Image
                src="/fisher-backflows-logo.png"
                alt="Fisher Backflows Platform"
                width={48}
                height={48}
                className="brightness-110 contrast-105 rounded-lg"
              />
              <div>
                <h1 className="text-xl font-bold text-white">Fisher Backflows Platform</h1>
                <p className="text-xs text-white/60">Password Reset</p>
              </div>
            </Link>
          </div>

          {/* Success Message */}
          <div className="glass border border-emerald-400/50 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-4">Check Your Email</h2>
            <p className="text-white/80 mb-6 leading-relaxed">
              We've sent password reset instructions to your email address.
              Please check your inbox and follow the instructions to reset your password.
            </p>

            <div className="space-y-4">
              <p className="text-white/60 text-sm">
                Didn't receive the email? Check your spam folder or try again in a few minutes.
              </p>

              <div className="flex flex-col space-y-3">
                <Link href="/portal/login">
                  <Button className="w-full glass-btn-primary hover:glow-blue text-white font-semibold rounded-xl">
                    Back to Login
                  </Button>
                </Link>

                <button
                  onClick={() => {
                    setSuccess(false);
                    setError('');
                  }}
                  className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                >
                  Try Different Email
                </button>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center space-x-2 text-white/60 text-xs">
              <Shield className="h-4 w-4" />
              <span>Password reset links expire in 24 hours</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-3 mb-6">
            <Image
              src="/fisher-backflows-logo.png"
              alt="Fisher Backflows Platform"
              width={48}
              height={48}
              className="brightness-110 contrast-105 rounded-lg"
            />
            <div>
              <h1 className="text-xl font-bold text-white">Fisher Backflows Platform</h1>
              <p className="text-xs text-white/60">Password Reset</p>
            </div>
          </Link>

          <h2 className="text-2xl font-bold text-white mb-2">Reset Your Password</h2>
          <p className="text-white/70">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl glass border border-red-400/50 bg-red-500/10">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Reset Form */}
        <div className="glass border border-blue-400/30 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/60 focus:border-blue-400 focus:outline-none transition-colors"
                  placeholder="your@email.com"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full glass-btn-primary hover:glow-blue text-white py-3 text-lg font-semibold rounded-xl"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                'Send Reset Instructions'
              )}
            </Button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              href="/portal/login"
              className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Link>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 text-white/60 text-xs">
            <Shield className="h-4 w-4" />
            <span>Secured with 256-bit SSL encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}