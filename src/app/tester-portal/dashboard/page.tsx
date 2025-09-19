'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Key, 
  Copy, 
  Plus, 
  Trash2, 
  BarChart3, 
  Users, 
  Calendar,
  CheckCircle,
  Code,
  Webhook,
  Settings,
  FileText,
  CreditCard,
  MapPin,
  Bell,
  Database,
  Shield,
  Zap,
  Building,
  Phone,
  Mail,
  Download,
  Upload,
  HelpCircle,
  Instagram
} from 'lucide-react'

interface ApiKey {
  id: string
  name: string
  key_preview: string
  created_at: string
  last_used_at?: string
  is_active: boolean
  rate_limit_per_hour: number
}

interface Usage {
  total_calls_today: number
  total_calls_month: number
  rate_limit_remaining: number
  most_used_endpoints: Array<{
    endpoint: string
    calls: number
  }>
}

interface UserPermissions {
  role: 'owner' | 'admin' | 'company' | 'trial'
  subscriptions: string[]
  isOwner: boolean
}

export default function TesterPortalDashboard() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [usage, setUsage] = useState<Usage | null>(null)
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('overview')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch user permissions and role
      const permResponse = await fetch('/api/tester-portal/permissions')
      if (permResponse.ok) {
        const permData = await permResponse.json()
        setPermissions(permData.data)
      }

      // Fetch API keys and usage
      const [keysResponse, usageResponse] = await Promise.all([
        fetch('/api/tester-portal/api-keys'),
        fetch('/api/tester-portal/usage')
      ])

      if (keysResponse.ok) {
        const keysData = await keysResponse.json()
        setApiKeys(keysData.data || [])
      }

      if (usageResponse.ok) {
        const usageData = await usageResponse.json()
        setUsage(usageData.data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const hasAccess = (feature: string) => {
    if (!permissions) return false
    return permissions.isOwner || permissions.subscriptions.includes(feature)
  }

  // Navigation sections with permission checks
  const navigationSections = [
    {
      title: 'Overview',
      items: [
        { id: 'overview', label: 'Dashboard', icon: BarChart3, path: '/tester-portal/dashboard' },
        { id: 'api', label: 'API Keys', icon: Key, path: '/tester-portal/api' }
      ]
    },
    {
      title: 'Customer Management',
      items: [
        { id: 'customers', label: 'Customers', icon: Users, path: '/tester-portal/customers', requiresAccess: 'customer-management' },
        { id: 'leads', label: 'Leads', icon: Phone, path: '/tester-portal/leads', requiresAccess: 'customer-management' },
        { id: 'import', label: 'Import Data', icon: Upload, path: '/tester-portal/import', requiresAccess: 'data-management' }
      ]
    },
    {
      title: 'Operations',
      items: [
        { id: 'schedule', label: 'Schedule', icon: Calendar, path: '/tester-portal/schedule', requiresAccess: 'scheduling' },
        { id: 'appointments', label: 'Appointments', icon: MapPin, path: '/tester-portal/appointments', requiresAccess: 'scheduling' },
        { id: 'routes', label: 'Route Planning', icon: MapPin, path: '/tester-portal/routes', requiresAccess: 'route-optimization' }
      ]
    },
    {
      title: 'Business',
      items: [
        { id: 'invoices', label: 'Invoices', icon: FileText, path: '/tester-portal/invoices', requiresAccess: 'billing' },
        { id: 'payments', label: 'Payments', icon: CreditCard, path: '/tester-portal/payments', requiresAccess: 'billing' },
        { id: 'reports', label: 'Test Reports', icon: FileText, path: '/tester-portal/reports', requiresAccess: 'compliance' }
      ]
    },
    {
      title: 'Marketing & Communication',
      items: [
        { id: 'reminders', label: 'Reminders', icon: Bell, path: '/tester-portal/reminders', requiresAccess: 'communications' },
        { id: 'social', label: 'Social Media', icon: Instagram, path: '/tester-portal/social', requiresAccess: 'marketing' },
        { id: 'branding', label: 'Branding', icon: Building, path: '/tester-portal/branding', requiresAccess: 'branding' }
      ]
    },
    {
      title: 'Data & Analytics',
      items: [
        { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/tester-portal/analytics', requiresAccess: 'analytics' },
        { id: 'export', label: 'Export Data', icon: Download, path: '/tester-portal/export', requiresAccess: 'data-management' },
        { id: 'backup', label: 'Backup', icon: Database, path: '/tester-portal/backup', requiresAccess: 'data-management' }
      ]
    },
    {
      title: 'System',
      items: [
        { id: 'webhooks', label: 'Webhooks', icon: Webhook, path: '/tester-portal/webhooks' },
        { id: 'settings', label: 'Settings', icon: Settings, path: '/tester-portal/settings' },
        { id: 'help', label: 'Help', icon: HelpCircle, path: '/tester-portal/help' }
      ]
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-4 text-white/80">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="glass border-b border-blue-400 glow-blue-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 glass border border-blue-400 rounded-2xl flex items-center justify-center glow-blue-sm">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
                <span className="text-white font-semibold">Fisher Backflows</span>
              </Link>
              <div className="hidden sm:block w-px h-6 bg-blue-400/30"></div>
              <div className="flex items-center space-x-2">
                <Code className="h-5 w-5 text-blue-300" />
                <span className="text-blue-300 font-semibold">Tester Portal</span>
                {permissions?.isOwner && (
                  <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    OWNER
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/tester-portal/docs"
                className="text-blue-300 hover:text-white transition-colors"
              >
                API Docs
              </Link>
              <Link
                href="/portal"
                className="text-blue-300 hover:text-white transition-colors"
              >
                Customer Portal
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 glass border-r border-blue-400 h-screen sticky top-0 overflow-y-auto">
          <div className="p-6">
            {navigationSections.map((section) => (
              <div key={section.title} className="mb-6">
                <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const accessible = !item.requiresAccess || hasAccess(item.requiresAccess)
                    const Icon = item.icon
                    
                    return (
                      <li key={item.id}>
                        {accessible ? (
                          <Link
                            href={item.path}
                            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                              activeSection === item.id
                                ? 'glass-btn-primary glow-blue text-white'
                                : 'text-white/80 hover:text-white hover:bg-blue-600/20'
                            }`}
                            onClick={() => setActiveSection(item.id)}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="text-sm font-medium">{item.label}</span>
                          </Link>
                        ) : (
                          <div className="flex items-center space-x-3 px-3 py-2 rounded-lg opacity-50 cursor-not-allowed">
                            <Icon className="h-4 w-4" />
                            <span className="text-sm font-medium text-blue-300">{item.label}</span>
                            <div className="ml-auto">
                              <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs">
                                PRO
                              </span>
                            </div>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {activeSection === 'overview' && (
            <div className="space-y-8">
              {/* Welcome Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                  Welcome to Tester Portal
                  {permissions?.isOwner && <span className="text-blue-300"> (Owner Access)</span>}
                </h1>
                <p className="text-white/80">
                  {permissions?.isOwner 
                    ? 'You have full access to all features and can manage the entire platform.'
                    : 'Manage your backflow testing business with our comprehensive tools.'}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass border border-blue-400 glow-blue-sm rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/20 border border-blue-400 glow-blue-sm flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-blue-300" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">API Calls</h3>
                  <p className="text-2xl font-bold text-blue-300">{usage?.total_calls_today || 0}</p>
                  <p className="text-sm text-blue-300 mt-1">Today</p>
                </div>

                <div className="glass border border-blue-400 glow-blue-sm rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Users className="h-6 w-6 text-green-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">Customers</h3>
                  <p className="text-2xl font-bold text-green-400">45</p>
                  <p className="text-sm text-green-300 mt-1">Active</p>
                </div>

                <div className="glass border border-blue-400 glow-blue-sm rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">Appointments</h3>
                  <p className="text-2xl font-bold text-blue-400">3</p>
                  <p className="text-sm text-blue-300 mt-1">Scheduled</p>
                </div>

                <div className="glass border border-blue-400 glow-blue-sm rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Key className="h-6 w-6 text-purple-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">API Keys</h3>
                  <p className="text-2xl font-bold text-purple-400">{apiKeys.filter(k => k.is_active).length}</p>
                  <p className="text-sm text-purple-300 mt-1">Active</p>
                </div>
              </div>

              {/* Features Access Status */}
              <div className="glass border border-blue-400 glow-blue-sm rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-6">Feature Access</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: 'Customer Management', key: 'customer-management' },
                    { name: 'Advanced Scheduling', key: 'scheduling' },
                    { name: 'Billing & Invoices', key: 'billing' },
                    { name: 'Compliance Reports', key: 'compliance' },
                    { name: 'Analytics', key: 'analytics' },
                    { name: 'Marketing Tools', key: 'marketing' }
                  ].map((feature) => (
                    <div key={feature.key} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-white font-medium">{feature.name}</span>
                      {hasAccess(feature.key) ? (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      ) : (
                        <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs">
                          UPGRADE
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                
                {!permissions?.isOwner && (
                  <div className="mt-6 text-center">
                    <Link
                      href="/tester-portal/upgrade"
                      className="glass-btn-primary glow-blue text-white px-6 py-3 rounded-lg font-semibold hover:glow-blue transition-all"
                    >
                      Upgrade to Pro Features
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}