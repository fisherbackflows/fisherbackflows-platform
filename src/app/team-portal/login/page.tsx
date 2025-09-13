'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/ui/Logo';
import { ArrowLeft, Lock, User, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { TeamPortalNavigation } from '@/components/navigation/UnifiedNavigation';

export default function TeamPortalLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Check if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/team/auth/me');
        if (response.ok) {
          const data = await response.json();
          if (data.role === 'admin') {
            router.push('/team-portal/dashboard');
          } else if (data.role === 'technician' || data.role === 'tester') {
            router.push('/team-portal/tester');
          } else {
            router.push('/team-portal/dashboard');
          }
        }
      } catch (error) {
        // User not authenticated, stay on login page
      }
    };
    
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/team/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Login successful!');
        // Redirect based on role
        if (data.role === 'admin') {
          router.push('/team-portal/dashboard');
        } else if (data.role === 'technician' || data.role === 'tester') {
          router.push('/team-portal/tester');
        } else {
          router.push('/team-portal/dashboard');
        }
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <TeamPortalNavigation userInfo={{ name: 'Team Member', email: '' }} />

      {/* Main Content */}
      <main className="flex items-center justify-center min-h-[calc(100vh-100px)] p-6">
        <div className="w-full max-w-md">
          <div className="glass border border-blue-400 rounded-2xl p-8 glow-blue">
            <div className="text-center mb-8">
              <div className="inline-flex p-4 rounded-2xl glass mb-6">
                <Lock className="h-8 w-8 text-white/80" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Tester Portal</h1>
              <p className="text-white/90">Sign in to access business management tools</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                  Email Address
                </Label>
                <Input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-blue-400 glass text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm transition-all duration-200"
                  placeholder="tester@company.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 border border-blue-400 glass text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm transition-all duration-200"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 text-white font-semibold rounded-xl glass-btn-primary glow-blue transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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

            <div className="mt-8 text-center text-white/80 text-sm">
              <p>Need help accessing your account?</p>
              <p className="mt-2">
                Contact IT support at{' '}
                <a 
                  href="mailto:support@fisherbackflows.com" 
                  className="text-blue-300 hover:text-blue-400 transition-colors font-semibold"
                >
                  support@fisherbackflows.com
                </a>
              </p>
            </div>

            <div className="mt-6 text-center">
              <Link href="/" className="text-blue-300 hover:text-blue-400 text-sm font-medium">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}