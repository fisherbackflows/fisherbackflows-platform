'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  ArrowLeft, 
  Navigation as NavigationIcon,
  HelpCircle,
  Phone,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface SmartNavigationProps {
  showBreadcrumbs?: boolean;
  showFloatingActions?: boolean;
  showHelpButton?: boolean;
}

export default function SmartNavigation({ 
  showBreadcrumbs = true, 
  showFloatingActions = true,
  showHelpButton = true 
}: SmartNavigationProps) {
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Auto-generate breadcrumbs from URL
  useEffect(() => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbItems: BreadcrumbItem[] = [
      { label: 'Home', href: '/', icon: <Home className="h-4 w-4" /> }
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Humanize segment names
      const label = segment
        .replace(/-/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      breadcrumbItems.push({
        label,
        href: currentPath
      });
    });

    setBreadcrumbs(breadcrumbItems);
  }, [pathname]);

  // Back to top functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Smart Breadcrumbs */}
      {showBreadcrumbs && breadcrumbs.length > 1 && (
        <nav className="glass-light border-b border-white/5 px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <ol className="flex items-center space-x-2 text-sm">
              {breadcrumbs.map((item, index) => (
                <li key={item.href} className="flex items-center">
                  {index > 0 && (
                    <ChevronRight className="h-4 w-4 text-white/30 mx-2" />
                  )}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="flex items-center space-x-2 text-white/90 font-medium">
                      {item.icon}
                      <span>{item.label}</span>
                    </span>
                  ) : (
                    <Link 
                      href={item.href}
                      className="flex items-center space-x-2 text-white/60 hover:text-white/90 transition-colors"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </nav>
      )}

      {/* Floating Action Buttons */}
      {showFloatingActions && (
        <div className="fixed bottom-6 right-6 z-50 space-y-3">
          {/* Back to Top */}
          {showBackToTop && (
            <button
              onClick={scrollToTop}
              className="w-12 h-12 bg-blue-600/90 backdrop-blur-md rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center group"
              aria-label="Scroll to top"
            >
              <ArrowLeft className="h-5 w-5 text-white rotate-90 group-hover:scale-110 transition-transform" />
            </button>
          )}

          {/* Quick Navigation */}
          <div className="relative group">
            <button className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center">
              <NavigationIcon className="h-5 w-5 text-white" />
            </button>
            
            {/* Quick Links Popup */}
            <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
              <div className="glass-blue rounded-xl p-3 shadow-2xl min-w-[200px]">
                <div className="space-y-2">
                  <Link href="/portal" className="flex items-center space-x-3 text-white/90 hover:text-white text-sm p-2 rounded-lg hover:bg-white/10 transition-colors">
                    <Home className="h-4 w-4" />
                    <span>Customer Portal</span>
                  </Link>
                  <Link href="/app" className="flex items-center space-x-3 text-white/90 hover:text-white text-sm p-2 rounded-lg hover:bg-white/10 transition-colors">
                    <Sparkles className="h-4 w-4" />
                    <span>Team Portal</span>
                  </Link>
                  <a href="tel:2532788692" className="flex items-center space-x-3 text-white/90 hover:text-white text-sm p-2 rounded-lg hover:bg-white/10 transition-colors">
                    <Phone className="h-4 w-4" />
                    <span>Call Support</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Help Button */}
          {showHelpButton && (
            <button className="w-12 h-12 bg-green-600/90 backdrop-blur-md rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center group">
              <HelpCircle className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>
      )}
    </>
  );
}