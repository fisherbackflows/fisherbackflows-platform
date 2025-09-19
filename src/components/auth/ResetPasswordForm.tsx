'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Lock,
  Eye,
  EyeOff,
  Key,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield
} from 'lucide-react';

interface ResetPasswordFormProps {
  resetToken?: string;
  onSuccess?: (data: any) => void;
}

export default function ResetPasswordForm({ resetToken, onSuccess }: ResetPasswordFormProps) {
  const [step, setStep] = useState<'otp' | 'password'>('otp');
  const [formData, setFormData] = useState({
    token: resetToken || '',
    otp: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verifiedData, setVerifiedData] = useState<any>(null);

  // Get token from URL if not provided as prop
  useEffect(() => {
    if (!resetToken) {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('token');
      if (tokenFromUrl) {
        setFormData(prev => ({ ...prev, token: tokenFromUrl }));
      }
    }
  }, [resetToken]);

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: formData.token,
          otp: formData.otp
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify OTP');
      }

      setSuccess('OTP verified successfully!');
      setVerifiedData(data);
      setStep('password');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: formData.token,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess('Password reset successfully!');
      
      if (onSuccess) {
        onSuccess(data);
      } else {
        // Redirect to dashboard after success
        setTimeout(() => {
          window.location.href = '/portal/dashboard';
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  // OTP Verification Step
  if (step === 'otp') {
    return (
      <div className="glass rounded-2xl p-8 w-full max-w-md mx-auto glow-blue-sm">
        <div className="text-center mb-8">
          <div className="inline-block glass-blue rounded-full p-4 mb-4">
            <Key className="h-8 w-8 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold gradient-text mb-2">Enter Verification Code</h2>
          <p className="text-white/60">Enter the 6-digit code sent to your email/phone</p>
        </div>

        <form onSubmit={handleVerifyOTP} className="space-y-6">
          {/* OTP Input */}
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-white/80 mb-2">
              Verification Code
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-5 w-5 text-white/40" />
              </div>
              <input
                id="otp"
                type="text"
                value={formData.otp}
                onChange={(e) => setFormData(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                placeholder="123456"
                className="input-glass w-full pl-10 pr-4 py-3 rounded-lg text-white placeholder-white/40 text-center text-2xl tracking-widest"
                maxLength={6}
                required
              />
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

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || formData.otp.length !== 6}
            className="w-full btn-glow py-3 text-lg font-semibold rounded-lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Code'
            )}
          </Button>
        </form>

        {/* Resend Code */}
        <div className="mt-6 text-center">
          <button
            type="button"
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            onClick={() => window.location.href = '/portal/forgot-password'}
          >
            Didn't receive a code? Send new one
          </button>
        </div>
      </div>
    );
  }

  // Password Reset Step
  return (
    <div className="glass rounded-2xl p-8 w-full max-w-md mx-auto glow-blue-sm">
      <div className="text-center mb-8">
        <div className="inline-block glass-blue rounded-full p-4 mb-4">
          <Lock className="h-8 w-8 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold gradient-text mb-2">Set New Password</h2>
        {verifiedData && (
          <p className="text-white/60">for {verifiedData.email}</p>
        )}
      </div>

      <form onSubmit={handleResetPassword} className="space-y-6">
        {/* New Password Input */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
            New Password
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
              placeholder="Enter new password"
              className="input-glass w-full pl-10 pr-12 py-3 rounded-lg text-white placeholder-white/40"
              minLength={8}
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

        {/* Confirm Password Input */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-white/40" />
            </div>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Confirm new password"
              className="input-glass w-full pl-10 pr-12 py-3 rounded-lg text-white placeholder-white/40"
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/40 hover:text-white/60"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Password Requirements */}
        <div className="glass-blue rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-400 mb-2">Password Requirements:</h4>
          <ul className="text-xs text-white/60 space-y-1">
            <li className={`flex items-center ${formData.password.length >= 8 ? 'text-green-400' : ''}`}>
              <CheckCircle className={`h-3 w-3 mr-1 ${formData.password.length >= 8 ? 'text-green-400' : 'text-white/40'}`} />
              At least 8 characters
            </li>
            <li className={`flex items-center ${formData.password === formData.confirmPassword && formData.password ? 'text-green-400' : ''}`}>
              <CheckCircle className={`h-3 w-3 mr-1 ${formData.password === formData.confirmPassword && formData.password ? 'text-green-400' : 'text-white/40'}`} />
              Passwords match
            </li>
          </ul>
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

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading || formData.password.length < 8 || formData.password !== formData.confirmPassword}
          className="w-full btn-glow py-3 text-lg font-semibold rounded-lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Resetting Password...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-5 w-5" />
              Reset Password
            </>
          )}
        </Button>
      </form>
    </div>
  );
}