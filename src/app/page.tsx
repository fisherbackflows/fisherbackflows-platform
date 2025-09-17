'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Clock,
  Users,
  ArrowRight,
  MapPin,
  CheckCircle,
  Phone,
  Mail
} from 'lucide-react';

export default function HomePage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-black text-white">

      {/* Minimal Header */}
      <header className="sticky top-0 z-50 glass border-b border-blue-400/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
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
                <p className="text-xs text-white/60">Compliance Marketplace</p>
              </div>
            </Link>

            <nav className="hidden sm:flex items-center space-x-6" role="navigation" aria-label="Main navigation">
              <Link
                href="/portal"
                className="text-white/80 hover:text-white transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black rounded"
                aria-label="Find certified testers"
              >
                Find Testers
              </Link>
              <Link
                href="/team-portal"
                className="text-white/80 hover:text-white transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black rounded"
                aria-label="For testing companies"
              >
                For Testers
              </Link>
              <Link
                href="/portal/login"
                className="px-5 py-2 rounded-full border border-white/30 text-white font-medium hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black"
                aria-label="Login to your account"
              >
                Login
              </Link>
            </nav>

            {/* Mobile Navigation Button */}
            <Link
              href="/portal"
              className="sm:hidden px-4 py-2 rounded-full glass-btn-primary text-white text-sm font-semibold transition-all duration-200"
              aria-label="Find testers near you"
            >
              Find Testers
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Simplified */}
      <section className="relative pt-20 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full glass border border-emerald-400/50 text-sm" role="status" aria-label="Trust indicator">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" aria-hidden="true"></div>
              <span className="text-white/90">Trusted by 500+ Companies Nationwide</span>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-white">Never Miss a</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              Backflow Test Again
            </span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-white/80 mb-4 max-w-3xl mx-auto leading-relaxed">
            Required annual backflow testing made simple. Find certified testers near you or manage your testing business - all in one platform.
          </p>

          <div className="text-center mb-8 sm:mb-12">
            <p className="text-sm text-white/60 mb-2">What is backflow testing?</p>
            <p className="text-base text-white/70 max-w-2xl mx-auto">
              Annual safety tests required by law to prevent contamination of drinking water. We make compliance automatic.
            </p>
          </div>

          <div className="space-y-6">
            {/* Primary CTA for Property Owners */}
            <div className="text-center">
              <Link href="/portal">
                <Button
                  size="lg"
                  className="glass-btn-primary hover:glow-blue text-white px-12 py-6 text-xl font-bold rounded-2xl group focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black shadow-2xl"
                  aria-label="Find certified backflow testers in your area"
                >
                  Find Testers Near Me
                  <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </Button>
              </Link>
              <p className="text-sm text-white/60 mt-3">Property owners & managers - Get compliant in minutes</p>
            </div>

            {/* Secondary CTA for Testing Companies */}
            <div className="text-center">
              <p className="text-white/80 mb-3">Are you a testing company?</p>
              <Link href="/team-portal">
                <Button
                  size="default"
                  className="glass border border-emerald-400/50 hover:border-emerald-400 text-white px-6 py-3 text-base font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-black"
                  aria-label="Access testing company portal to grow your business"
                >
                  Grow Your Business
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Value Props - Simplified */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-12">
            Everything You Need for Backflow Compliance
          </h2>

          <div className="grid sm:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl glass border border-blue-400/30 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Find Local Testers</h3>
              <p className="text-white/70">
                Browse verified testing companies in your area
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl glass border border-emerald-400/30 flex items-center justify-center">
                <Clock className="h-8 w-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Never Miss a Test</h3>
              <p className="text-white/70">
                Automatic scheduling and yearly reminders
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Simplified */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-12">
            How It Works
          </h2>

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
              <div className="w-12 h-12 mb-4 sm:mb-0 sm:mr-6 flex-shrink-0 rounded-full glass border border-blue-400/30 flex items-center justify-center">
                <span className="text-xl font-bold text-blue-400">1</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Find Certified Testers</h3>
                <p className="text-white/70">Search by location to find verified testing companies near you.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
              <div className="w-12 h-12 mb-4 sm:mb-0 sm:mr-6 flex-shrink-0 rounded-full glass border border-emerald-400/30 flex items-center justify-center">
                <span className="text-xl font-bold text-emerald-400">2</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Schedule Your Test</h3>
                <p className="text-white/70">Book directly with testing companies and get automatic yearly reminders.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
              <div className="w-12 h-12 mb-4 sm:mb-0 sm:mr-6 flex-shrink-0 rounded-full glass border border-purple-400/30 flex items-center justify-center">
                <span className="text-xl font-bold text-purple-400">3</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Stay Compliant</h3>
                <p className="text-white/70">Track all your devices and never miss a required test again.</p>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <Link href="/portal">
              <Button size="lg" className="glass-btn-primary hover:glow-blue text-white px-8 py-4 text-lg font-semibold rounded-2xl">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Simple CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Simplify Compliance?
          </h2>
          <p className="text-xl text-white/70 mb-10">
            Join the leading backflow compliance marketplace
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="glass-btn-primary hover:glow-blue text-white px-8 py-4 text-lg font-semibold rounded-2xl">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center justify-center space-x-6 text-white/60">
              <a href="tel:2532788692" className="flex items-center hover:text-white transition-colors">
                <Phone className="h-5 w-5 mr-2" />
                (253) 278-8692
              </a>
              <a href="mailto:service@fisherbackflows.com" className="flex items-center hover:text-white transition-colors">
                <Mail className="h-5 w-5 mr-2" />
                Contact
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="glass border-t border-blue-400/20 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <Image
                src="/fisher-backflows-logo.png"
                alt="Fisher Backflows Platform"
                width={32}
                height={32}
                className="brightness-110 contrast-105 rounded-lg"
              />
              <div>
                <p className="text-white/80 text-sm">© {currentYear} Fisher Backflows Platform</p>
                <p className="text-white/60 text-xs">Powered by Fisher Backflows LLC</p>
              </div>
            </div>

            <div className="flex space-x-6 text-sm">
              <Link href="/portal" className="text-white/60 hover:text-white transition-colors">
                Property Portal
              </Link>
              <Link href="/team-portal" className="text-white/60 hover:text-white transition-colors">
                Company Portal
              </Link>
              <Link href="/signup" className="text-white/60 hover:text-white transition-colors">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}