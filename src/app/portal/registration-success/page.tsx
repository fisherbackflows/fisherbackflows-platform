import { CheckCircle, Mail, Shield, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function RegistrationSuccessPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Background grid pattern */}
      <div className="fixed inset-0 bg-grid opacity-10"></div>
      <div className="fixed inset-0 bg-gradient-to-br from-green-600/5 via-transparent to-blue-500/5"></div>
      
      <div className="glass rounded-2xl p-8 border border-green-400 glow-green-sm max-w-md w-full relative z-10">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/20 border border-green-400 glow-green-sm mb-4">
              <CheckCircle className="h-8 w-8 text-green-300" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Account Created Successfully!
            </h1>
            <p className="text-white/80">
              We've sent a verification email to your inbox.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-blue-500/10 border border-blue-400/30">
              <Mail className="h-5 w-5 text-blue-400 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium text-white">
                  Check Your Email
                </p>
                <p className="text-xs text-white/60">
                  Look for a verification email from Fisher Backflows
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-green-500/10 border border-green-400/30">
              <Shield className="h-5 w-5 text-green-400 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium text-white">
                  Click Verify Account
                </p>
                <p className="text-xs text-white/60">
                  Click the verification link in the email
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-purple-500/10 border border-purple-400/30">
              <ArrowRight className="h-5 w-5 text-purple-400 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium text-white">
                  Sign In
                </p>
                <p className="text-xs text-white/60">
                  Return here and sign in to access your account
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link href="/portal">
              <button className="w-full btn-glow bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Continue to Sign In
              </button>
            </Link>
            
            <Link href="/">
              <button className="w-full btn-glass text-white hover:bg-white/5 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Return to Home
              </button>
            </Link>
          </div>

          {/* Help */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-white/60">
              Didn't receive the email? Check your spam folder or{' '}
              <Link href="/api/auth/resend-verification" className="text-blue-400 hover:underline">
                request a new one
              </Link>
            </p>
            <p className="text-xs text-white/60 mt-2">
              Need help?{' '}
              <a href="mailto:support@fisherbackflows.com" className="text-blue-400 hover:underline">
                Contact support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}