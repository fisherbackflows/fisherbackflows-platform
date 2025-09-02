'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BreadcrumbItem {
  label: string;
  href: string;
  current?: boolean;
}

interface SmartBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function SmartBreadcrumb({ items, className = '' }: SmartBreadcrumbProps) {
  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`} aria-label="Breadcrumb">
      <Link href="/" className="text-blue-300 hover:text-white transition-colors">
        <Home className="h-4 w-4" />
      </Link>
      
      {items.map((item, index) => (
        <div key={item.href} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4 text-blue-400" />
          {item.current ? (
            <span className="text-white font-medium">{item.label}</span>
          ) : (
            <Link 
              href={item.href} 
              className="text-blue-300 hover:text-white transition-colors font-medium"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}

interface SmartBackButtonProps {
  backTo: {
    label: string;
    href: string;
  };
  breadcrumb?: BreadcrumbItem[];
  className?: string;
}

export function SmartBackButton({ backTo, breadcrumb, className = '' }: SmartBackButtonProps) {
  return (
    <div className={`glass border-b border-blue-400 glow-blue-sm mb-6 sticky top-0 z-10 ${className}`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        {breadcrumb ? (
          <SmartBreadcrumb items={breadcrumb} />
        ) : (
          <Link href={backTo.href}>
            <Button variant="ghost" className="text-blue-300 hover:text-white">
              ← Back to {backTo.label}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}