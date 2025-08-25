'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  CheckCircle,
  Shield,
  Users,
  Clock
} from 'lucide-react';

export default function HomePage() {
  const [currentYear, setCurrentYear] = useState(2024);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const services = [
    {
      icon: <CheckCircle className="h-12 w-12 text-blue-600 mb-4" />,
      title: "Annual Testing",
      description: "State-required annual backflow preventer testing to ensure your devices are functioning properly and protecting the water supply.",
      features: ["Certified testing procedures", "Complete documentation", "Direct submission to water district"]
    },
    {
      icon: <Shield className="h-12 w-12 text-blue-600 mb-4" />,
      title: "Repairs & Maintenance",
      description: "Expert repair services for all types of backflow prevention devices, ensuring compliance and reliability.",
      features: ["Same-day emergency repairs", "Genuine replacement parts", "Warranty on all work"]
    },
    {
      icon: <Users className="h-12 w-12 text-blue-600 mb-4" />,
      title: "New Installations",
      description: "Professional installation of backflow prevention devices for residential and commercial properties.",
      features: ["Code-compliant installations", "Device selection consultation", "Permit assistance"]
    }
  ];

  const features = [
    "Same‑week appointments usually available",
    "Testing takes about 30–45 minutes",
    "Immediate results; clear next steps if repairs are needed",
    "We file with your water district",
    "We'll remind you next year"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="text-xl font-bold">
                Fisher <span className="text-blue-400">Backflows</span>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#services" className="hover:text-blue-400 transition-colors">What We Do</a>
              <a href="#about" className="hover:text-blue-400 transition-colors">About</a>
              <a href="#contact" className="hover:text-blue-400 transition-colors">Get in Touch</a>
              <a href="/portal" className="bg-green-600 px-4 py-2 rounded-md hover:bg-green-700 transition-colors">Customer Portal</a>
              <a href="/app" className="bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">Business App</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Backflow Testing You Can Trust
          </h1>
          <p className="text-xl md:text-2xl text-blue-200 mb-4">
            Serving South Sound families and businesses
          </p>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Annual testing done right, on time, and without the hassle.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-green-600 hover:bg-green-700 text-lg px-8 py-3"
              onClick={() => window.location.href = '/portal'}
            >
              <User className="mr-2 h-5 w-5" />
              Customer Portal
            </Button>
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
              onClick={() => window.location.href = '/portal/schedule'}
            >
              <Calendar className="mr-2 h-5 w-5" />
              Schedule Service
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white text-white hover:bg-white hover:text-slate-900 text-lg px-8 py-3"
              onClick={() => window.location.href = 'tel:2532788692'}
            >
              <Phone className="mr-2 h-5 w-5" />
              Call: (253) 278‑8692
            </Button>
          </div>
        </div>
      </section>

      {/* Breakdown Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Breakdown</h2>
            
            <div className="prose prose-lg max-w-none mb-8">
              <p className="text-gray-600 text-lg leading-relaxed">
                WA state requires your backflow device to be tested annually. It keeps
                contaminants from flowing backward into your clean water supply.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed">
                We're local, experienced, and efficient — and we handle the paperwork
                with your water district for you.
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                What you probably want to know:
              </h3>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What We Do</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-center mb-6">
                  {service.icon}
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{service.title}</h3>
                  <p className="text-gray-600">{service.description}</p>
                </div>
                <ul className="space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
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
      <section id="about" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">About Fisher Backflows</h2>
            
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              We're a local, family-owned business serving Pierce County since 2015.
              Licensed, insured, and certified to test and repair all types of
              backflow preventers.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Why Choose Us?</h3>
                <ul className="space-y-2">
                  {[
                    "State Certified BAT Technicians", 
                    "Licensed & Insured",
                    "Competitive Pricing",
                    "Quick Turnaround", 
                    "Electronic Reporting"
                  ].map((item, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Service Areas</h3>
                <ul className="space-y-2">
                  {["Tacoma", "Lakewood", "Puyallup", "Gig Harbor", "All Pierce County"].map((area, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <MapPin className="h-4 w-4 text-green-600 mr-2" />
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Get in Touch</h2>
            <p className="text-lg text-gray-600">
              Ready to schedule your backflow test? Have questions about our services? We're here to help!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-4">
                <Phone className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Call or Text</h3>
              <a href="tel:2532788692" className="text-blue-600 hover:text-blue-800 text-lg font-medium">
                (253) 278‑8692
              </a>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-4">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
              <a href="mailto:service@fisherbackflows.com" className="text-green-600 hover:text-green-800">
                service@fisherbackflows.com
              </a>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-3 w-12 h-12 mx-auto mb-4">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Schedule Online</h3>
              <Button 
                variant="link" 
                className="text-purple-600 hover:text-purple-800 p-0"
                onClick={() => window.open('https://calendar.google.com/calendar/appointments/schedules/AcZssZ3bI9wy6sFs2BK9HhCpKFfA4xlLM8gafn0rIoL0HvRmQdpN5Ej-5L6mLlPBDgEFh0-TK6zCKF8L?gv=true', '_blank')}
              >
                Book directly on our calendar
              </Button>
            </div>
          </div>

          <div className="text-center mt-12 bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-center mb-4">
              <Clock className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="font-semibold text-gray-900">Hours</h3>
            </div>
            <div className="space-y-1 text-gray-600">
              <p>Monday–Friday: 7:00 AM – 6:00 PM</p>
              <p>Saturday: 8:00 AM – 4:00 PM</p>
              <p>Sunday: Emergency only</p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Portal Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Manage Your Account Online</h2>
          <p className="text-xl text-green-100 mb-8">
            Access your customer portal for easy bill payment, appointment scheduling, and service history.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/10 rounded-lg p-6">
              <CreditCard className="h-12 w-12 text-green-200 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Pay Bills Online</h3>
              <p className="text-green-100 mb-4">Secure payment portal with multiple payment options</p>
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-green-700"
                onClick={() => window.location.href = '/portal/pay'}
              >
                Pay Now
              </Button>
            </div>
            
            <div className="bg-white/10 rounded-lg p-6">
              <Calendar className="h-12 w-12 text-green-200 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Schedule Service</h3>
              <p className="text-green-100 mb-4">Book appointments online at your convenience</p>
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-green-700"
                onClick={() => window.location.href = '/portal/schedule'}
              >
                Schedule
              </Button>
            </div>
            
            <div className="bg-white/10 rounded-lg p-6">
              <FileText className="h-12 w-12 text-green-200 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Access Records</h3>
              <p className="text-green-100 mb-4">View test certificates and service history</p>
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-green-700"
                onClick={() => window.location.href = '/portal'}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Schedule your backflow test today and ensure your water stays clean and compliant.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
              onClick={() => window.open('https://calendar.google.com/calendar/appointments/schedules/AcZssZ3bI9wy6sFs2BK9HhCpKFfA4xlLM8gafn0rIoL0HvRmQdpN5Ej-5L6mLlPBDgEFh0-TK6zCKF8L?gv=true', '_blank')}
            >
              Schedule Test Now
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white text-white hover:bg-white hover:text-slate-900 text-lg px-8 py-3"
              onClick={() => window.location.href = '/app'}
            >
              Open Business App
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">
              &copy; {currentYear} Fisher Backflows. Licensed & Insured.
            </p>
            <p className="text-gray-400 mt-2">
              Serving Tacoma, Puyallup, Lakewood, Gig Harbor, and all Pierce County.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              BAT Certified | Pierce County Contractor #FISHER*123AB
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}