'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield, CheckCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CustomerLoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for URL parameters
    const registered = searchParams.get('registered');
    const verified = searchParams.get('verified');
    const reason = searchParams.get('reason');

    if (registered === 'true') {
      setSuccess('Registration successful! Please check your email to verify your account, then login below.');
    }
    if (verified === 'true') {
      setSuccess('Email verified successfully! You can now login to your account.');
    }
    if (reason === 'verification-required') {
      setError('Please verify your email address before logging in. Check your email for verification link.');
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.needsVerification) {
        setError('Please verify your email address before logging in. Check your email for verification link.');
        return;
      }

      // Successful login
      setSuccess('Login successful! Redirecting to your dashboard...');

      // Wait a moment for user to see success message
      setTimeout(() => {
        router.push('/portal/dashboard');
      }, 1000);

    } catch (error: any) {
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
              <p className="text-xs text-white/60">Customer Portal</p>
            </div>
          </Link>

          <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-white/70">Sign in to your compliance portal</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 rounded-xl glass border border-emerald-400/50 bg-emerald-500/10">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <p className="text-emerald-300 text-sm">{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl glass border border-red-400/50 bg-red-500/10">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <div className="glass border border-blue-400/30 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/60 focus:border-blue-400 focus:outline-none transition-colors"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/60 focus:border-blue-400 focus:outline-none transition-colors"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full glass-btn-primary hover:glow-blue text-white py-3 text-lg font-semibold rounded-xl group"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

          </form>

          {/* Additional Options */}
          <div className="mt-6 space-y-4">
            <div className="text-center">
              <Link href="/portal/forgot-password" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                Forgot your password?
              </Link>
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="text-center text-white/70 text-sm">
                Don't have an account?{' '}
                <Link href="/portal/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                  Sign up here
                </Link>
              </p>
            </div>

            <div className="text-center">
              <Link href="/portal" className="text-white/60 hover:text-white/80 text-sm transition-colors">
                ← Browse Testing Companies
              </Link>
            </div>
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