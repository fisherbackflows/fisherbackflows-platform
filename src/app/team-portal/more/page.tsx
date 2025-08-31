'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Settings,
  FileText,
  DollarSign,
  BarChart3,
  Bell,
  Download,
  Upload,
  Users,
  Calendar,
  Plus,
  Mail,
  Phone,
  MapPin,
  Shield,
  HelpCircle,
  LogOut,
  Smartphone,
  Cloud,
  Printer,
  Instagram
} from 'lucide-react';
import Link from 'next/link';

interface QuickStat {
  label: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
}

export default function MorePage() {
  const [stats, setStats] = useState<QuickStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load quick stats
    const quickStats: QuickStat[] = [
      { label: 'This Month Revenue', value: '$2,850', change: '+12%', changeType: 'positive' },
      { label: 'Tests Completed', value: '47', change: '+8%', changeType: 'positive' },
      { label: 'Outstanding Invoices', value: '$1,425', change: '-5%', changeType: 'positive' },
      { label: 'Active Customers', value: '156', change: '+3%', changeType: 'positive' }
    ];

    setTimeout(() => {
      setStats(quickStats);
      setLoading(false);
    }, 300);
  }, []);

  const businessFeatures = [
    {
      title: 'Instagram Marketing',
      description: 'Branding & advertising dashboard',
      icon: <Instagram className="h-6 w-6" />,
      href: '/team-portal/instagram',
      color: 'bg-pink-500'
    },
    {
      title: 'Customer Database',
      description: 'Complete customer records',
      icon: <Users className="h-6 w-6" />,
      href: '/team-portal/customers/database',
      color: 'bg-blue-500'
    },
    {
      title: 'Invoices',
      description: 'Manage billing and payments',
      icon: <DollarSign className="h-6 w-6" />,
      href: '/team-portal/invoices',
      color: 'bg-green-500'
    },
    {
      title: 'Water Districts',
      description: 'Submit test reports',
      icon: <FileText className="h-6 w-6" />,
      href: '/team-portal/district-reports',
      color: 'bg-indigo-500'
    },
    {
      title: 'Auto Reminders',
      description: 'Automated annual notifications',
      icon: <Bell className="h-6 w-6" />,
      href: '/team-portal/reminders',
      color: 'bg-yellow-500'
    }
  ];

  const toolsFeatures = [
    {
      title: 'Export Data',
      description: 'Download customer data',
      icon: <Download className="h-6 w-6" />,
      href: '/team-portal/export',
      color: 'bg-purple-500'
    },
    {
      title: 'Import Data',
      description: 'Import existing records',
      icon: <Upload className="h-6 w-6" />,
      href: '/team-portal/import',
      color: 'bg-orange-500'
    },
    {
      title: 'Print Labels',
      description: 'Device and customer labels',
      icon: <Printer className="h-6 w-6" />,
      href: '/team-portal/labels',
      color: 'bg-white0'
    },
    {
      title: 'Backup & Sync',
      description: 'Cloud data backup',
      icon: <Cloud className="h-6 w-6" />,
      href: '/team-portal/backup',
      color: 'bg-cyan-500'
    }
  ];

  const supportFeatures = [
    {
      title: 'Settings',
      description: 'App preferences',
      icon: <Settings className="h-6 w-6" />,
      href: '/team-portal/settings',
      color: 'bg-gray-600'
    },
    {
      title: 'Help & Support',
      description: 'Get help and tutorials',
      icon: <HelpCircle className="h-6 w-6" />,
      href: '/team-portal/help',
      color: 'bg-teal-500'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-slate-900 text-white">
        <div className="px-4 py-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-blue-600 rounded-full p-2">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Fisher Backflows</h1>
              <p className="text-blue-200 text-sm">Business Management</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white/10 rounded-lg p-3">
                <div className="text-sm text-gray-300">{stat.label}</div>
                <div className="flex items-center space-x-2">
                  <div className="text-lg font-bold">{stat.value}</div>
                  <div className={`text-xs px-1.5 py-0.5 rounded ${
                    stat.changeType === 'positive' ? 'bg-green-100 text-green-800' :
                    stat.changeType === 'negative' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-900'
                  }`}>
                    {stat.change}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="p-4 pb-20">
        {/* Business Features */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Business</h2>
          <div className="grid grid-cols-2 gap-3">
            {businessFeatures.map((feature, index) => (
              <Link
                key={index}
                href={feature.href}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`${feature.color} text-white rounded-lg p-2`}>
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{feature.title}</div>
                    <div className="text-sm text-gray-600">{feature.description}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Tools & Utilities */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tools & Utilities</h2>
          <div className="grid grid-cols-2 gap-3">
            {toolsFeatures.map((feature, index) => (
              <Link
                key={index}
                href={feature.href}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`${feature.color} text-white rounded-lg p-2`}>
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{feature.title}</div>
                    <div className="text-sm text-gray-600">{feature.description}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/team-portal/test-report"
              className="flex items-center justify-between bg-blue-600 text-white rounded-lg p-4 hover:bg-blue-700 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <FileText className="h-6 w-6" />
                <div>
                  <div className="font-semibold">Start New Test</div>
                  <div className="text-sm text-blue-100">Begin field testing</div>
                </div>
              </div>
              <Plus className="h-5 w-5" />
            </Link>

            <Link
              href="/team-portal/customers/new"
              className="flex items-center justify-between bg-green-600 text-white rounded-lg p-4 hover:bg-green-700 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Users className="h-6 w-6" />
                <div>
                  <div className="font-semibold">Add Customer</div>
                  <div className="text-sm text-green-100">New customer entry</div>
                </div>
              </div>
              <Plus className="h-5 w-5" />
            </Link>

            <Link
              href="/team-portal/invoices/new"
              className="flex items-center justify-between bg-purple-600 text-white rounded-lg p-4 hover:bg-purple-700 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <DollarSign className="h-6 w-6" />
                <div>
                  <div className="font-semibold">Create Invoice</div>
                  <div className="text-sm text-purple-100">Bill customer</div>
                </div>
              </div>
              <Plus className="h-5 w-5" />
            </Link>
          </div>
        </section>

        {/* Business Info */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h2>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">Phone</div>
                  <a href="tel:2532788692" className="text-blue-600">(253) 278-8692</a>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">Email</div>
                  <a href="mailto:service@fisherbackflows.com" className="text-blue-600">
                    service@fisherbackflows.com
                  </a>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">License</div>
                  <div className="text-gray-600">BAT Certified | Pierce County Contractor</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">Service Area</div>
                  <div className="text-gray-600">Tacoma, Puyallup, Gig Harbor, All Pierce County</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Settings & Support */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings & Support</h2>
          <div className="space-y-2">
            {supportFeatures.map((feature, index) => (
              <Link
                key={index}
                href={feature.href}
                className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-3">
                  <div className={`${feature.color} text-white rounded-lg p-2`}>
                    {feature.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{feature.title}</div>
                    <div className="text-sm text-gray-600">{feature.description}</div>
                  </div>
                </div>
                <div className="text-gray-400">→</div>
              </Link>
            ))}
          </div>
        </section>

        {/* App Information */}
        <section className="mb-6">
          <div className="bg-gray-100 rounded-lg p-4 text-center">
            <div className="text-sm text-gray-600 mb-2">
              Fisher Backflows Team App
            </div>
            <div className="text-xs text-gray-500">
              Version 1.0.0 • Next.js with Turbopack
            </div>
            <div className="text-xs text-gray-500">
              © 2024 Fisher Backflows • Licensed & Insured
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="grid grid-cols-5">
          <Link href="/app" className="flex flex-col items-center py-2 px-1 text-gray-600 hover:text-gray-900">
            <div className="h-6 w-6 bg-gray-400 rounded"></div>
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/team-portal/customers" className="flex flex-col items-center py-2 px-1 text-gray-600 hover:text-gray-900">
            <Users className="h-6 w-6" />
            <span className="text-xs">Customers</span>
          </Link>
          <Link href="/team-portal/test-report" className="flex flex-col items-center py-2 px-1 text-gray-600 hover:text-gray-900">
            <Plus className="h-6 w-6" />
            <span className="text-xs">Test</span>
          </Link>
          <Link href="/team-portal/schedule" className="flex flex-col items-center py-2 px-1 text-gray-600 hover:text-gray-900">
            <Calendar className="h-6 w-6" />
            <span className="text-xs">Schedule</span>
          </Link>
          <Link href="/team-portal/more" className="flex flex-col items-center py-2 px-1 text-blue-600 bg-blue-50">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
              <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
              <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
            </div>
            <span className="text-xs font-medium">More</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}