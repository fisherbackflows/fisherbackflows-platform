'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
  Gauge
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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading Fisher Backflows Platform...</p>
        </div>
      </div>
    );
  }

  const services = [
    {
      icon: <CheckCircle className="h-12 w-12 text-blue-400 mb-4" />,
      title: "Annual Testing",
      description: "State-required annual backflow preventer testing to ensure your devices are functioning properly.",
      features: ["Certified testing", "Complete documentation", "District submission"]
    }
  ];

  const features = [
    "Same-week appointments available",
    "Testing takes 30–45 minutes",
    "Immediate results provided",
    "We file with your water district",
    "Annual reminders sent"
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5" />
      
      {/* Header */}
      <header className="relative z-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Image
                src="/fisher-backflows-logo.png"
                alt="Fisher Backflows LLC"
                width={200}
                height={160}
                priority
                className="brightness-110 contrast-105"
              />
            </div>
            
            <nav className="hidden md:flex space-x-6 items-center">
              <a href="#services" className="text-white/80 hover:text-white transition-colors">Services</a>
              <a href="#about" className="text-white/80 hover:text-white transition-colors">About</a>
              <a href="#contact" className="text-white/80 hover:text-white transition-colors">Contact</a>
              <a href="/portal" className="bg-blue-600/20 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-600/30 transition-all">Customer Portal</a>
              <a href="/app" className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all">Team App</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block mb-6">
            <div className="bg-blue-600/20 border border-blue-500/30 px-4 py-2 rounded-full text-blue-400 text-sm font-medium backdrop-blur-sm">
              <Gauge className="inline h-4 w-4 mr-2" />
              Professional Backflow Testing & Certification
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-white">Protecting Your</span><br />
            <span className="bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">Water Quality</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/60 mb-8 max-w-3xl mx-auto">
            State-certified backflow testing for Pierce County homes and businesses. 
            Fast, reliable, and compliant.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 px-8 py-6 text-lg rounded-lg group transition-all"
              onClick={() => window.location.href = '/portal/schedule'}
            >
              Schedule Testing
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              className="bg-green-600/20 border border-green-500/30 text-green-400 hover:bg-green-600/30 px-8 py-6 text-lg rounded-lg transition-all"
              onClick={() => window.location.href = 'tel:2532788692'}
            >
              <Phone className="mr-2 h-5 w-5" />
              (253) 278-8692
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4 backdrop-blur-sm">
              <CheckCircle className="h-6 w-6 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-white/80">Licensed & Insured</p>
            </div>
            <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4 backdrop-blur-sm">
              <Clock className="h-6 w-6 text-blue-400 mx-auto mb-2" />
              <p className="text-sm text-white/80">Same Week Service</p>
            </div>
            <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-4 backdrop-blur-sm">
              <Shield className="h-6 w-6 text-purple-400 mx-auto mb-2" />
              <p className="text-sm text-white/80">BAT Certified</p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Portal CTA */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-500/30 rounded-2xl p-12 text-center backdrop-blur-sm">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">Customer Portal</h2>
            <p className="text-xl text-white/80 mb-8">
              Manage your account, pay bills, and schedule service online
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
              <div className="bg-gray-900/50 border border-gray-500/20 rounded-lg p-6 backdrop-blur-sm">
                <CreditCard className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Online Payments</h3>
                <p className="text-white/60 text-sm">Secure and convenient bill pay</p>
              </div>
              
              <div className="bg-gray-900/50 border border-gray-500/20 rounded-lg p-6 backdrop-blur-sm">
                <Calendar className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Easy Scheduling</h3>
                <p className="text-white/60 text-sm">Book appointments 24/7</p>
              </div>
              
              <div className="bg-gray-900/50 border border-gray-500/20 rounded-lg p-6 backdrop-blur-sm">
                <FileText className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Test Records</h3>
                <p className="text-white/60 text-sm">Access all your documents</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 px-8 py-3 rounded-lg transition-all"
                onClick={() => window.location.href = '/portal'}
              >
                Access Portal
                <User className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                className="bg-green-600/20 border border-green-500/30 text-green-400 hover:bg-green-600/30 px-8 py-3 rounded-lg transition-all"
                onClick={() => window.location.href = '/team-portal'}
              >
                Business Login
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Our Services</h2>
            <p className="text-white/60 text-lg">Professional backflow testing and certification</p>
          </div>
          
          <div className="max-w-md mx-auto">
            {services.map((service, index) => (
              <div key={index} className="bg-gray-900/50 border border-gray-500/20 rounded-xl p-8 backdrop-blur-sm hover:border-gray-400/30 transition-all">
                <div className="text-center mb-6">
                  <div className="inline-block bg-blue-600/20 border border-blue-500/30 rounded-full p-3 mb-4">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                  <p className="text-white/60 text-sm">{service.description}</p>
                </div>
                <ul className="space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-white/70">
                      <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Get Started Today</h2>
            <p className="text-lg text-white/60">Choose the most convenient way to reach us</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
            <div className="bg-gray-900/50 border border-gray-500/20 rounded-xl p-6 text-center backdrop-blur-sm hover:border-gray-400/30 transition-all">
              <div className="inline-block bg-blue-600/20 border border-blue-500/30 rounded-full p-3 mb-4">
                <Phone className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2">Call or Text</h3>
              <a href="tel:2532788692" className="text-blue-400 hover:text-blue-300 text-lg font-medium transition-colors">
                (253) 278-8692
              </a>
            </div>

            <div className="bg-gray-900/50 border border-gray-500/20 rounded-xl p-6 text-center backdrop-blur-sm hover:border-gray-400/30 transition-all">
              <div className="inline-block bg-blue-600/20 border border-blue-500/30 rounded-full p-3 mb-4">
                <Mail className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2">Email</h3>
              <a href="mailto:service@fisherbackflows.com" className="text-blue-400 hover:text-blue-300 transition-colors">
                service@fisherbackflows.com
              </a>
            </div>

            <div className="bg-gray-900/50 border border-gray-500/20 rounded-xl p-6 text-center backdrop-blur-sm hover:border-gray-400/30 transition-all">
              <div className="inline-block bg-blue-600/20 border border-blue-500/30 rounded-full p-3 mb-4">
                <Calendar className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2">Book Online</h3>
              <Button 
                variant="link" 
                className="text-blue-400 hover:text-blue-300 p-0 transition-colors"
                onClick={() => window.location.href = '/portal/schedule'}
              >
                Schedule Now
              </Button>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-500/20 rounded-xl p-6 max-w-2xl mx-auto text-center">
            <div className="flex items-center justify-center mb-4">
              <Clock className="h-5 w-5 text-white/60 mr-2" />
              <h3 className="font-semibold">Business Hours</h3>
            </div>
            <div className="space-y-1 text-white/70 text-sm">
              <p>Monday–Friday: 7:00 AM – 6:00 PM</p>
              <p>Saturday: 8:00 AM – 4:00 PM</p>
              <p>Sunday: Emergency service only</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900/50 border-t border-gray-500/20 py-12 px-4 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="mb-4">
                <Image
                  src="/fisher-backflows-logo.png"
                  alt="Fisher Backflows LLC"
                  width={160}
                  height={128}
                  className="brightness-110 contrast-105"
                />
              </div>
              <p className="text-white/50 text-sm">
                Professional backflow testing and prevention services for Pierce County.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-white/80">Quick Links</h4>
              <div className="space-y-2">
                <a href="/portal" className="block text-white/50 hover:text-white/80 text-sm transition-colors">Customer Portal</a>
                <a href="/portal/schedule" className="block text-white/50 hover:text-white/80 text-sm transition-colors">Schedule Service</a>
                <a href="/portal/pay" className="block text-white/50 hover:text-white/80 text-sm transition-colors">Pay Bill</a>
                <a href="/app" className="block text-white/50 hover:text-white/80 text-sm transition-colors">Team App</a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-white/80">Contact</h4>
              <div className="space-y-2 text-white/50 text-sm">
                <p>(253) 278-8692</p>
                <p>service@fisherbackflows.com</p>
                <p>Pierce County, WA</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-500/20 pt-8 text-center">
            <p className="text-white/30 text-sm">
              © {currentYear} Fisher Backflows LLC. All rights reserved. Licensed & Insured.
            </p>
            <p className="text-white/20 text-xs mt-2">
              BAT Certified | Contractor License
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}