'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/ui/Logo';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Users,
  Wrench,
  Building,
  Shield,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface LoginFormData {
  email: string;
  password: string;
  userType: 'auto' | 'customer' | 'business' | 'field' | 'admin';
}

interface LoginResponse {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    role: 'customer' | 'business_owner' | 'business_admin' | 'field_tech' | 'admin';
    name: string;
    redirectPath: string;
  };
  retryAfter?: number;
}

export default function UnifiedLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [retryTimer, setRetryTimer] = useState<number>(0);
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    userType: 'auto'
  });

  // Check for logout reason and redirect parameters
  const logoutReason = searchParams?.get('reason');
  const returnTo = searchParams?.get('returnTo');
  const registered = searchParams?.get('registered');

  useEffect(() => {
    // Show success message if coming from registration
    if (registered === 'true') {
      toast.success('Account created successfully! Please sign in.');
    }
  }, [registered]);

  // Handle rate limiting countdown
  useEffect(() => {
    if (retryTimer > 0) {
      const timer = setTimeout(() => {
        setRetryTimer(retryTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [retryTimer]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (retryTimer > 0) {
      toast.error(`Please wait ${retryTimer} seconds before trying again`);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/unified/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          userType: formData.userType,
          returnTo
        })
      });

      const data: LoginResponse = await response.json();

      if (response.ok && data.success && data.user) {
        toast.success(`Welcome back, ${data.user.name}!`);

        // Role-based routing
        const redirectPath = returnTo || data.user.redirectPath || getRoleBasedRedirect(data.user.role);
        router.push(redirectPath);
      } else if (response.status === 429) {
        const retryAfterSeconds = data.retryAfter || 900;
        setRetryTimer(retryAfterSeconds);
        toast.error(`Too many login attempts. Please wait ${Math.ceil(retryAfterSeconds / 60)} minutes.`);
      } else if (data.error?.includes('locked')) {
        toast.error('Your account has been locked due to multiple failed attempts. Please contact support.');
      } else {
        toast.error(data.error || 'Invalid credentials');
      }
    } catch (error) {
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBasedRedirect = (role: string): string => {
    switch (role) {
      case 'customer':
        return '/portal/dashboard';
      case 'business_owner':
      case 'business_admin':
        return '/business';
      case 'field_tech':
        return '/field';
      case 'admin':
        return '/admin';
      default:
        return '/portal/dashboard';
    }
  };

  const getUserTypeInfo = (type: string) => {
    switch (type) {
      case 'customer':
        return {
          icon: <User className="h-5 w-5" />,
          label: 'Customer Portal',
          description: 'Access your account and services'
        };
      case 'business':
        return {
          icon: <Building className="h-5 w-5" />,
          label: 'Business Portal',
          description: 'Manage customers and operations'
        };
      case 'field':
        return {
          icon: <Wrench className="h-5 w-5" />,
          label: 'Field App',
          description: 'Mobile technician interface'
        };
      case 'admin':
        return {
          icon: <Shield className="h-5 w-5" />,
          label: 'Admin Panel',
          description: 'System administration'
        };
      default:
        return {
          icon: <Users className="h-5 w-5" />,
          label: 'Auto-Detect',
          description: 'Automatically determine portal'
        };
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-grid opacity-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-blue-500/5" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/">
              <Logo width={160} height={128} />
            </Link>
            <nav className="hidden md:flex space-x-3 items-center">
              <Link href="/">
                <Button variant="ghost" className="text-white/80 hover:text-white">
                  Home
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="outline" className="border-blue-400 text-white/80">
                  Create Account
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex items-center justify-center min-h-[calc(100vh-100px)] p-6 relative z-10">
        <div className="w-full max-w-md">
          <div className="glass border border-blue-400 rounded-2xl p-8 glow-blue">
            <div className="text-center mb-8">
              <div className="inline-flex p-4 rounded-2xl glass mb-6">
                <Lock className="h-8 w-8 text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Fisher Backflows</h1>
              <p className="text-white/80">Sign in to your account</p>
            </div>

            {/* Logout Notifications */}
            {logoutReason === 'idle' && (
              <div className="mb-6 p-4 bg-amber-500/20 border border-amber-400/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  <div>
                    <h3 className="text-amber-200 font-semibold">Session Expired</h3>
                    <p className="text-amber-200/80 text-sm">
                      You were automatically logged out due to inactivity.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {logoutReason === 'logout' && (
              <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-400/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                  <div>
                    <h3 className="text-emerald-200 font-semibold">Logged Out Successfully</h3>
                    <p className="text-emerald-200/80 text-sm">
                      You have been securely logged out.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Type Selection */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-3">
                  Portal Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['auto', 'customer', 'business', 'field'].map((type) => {
                    const info = getUserTypeInfo(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, userType: type as any })}
                        className={`p-3 rounded-xl border transition-all text-left ${
                          formData.userType === type
                            ? 'border-blue-400 bg-blue-500/20 text-white'
                            : 'border-white/20 bg-white/5 text-white/80 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          {info.icon}
                          <span className="font-medium text-sm">{info.label}</span>
                        </div>
                        <p className="text-xs text-white/60">{info.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/20 text-white placeholder-white/60 focus:border-blue-400 focus:outline-none"
                  placeholder="Enter your email"
                  disabled={retryTimer > 0}
                  required
                />
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-black/50 border border-white/20 text-white placeholder-white/60 focus:border-blue-400 focus:outline-none"
                    placeholder="Enter your password"
                    disabled={retryTimer > 0}
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

              {/* Rate limit countdown */}
              {retryTimer > 0 && (
                <div className="p-3 bg-red-500/20 border border-red-400/50 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    <span className="text-red-200 text-sm">
                      Too many attempts. Please wait {Math.floor(retryTimer / 60)}:{(retryTimer % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              )}

              {/* Sign In Button */}
              <Button
                type="submit"
                disabled={isLoading || retryTimer > 0}
                className="w-full py-3 glass-btn-primary hover:glow-blue disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Sign In</span>
                  </div>
                )}
              </Button>
            </form>

            {/* Additional Links */}
            <div className="mt-8 space-y-4">
              <div className="text-center">
                <Link
                  href="/auth/forgot-password"
                  className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>

              <div className="border-t border-white/20 pt-6 text-center">
                <p className="text-white/60 text-sm mb-4">Don't have an account?</p>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center px-6 py-3 bg-white/10 border border-blue-400/50 rounded-xl text-blue-300 hover:text-white hover:bg-white/20 transition-all font-medium"
                >
                  Create Account
                </Link>
              </div>
            </div>

            {/* Support */}
            <div className="mt-8 text-center text-white/60 text-sm">
              <p>Need help?</p>
              <p className="mt-2">
                Contact support at{' '}
                <a
                  href="mailto:support@fisherbackflows.com"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  support@fisherbackflows.com
                </a>
              </p>
            </div>

            <div className="mt-6 text-center">
              <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}