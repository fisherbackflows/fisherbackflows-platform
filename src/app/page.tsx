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
    { icon: <MapPin className="h-6 w-6" />, text: "Serving all of Pierce County", color: "text-cyan-400" }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Clean minimal background */}
      <div className="absolute inset-0 glass pointer-events-none"></div>
      
      {/* Unified Header */}
      <header className="sticky top-0 z-50 glass border-b border-blue-400 glow-blue-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo and Company Title */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="relative">
                <Image
                  src="/fisher-backflows-logo.png"
                  alt="Fisher Backflows LLC"
                  width={40}
                  height={32}
                  priority
                  className="drop-glow-blue-sm"
                />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500/20 border border-emerald-400 glow-blue-sm0 rounded-full"></div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Fisher Backflows</h1>
                <p className="text-xs text-white/60">Professional Services</p>
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
              <Link href="/portal" className="px-4 py-2 rounded-2xl glass-btn-primary hover:glow-blue text-white transition-all duration-200 font-semibold">
                <User className="inline h-4 w-4 mr-1" />
                Customer Portal
              </Link>
              <Link href="/team-portal" className="px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-400 glow-blue-sm hover:bg-emerald-500/30 text-white transition-all duration-200 font-semibold">
                Team Portal
              </Link>
              <Link href="/business-admin" className="px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-400 glow-blue-sm hover:bg-amber-500/30 text-white transition-all duration-200 font-semibold">
                Admin Portal
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
                  Customer Portal
                </Link>
                <Link 
                  href="/team-portal" 
                  className="block px-4 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-400 glow-blue-sm text-white text-center font-semibold transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Team Portal
                </Link>
                <Link 
                  href="/business-admin" 
                  className="block px-4 py-3 rounded-2xl bg-amber-500/20 border border-amber-400 glow-blue-sm text-white text-center font-semibold transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin Portal
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
          {/* Trust Badge */}
          <div className="inline-block mb-12">
            <div className="bg-emerald-500/20 border border-emerald-400 glow-blue-sm border border-emerald-200 px-6 py-3 rounded-full text-emerald-700 text-sm font-semibold flex items-center space-x-2 glow-blue-sm">
              <div className="w-2 h-2 bg-emerald-500/20 border border-emerald-400 glow-blue-sm0 rounded-full"></div>
              <Award className="h-4 w-4" />
              <span>BAT Certified • Licensed & Insured • Pierce County</span>
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-8 leading-tight text-white">
            Professional Backflow<br className="hidden sm:block" />
            <span className="block sm:inline">
              <span className="bg-gradient-to-r from-blue-600/80 via-blue-700 to-emerald-600 bg-clip-text text-transparent">Testing & Certification</span>
            </span>
          </h1>
          
          <div className="text-lg sm:text-xl md:text-2xl text-white/90 mb-12 max-w-4xl mx-auto leading-relaxed px-4">
            <p className="text-center mb-6">
              Protecting Pierce County's water supply with expert backflow prevention services.
            </p>
            <p className="text-center">
              <strong className="text-white/90">Fast scheduling, same-week service, and full compliance guaranteed.</strong>
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20 px-4">
            <Button 
              size="lg" 
              className="w-full sm:w-auto glass-btn-primary hover:glow-blue text-white px-8 py-4 text-lg font-semibold rounded-xl group transition-all duration-200 glow-blue hover:glow-blue-lg"
              onClick={() => window.location.href = '/portal'}
            >
              Schedule Testing Now
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Button>
            <Button 
              size="lg" 
              className="w-full sm:w-auto glass border-2 border-blue-400 text-white/80 hover:bg-black/40 backdrop-blur-xl hover:border-blue-500/40 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200 glow-blue-sm"
              onClick={() => window.location.href = 'tel:2532788692'}
            >
              <Phone className="mr-2 h-5 w-5" />
              (253) 278-8692
            </Button>
          </div>
          
          {/* Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto px-4">
            <div className="glass border border-blue-400 rounded-2xl p-8 glow-blue-sm hover:glow-blue transition-all duration-200">
              <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-400 glow-blue-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-emerald-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Licensed & Insured</h3>
              <p className="text-white/90 leading-relaxed">Fully certified contractor with comprehensive insurance for your complete protection and peace of mind.</p>
            </div>
            <div className="glass border border-blue-400 rounded-2xl p-8 glow-blue-sm hover:glow-blue transition-all duration-200">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 border border-blue-400 glow-blue-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Clock className="h-8 w-8 text-blue-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Same Week Service</h3>
              <p className="text-white/90 leading-relaxed">Fast scheduling with same-week appointments available to meet your testing deadlines and requirements.</p>
            </div>
            <div className="glass border border-blue-400 rounded-2xl p-8 glow-blue-sm hover:glow-blue transition-all duration-200">
              <div className="w-16 h-16 bg-amber-500/20 border border-amber-400 glow-blue-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Award className="h-8 w-8 text-amber-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">BAT Certified</h3>
              <p className="text-white/90 leading-relaxed">Certified Backflow Assembly Tester with years of experience and up-to-date certifications.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Portal Section */}
      <section className="py-20 px-6 bg-black/40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Customer Portal
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Manage your backflow testing services online with our secure customer portal. 
              Schedule appointments, pay bills, and access your compliance records anytime.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="glass border border-blue-400 rounded-xl p-8 text-center glow-blue-sm hover:glow-blue transition-all duration-200">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 border border-blue-400 glow-blue-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-8 w-8 text-blue-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Easy Scheduling</h3>
              <p className="text-white/90 leading-relaxed">Book appointments online 24/7 with real-time availability and instant confirmation.</p>
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
              <h3 className="text-xl font-bold text-white mb-4">Digital Records</h3>
              <p className="text-white/90 leading-relaxed">Access all your test reports, compliance certificates, and service history instantly.</p>
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
                Customer Login
              </Button>
              <Button 
                size="lg" 
                className="glass border-2 border-blue-400 text-white/80 hover:bg-black/40 backdrop-blur-xl hover:border-blue-500/40 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200 glow-blue-sm"
                onClick={() => window.location.href = '/team-portal'}
              >
                Business Portal
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6 text-white">Our Services</h2>
            <p className="text-xl text-white/80">Professional backflow testing and certification services</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="glass backdrop-blur-sm border border-blue-500/40/30 rounded-2xl p-10 hover:scale-105 transition-all duration-300 glow-blue-lg">
                <div className="text-center mb-8">
                  {service.icon}
                  <h3 className="text-2xl font-bold mb-4 text-white">{service.title}</h3>
                  <p className="text-white/90 text-lg leading-relaxed">{service.description}</p>
                </div>
                <ul className="space-y-3">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-white/90">
                      <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6 text-white">Why Choose Fisher Backflows?</h2>
            <p className="text-white/90 text-xl">Professional service you can trust</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="glass backdrop-blur-sm border border-blue-500/40/20 rounded-xl p-6 hover:scale-105 transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-2xl bg-black/40 backdrop-blur-xl/50 ${feature.color}`}>
                    {feature.icon}
                  </div>
                  <p className="text-white/90 font-medium">{feature.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-6 mb-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6 text-white">Get Started Today</h2>
            <p className="text-xl text-white/80">Choose the most convenient way to reach us</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="glass backdrop-blur-sm border border-blue-400/20 rounded-2xl p-8 text-center hover:scale-105 transition-all duration-300">
              <div className="inline-block p-6 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 rounded-2xl mb-6">
                <Phone className="h-12 w-12 text-blue-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-white">Call or Text</h3>
              <a href="tel:2532788692" className="text-blue-400 hover:text-blue-300 text-2xl font-bold transition-colors block">
                (253) 278-8692
              </a>
            </div>

            <div className="glass backdrop-blur-sm border border-emerald-400/20 rounded-2xl p-8 text-center hover:scale-105 transition-all duration-300">
              <div className="inline-block p-6 bg-emerald-600/20 rounded-2xl mb-6">
                <Mail className="h-12 w-12 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-white">Email</h3>
              <a href="mailto:service@fisherbackflows.com" className="text-emerald-400 hover:text-emerald-300 text-lg font-semibold transition-colors block">
                service@fisherbackflows.com
              </a>
            </div>

            <div className="glass backdrop-blur-sm border border-amber-400/20 rounded-2xl p-8 text-center hover:scale-105 transition-all duration-300">
              <div className="inline-block p-6 bg-amber-600/20 rounded-2xl mb-6">
                <Calendar className="h-12 w-12 text-amber-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-white">Book Online</h3>
              <Button 
                className="glass hover:from-amber-700 hover:to-amber-600 text-white px-8 py-3 rounded-xl transition-all duration-300"
                onClick={() => window.location.href = '/portal'}
              >
                Schedule Now
              </Button>
            </div>
          </div>

          <div className="glass backdrop-blur-sm border border-blue-500/40/20 rounded-2xl p-8 max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center mb-6">
              <Clock className="h-8 w-8 text-white/90 mr-3" />
              <h3 className="text-2xl font-bold text-white">Business Hours</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-white/90 text-lg">
              <div>
                <strong className="text-white">Monday–Friday</strong><br />
                7:00 AM – 6:00 PM
              </div>
              <div>
                <strong className="text-white">Saturday</strong><br />
                8:00 AM – 4:00 PM
              </div>
              <div>
                <strong className="text-white">Sunday</strong><br />
                Emergency service only
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
                  alt="Fisher Backflows LLC"
                  width={200}
                  height={160}
                  className="brightness-110 contrast-105"
                />
              </div>
              <p className="text-white/90 text-lg mb-6 leading-relaxed">
                Professional backflow testing and prevention services for Pierce County. 
                Protecting your water quality with certified expertise.
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
                <a href="/portal" className="block text-white/90 hover:text-white text-lg transition-colors">Customer Portal</a>
                <a href="/portal/schedule" className="block text-white/90 hover:text-white text-lg transition-colors">Schedule Service</a>
                <a href="/portal/pay" className="block text-white/90 hover:text-white text-lg transition-colors">Pay Bill</a>
                <a href="/team-portal" className="block text-white/90 hover:text-white text-lg transition-colors">Team Portal</a>
              </div>
            </div>
            
            <div className="text-center">
              <h4 className="text-xl font-bold mb-6 text-white">Contact Info</h4>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="inline-flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-blue-400" />
                    <span className="text-white/90 text-lg">(253) 278-8692</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-emerald-400" />
                    <span className="text-white/90 text-lg">service@fisherbackflows.com</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-amber-400" />
                    <span className="text-white/90 text-lg">Pierce County, WA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-blue-500/40/50 pt-8 text-center">
            <p className="text-white/80 text-lg mb-2">
              © {currentYear} Fisher Backflows LLC. All rights reserved. Licensed & Insured.
            </p>
            <p className="text-white/90 text-sm">
              BAT Certified | Washington State Contractor License
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}