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
  Zap
} from 'lucide-react';

export default function HomePage() {
  const [currentYear, setCurrentYear] = useState(2024);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentYear(new Date().getFullYear());
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-slate-700">Loading...</p>
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
    <div className="min-h-screen bg-white text-slate-900">
      {/* Clean minimal background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/30 to-white pointer-events-none"></div>
      
      {/* Elegant Header */}
      <header className="relative z-50 bg-white border-b border-slate-200 sticky top-0 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Image
                  src="/fisher-backflows-logo.png"
                  alt="Fisher Backflows LLC"
                  width={180}
                  height={144}
                  priority
                  className="drop-shadow-sm"
                />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full"></div>
              </div>
            </div>
            
            <nav className="hidden md:flex space-x-1">
              <a href="#services" className="px-5 py-2.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200 font-medium">
                Services
              </a>
              <a href="#about" className="px-5 py-2.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200 font-medium">
                About
              </a>
              <a href="#contact" className="px-5 py-2.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200 font-medium">
                Contact
              </a>
              <div className="w-px h-8 bg-slate-300 mx-2"></div>
              <Link href="/portal" className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 font-semibold shadow-sm">
                Customer Portal
              </Link>
              <Link href="/team-portal" className="px-6 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white transition-all duration-200 font-semibold shadow-sm">
                Team Login
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          {/* Trust Badge */}
          <div className="inline-block mb-12">
            <div className="bg-emerald-50 border border-emerald-200 px-6 py-3 rounded-full text-emerald-700 text-sm font-semibold flex items-center space-x-2 shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <Award className="h-4 w-4" />
              <span>BAT Certified • Licensed & Insured • Pierce County</span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight text-slate-900">
            Professional Backflow<br />
            <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-emerald-600 bg-clip-text text-transparent">Testing & Certification</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            Protecting Pierce County's water supply with expert backflow prevention services. 
            <strong className="text-slate-800">Fast scheduling, same-week service, and full compliance guaranteed.</strong>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl group transition-all duration-200 shadow-lg hover:shadow-xl"
              onClick={() => window.location.href = '/portal/schedule'}
            >
              Schedule Testing Now
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Button>
            <Button 
              size="lg" 
              className="bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200 shadow-sm"
              onClick={() => window.location.href = 'tel:2532788692'}
            >
              <Phone className="mr-2 h-5 w-5" />
              (253) 278-8692
            </Button>
          </div>
          
          {/* Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Licensed & Insured</h3>
              <p className="text-slate-600 leading-relaxed">Fully certified contractor with comprehensive insurance for your complete protection and peace of mind.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Same Week Service</h3>
              <p className="text-slate-600 leading-relaxed">Fast scheduling with same-week appointments available to meet your testing deadlines and requirements.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Award className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">BAT Certified</h3>
              <p className="text-slate-600 leading-relaxed">Certified Backflow Assembly Tester with years of experience and up-to-date certifications.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Portal Section */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Customer Portal
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Manage your backflow testing services online with our secure customer portal. 
              Schedule appointments, pay bills, and access your compliance records anytime.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm hover:shadow-lg transition-all duration-200">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Easy Scheduling</h3>
              <p className="text-slate-600 leading-relaxed">Book appointments online 24/7 with real-time availability and instant confirmation.</p>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm hover:shadow-lg transition-all duration-200">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CreditCard className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Secure Payments</h3>
              <p className="text-slate-600 leading-relaxed">Pay your bills online with multiple payment options and automated billing features.</p>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm hover:shadow-lg transition-all duration-200">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Digital Records</h3>
              <p className="text-slate-600 leading-relaxed">Access all your test reports, compliance certificates, and service history instantly.</p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                onClick={() => window.location.href = '/portal'}
              >
                <User className="mr-2 h-5 w-5" />
                Customer Login
              </Button>
              <Button 
                size="lg" 
                className="bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200 shadow-sm"
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
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Our Services</h2>
            <p className="text-slate-400 text-2xl">Professional backflow testing and certification services</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-600/30 rounded-2xl p-10 hover:scale-105 transition-all duration-300 shadow-xl">
                <div className="text-center mb-8">
                  {service.icon}
                  <h3 className="text-2xl font-bold mb-4 text-white">{service.title}</h3>
                  <p className="text-slate-300 text-lg leading-relaxed">{service.description}</p>
                </div>
                <ul className="space-y-3">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-slate-300">
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
            <p className="text-slate-400 text-xl">Professional service you can trust</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-slate-600/20 rounded-xl p-6 hover:scale-105 transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg bg-slate-700/50 ${feature.color}`}>
                    {feature.icon}
                  </div>
                  <p className="text-slate-200 font-medium">{feature.text}</p>
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
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Get Started Today</h2>
            <p className="text-2xl text-slate-400">Choose the most convenient way to reach us</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-gradient-to-br from-blue-600/10 to-blue-800/10 backdrop-blur-sm border border-blue-400/20 rounded-2xl p-8 text-center hover:scale-105 transition-all duration-300">
              <div className="inline-block p-6 bg-blue-600/20 rounded-2xl mb-6">
                <Phone className="h-12 w-12 text-blue-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-white">Call or Text</h3>
              <a href="tel:2532788692" className="text-blue-400 hover:text-blue-300 text-2xl font-bold transition-colors block">
                (253) 278-8692
              </a>
            </div>

            <div className="bg-gradient-to-br from-emerald-600/10 to-emerald-800/10 backdrop-blur-sm border border-emerald-400/20 rounded-2xl p-8 text-center hover:scale-105 transition-all duration-300">
              <div className="inline-block p-6 bg-emerald-600/20 rounded-2xl mb-6">
                <Mail className="h-12 w-12 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-white">Email</h3>
              <a href="mailto:service@fisherbackflows.com" className="text-emerald-400 hover:text-emerald-300 text-lg font-semibold transition-colors block">
                service@fisherbackflows.com
              </a>
            </div>

            <div className="bg-gradient-to-br from-amber-600/10 to-amber-800/10 backdrop-blur-sm border border-amber-400/20 rounded-2xl p-8 text-center hover:scale-105 transition-all duration-300">
              <div className="inline-block p-6 bg-amber-600/20 rounded-2xl mb-6">
                <Calendar className="h-12 w-12 text-amber-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-white">Book Online</h3>
              <Button 
                className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white px-8 py-3 rounded-xl transition-all duration-300"
                onClick={() => window.location.href = '/portal/schedule'}
              >
                Schedule Now
              </Button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-slate-800/30 to-slate-700/30 backdrop-blur-sm border border-slate-600/20 rounded-2xl p-8 max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center mb-6">
              <Clock className="h-8 w-8 text-slate-400 mr-3" />
              <h3 className="text-2xl font-bold text-white">Business Hours</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-slate-300 text-lg">
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
      <footer className="bg-gradient-to-r from-slate-900/90 to-slate-800/90 backdrop-blur-xl border-t border-slate-700/50 py-16 px-6">
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
              <p className="text-slate-400 text-lg mb-6 leading-relaxed">
                Professional backflow testing and prevention services for Pierce County. 
                Protecting your water quality with certified expertise.
              </p>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2 text-slate-300">
                  <Star className="h-5 w-5 text-amber-400" />
                  <span>5-Star Service</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <Shield className="h-5 w-5 text-emerald-400" />
                  <span>Licensed & Insured</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-xl font-bold mb-6 text-white">Quick Links</h4>
              <div className="space-y-3">
                <a href="/portal" className="block text-slate-400 hover:text-white text-lg transition-colors">Customer Portal</a>
                <a href="/portal/schedule" className="block text-slate-400 hover:text-white text-lg transition-colors">Schedule Service</a>
                <a href="/portal/pay" className="block text-slate-400 hover:text-white text-lg transition-colors">Pay Bill</a>
                <a href="/team-portal" className="block text-slate-400 hover:text-white text-lg transition-colors">Team Portal</a>
              </div>
            </div>
            
            <div>
              <h4 className="text-xl font-bold mb-6 text-white">Contact Info</h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-blue-400" />
                  <span className="text-slate-300 text-lg">(253) 278-8692</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-emerald-400" />
                  <span className="text-slate-300 text-lg">service@fisherbackflows.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-amber-400" />
                  <span className="text-slate-300 text-lg">Pierce County, WA</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-700/50 pt-8 text-center">
            <p className="text-slate-500 text-lg mb-2">
              © {currentYear} Fisher Backflows LLC. All rights reserved. Licensed & Insured.
            </p>
            <p className="text-slate-600 text-sm">
              BAT Certified | Washington State Contractor License
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}