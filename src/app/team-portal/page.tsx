'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UnifiedPageLayout, UnifiedCard, THEME } from '@/components/ui/UnifiedTheme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/ui/Logo';
import { ArrowLeft, Lock, User, Eye, EyeOff } from 'lucide-react';

export default function TeamPortalPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Check if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/team/auth/me');
        if (response.ok) {
          const data = await response.json();
          if (data.role === 'admin') {
            router.push('/team-portal/dashboard');
          } else if (data.role === 'tester') {
            router.push('/team-portal/tester');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };
    
    checkAuth();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/team/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect based on role
        if (data.role === 'admin') {
          router.push('/team-portal/dashboard');
        } else if (data.role === 'technician' || data.role === 'tester') {
          router.push('/team-portal/tester');
        } else {
          router.push('/team-portal/dashboard');
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-3">
              <Logo width={160} height={128} />
              <div>
                <h1 className="text-lg font-bold text-slate-900">Fisher Backflows</h1>
                <p className="text-xs text-slate-600">Business Portal</p>
              </div>
            </Link>
            <nav className="hidden md:flex space-x-1">
              <Link href="/">
                <Button variant="ghost" className="px-5 py-2.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200 font-medium">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              <Link href="/portal">
                <Button variant="ghost" className="px-5 py-2.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200 font-medium">
                  Customer Portal
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center min-h-[calc(100vh-100px)] p-6 bg-gradient-to-b from-slate-50/50 to-white">
        <div className="w-full max-w-md">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-8">
              <div className="inline-flex p-4 rounded-2xl bg-slate-100 mb-6">
                <Lock className="h-8 w-8 text-slate-700" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Business Portal</h1>
              <p className="text-slate-600">Sign in to access team management tools</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-center text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </Label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  placeholder="admin@fisherbackflows.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 text-white font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Sign In to Business Portal</span>
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center text-slate-500 text-sm">
              <p>Need help accessing your account?</p>
              <p className="mt-2">
                Contact IT support at{' '}
                <a 
                  href="mailto:support@fisherbackflows.com" 
                  className="text-blue-600 hover:text-blue-700 transition-colors font-semibold"
                >
                  support@fisherbackflows.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}