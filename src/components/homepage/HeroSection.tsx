'use client';

import ClientButton from './ClientButton';
import { Phone, ArrowRight, CheckCircle, Clock, Shield, Gauge } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-dots opacity-10" />
      <div className="max-w-7xl mx-auto text-center relative z-10">
        <div className="inline-block mb-6">
          <div className="glass px-4 py-2 rounded-full text-blue-400 text-sm font-medium glow-blue-sm">
            <Gauge className="inline h-4 w-4 mr-2" />
            Professional Backflow Testing & Certification
          </div>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          <span className="text-white">Protecting Your</span><br />
          <span className="gradient-text text-glow">Water Quality</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-white/60 mb-8 max-w-3xl mx-auto">
          State-certified backflow testing for Pierce County homes and businesses. 
          Fast, reliable, and compliant.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <ClientButton 
            size="lg" 
            className="btn-glow px-8 py-6 text-lg rounded-lg group"
            onClick={() => window.location.href = '/portal/schedule'}
          >
            Schedule Testing
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </ClientButton>
          <ClientButton 
            size="lg" 
            className="btn-glass px-8 py-6 text-lg rounded-lg hover-glow"
            onClick={() => window.location.href = 'tel:2532788692'}
          >
            <Phone className="mr-2 h-5 w-5" />
            (253) 278-8692
          </ClientButton>
        </div>
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <div className="glass rounded-lg p-4 card-hover">
            <CheckCircle className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-white/80">Licensed & Insured</p>
          </div>
          <div className="glass rounded-lg p-4 card-hover">
            <Clock className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <p className="text-sm text-white/80">Same Week Service</p>
          </div>
          <div className="glass rounded-lg p-4 card-hover">
            <Shield className="h-6 w-6 text-purple-400 mx-auto mb-2" />
            <p className="text-sm text-white/80">BAT Certified</p>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-32 water-wave opacity-20" />
    </section>
  );
}