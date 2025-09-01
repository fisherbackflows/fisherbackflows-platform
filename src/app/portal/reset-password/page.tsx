'use client';

export const dynamic = 'force-dynamic';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import Logo from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  return (
    <ResetPasswordForm 
      resetToken={token || undefined}
      onSuccess={(data) => {
        console.log('Password reset successful:', data);
        // Redirect will be handled by the component
      }}
    />
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-black relative">
      {/* Header */}
      <header className="glass border-b border-blue-400 glow-blue-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/">
              <Logo width={180} height={144} />
            </Link>
            <nav className="hidden md:flex space-x-4">
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

      <div className="flex items-center justify-center min-h-[calc(100vh-100px)] p-4 ">
        <Suspense fallback={
          <div className="glass border border-blue-400 rounded-2xl p-8 w-full max-w-md mx-auto glow-blue-sm">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
              <p className="text-white/80 mt-4">Loading...</p>
            </div>
          </div>
        }>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}