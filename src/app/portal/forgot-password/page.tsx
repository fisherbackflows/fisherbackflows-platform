'use client';

import Link from 'next/link';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import Logo from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Professional Header */}
      <header className="glass border-b border-blue-400 glow-blue-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/">
              <Logo width={160} height={128} />
            </Link>
            <nav className="hidden md:flex space-x-3">
              <Link href="/">
                <Button variant="ghost" className="px-5 py-2.5 rounded-2xl text-white/80 hover:text-white hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm transition-colors duration-200 font-medium">
                  Home
                </Button>
              </Link>
              <Link href="/portal">
                <Button className="glass-btn-primary hover:glow-blue text-white px-5 py-2.5 rounded-2xl font-medium glow-blue-sm transition-colors duration-200">
                  Login
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex items-center justify-center min-h-[calc(100vh-100px)] p-6">
        <div className="w-full max-w-md">
          <div className="glass border border-blue-400 rounded-2xl p-8 glow-blue">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
              <p className="text-white/90">Enter your email to receive a password reset link</p>
            </div>
            
            <ForgotPasswordForm 
              onBack={() => window.location.href = '/portal'}
              onSuccess={(data) => {
                console.log('Reset request successful:', data);
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}