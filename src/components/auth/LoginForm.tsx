'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  Phone, 
  Eye, 
  EyeOff, 
  Lock, 
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface LoginFormProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  redirectTo?: string;
}

export default function LoginForm({ onSuccess, onError, redirectTo = '/portal' }: LoginFormProps) {
  const [formData, setFormData] = useState({
    identifier: '', // email or phone
    password: '',
    loginType: 'email' as 'email' | 'phone'
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: formData.identifier,
          password: formData.password,
          type: formData.loginType
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setSuccess('Login successful! Redirecting...');
      
      if (onSuccess) {
        onSuccess(data.user);
      } else {
        // Redirect after success
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 1500);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setFormData({
      identifier: 'demo',
      password: '',
      loginType: 'email'
    });
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'demo',
          type: 'demo'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Demo login failed');
      }

      setSuccess('Demo login successful! Redirecting...');
      
      setTimeout(() => {
        window.location.href = redirectTo;
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-8 w-full max-w-md mx-auto glow-blue-sm">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold gradient-text mb-2">Customer Login</h2>
        <p className="text-white/60">Access your account and manage services</p>
      </div>

      {/* Login Type Selector */}
      <div className="flex glass-blue rounded-lg p-1 mb-6">
        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, loginType: 'email' }))}
          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-all ${
            formData.loginType === 'email' 
              ? 'bg-blue-500/20 text-blue-400' 
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          <Mail className="h-4 w-4 mr-2" />
          Email
        </button>
        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, loginType: 'phone' }))}
          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-all ${
            formData.loginType === 'phone' 
              ? 'bg-blue-500/20 text-blue-400' 
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          <Phone className="h-4 w-4 mr-2" />
          Phone
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identifier Input */}
        <div>
          <label htmlFor="identifier" className="block text-sm font-medium text-white/80 mb-2">
            {formData.loginType === 'email' ? 'Email Address' : 'Phone Number'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {formData.loginType === 'email' ? (
                <Mail className="h-5 w-5 text-white/40" />
              ) : (
                <Phone className="h-5 w-5 text-white/40" />
              )}
            </div>
            <input
              id="identifier"
              type={formData.loginType === 'email' ? 'email' : 'tel'}
              value={formData.identifier}
              onChange={(e) => setFormData(prev => ({ ...prev, identifier: e.target.value }))}
              placeholder={formData.loginType === 'email' ? 'your@email.com' : '(253) 555-0123'}
              className="input-glass w-full pl-10 pr-4 py-3 rounded-lg text-white placeholder-white/40"
              required
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-white/40" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter your password"
              className="input-glass w-full pl-10 pr-12 py-3 rounded-lg text-white placeholder-white/40"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/40 hover:text-white/60"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="glass-darker border border-red-500/20 rounded-lg p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="glass-blue border border-green-500/20 rounded-lg p-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
            <p className="text-green-400 text-sm">{success}</p>
          </div>
        )}

        {/* Login Button */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full btn-glow py-3 text-lg font-semibold rounded-lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>

      {/* Demo Login */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <Button
          type="button"
          onClick={handleDemoLogin}
          disabled={loading}
          className="w-full btn-glass py-3 rounded-lg hover-glow"
        >
          Try Demo Account
        </Button>
      </div>

      {/* Additional Links */}
      <div className="mt-6 text-center space-y-3">
        <button
          type="button"
          className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
          onClick={() => window.location.href = '/portal/forgot-password'}
        >
          Forgot your password?
        </button>
        
        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-white/10"></div>
          <span className="px-4 text-white/40 text-xs">or</span>
          <div className="flex-1 border-t border-white/10"></div>
        </div>
        
        <Button
          type="button"
          className="w-full border border-blue-500/30 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 py-3 rounded-lg transition-all"
          onClick={() => window.location.href = '/portal/register'}
        >
          Create New Account
        </Button>
        
        <div className="text-white/40 text-xs mt-3">
          Need help? Contact us at{' '}
          <a href="tel:2532788692" className="text-blue-400 hover:text-blue-300">
            (253) 278-8692
          </a>
        </div>
      </div>
    </div>
  );
}