'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  Phone, 
  ArrowLeft,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle,
  Shield
} from 'lucide-react';

interface ForgotPasswordFormProps {
  onBack?: () => void;
  onSuccess?: (data: any) => void;
}

export default function ForgotPasswordForm({ onBack, onSuccess }: ForgotPasswordFormProps) {
  const [formData, setFormData] = useState({
    identifier: '',
    type: 'email' as 'email' | 'phone'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset instructions');
      }

      setSuccess(true);
      setDebugInfo(data.debug); // For development only
      
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset instructions');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="glass rounded-2xl p-8 w-full max-w-md mx-auto glow-blue-sm">
        <div className="text-center">
          <div className="inline-block glass-blue rounded-full p-4 mb-6">
            <CheckCircle className="h-12 w-12 text-green-400" />
          </div>
          
          <h2 className="text-2xl font-bold gradient-text mb-4">Check Your {formData.type === 'email' ? 'Email' : 'Phone'}</h2>
          
          <p className="text-white/70 mb-6">
            We've sent reset instructions to your {formData.type === 'email' ? 'email address' : 'phone number'}.
            Follow the instructions to reset your password.
          </p>

          {/* Development Debug Info */}
          {debugInfo && (
            <div className="glass-darker rounded-lg p-4 mb-6 text-left">
              <h4 className="text-sm font-semibold text-blue-400 mb-2">Development Info:</h4>
              <div className="text-xs text-white/60 space-y-1">
                <p><strong>OTP:</strong> {debugInfo.otp}</p>
                <p><strong>Reset Token:</strong> {debugInfo.resetToken.substring(0, 20)}...</p>
                <p><strong>Expires:</strong> {new Date(debugInfo.expires).toLocaleTimeString()}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={() => window.location.href = '/portal/reset-password'}
              className="w-full btn-glow py-3 rounded-lg"
            >
              Continue to Reset
            </Button>
            
            <Button
              onClick={onBack}
              variant="outline"
              className="w-full btn-glass py-3 rounded-lg"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-8 w-full max-w-md mx-auto glow-blue-sm">
      <div className="text-center mb-8">
        <div className="inline-block glass-blue rounded-full p-4 mb-4">
          <Shield className="h-8 w-8 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold gradient-text mb-2">Reset Password</h2>
        <p className="text-white/60">Enter your email or phone to receive reset instructions</p>
      </div>

      {/* Method Selector */}
      <div className="flex glass-blue rounded-lg p-1 mb-6">
        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, type: 'email', identifier: '' }))}
          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-all ${
            formData.type === 'email' 
              ? 'bg-blue-700/20 text-blue-400' 
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          <Mail className="h-4 w-4 mr-2" />
          Email
        </button>
        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, type: 'phone', identifier: '' }))}
          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-all ${
            formData.type === 'phone' 
              ? 'bg-blue-700/20 text-blue-400' 
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
            {formData.type === 'email' ? 'Email Address' : 'Phone Number'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {formData.type === 'email' ? (
                <Mail className="h-5 w-5 text-white/40" />
              ) : (
                <Phone className="h-5 w-5 text-white/40" />
              )}
            </div>
            <input
              id="identifier"
              type={formData.type === 'email' ? 'email' : 'tel'}
              value={formData.identifier}
              onChange={(e) => setFormData(prev => ({ ...prev, identifier: e.target.value }))}
              placeholder={formData.type === 'email' ? 'your@email.com' : '(253) 555-0123'}
              className="input-glass w-full pl-10 pr-4 py-3 rounded-lg text-white placeholder-white/40"
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

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full btn-glow py-3 text-lg font-semibold rounded-lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Sending Instructions...
            </>
          ) : (
            <>
              <Send className="mr-2 h-5 w-5" />
              Send Reset Instructions
            </>
          )}
        </Button>
      </form>

      {/* Back to Login */}
      <div className="mt-6 text-center">
        <button
          onClick={onBack}
          className="text-blue-400 hover:text-blue-300 text-sm transition-colors flex items-center justify-center mx-auto"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Login
        </button>
      </div>

      {/* Security Notice */}
      <div className="mt-6 glass-blue rounded-lg p-4">
        <div className="flex items-start space-x-3 text-white/70 text-sm">
          <Shield className="h-4 w-4 flex-shrink-0 text-blue-400 mt-0.5" />
          <span>
            Reset instructions are valid for 15 minutes. If you don't receive them, 
            check your spam folder or try again.
          </span>
        </div>
      </div>
    </div>
  );
}