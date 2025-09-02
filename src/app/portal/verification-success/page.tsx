'use client';

import Link from 'next/link';
import { CheckCircle, ArrowRight, Mail, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VerificationSuccessPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-grid opacity-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-green-600/5 via-transparent to-blue-500/5" />
      
      <div className="glass rounded-2xl p-8 border border-green-400 glow-green-sm max-w-md w-full relative z-10">
        <div className="text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/20 border border-green-400 glow-green-sm mb-4">
              <CheckCircle className="h-8 w-8 text-green-300" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Email Verified Successfully!
            </h1>
            <p className="text-white/80">
              Your account has been activated and you can now access your customer portal.
            </p>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-green-500/10 border border-green-400/30">
              <Shield className="h-5 w-5 text-green-400" />
              <div className="text-left">
                <p className="text-sm font-medium text-white">Account Activated</p>
                <p className="text-xs text-white/60">Your account is now fully operational</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-blue-500/10 border border-blue-400/30">
              <Mail className="h-5 w-5 text-blue-400" />
              <div className="text-left">
                <p className="text-sm font-medium text-white">Email Confirmed</p>
                <p className="text-xs text-white/60">You'll receive service notifications</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <Link href="/portal/login">
              <Button className="w-full btn-glow">
                <ArrowRight className="h-4 w-4 mr-2" />
                Continue to Customer Portal
              </Button>
            </Link>
            
            <Link href="/">
              <Button variant="outline" className="w-full btn-glass">
                Return to Home
              </Button>
            </Link>
          </div>
          
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-white/60">
              Need help? Contact us at{' '}
              <a href="mailto:support@fisherbackflows.com" className="text-blue-400 hover:underline">
                support@fisherbackflows.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}