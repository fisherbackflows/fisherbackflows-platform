'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/ui/Logo';
import {
  Shield,
  CheckCircle,
  User,
  Building,
  Wrench,
  Mail,
  Phone,
  Lock,
  MapPin,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Home
} from 'lucide-react';

interface RegistrationFormData {
  accountType: 'customer' | 'business';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  // Customer specific
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  propertyType?: 'residential' | 'commercial';
  // Business specific
  companyName?: string;
  businessType?: string;
  licenseNumber?: string;
  agreeToTerms: boolean;
}

export default function UnifiedRegistrationPage() {
  const [formData, setFormData] = useState<RegistrationFormData>({
    accountType: 'customer',
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
    propertyType: 'residential',
    companyName: '',
    businessType: '',
    licenseNumber: '',
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
      const registrationData = {
        accountType: formData.accountType,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        ...(formData.accountType === 'customer' && {
          address: formData.address,
          propertyType: formData.propertyType
        }),
        ...(formData.accountType === 'business' && {
          companyName: formData.companyName,
          businessType: formData.businessType,
          licenseNumber: formData.licenseNumber
        })
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess('Account created successfully! You can now sign in with your email and password.');

      // Redirect to login after success
      setTimeout(() => {
        window.location.href = '/auth/login?registered=true';
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getAccountTypeInfo = (type: string) => {
    switch (type) {
      case 'customer':
        return {
          icon: <User className="h-6 w-6" />,
          title: 'Customer Account',
          description: 'For property owners who need backflow testing services'
        };
      case 'business':
        return {
          icon: <Building className="h-6 w-6" />,
          title: 'Business Account',
          description: 'For backflow testing companies and service providers'
        };
      default:
        return {
          icon: <User className="h-6 w-6" />,
          title: 'Account',
          description: ''
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
              <Link href="/auth/login">
                <Button className="glass-btn-primary hover:glow-blue text-white">
                  Sign In
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex items-center justify-center min-h-[calc(100vh-100px)] p-6 relative z-10">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Create Your Account
            </h1>
            <p className="text-xl text-white/80">
              Join Fisher Backflows to manage your services online
            </p>
          </div>

          <div className="glass border border-blue-400 rounded-2xl p-8 max-w-2xl mx-auto glow-blue">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Account Type Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-blue-400 pb-2">Account Type</h3>

                <div className="grid md:grid-cols-2 gap-4">
                  {['customer', 'business'].map((type) => {
                    const info = getAccountTypeInfo(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, accountType: type as any }))}
                        className={`p-4 rounded-xl border transition-all text-left ${
                          formData.accountType === type
                            ? 'border-blue-400 bg-blue-500/20 text-white'
                            : 'border-white/20 bg-white/5 text-white/80 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="text-blue-400">
                            {info.icon}
                          </div>
                          <h4 className="font-semibold">{info.title}</h4>
                        </div>
                        <p className="text-sm text-white/60">{info.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-blue-400 pb-2">Personal Information</h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-white/80 mb-2">
                      First Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                      <input
                        id="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="John"
                        className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/60 focus:border-blue-400 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-white/80 mb-2">
                      Last Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                      <input
                        id="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Doe"
                        className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/60 focus:border-blue-400 focus:outline-none"
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
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/60 focus:border-blue-400 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-white/80 mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                    <input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(253) 555-0123"
                      className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/60 focus:border-blue-400 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Business Information (only for business accounts) */}
              {formData.accountType === 'business' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white border-b border-blue-400 pb-2">Business Information</h3>

                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-white/80 mb-2">
                      Company Name *
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                      <input
                        id="companyName"
                        type="text"
                        value={formData.companyName || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                        placeholder="Your Business Name"
                        className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/60 focus:border-blue-400 focus:outline-none"
                        required={formData.accountType === 'business'}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="businessType" className="block text-sm font-medium text-white/80 mb-2">
                        Business Type
                      </label>
                      <select
                        id="businessType"
                        value={formData.businessType || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, businessType: e.target.value }))}
                        className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white focus:border-blue-400 focus:outline-none"
                      >
                        <option value="">Select Type</option>
                        <option value="backflow_testing">Backflow Testing</option>
                        <option value="plumbing">Plumbing Services</option>
                        <option value="property_management">Property Management</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="licenseNumber" className="block text-sm font-medium text-white/80 mb-2">
                        License Number
                      </label>
                      <input
                        id="licenseNumber"
                        type="text"
                        value={formData.licenseNumber || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                        placeholder="License #"
                        className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/60 focus:border-blue-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Property Address (only for customer accounts) */}
              {formData.accountType === 'customer' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white border-b border-blue-400 pb-2">Property Address</h3>

                  <div>
                    <label htmlFor="street" className="block text-sm font-medium text-white/80 mb-2">
                      Street Address *
                    </label>
                    <div className="relative">
                      <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                      <input
                        id="street"
                        type="text"
                        value={formData.address?.street || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          address: { ...prev.address!, street: e.target.value }
                        }))}
                        placeholder="123 Main Street"
                        className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/60 focus:border-blue-400 focus:outline-none"
                        required={formData.accountType === 'customer'}
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
                        value={formData.address?.city || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          address: { ...prev.address!, city: e.target.value }
                        }))}
                        placeholder="Tacoma"
                        className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/60 focus:border-blue-400 focus:outline-none"
                        required={formData.accountType === 'customer'}
                      />
                    </div>

                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-white/80 mb-2">
                        State
                      </label>
                      <select
                        id="state"
                        value={formData.address?.state || 'WA'}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          address: { ...prev.address!, state: e.target.value }
                        }))}
                        className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white focus:border-blue-400 focus:outline-none"
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
                        value={formData.address?.zipCode || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          address: { ...prev.address!, zipCode: e.target.value }
                        }))}
                        placeholder="98401"
                        className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/60 focus:border-blue-400 focus:outline-none"
                        required={formData.accountType === 'customer'}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="propertyType" className="block text-sm font-medium text-white/80 mb-2">
                      Property Type
                    </label>
                    <select
                      id="propertyType"
                      value={formData.propertyType || 'residential'}
                      onChange={(e) => setFormData(prev => ({ ...prev, propertyType: e.target.value as 'residential' | 'commercial' }))}
                      className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white focus:border-blue-400 focus:outline-none"
                    >
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Password Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-blue-400 pb-2">Account Security</h3>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Create a strong password"
                      className="w-full pl-10 pr-12 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/60 focus:border-blue-400 focus:outline-none"
                      required
                      minLength={8}
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

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm your password"
                      className="w-full pl-10 pr-12 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/60 focus:border-blue-400 focus:outline-none"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
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
                  className="mt-1 h-4 w-4 text-blue-400 border-white/20 rounded focus:ring-blue-400"
                  required
                />
                <label htmlFor="agreeToTerms" className="text-sm text-white/80">
                  I agree to the{' '}
                  <Link href="/terms" className="text-blue-400 hover:text-blue-300 underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-blue-400 hover:text-blue-300 underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/20 border border-red-400/50 rounded-xl p-4 flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-emerald-500/20 border border-emerald-400/50 rounded-xl p-4 flex items-center">
                  <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 flex-shrink-0" />
                  <p className="text-emerald-200 text-sm">{success}</p>
                </div>
              )}

              {/* Create Account Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full glass-btn-primary hover:glow-blue disabled:opacity-50 disabled:cursor-not-allowed py-3 text-lg"
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
                <div className="flex-1 border-t border-white/20"></div>
                <span className="px-4 text-white/60 text-sm">Already have an account?</span>
                <div className="flex-1 border-t border-white/20"></div>
              </div>

              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center w-full border border-blue-400/50 bg-white/10 text-white hover:bg-white/20 py-3 rounded-xl transition-colors font-medium"
              >
                Sign In to Your Account
              </Link>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-8 text-center">
            <div className="glass border border-blue-400/50 rounded-xl p-4 max-w-md mx-auto">
              <div className="flex items-center justify-center space-x-3 text-white/80 text-sm">
                <Shield className="h-5 w-5 flex-shrink-0 text-blue-400" />
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