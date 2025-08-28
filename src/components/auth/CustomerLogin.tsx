'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Key, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signInCustomer } from '@/lib/auth';

export default function CustomerLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    accountNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      const { user, error } = await signInCustomer(formData.email, formData.accountNumber);

      if (error) {
        setError(error.message);
        return;
      }

      if (user) {
        setSuccess('Login link sent to your email! Check your inbox.');
        
        // Redirect to portal after a short delay
        setTimeout(() => {
          router.push('/portal/dashboard');
        }, 2000);
      }

    } catch (error) {
      console.error('Login error:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="fixed inset-0 bg-grid opacity-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5" />
      
      <div className="max-w-md w-full mx-4 relative z-10">
        <div className="glass rounded-3xl p-8 glow-blue">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="glass rounded-full p-4 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
              <Key className="h-8 w-8 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Customer Login</h1>
            <p className="text-white/70">Access your backflow testing account</p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="glass-green rounded-xl p-4 mb-6 flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
              <p className="text-green-100 text-sm">{success}</p>
            </div>
          )}

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
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john.smith@email.com"
                  required
                  className="input-glass w-full pl-10 pr-4 py-3 rounded-xl text-white placeholder-white/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Account Number
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  placeholder="FB001"
                  required
                  className="input-glass w-full pl-10 pr-4 py-3 rounded-xl text-white placeholder-white/40 uppercase"
                />
              </div>
              <p className="text-white/50 text-xs mt-2">
                Find this on your invoice or previous correspondence
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || !formData.email || !formData.accountNumber}
              className="w-full btn-glow py-3 text-lg font-bold rounded-xl hover-glow"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Verifying...
                </>
              ) : (
                <>
                  Send Login Link
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Help Text */}
          <div className="text-center mt-6 space-y-3">
            <p className="text-white/60 text-sm">
              Don't have an account number? Call us at{' '}
              <a href="tel:2532788692" className="text-blue-400 hover:text-blue-300">
                (253) 278-8692
              </a>
            </p>
            
            <div className="glass-darker rounded-xl p-4">
              <p className="text-white/70 text-sm font-medium mb-2">
                ⚡ Quick Demo Login
              </p>
              <p className="text-white/50 text-xs">
                Email: demo@fisherbackflows.com<br/>
                Account: FB005
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}