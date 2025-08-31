'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Key, ArrowRight, AlertCircle, CheckCircle, Eye, EyeOff, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signInCustomer } from '@/lib/auth';
import Link from 'next/link';

export default function CustomerLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

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
      const { data, error } = await signInCustomer(formData.email, formData.password);

      if (error) {
        // Provide more specific error messages
        if (error.message.includes('Invalid email')) {
          setError('No account found with this email address. Please check your email or contact us for help.');
        } else if (error.message.includes('Invalid password') || error.message.includes('password')) {
          setError('Incorrect password. Please try again or use the forgot password link below.');
        } else if (error.message.includes('network')) {
          setError('Connection problem. Please check your internet and try again.');
        } else {
          setError(error.message || 'Unable to sign in. Please try again.');
        }
        return;
      }

      if (data?.user) {
        setSuccess('Welcome back! Taking you to your account...');
        
        // Small delay for better UX
        setTimeout(() => {
          router.push('/portal/dashboard');
        }, 1000);
      }

    } catch (error) {
      console.error('Login error:', error);
      setError('Something unexpected happened. Please try again or contact support.');
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
              <div className="flex items-center justify-between mb-2">
                <label className="block text-white/80 text-sm font-medium">
                  Password
                </label>
                <Link 
                  href="/portal/forgot-password"
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  required
                  className="input-glass w-full pl-10 pr-12 py-3 rounded-xl text-white placeholder-white/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !formData.email || !formData.password}
              className="w-full btn-glow py-3 text-lg font-bold rounded-xl hover-glow"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Verifying...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Additional Options */}
          <div className="text-center mt-6 space-y-4">
            <div className="flex items-center justify-center space-x-4 text-sm">
              <Link 
                href="/portal/register" 
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Create Account
              </Link>
              <span className="text-white/40">•</span>
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="text-blue-400 hover:text-blue-300 transition-colors flex items-center"
              >
                <HelpCircle className="h-4 w-4 mr-1" />
                Need Help?
              </button>
            </div>

            {showHelp && (
              <div className="glass-darker rounded-xl p-4 space-y-3">
                <div className="text-left">
                  <p className="text-white/70 text-sm font-medium mb-2">
                    🆘 Having trouble logging in?
                  </p>
                  <ul className="text-white/50 text-xs space-y-1">
                    <li>• Check that your email is spelled correctly</li>
                    <li>• Try the "Forgot password?" link above</li>
                    <li>• Make sure you're using the email from your invoice</li>
                    <li>• Contact us if you need your account number</li>
                  </ul>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <p className="text-white/60 text-xs mb-1">Call or text us:</p>
                  <a 
                    href="tel:2532788692" 
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                  >
                    (253) 278-8692
                  </a>
                </div>
              </div>
            )}
            
            <div className="glass-darker rounded-xl p-4">
              <p className="text-white/70 text-sm font-medium mb-2">
                ⚡ Demo Account
              </p>
              <div className="text-white/50 text-xs space-y-1">
                <p>Email: demo@fisherbackflows.com</p>
                <p>Password: demo123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}