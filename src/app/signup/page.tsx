'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Users,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

export default function SignupPage() {
  const [selectedPath, setSelectedPath] = useState<'customer' | 'company' | null>(null);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="glass border-b border-blue-400/30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/fisher-backflows-logo.png"
              alt="Fisher Backflows Platform"
              width={36}
              height={36}
              className="brightness-110 contrast-105 rounded-lg"
            />
            <div>
              <h1 className="text-lg font-bold text-white">Fisher Backflows Platform</h1>
              <p className="text-xs text-white/60">Choose Your Path</p>
            </div>
          </Link>
        </div>
      </header>

      <main className="flex items-center justify-center min-h-[calc(100vh-100px)] p-6">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Get Started with Fisher Backflows
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Choose your path to join the leading backflow compliance marketplace
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Property Owner Path */}
            <div
              className={`glass border-2 rounded-3xl p-8 cursor-pointer transition-all duration-300 ${
                selectedPath === 'customer'
                  ? 'border-blue-400 ring-2 ring-blue-400/50 glow-blue'
                  : 'border-blue-400/30 hover:border-blue-400/60'
              }`}
              onClick={() => setSelectedPath('customer')}
            >
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl glass border border-blue-400/30 flex items-center justify-center">
                  <Building2 className="h-10 w-10 text-blue-400" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-4">Property Owner</h2>
                <p className="text-white/80 mb-6">
                  I need backflow testing for my residential or commercial property
                </p>

                <div className="space-y-3 text-left mb-8">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 flex-shrink-0" />
                    <span className="text-white/80">Find certified testing companies</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 flex-shrink-0" />
                    <span className="text-white/80">Manage all your backflow devices</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 flex-shrink-0" />
                    <span className="text-white/80">Auto-schedule yearly compliance</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 flex-shrink-0" />
                    <span className="text-white/80">Track testing history</span>
                  </div>
                </div>

                <Link href="/portal/register">
                  <Button
                    className={`w-full glass-btn-primary hover:glow-blue text-white font-semibold rounded-xl ${
                      selectedPath === 'customer' ? 'ring-2 ring-blue-400/50' : ''
                    }`}
                  >
                    Register as Property Owner
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Testing Company Path */}
            <div
              className={`glass border-2 rounded-3xl p-8 cursor-pointer transition-all duration-300 ${
                selectedPath === 'company'
                  ? 'border-emerald-400 ring-2 ring-emerald-400/50 glow-emerald'
                  : 'border-emerald-400/30 hover:border-emerald-400/60'
              }`}
              onClick={() => setSelectedPath('company')}
            >
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl glass border border-emerald-400/30 flex items-center justify-center">
                  <Users className="h-10 w-10 text-emerald-400" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-4">Testing Company</h2>
                <p className="text-white/80 mb-6">
                  I provide backflow testing services and want to grow my business
                </p>

                <div className="space-y-3 text-left mb-8">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0" />
                    <span className="text-white/80">Create company profile</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0" />
                    <span className="text-white/80">Manage team & permissions</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0" />
                    <span className="text-white/80">Mobile app for field techs</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0" />
                    <span className="text-white/80">Streamlined workflows</span>
                  </div>
                </div>

                <Link href="/team-portal/register-company">
                  <Button
                    className={`w-full glass border border-emerald-400 hover:bg-emerald-400/10 text-white font-semibold rounded-xl ${
                      selectedPath === 'company' ? 'ring-2 ring-emerald-400/50' : ''
                    }`}
                  >
                    Register Your Company
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Existing Users */}
          <div className="mt-12 text-center">
            <p className="text-white/60 mb-4">Already have an account?</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/login">
                <Button className="glass hover:glass text-white/80 border border-blue-400/50">
                  Customer Login
                </Button>
              </Link>
              <Link href="/team-portal/login">
                <Button className="glass hover:glass text-white/80 border border-emerald-400/50">
                  Company Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}