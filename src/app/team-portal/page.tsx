'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/ui/Logo';
import StandardHeader from '@/components/ui/StandardHeader';
import { ArrowLeft, Lock, User, Eye, EyeOff } from 'lucide-react';

export default function TeamLoginPage() {
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

      if (response.ok) {
        const data = await response.json();
        
        // Redirect based on role
        if (data.role === 'admin') {
          router.push('/team-portal/dashboard');
        } else if (data.role === 'tester') {
          router.push('/team-portal/tester');
        } else {
          setError('Invalid user role');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid opacity-20" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5" />
      
      <StandardHeader variant="portal">
        <div className="flex justify-between items-center">
          <Logo width={200} height={160} priority />
          <div className="flex items-center gap-4">
            <Link href="/" className="btn-glass px-4 py-2 rounded-lg hover-glow flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Home
            </Link>
          </div>
        </div>
      </StandardHeader>

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto">
          <div className="glass rounded-2xl p-8 glow-blue-sm">
            <div className="text-center mb-8">
              <div className="inline-block glass-blue rounded-full p-4 mb-4 pulse-glow">
                <User className="h-8 w-8 text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Team Portal Login</h1>
              <p className="text-white/60">Access your team dashboard and tools</p>
            </div>

            {error && (
              <div className="glass-red rounded-lg p-4 mb-6 text-center text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="glass border-white/20 text-white placeholder:text-white/40 focus:border-blue-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="glass border-white/20 text-white placeholder:text-white/40 focus:border-blue-400 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full btn-glow py-3 flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Signing In...
                  </div>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-white/50 text-sm">
                Need help? Contact your administrator
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-white/30 text-xs">
              Team Portal • Secure Access • Fisher Backflows
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}