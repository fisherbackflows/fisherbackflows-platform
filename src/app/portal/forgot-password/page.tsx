'use client';

import Link from 'next/link';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import Logo from '@/components/ui/Logo';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-black relative">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid opacity-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-blue-500/5" />
      
      {/* Header */}
      <header className="glass border-b border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/">
              <Logo width={180} height={144} />
            </Link>
            <nav className="hidden md:flex space-x-4">
              <Link href="/" className="glass border border-white/20 px-4 py-2 rounded-lg text-white/90 hover:text-white hover:border-white/40 transition-all duration-300 hover:bg-white/10 hover:scale-105">
                Home
              </Link>
              <Link href="/portal" className="glass border border-blue-400/30 px-4 py-2 rounded-lg text-blue-400 hover:text-white hover:border-blue-400/60 transition-all duration-300 hover:bg-blue-400/20 hover:scale-105 glow-blue-sm">
                Login
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center min-h-[calc(100vh-100px)] p-4 relative z-10">
        <ForgotPasswordForm 
          onBack={() => window.location.href = '/portal'}
          onSuccess={(data) => {
            // Store any necessary data and redirect will be handled by the component
            console.log('Reset request successful:', data);
          }}
        />
      </div>
    </div>
  );
}