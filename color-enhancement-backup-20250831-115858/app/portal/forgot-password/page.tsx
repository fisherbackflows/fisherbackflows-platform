'use client';

import Link from 'next/link';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import Logo from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Professional Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/">
              <Logo width={160} height={128} />
            </Link>
            <nav className="hidden md:flex space-x-3">
              <Link href="/">
                <Button variant="ghost" className="px-5 py-2.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-200 font-medium">
                  Home
                </Button>
              </Link>
              <Link href="/portal">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors duration-200">
                  Login
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex items-center justify-center min-h-[calc(100vh-100px)] p-6">
        <div className="w-full max-w-md">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Reset Password</h1>
              <p className="text-slate-600">Enter your email to receive a password reset link</p>
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