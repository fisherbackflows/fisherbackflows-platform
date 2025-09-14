'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  Mail, 
  Calendar,
  CheckCircle,
  Shield,
  Clock,
  User,
  CreditCard,
  FileText,
  ArrowRight,
  Gauge,
  Star,
  Award,
  MapPin,
  Zap,
  Menu,
  X
} from 'lucide-react';

export default function HomePage() {
  const [currentYear, setCurrentYear] = useState(2024);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentYear(new Date().getFullYear());
  }, []);

  // Close mobile menu on escape key or outside click
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (mobileMenuOpen && !target.closest('header')) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('click', handleClickOutside);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-white/80">Loading...</p>
        </div>
      </div>
    );
  }

  const services = [
    {
      icon: <CheckCircle className="h-12 w-12 text-emerald-400 mb-4" />,
      title: "Annual Testing",
      description: "State-required annual backflow preventer testing with certified documentation.",
      features: ["BAT Certified Testing", "Same-Day Results", "District Submission", "Digital Reports"]
    },
    {
      icon: <Shield className="h-12 w-12 text-blue-400 mb-4" />,
      title: "Device Installation", 
      description: "Professional installation of backflow prevention assemblies for new construction.",
      features: ["Licensed Installation", "Code Compliance", "Warranty Included", "Permit Assistance"]
    },
    {
      icon: <Gauge className="h-12 w-12 text-amber-400 mb-4" />,
      title: "Repairs & Maintenance",
      description: "Expert repair services for all backflow preventer types and manufacturers.",
      features: ["Emergency Repairs", "Part Replacement", "Maintenance Plans", "24/7 Support"]
    }
  ];

  const features = [
    { icon: <Clock className="h-6 w-6" />, text: "Same-week appointments available", color: "text-emerald-400" },
    { icon: <Award className="h-6 w-6" />, text: "BAT Certified technicians", color: "text-blue-400" },
    { icon: <FileText className="h-6 w-6" />, text: "Digital test reports provided", color: "text-amber-400" },
    { icon: <Shield className="h-6 w-6" />, text: "We file with your water district", color: "text-purple-400" },
    { icon: <Zap className="h-6 w-6" />, text: "Annual reminder service", color: "text-pink-400" },
    { icon: <MapPin className="h-6 w-6" />, text: "Serving all of Pierce County", color: "text-blue-400" }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      
      {/* Unified Header */}
      <header className="sticky top-0 z-50 glass border-b border-blue-400 glow-blue-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo and Platform Title */}
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/fisher-backflows-logo.png"
                alt="Fisher Backflows Platform"
                width={40}
                height={40}
                className="brightness-110 contrast-105 rounded-lg"
              />
              <div>
                <h1 className="text-lg font-bold text-white">Fisher Backflows Platform</h1>
                <p className="text-xs text-white/60">SaaS Compliance Marketplace</p>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <a href="#services" className="px-4 py-2 rounded-2xl text-white/80 hover:text-white hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl transition-all duration-200 font-medium">
                Services
              </a>
              <a href="#about" className="px-4 py-2 rounded-2xl text-white/80 hover:text-white hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl transition-all duration-200 font-medium">
                About
              </a>
              <a href="#contact" className="px-4 py-2 rounded-2xl text-white/80 hover:text-white hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl transition-all duration-200 font-medium">
                Contact
              </a>
              <div className="w-px h-8 bg-white/20 mx-3"></div>
              <Link href="/signup" className="px-4 py-2 rounded-2xl glass-btn-primary glow-blue hover:glow-blue-lg text-white transition-all duration-200 font-semibold">
                Start Free Trial
              </Link>
              <Link href="/team-portal" className="px-4 py-2 rounded-2xl glass-btn-primary hover:glow-blue text-white transition-all duration-200 font-semibold">
                <User className="inline h-4 w-4 mr-1" />
                Sign In
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-2xl glass hover:glow-blue-sm transition-all duration-200"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-white" />
              ) : (
                <Menu className="h-6 w-6 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden glass border-t border-blue-400/50">
            <div className="px-4 py-4 space-y-2">
              <a 
                href="#services" 
                className="block px-4 py-3 rounded-2xl text-white/80 hover:text-white hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl transition-all duration-200 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Services
              </a>
              <a 
                href="#about" 
                className="block px-4 py-3 rounded-2xl text-white/80 hover:text-white hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl transition-all duration-200 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </a>
              <a 
                href="#contact" 
                className="block px-4 py-3 rounded-2xl text-white/80 hover:text-white hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl transition-all duration-200 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </a>
              
              <div className="border-t border-blue-400/30 pt-3 mt-3 space-y-2">
                <Link 
                  href="/portal" 
                  className="block px-4 py-3 rounded-2xl glass-btn-primary text-white text-center font-semibold transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="inline h-4 w-4 mr-2" />
                  Property Owner Portal
                </Link>
                <Link 
                  href="/team-portal" 
                  className="block px-4 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-400 glow-blue-sm text-white text-center font-semibold transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Testing Company Portal
                </Link>
                
                <div className="border-t border-blue-400/30 pt-3 mt-3">
                  <Button 
                    size="sm" 
                    className="w-full glass-btn-primary text-white font-semibold rounded-xl transition-all duration-200"
                    onClick={() => {
                      window.location.href = 'tel:2532788692';
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Call: (253) 278-8692
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          {/* Title area */}
          <div className="relative mb-12">
            {/* Trust Badge */}
            <div className="relative inline-block mb-12">
              <div className="bg-emerald-500/20 border border-emerald-400 px-6 py-3 rounded-full text-white text-sm font-semibold flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <Shield className="h-4 w-4 text-emerald-300" />
                <span>SaaS Platform • 500+ Testing Companies • 10,000+ Properties Managed</span>
              </div>
            </div>
            
            <div className="relative inline-block mb-8">
              <h1 className="relative text-4xl sm:text-5xl md:text-7xl font-bold leading-tight text-white">
                <span className="relative inline-block">
                  <div className="absolute inset-0 -inset-x-4 -inset-y-3 bg-gradient-to-r from-blue-600/10 to-purple-600/10 backdrop-blur-md border-2 border-blue-400/50 rounded-[2.5rem] shadow-[0_0_50px_rgba(59,130,246,0.4),inset_0_0_30px_rgba(59,130,246,0.1)]"></div>
                  <span className="relative px-4 py-3 inline-block">
                    The Backflow Compliance
                    <br className="hidden sm:block" />
                    Marketplace Platform
                  </span>
                </span>
              </h1>
            </div>
          </div>
          <div className="text-lg sm:text-xl md:text-2xl text-white/90 mb-12 max-w-4xl mx-auto leading-relaxed px-4">
            <div className="text-center mb-6 space-y-4">
              <p className="text-white/90 leading-relaxed">
                <strong className="text-blue-300">For Property Owners:</strong> Create your all-in-one compliance portal. Track all backflow devices, automatically schedule yearly testing, search certified testers by location or name, and never miss a deadline.
              </p>
              <p className="text-white/90 leading-relaxed">
                <strong className="text-emerald-300">For Testing Companies:</strong> From solo testers to large HVAC firms - streamline your entire workflow with admin controls, tester profiles, auto-populated forms, smart routing, and mobile apps for field techs.
              </p>
            </div>
            <p className="text-center">
              <strong className="text-white/90">Powered by Fisher Backflows Platform - The industry's leading SaaS solution</strong>
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20 px-4">
            <Button
              size="lg"
              className="w-full sm:w-auto glass-btn-primary hover:glow-blue text-white px-8 py-4 text-lg font-semibold rounded-xl group transition-all duration-200 glow-blue hover:glow-blue-lg"
              onClick={() => window.location.href = '/portal'}
            >
              Property Owner Portal
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Button>
            <Button
              size="lg"
              className="w-full sm:w-auto glass border-2 border-emerald-400 text-white/80 hover:bg-black/40 backdrop-blur-xl hover:border-emerald-500/40 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200 glow-blue-sm"
              onClick={() => window.location.href = '/signup'}
            >
              <User className="mr-2 h-5 w-5" />
              Testing Company Trial
            </Button>
          </div>
          
          {/* Platform Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto px-4">
            <div className="glass border border-blue-400 rounded-2xl p-8 glow-blue-sm hover:glow-blue transition-all duration-200">
              <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-400 glow-blue-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-emerald-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Marketplace of Testers</h3>
              <p className="text-white/90 leading-relaxed">Browse certified testers from solo operators to large HVAC companies. Search by location, name, or view all. Every tester verified for licenses and BAT certification.</p>
            </div>
            <div className="glass border border-blue-400 rounded-2xl p-8 glow-blue-sm hover:glow-blue transition-all duration-200">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 border border-blue-400 glow-blue-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Clock className="h-8 w-8 text-blue-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Yearly Compliance Portal</h3>
              <p className="text-white/90 leading-relaxed">Track all devices in one dashboard. Auto-schedule yearly tests required by code. Get reminders, digital reports, and automatic district submissions.</p>
            </div>
            <div className="glass border border-blue-400 rounded-2xl p-8 glow-blue-sm hover:glow-blue transition-all duration-200">
              <div className="w-16 h-16 bg-amber-500/20 border border-amber-400 glow-blue-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Award className="h-8 w-8 text-amber-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">End-to-End Workflow</h3>
              <p className="text-white/90 leading-relaxed">Testing companies get auto-populated forms, optimized routes, mobile tech apps, and complete business management from scheduling to billing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Portal Section */}
      <section className="py-20 px-6 bg-black/40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Your Complete Compliance Portal
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Property owners create one account to manage all backflow devices. Track compliance history, auto-schedule yearly required testing, and choose from our marketplace of verified testing companies - from independent testers to full-service plumbing and HVAC firms.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="glass border border-blue-400 rounded-xl p-8 text-center glow-blue-sm hover:glow-blue transition-all duration-200">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 border border-blue-400 glow-blue-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-8 w-8 text-blue-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Search & Compare Testers</h3>
              <p className="text-white/90 leading-relaxed">Search by location radius, company name, or browse all. Compare solo testers, plumbing companies, and HVAC firms with transparent pricing and availability.</p>
            </div>
            
            <div className="glass border border-blue-400 rounded-xl p-8 text-center glow-blue-sm hover:glow-blue transition-all duration-200">
              <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-400 glow-blue-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CreditCard className="h-8 w-8 text-emerald-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Secure Payments</h3>
              <p className="text-white/90 leading-relaxed">Pay your bills online with multiple payment options and automated billing features.</p>
            </div>
            
            <div className="glass border border-blue-400 rounded-xl p-8 text-center glow-blue-sm hover:glow-blue transition-all duration-200">
              <div className="w-16 h-16 bg-amber-500/20 border border-amber-400 glow-blue-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="h-8 w-8 text-amber-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Automatic Yearly Scheduling</h3>
              <p className="text-white/90 leading-relaxed">Set it and forget it. Auto-schedule next year's required test, get reminders 30 days before due, track all devices, and maintain complete compliance history.</p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="glass-btn-primary hover:glow-blue text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200 glow-blue hover:glow-blue-lg"
                onClick={() => window.location.href = '/portal'}
              >
                <User className="mr-2 h-5 w-5" />
                Property Owner Portal
              </Button>
              <Button 
                size="lg" 
                className="glass border-2 border-blue-400 text-white/80 hover:bg-black/40 backdrop-blur-xl hover:border-blue-500/40 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200 glow-blue-sm"
                onClick={() => window.location.href = '/team-portal'}
              >
                Testing Company Portal
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace Section - New */}
      <section className="py-20 px-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              The Testing Company Marketplace
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Connect with the right testing company for your needs. Our platform hosts everyone from independent certified testers to full-service plumbing and HVAC companies offering backflow testing services.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="glass border border-purple-400 rounded-xl p-8 text-center glow-blue-sm hover:glow-blue transition-all duration-200">
              <div className="w-16 h-16 bg-purple-500/20 border border-purple-400 glow-blue-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <User className="h-8 w-8 text-purple-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Solo Testers</h3>
              <p className="text-white/90 leading-relaxed">Independent certified professionals who own their testing business. Often provide personalized service and competitive rates.</p>
            </div>

            <div className="glass border border-blue-400 rounded-xl p-8 text-center glow-blue-sm hover:glow-blue transition-all duration-200">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 border border-blue-400 glow-blue-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Gauge className="h-8 w-8 text-blue-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Plumbing Companies</h3>
              <p className="text-white/90 leading-relaxed">Full-service plumbing firms that include backflow testing. Can handle repairs, installations, and other plumbing needs.</p>
            </div>

            <div className="glass border border-emerald-400 rounded-xl p-8 text-center glow-blue-sm hover:glow-blue transition-all duration-200">
              <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-400 glow-blue-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8 text-emerald-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">HVAC Companies</h3>
              <p className="text-white/90 leading-relaxed">HVAC service providers offering backflow testing alongside heating and cooling services. Multiple techs for quick scheduling.</p>
            </div>
          </div>

          <div className="glass border border-blue-400/30 rounded-2xl p-8 mb-12">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">How Our Marketplace Works</h3>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 border border-blue-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-300 font-bold">1</span>
                </div>
                <p className="text-white/80 text-sm">Enter your address or search area</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 border border-blue-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-300 font-bold">2</span>
                </div>
                <p className="text-white/80 text-sm">Browse testers by distance, name, or type</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 border border-blue-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-300 font-bold">3</span>
                </div>
                <p className="text-white/80 text-sm">Compare prices, availability & reviews</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 border border-blue-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-300 font-bold">4</span>
                </div>
                <p className="text-white/80 text-sm">Book online & track everything in your portal</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testing Companies Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-emerald-900/20 to-blue-900/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Complete Business Management Platform
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Whether you're a solo tester or a large HVAC company - streamline everything. Create company profiles with admin controls, manage multiple tester accounts with custom permissions, auto-populate forms, and give field techs mobile access with optimized routing.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="glass border border-emerald-400 rounded-xl p-8 text-center glow-blue-sm hover:glow-blue transition-all duration-200">
              <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-400 glow-blue-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <User className="h-8 w-8 text-emerald-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Multi-User Company Profiles</h3>
              <p className="text-white/90 leading-relaxed">Create your company profile with admin controls. Add unlimited tester accounts with modular permissions. Perfect for solo testers to large teams.</p>
            </div>
            
            <div className="glass border border-blue-400 rounded-xl p-8 text-center glow-blue-sm hover:glow-blue transition-all duration-200">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 border border-blue-400 glow-blue-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-8 w-8 text-blue-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Mobile Tech App & Routing</h3>
              <p className="text-white/90 leading-relaxed">Field techs login to see their daily schedule with optimized routing. Auto-navigation to next job, digital forms, and real-time updates to office.</p>
            </div>
            
            <div className="glass border border-amber-400 rounded-xl p-8 text-center glow-blue-sm hover:glow-blue transition-all duration-200">
              <div className="w-16 h-16 bg-amber-500/20 border border-amber-400 glow-blue-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="h-8 w-8 text-amber-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Automated Workflow</h3>
              <p className="text-white/90 leading-relaxed">Auto-populate test forms from device history. Generate reports instantly. Submit to water districts automatically. Cut your entire process time by 70%.</p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="glass-btn-primary hover:glow-blue text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200 glow-blue hover:glow-blue-lg"
                onClick={() => window.location.href = '/signup'}
              >
                <ArrowRight className="mr-2 h-5 w-5" />
                Start Free Trial
              </Button>
              <Button 
                size="lg" 
                className="glass border-2 border-emerald-400 text-white/80 hover:bg-black/40 backdrop-blur-xl hover:border-emerald-500/40 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200 glow-blue-sm"
                onClick={() => window.location.href = '/team-portal'}
              >
                Company Login
                <User className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features Grid - Modern Bento Box Design */}
      <section id="services" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Comprehensive tools for testing companies and property owners
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <div 
                key={index} 
                className="group relative glass border border-blue-400/30 rounded-3xl p-8 hover:border-blue-400 transition-all duration-500 hover:glow-blue"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl group-hover:from-blue-500/20 transition-all duration-500" />
                
                <div className="relative">
                  <div className="mb-6">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{service.title}</h3>
                  <p className="text-white/60 mb-6 text-sm leading-relaxed">{service.description}</p>
                  
                  <div className="space-y-2">
                    {service.features.slice(0, 3).map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center text-white/70 text-sm">
                        <div className="w-1 h-1 bg-blue-400 rounded-full mr-3" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose - Minimal Grid */}
      <section className="py-20 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Why Teams Choose Our Platform</h2>
            <p className="text-white/60 text-lg">Trusted features that drive success</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="glass border border-blue-400/20 rounded-2xl p-5 hover:border-blue-400/50 hover:glow-blue-sm transition-all duration-300">
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-xl glass ${feature.color}`}>
                    {feature.icon}
                  </div>
                  <p className="text-white/80 text-sm font-medium">{feature.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section - Modern CTA */}
      <section id="contact" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="glass border border-blue-400/30 rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full blur-3xl" />
            
            <div className="relative text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Join the Fisher Backflows Platform
              </h2>
              <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10">
                The industry's leading SaaS marketplace connecting property owners with testing companies
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  size="lg" 
                  className="glass-btn-primary hover:glow-blue text-white px-8 py-4 text-lg font-semibold rounded-2xl transition-all duration-200 glow-blue"
                  onClick={() => window.location.href = '/signup'}
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  className="glass border-2 border-white/20 text-white hover:border-blue-400 hover:glow-blue-sm px-8 py-4 text-lg font-semibold rounded-2xl transition-all duration-200"
                  onClick={() => window.location.href = '/portal'}
                >
                  Browse Companies
                </Button>
              </div>
              
              <div className="mt-10 pt-10 border-t border-white/10">
                <p className="text-white/60 mb-4">Questions? Contact our team</p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <a href="tel:2532788692" className="flex items-center text-blue-300 hover:text-blue-400 transition-colors">
                    <Phone className="h-5 w-5 mr-2" />
                    (253) 278-8692
                  </a>
                  <a href="mailto:service@fisherbackflows.com" className="flex items-center text-emerald-300 hover:text-emerald-400 transition-colors">
                    <Mail className="h-5 w-5 mr-2" />
                    service@fisherbackflows.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="glass backdrop-blur-xl border-t border-blue-500/40/50 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="mb-6">
                <Image
                  src="/fisher-backflows-logo.png"
                  alt="Fisher Backflows Platform"
                  width={200}
                  height={160}
                  className="brightness-110 contrast-105"
                />
              </div>
              <p className="text-white/90 text-lg mb-6 leading-relaxed">
                Fisher Backflows Platform - The complete SaaS marketplace for backflow compliance.
                Connecting property owners with certified testing companies nationwide.
              </p>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2 text-white/90">
                  <Star className="h-5 w-5 text-amber-400" />
                  <span>5-Star Service</span>
                </div>
                <div className="flex items-center space-x-2 text-white/90">
                  <Shield className="h-5 w-5 text-emerald-400" />
                  <span>Licensed & Insured</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-xl font-bold mb-6 text-white">Quick Links</h4>
              <div className="space-y-3">
                <Link href="/portal" className="block text-white/90 hover:text-white text-lg transition-colors">Customer Portal</Link>
                <Link href="/portal/schedule" className="block text-white/90 hover:text-white text-lg transition-colors">Schedule Service</Link>
                <Link href="/portal/pay" className="block text-white/90 hover:text-white text-lg transition-colors">Pay Bill</Link>
                <Link href="/team-portal" className="block text-white/90 hover:text-white text-lg transition-colors">Testing Company Portal</Link>
              </div>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <h4 className="text-xl font-bold mb-6 text-white">Contact Info</h4>
              <div className="space-y-4 flex flex-col items-center">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-blue-400" />
                  <span className="text-white/90 text-lg">(253) 278-8692</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-emerald-400" />
                  <span className="text-white/90 text-lg">service@fisherbackflows.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-amber-400" />
                  <span className="text-white/90 text-lg">Pierce County, WA</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-blue-500/40/50 pt-8 text-center">
            <p className="text-white/80 text-lg mb-2">
              © {currentYear} Fisher Backflows Platform. All rights reserved.
            </p>
            <p className="text-white/90 text-sm">
              SaaS Marketplace Platform | Powered by Fisher Backflows LLC
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}