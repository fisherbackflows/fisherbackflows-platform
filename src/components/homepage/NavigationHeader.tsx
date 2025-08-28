'use client';

import { useState, useEffect } from 'react';
import Logo from '@/components/ui/Logo';
import { Menu, X } from 'lucide-react';

export default function NavigationHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'nav-blur py-3' : 'py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Logo width={180} height={144} priority />
          
          <nav className="hidden md:flex space-x-6 items-center">
            <a href="#services" className="text-white/80 hover:text-white transition-colors hover:text-glow-sm">Services</a>
            <a href="#about" className="text-white/80 hover:text-white transition-colors hover:text-glow-sm">About</a>
            <a href="#contact" className="text-white/80 hover:text-white transition-colors hover:text-glow-sm">Contact</a>
            <a href="/portal" className="btn-glass px-4 py-2 rounded-lg hover-glow">Customer Portal</a>
            <a href="/app" className="btn-glow px-4 py-2 rounded-lg">Team App</a>
          </nav>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white/80 hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      
      {mobileMenuOpen && (
        <div className="md:hidden glass-darker mt-2 mx-4 rounded-lg p-4">
          <nav className="flex flex-col space-y-3">
            <a href="#services" className="text-white/80 hover:text-white transition-colors py-2">Services</a>
            <a href="#about" className="text-white/80 hover:text-white transition-colors py-2">About</a>
            <a href="#contact" className="text-white/80 hover:text-white transition-colors py-2">Contact</a>
            <a href="/portal" className="btn-glass px-4 py-2 rounded-lg text-center">Customer Portal</a>
            <a href="/app" className="btn-glow px-4 py-2 rounded-lg text-center">Team App</a>
          </nav>
        </div>
      )}
    </header>
  );
}