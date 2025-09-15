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
        <div className="max-w-7xl mx-auto px-6 py-4">
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

            <nav className="flex items-center space-x-6" role="navigation" aria-label="Main navigation">
              <Link
                href="/portal"
                className="text-white/80 hover:text-white transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black rounded"
                aria-label="Access property owner portal"
              >
                Property Owners
              </Link>
              <Link
                href="/team-portal"
                className="text-white/80 hover:text-white transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black rounded"
                aria-label="Access testing company portal"
              >
                Testing Companies
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2 rounded-full glass-btn-primary text-white font-semibold transition-all duration-200 hover:glow-blue focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black"
                aria-label="Sign up for a new account"
              >
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section - Simplified */}
      <section className="relative pt-32 pb-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full glass border border-emerald-400/50 text-sm" role="status" aria-label="Trust indicator">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" aria-hidden="true"></div>
              <span className="text-white/90">Trusted by 500+ Companies Nationwide</span>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-white">Backflow Compliance</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              Made Simple
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
            The marketplace connecting property owners with certified testing companies.
            Track compliance, auto-schedule yearly tests, and manage everything in one platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/portal">
              <Button
                size="lg"
                className="glass-btn-primary hover:glow-blue text-white px-8 py-6 text-lg font-semibold rounded-2xl group focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black"
                aria-label="Access property owner portal to manage your backflow compliance"
              >
                I Own Property
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="/team-portal">
              <Button
                size="lg"
                className="glass border border-blue-400/50 hover:border-blue-400 text-white px-8 py-6 text-lg font-semibold rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black"
                aria-label="Access testing company portal to manage your business"
              >
                I Test Backflows
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Core Value Props - Minimal Grid */}
      <section className="py-24 px-6" aria-labelledby="features-heading">
        <div className="max-w-6xl mx-auto">
          <h2 id="features-heading" className="sr-only">Platform Features</h2>
          <div className="grid md:grid-cols-3 gap-8">

            <article className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl glass border border-blue-400/30 flex items-center justify-center" aria-hidden="true">
                <MapPin className="h-8 w-8 text-blue-400" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Find Certified Testers</h3>
              <p className="text-white/70 leading-relaxed">
                Search by location or browse our marketplace of verified testing companies - from solo testers to large HVAC firms.
              </p>
            </article>

            <article className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl glass border border-emerald-400/30 flex items-center justify-center" aria-hidden="true">
                <Clock className="h-8 w-8 text-emerald-400" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Automatic Scheduling</h3>
              <p className="text-white/70 leading-relaxed">
                Never miss yearly compliance deadlines. Auto-schedule tests, get reminders, and track all devices in one dashboard.
              </p>
            </article>

            <article className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl glass border border-purple-400/30 flex items-center justify-center" aria-hidden="true">
                <Users className="h-8 w-8 text-purple-400" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Business Management</h3>
              <p className="text-white/70 leading-relaxed">
                Testing companies get admin controls, mobile apps for techs, auto-routing, and 70% faster workflows.
              </p>
            </article>

          </div>
        </div>
      </section>

      {/* How It Works - Two Paths */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent"></div>
        <div className="max-w-6xl mx-auto relative">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-16">
            Two Sides, One Platform
          </h2>

          <div className="grid md:grid-cols-2 gap-12">

            {/* Property Owners */}
            <div className="glass border border-blue-400/30 rounded-3xl p-8">
              <div className="flex items-center mb-6">
                <Shield className="h-8 w-8 text-blue-400 mr-3" />
                <h3 className="text-2xl font-bold text-white">Property Owners</h3>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-white/80">Create one account to manage all backflow devices</p>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-white/80">Search and compare certified testing companies</p>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-white/80">Auto-schedule yearly required tests</p>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-white/80">Track compliance history and get reminders</p>
                </div>
              </div>

              <Link href="/portal">
                <Button className="w-full glass-btn-primary hover:glow-blue text-white font-semibold rounded-xl">
                  Access Property Portal
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Testing Companies */}
            <div className="glass border border-emerald-400/30 rounded-3xl p-8">
              <div className="flex items-center mb-6">
                <Users className="h-8 w-8 text-emerald-400 mr-3" />
                <h3 className="text-2xl font-bold text-white">Testing Companies</h3>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-white/80">Create company profile with admin controls</p>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-white/80">Add unlimited testers with custom permissions</p>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-white/80">Mobile app with optimized routing for field techs</p>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-white/80">Auto-populate forms and streamline workflows</p>
                </div>
              </div>

              <Link href="/signup">
                <Button className="w-full glass border border-emerald-400 hover:bg-emerald-400/10 text-white font-semibold rounded-xl">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Simple CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
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