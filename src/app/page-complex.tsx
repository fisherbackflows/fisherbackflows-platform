'use client';

import { Suspense } from 'react';
import Logo from '@/components/ui/Logo';
import NavigationHeader from '@/components/homepage/NavigationHeader';
import HeroSection from '@/components/homepage/HeroSection';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  CheckCircle,
  Shield,
  Users,
  Clock,
  User,
  CreditCard,
  FileText,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

export default function HomePage() {
  const currentYear = new Date().getFullYear();

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
    <div className="min-h-screen bg-black">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid opacity-20" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5" />
      
      <Suspense fallback={<div className="h-16" />}>
        <NavigationHeader />
      </Suspense>

      <Suspense fallback={<div className="h-screen" />}>
        <HeroSection />
      </Suspense>

      {/* Customer Portal CTA */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-400/10" />
        <div className="absolute inset-0 bg-dots opacity-10" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="glass-blue rounded-2xl p-12 text-center glow-blue">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Customer Portal</h2>
            <p className="text-xl text-white/80 mb-8">
              Manage your account, pay bills, and schedule service online
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
              <div className="glass rounded-lg p-6">
                <CreditCard className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Online Payments</h3>
                <p className="text-white/60 text-sm">Secure and convenient bill pay</p>
              </div>
              
              <div className="glass rounded-lg p-6">
                <Calendar className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Easy Scheduling</h3>
                <p className="text-white/60 text-sm">Book appointments 24/7</p>
              </div>
              
              <div className="glass rounded-lg p-6">
                <FileText className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Test Records</h3>
                <p className="text-white/60 text-sm">Access all your documents</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="btn-glow px-8 py-3 rounded-lg"
                onClick={() => window.location.href = '/portal'}
              >
                Access Portal
                <User className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                className="btn-glass px-8 py-3 rounded-lg hover-glow"
                onClick={() => window.location.href = '/app'}
              >
                Business Login
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Info Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="glass rounded-2xl p-8 md:p-12 glow-blue-sm">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center gradient-text">Why Testing Matters</h2>
              
              <div className="prose prose-lg prose-invert max-w-none mb-8">
                <p className="text-white/70 text-lg leading-relaxed mb-4">
                  Washington state requires annual testing of backflow devices to protect our water supply 
                  from contamination. We make compliance easy.
                </p>
              </div>

              <div className="glass-blue rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-blue-400">Our Process:</h3>
                <ul className="space-y-3">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <ChevronRight className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">Our Services</h2>
            <p className="text-white/60 text-lg">Professional backflow testing and certification</p>
          </div>
          
          <div className="max-w-md mx-auto">
            {services.map((service, index) => (
              <div key={index} className="glass rounded-xl p-8 card-hover group">
                <div className="text-center mb-6">
                  <div className="inline-block pulse-glow rounded-full p-3 glass mb-4">
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

      {/* About Section */}
      <section id="about" className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-blue-500/5" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 gradient-text">About Fisher Backflows</h2>
              <p className="text-lg text-white/70 mb-6 leading-relaxed">
                Family-owned and operated since 2019, we've built our reputation on reliability, 
                expertise, and exceptional service throughout Pierce County.
              </p>
              
              <div className="space-y-4">
                {[
                  "State Certified BAT Technicians", 
                  "Licensed & Fully Insured",
                  "10+ Years Experience",
                  "1000+ Satisfied Customers"
                ].map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div className="glass rounded-lg p-2 mr-4">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                    <span className="text-white/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="glass rounded-xl p-8 glow-blue-sm">
              <h3 className="text-2xl font-semibold mb-6 text-blue-400">Service Areas</h3>
              <div className="grid grid-cols-2 gap-4">
                {["Tacoma", "Lakewood", "Puyallup", "Gig Harbor", "Spanaway", "Graham"].map((area, index) => (
                  <div key={index} className="flex items-center text-white/70">
                    <MapPin className="h-4 w-4 text-blue-400 mr-2" />
                    {area}
                  </div>
                ))}
              </div>
              <p className="text-sm text-white/50 mt-6">And all surrounding Pierce County areas</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">Get Started Today</h2>
            <p className="text-lg text-white/60">Choose the most convenient way to reach us</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="glass rounded-xl p-6 text-center card-hover">
              <div className="inline-block glass-blue rounded-full p-3 mb-4 pulse-glow">
                <Phone className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2">Call or Text</h3>
              <a href="tel:2532788692" className="text-blue-400 hover:text-blue-300 text-lg font-medium transition-colors">
                (253) 278-8692
              </a>
            </div>

            <div className="glass rounded-xl p-6 text-center card-hover">
              <div className="inline-block glass-blue rounded-full p-3 mb-4 pulse-glow">
                <Mail className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2">Email</h3>
              <a href="mailto:service@fisherbackflows.com" className="text-blue-400 hover:text-blue-300 transition-colors">
                service@fisherbackflows.com
              </a>
            </div>

            <div className="glass rounded-xl p-6 text-center card-hover">
              <div className="inline-block glass-blue rounded-full p-3 mb-4 pulse-glow">
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

          <div className="mt-12 glass rounded-xl p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <Clock className="h-5 w-5 text-white/60 mr-2" />
              <h3 className="font-semibold">Business Hours</h3>
            </div>
            <div className="space-y-1 text-white/70 text-center text-sm">
              <p>Monday–Friday: 7:00 AM – 6:00 PM</p>
              <p>Saturday: 8:00 AM – 4:00 PM</p>
              <p>Sunday: Emergency service only</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-darker py-12 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="mb-4">
                <Logo width={140} height={112} />
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
          
          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-white/30 text-sm">
              © {currentYear} Fisher Backflows. All rights reserved. Licensed & Insured.
            </p>
            <p className="text-white/20 text-xs mt-2">
              BAT Certified | Contractor #FISHER*123AB
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}