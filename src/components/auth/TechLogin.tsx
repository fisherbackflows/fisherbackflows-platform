'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, ArrowRight, AlertCircle, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signInTech } from '@/lib/auth';

export default function TechLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { success, error } = await signInTech(formData.username, formData.password);

      if (!success) {
        setError(error || 'Invalid credentials');
        return;
      }

      // Redirect to field app dashboard
      router.push('/field/dashboard');

    } catch (error) {
      console.error('Tech login error:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="fixed inset-0 bg-grid opacity-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-orange-500/5" />
      
      <div className="max-w-md w-full mx-4 relative z-10">
        <div className="glass rounded-3xl p-8 glow-orange">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="glass rounded-full p-4 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
              <Wrench className="h-8 w-8 text-orange-400" />
            </div>
            <h1 className="text-3xl font-bold text-orange-400 mb-2">Field Tech Login</h1>
            <p className="text-white/70">Access field testing tools</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="glass-red rounded-xl p-4 mb-6 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
              <p className="text-red-100 text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="mike"
                  required
                  className="input-glass w-full pl-10 pr-4 py-3 rounded-xl text-white placeholder-white/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter password"
                  required
                  className="input-glass w-full pl-10 pr-4 py-3 rounded-xl text-white placeholder-white/40"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !formData.username || !formData.password}
              className="w-full bg-orange-500 hover:bg-orange-600 py-3 text-lg font-bold rounded-xl transition-all"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="text-center mt-6">
            <div className="glass-darker rounded-xl p-4">
              <p className="text-white/70 text-sm font-medium mb-2">
                🔧 Demo Credentials
              </p>
              <div className="space-y-1 text-white/50 text-xs">
                <p>Username: <span className="text-orange-400">mike</span> | Password: <span className="text-orange-400">fisher123</span></p>
                <p>Username: <span className="text-orange-400">tech1</span> | Password: <span className="text-orange-400">backflow2024</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}