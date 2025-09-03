'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/ui/Logo';
import { 
  Shield,
  CheckCircle,
  Clock,
  CreditCard,
  Mail,
  Phone,
  Lock,
  User,
  MapPin,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Home
} from 'lucide-react';

export default function CustomerRegistrationPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: {
      street: '',
      city: '',
      state: 'WA',
      zipCode: ''
    },
    propertyType: 'residential' as 'residential' | 'commercial',
    agreeToTerms: false
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!formData.agreeToTerms) {
      setError('Please agree to the Terms of Service');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          address: formData.address,
          propertyType: formData.propertyType
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess('Account created successfully! Please check your email to verify your account.');
      
      // Redirect to login after success
      setTimeout(() => {
        window.location.href = '/portal?registered=true';
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Professional Header */}
      <header className="glass border-b border-blue-400 glow-blue-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/">
              <Logo width={160} height={128} />
            </Link>
            <nav className="hidden md:flex space-x-3 items-center">
              <Link href="/">
                <Link href="/"><Button variant="ghost" className="px-5 py-2.5 rounded-2xl text-white/80 hover:text-white hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm transition-colors duration-200 font-medium">
                  Home
                </Button></Link>
              </Link>
              <Link href="/portal">
                <Button className="glass-btn-primary hover:glow-blue text-white px-5 py-2.5 rounded-2xl font-medium glow-blue-sm transition-colors duration-200">
                  Sign In
                </Button>
              </Link>
              <Link href="/team-portal">
                <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-500/20 border border-emerald-400 glow-blue-sm hover:border-emerald-300 px-5 py-2.5 rounded-2xl font-medium transition-colors duration-200">
                  Team Portal
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex items-center justify-center min-h-[calc(100vh-100px)] p-6">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Create Your Customer Account
            </h1>
            <p className="text-xl text-white/90">
              Join Fisher Backflows to manage your backflow testing services online
            </p>
          </div>

          <div className="glass border border-blue-400 rounded-2xl p-8 max-w-2xl mx-auto glow-blue">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-blue-400 pb-2">Personal Information</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-white/80 mb-2">
                      First Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-white/90" />
                      </div>
                      <input
                        id="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="John"
                        className="w-full pl-10 pr-4 py-3 bg-white/90 border border-blue-400 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-black placeholder-gray-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-white/80 mb-2">
                      Last Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-white/90" />
                      </div>
                      <input
                        id="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Doe"
                        className="w-full pl-10 pr-4 py-3 bg-white/90 border border-blue-400 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-black placeholder-gray-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-white/90" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-white/90 border border-blue-400 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-black placeholder-gray-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-white/80 mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-white/90" />
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(253) 555-0123"
                      className="w-full pl-10 pr-4 py-3 bg-white/90 border border-blue-400 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-black placeholder-gray-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Property Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-blue-400 pb-2">Property Address</h3>
                
                <div>
                  <label htmlFor="street" className="block text-sm font-medium text-white/80 mb-2">
                    Street Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Home className="h-5 w-5 text-white/90" />
                    </div>
                    <input
                      id="street"
                      type="text"
                      value={formData.address.street}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, street: e.target.value }
                      }))}
                      placeholder="123 Main Street"
                      className="w-full pl-10 pr-4 py-3 bg-white/90 border border-blue-400 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-black placeholder-gray-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-white/80 mb-2">
                      City *
                    </label>
                    <input
                      id="city"
                      type="text"
                      value={formData.address.city}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, city: e.target.value }
                      }))}
                      placeholder="Tacoma"
                      className="w-full px-4 py-3 bg-white/90 border border-blue-400 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-black placeholder-gray-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-white/80 mb-2">
                      State
                    </label>
                    <select
                      id="state"
                      value={formData.address.state}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, state: e.target.value }
                      }))}
                      className="w-full px-4 py-3 border border-blue-400 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white"
                      required
                    >
                      <option value="WA">WA</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="zipCode" className="block text-sm font-medium text-white/80 mb-2">
                      ZIP Code *
                    </label>
                    <input
                      id="zipCode"
                      type="text"
                      value={formData.address.zipCode}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, zipCode: e.target.value }
                      }))}
                      placeholder="98401"
                      className="w-full px-4 py-3 bg-white/90 border border-blue-400 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-black placeholder-gray-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="propertyType" className="block text-sm font-medium text-white/80 mb-2">
                    Property Type
                  </label>
                  <select
                    id="propertyType"
                    value={formData.propertyType}
                    onChange={(e) => setFormData(prev => ({ ...prev, propertyType: e.target.value as 'residential' | 'commercial' }))}
                    className="w-full px-4 py-3 border border-blue-400 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white"
                    required
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>
              </div>

              {/* Security */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-blue-400 pb-2">Account Security</h3>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-white/90" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Create a strong password"
                      className="w-full pl-10 pr-12 py-3 bg-white/90 border border-blue-400 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-black placeholder-gray-500"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/90 hover:text-white/90 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-white/90" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm your password"
                      className="w-full pl-10 pr-12 py-3 bg-white/90 border border-blue-400 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-black placeholder-gray-500"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/90 hover:text-white/90 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start space-x-3">
                <input
                  id="agreeToTerms"
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={(e) => setFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
                  className="mt-1 h-4 w-4 text-blue-300 border-blue-500/50 rounded focus:ring-blue-400"
                  required
                />
                <label htmlFor="agreeToTerms" className="text-sm text-white/80">
                  I agree to the{' '}
                  <a href="/terms" className="text-blue-300 hover:text-blue-700 underline font-medium">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-blue-300 hover:text-blue-700 underline font-medium">
                    Privacy Policy
                  </a>
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl border border-red-200 rounded-2xl p-4 flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-300 mr-3 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl border border-green-200 rounded-2xl p-4 flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-300 mr-3 flex-shrink-0" />
                  <p className="text-green-700 text-sm">{success}</p>
                </div>
              )}

              {/* Create Account Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full glass-btn-primary hover:glow-blue disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 text-lg font-semibold rounded-2xl glow-blue-sm transition-colors duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-blue-400"></div>
                <span className="px-4 text-white/80 text-xs">Already have an account?</span>
                <div className="flex-1 border-t border-blue-400"></div>
              </div>
              
              <Link
                href="/portal"
                className="inline-flex items-center justify-center w-full border border-blue-200 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl text-blue-700 hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 border border-blue-400 glow-blue-sm hover:border-blue-300 py-3 rounded-2xl transition-colors duration-200 font-medium"
              >
                Sign In to Your Account
              </Link>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-8 text-center">
            <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl border border-blue-200 rounded-2xl p-4 max-w-md mx-auto">
              <div className="flex items-center justify-center space-x-3 text-white/80 text-sm">
                <Shield className="h-5 w-5 flex-shrink-0 text-blue-300" />
                <span>
                  Your information is protected with bank-level security.
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}