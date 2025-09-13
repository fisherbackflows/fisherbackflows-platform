'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  LinkIcon,
  CloudIcon,
  CpuChipIcon,
  CodeBracketIcon,
  CogIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  PlayIcon,
  PauseIcon,
  EllipsisHorizontalIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ClockIcon,
  ChartBarIcon,
  BeakerIcon,
  KeyIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import { 
  CheckCircleIcon as CheckCircleIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  XCircleIcon as XCircleIconSolid
} from '@heroicons/react/24/solid'

interface Integration {
  id: string
  name: string
  description: string
  provider: string
  category: 'accounting' | 'crm' | 'communication' | 'analytics' | 'storage' | 'automation' | 'compliance'
  status: 'active' | 'inactive' | 'error' | 'pending'
  connection_status: 'connected' | 'disconnected' | 'authenticating' | 'rate_limited'
  logo: string
  endpoints: {
    inbound: number
    outbound: number
  }
  last_sync: string
  sync_frequency: 'real_time' | 'hourly' | 'daily' | 'weekly' | 'manual'
  data_types: string[]
  settings: Record<string, any>
  metrics: {
    requests_today: number
    success_rate: number
    avg_response_time: number
    errors_today: number
  }
}

interface APIEndpoint {
  id: string
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  description: string
  integration_id: string
  status: 'active' | 'inactive' | 'deprecated'
  usage_count: number
  last_used: string
  rate_limit: {
    requests_per_minute: number
    requests_per_hour: number
  }
  authentication: 'api_key' | 'oauth2' | 'bearer_token' | 'basic_auth'
  documentation_url: string
}

interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  status: 'active' | 'inactive' | 'error'
  secret: string
  last_triggered: string
  success_count: number
  failure_count: number
  retry_policy: {
    max_attempts: number
    backoff_strategy: 'linear' | 'exponential'
  }
}

interface IntegrationTemplate {
  id: string
  name: string
  description: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  setup_time: string
  features: string[]
  documentation_url: string
  popular: boolean
}

const mockIntegrations: Integration[] = [
  {
    id: '1',
    name: 'QuickBooks Online',
    description: 'Sync invoices, payments, and customer data with QuickBooks accounting software',
    provider: 'Intuit',
    category: 'accounting',
    status: 'active',
    connection_status: 'connected',
    logo: 'QB',
    endpoints: { inbound: 4, outbound: 6 },
    last_sync: '5 minutes ago',
    sync_frequency: 'hourly',
    data_types: ['invoices', 'payments', 'customers', 'items'],
    settings: { sync_invoices: true, sync_payments: true, auto_create_customers: true },
    metrics: {
      requests_today: 247,
      success_rate: 98.4,
      avg_response_time: 340,
      errors_today: 4
    }
  },
  {
    id: '2',
    name: 'Salesforce CRM',
    description: 'Bi-directional sync of leads, opportunities, and customer relationships',
    provider: 'Salesforce',
    category: 'crm',
    status: 'active',
    connection_status: 'connected',
    logo: 'SF',
    endpoints: { inbound: 8, outbound: 12 },
    last_sync: '2 minutes ago',
    sync_frequency: 'real_time',
    data_types: ['leads', 'contacts', 'accounts', 'opportunities', 'tasks'],
    settings: { sync_leads: true, sync_opportunities: true, create_tasks: true },
    metrics: {
      requests_today: 892,
      success_rate: 99.2,
      avg_response_time: 120,
      errors_today: 7
    }
  },
  {
    id: '3',
    name: 'Twilio Communications',
    description: 'SMS notifications, voice calls, and automated messaging',
    provider: 'Twilio',
    category: 'communication',
    status: 'active',
    connection_status: 'connected',
    logo: 'TW',
    endpoints: { inbound: 3, outbound: 5 },
    last_sync: '1 hour ago',
    sync_frequency: 'real_time',
    data_types: ['sms_messages', 'call_logs', 'phone_numbers'],
    settings: { enable_sms: true, enable_voice: true, enable_webhooks: true },
    metrics: {
      requests_today: 156,
      success_rate: 97.8,
      avg_response_time: 89,
      errors_today: 3
    }
  },
  {
    id: '4',
    name: 'Google Analytics',
    description: 'Track website performance, user behavior, and conversion metrics',
    provider: 'Google',
    category: 'analytics',
    status: 'inactive',
    connection_status: 'disconnected',
    logo: 'GA',
    endpoints: { inbound: 6, outbound: 2 },
    last_sync: '3 days ago',
    sync_frequency: 'daily',
    data_types: ['page_views', 'sessions', 'conversions', 'demographics'],
    settings: { track_events: true, enable_ecommerce: false },
    metrics: {
      requests_today: 0,
      success_rate: 0,
      avg_response_time: 0,
      errors_today: 0
    }
  },
  {
    id: '5',
    name: 'Stripe Payments',
    description: 'Process payments, manage subscriptions, and handle billing',
    provider: 'Stripe',
    category: 'accounting',
    status: 'active',
    connection_status: 'connected',
    logo: 'ST',
    endpoints: { inbound: 5, outbound: 8 },
    last_sync: '1 minute ago',
    sync_frequency: 'real_time',
    data_types: ['payments', 'subscriptions', 'invoices', 'customers'],
    settings: { webhook_enabled: true, auto_reconcile: true },
    metrics: {
      requests_today: 423,
      success_rate: 99.8,
      avg_response_time: 67,
      errors_today: 1
    }
  },
  {
    id: '6',
    name: 'Water District API',
    description: 'Submit compliance reports and sync regulatory requirements',
    provider: 'Local Water Authority',
    category: 'compliance',
    status: 'error',
    connection_status: 'rate_limited',
    logo: 'WD',
    endpoints: { inbound: 2, outbound: 4 },
    last_sync: '4 hours ago',
    sync_frequency: 'daily',
    data_types: ['test_reports', 'compliance_data', 'device_registrations'],
    settings: { auto_submit_reports: true, include_photos: true },
    metrics: {
      requests_today: 89,
      success_rate: 85.4,
      avg_response_time: 2340,
      errors_today: 13
    }
  }
]

const mockEndpoints: APIEndpoint[] = [
  {
    id: '1',
    name: 'Create Customer',
    method: 'POST',
    path: '/api/customers',
    description: 'Create a new customer record with device information',
    integration_id: 'internal',
    status: 'active',
    usage_count: 1247,
    last_used: '3 minutes ago',
    rate_limit: { requests_per_minute: 100, requests_per_hour: 5000 },
    authentication: 'api_key',
    documentation_url: '/docs/api/customers'
  },
  {
    id: '2',
    name: 'Submit Test Report',
    method: 'POST',
    path: '/api/test-reports',
    description: 'Submit backflow test results and generate compliance report',
    integration_id: 'internal',
    status: 'active',
    usage_count: 892,
    last_used: '12 minutes ago',
    rate_limit: { requests_per_minute: 50, requests_per_hour: 2000 },
    authentication: 'bearer_token',
    documentation_url: '/docs/api/test-reports'
  },
  {
    id: '3',
    name: 'Get Customer Devices',
    method: 'GET',
    path: '/api/customers/{id}/devices',
    description: 'Retrieve all devices associated with a customer',
    integration_id: 'internal',
    status: 'active',
    usage_count: 2341,
    last_used: '1 minute ago',
    rate_limit: { requests_per_minute: 200, requests_per_hour: 10000 },
    authentication: 'api_key',
    documentation_url: '/docs/api/devices'
  }
]

const mockWebhooks: Webhook[] = [
  {
    id: '1',
    name: 'Test Completion Webhook',
    url: 'https://api.partner.com/webhooks/test-completed',
    events: ['test.completed', 'test.failed'],
    status: 'active',
    secret: 'whsec_test_completion_***',
    last_triggered: '2 hours ago',
    success_count: 1842,
    failure_count: 23,
    retry_policy: { max_attempts: 3, backoff_strategy: 'exponential' }
  },
  {
    id: '2',
    name: 'Customer Events',
    url: 'https://crm.system.com/hooks/customer-events',
    events: ['customer.created', 'customer.updated', 'customer.deleted'],
    status: 'active',
    secret: 'whsec_customer_events_***',
    last_triggered: '15 minutes ago',
    success_count: 567,
    failure_count: 8,
    retry_policy: { max_attempts: 5, backoff_strategy: 'linear' }
  },
  {
    id: '3',
    name: 'Invoice Notifications',
    url: 'https://accounting.app.com/webhooks/invoices',
    events: ['invoice.created', 'payment.received'],
    status: 'error',
    secret: 'whsec_invoice_notify_***',
    last_triggered: '1 day ago',
    success_count: 234,
    failure_count: 45,
    retry_policy: { max_attempts: 3, backoff_strategy: 'exponential' }
  }
]

const mockTemplates: IntegrationTemplate[] = [
  {
    id: '1',
    name: 'Accounting System Sync',
    description: 'Connect with popular accounting software for automated invoice and payment sync',
    category: 'Accounting',
    difficulty: 'easy',
    setup_time: '15 minutes',
    features: ['Invoice sync', 'Payment tracking', 'Customer data sync', 'Tax reporting'],
    documentation_url: '/docs/integrations/accounting',
    popular: true
  },
  {
    id: '2',
    name: 'CRM Integration',
    description: 'Bi-directional sync with CRM systems for lead and customer management',
    category: 'CRM',
    difficulty: 'medium',
    setup_time: '30 minutes',
    features: ['Lead sync', 'Contact management', 'Pipeline tracking', 'Activity logging'],
    documentation_url: '/docs/integrations/crm',
    popular: true
  },
  {
    id: '3',
    name: 'Communication Platform',
    description: 'Integrate SMS, email, and voice communication channels',
    category: 'Communication',
    difficulty: 'medium',
    setup_time: '25 minutes',
    features: ['SMS notifications', 'Email automation', 'Voice calls', 'Multi-channel messaging'],
    documentation_url: '/docs/integrations/communication',
    popular: false
  }
]

export default function APIIntegrations() {
  const [activeTab, setActiveTab] = useState('integrations')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20 border-green-500/30'
      case 'inactive': return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
      case 'error': return 'text-red-400 bg-red-500/20 border-red-500/30'
      case 'pending': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
      case 'connected': return 'text-green-400'
      case 'disconnected': return 'text-red-400'
      case 'authenticating': return 'text-yellow-400'
      case 'rate_limited': return 'text-orange-400'
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    }
  }

  const getConnectionIcon = (status: string) => {
    switch (status) {
      case 'connected': return CheckCircleIconSolid
      case 'disconnected': return XCircleIconSolid
      case 'authenticating': return ClockIcon
      case 'rate_limited': return ExclamationTriangleIconSolid
      default: return XCircleIconSolid
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'accounting': return CurrencyDollarIcon
      case 'crm': return UserGroupIcon
      case 'communication': return ChatBubbleLeftRightIcon
      case 'analytics': return ChartBarIcon
      case 'storage': return CloudIcon
      case 'automation': return CogIcon
      case 'compliance': return ShieldCheckIcon
      default: return LinkIcon
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-500/20'
      case 'medium': return 'text-yellow-400 bg-yellow-500/20'
      case 'hard': return 'text-red-400 bg-red-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const filteredIntegrations = mockIntegrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || integration.category === filterCategory
    const matchesStatus = filterStatus === 'all' || integration.status === filterStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link 
              href="/tester-portal/dashboard/crm"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20"
            >
              <ArrowLeftIcon className="h-5 w-5 text-white" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <LinkIcon className="h-8 w-8 mr-3 text-purple-400" />
                API Integrations
              </h1>
              <p className="text-blue-200 mt-1">Enterprise API management and third-party integrations</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300" />
              <input
                type="text"
                placeholder="Search integrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
              />
            </div>
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center">
              <PlusIcon className="h-5 w-5 mr-2" />
              New Integration
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-1 mb-8 w-fit">
          {[
            { id: 'integrations', label: 'Integrations', icon: LinkIcon },
            { id: 'endpoints', label: 'API Endpoints', icon: CodeBracketIcon },
            { id: 'webhooks', label: 'Webhooks', icon: CpuChipIcon },
            { id: 'templates', label: 'Templates', icon: DocumentTextIcon },
            { id: 'testing', label: 'API Testing', icon: BeakerIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-blue-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Sections */}
        {activeTab === 'integrations' && (
          <div className="space-y-8">
            {/* Integration Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Total Integrations</h3>
                <p className="text-3xl font-bold text-purple-400">{mockIntegrations.length}</p>
                <p className="text-blue-200 text-sm mt-1">
                  {mockIntegrations.filter(i => i.status === 'active').length} active
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-2">API Requests Today</h3>
                <p className="text-3xl font-bold text-blue-400">
                  {mockIntegrations.reduce((sum, i) => sum + i.metrics.requests_today, 0).toLocaleString()}
                </p>
                <p className="text-blue-200 text-sm mt-1">Across all integrations</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Success Rate</h3>
                <p className="text-3xl font-bold text-green-400">
                  {Math.round(mockIntegrations.reduce((sum, i) => sum + i.metrics.success_rate, 0) / mockIntegrations.length)}%
                </p>
                <p className="text-blue-200 text-sm mt-1">Average</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Errors Today</h3>
                <p className="text-3xl font-bold text-red-400">
                  {mockIntegrations.reduce((sum, i) => sum + i.metrics.errors_today, 0)}
                </p>
                <p className="text-blue-200 text-sm mt-1">Across all systems</p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all" className="bg-slate-800">All Categories</option>
                <option value="accounting" className="bg-slate-800">Accounting</option>
                <option value="crm" className="bg-slate-800">CRM</option>
                <option value="communication" className="bg-slate-800">Communication</option>
                <option value="analytics" className="bg-slate-800">Analytics</option>
                <option value="compliance" className="bg-slate-800">Compliance</option>
              </select>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all" className="bg-slate-800">All Status</option>
                <option value="active" className="bg-slate-800">Active</option>
                <option value="inactive" className="bg-slate-800">Inactive</option>
                <option value="error" className="bg-slate-800">Error</option>
                <option value="pending" className="bg-slate-800">Pending</option>
              </select>
            </div>

            {/* Integrations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {filteredIntegrations.map((integration) => {
                const CategoryIcon = getCategoryIcon(integration.category)
                const ConnectionIcon = getConnectionIcon(integration.connection_status)
                
                return (
                  <div key={integration.id} className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                          {integration.logo}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white mb-1">{integration.name}</h3>
                          <p className="text-blue-200 text-sm mb-2">{integration.description}</p>
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center">
                              <CategoryIcon className="h-4 w-4 text-blue-300 mr-1" />
                              <span className="text-blue-300 capitalize">{integration.category}</span>
                            </div>
                            <span className="text-blue-300">by {integration.provider}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <ConnectionIcon className={`h-5 w-5 ${getStatusColor(integration.connection_status)} mr-2`} />
                          <span className={`text-sm font-medium capitalize ${getStatusColor(integration.connection_status)}`}>
                            {integration.connection_status.replace('_', ' ')}
                          </span>
                        </div>
                        <button className="p-1 text-blue-300 hover:text-white">
                          <EllipsisHorizontalIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Integration Metrics */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-200 text-sm">Requests Today</p>
                            <p className="text-lg font-bold text-white">{integration.metrics.requests_today.toLocaleString()}</p>
                          </div>
                          <ChartBarIcon className="h-6 w-6 text-blue-400" />
                        </div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-200 text-sm">Success Rate</p>
                            <p className="text-lg font-bold text-white">{integration.metrics.success_rate}%</p>
                          </div>
                          <CheckCircleIcon className="h-6 w-6 text-green-400" />
                        </div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-200 text-sm">Avg Response</p>
                            <p className="text-lg font-bold text-white">{integration.metrics.avg_response_time}ms</p>
                          </div>
                          <ClockIcon className="h-6 w-6 text-purple-400" />
                        </div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-200 text-sm">Errors Today</p>
                            <p className="text-lg font-bold text-white">{integration.metrics.errors_today}</p>
                          </div>
                          <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                        </div>
                      </div>
                    </div>

                    {/* Integration Details */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between text-sm mb-3">
                        <span className="text-blue-200">Endpoints:</span>
                        <span className="text-white">{integration.endpoints.inbound} in, {integration.endpoints.outbound} out</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mb-3">
                        <span className="text-blue-200">Sync Frequency:</span>
                        <span className="text-white capitalize">{integration.sync_frequency.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mb-3">
                        <span className="text-blue-200">Last Sync:</span>
                        <span className="text-white">{integration.last_sync}</span>
                      </div>
                      <div className="text-sm">
                        <p className="text-blue-200 mb-2">Data Types:</p>
                        <div className="flex flex-wrap gap-1">
                          {integration.data_types.map((type) => (
                            <span key={type} className="px-2 py-1 bg-white/10 text-blue-300 text-xs rounded-full border border-white/20">
                              {type.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        {integration.status === 'active' ? (
                          <button className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors">
                            <PauseIcon className="h-4 w-4" />
                          </button>
                        ) : (
                          <button className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                            <PlayIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                          <CogIcon className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
                          Configure
                        </button>
                        <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors border border-white/20">
                          Test Connection
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'endpoints' && (
          <div className="space-y-6">
            {mockEndpoints.map((endpoint) => (
              <div key={endpoint.id} className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        endpoint.method === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                        endpoint.method === 'POST' ? 'bg-green-500/20 text-green-400' :
                        endpoint.method === 'PUT' ? 'bg-yellow-500/20 text-yellow-400' :
                        endpoint.method === 'DELETE' ? 'bg-red-500/20 text-red-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {endpoint.method}
                      </span>
                      <code className="text-white font-mono text-lg">{endpoint.path}</code>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{endpoint.name}</h3>
                    <p className="text-blue-200 text-sm">{endpoint.description}</p>
                  </div>
                  
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(endpoint.status)}`}>
                    {endpoint.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-blue-200 text-sm">Usage Count</p>
                    <p className="text-white font-medium">{endpoint.usage_count.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm">Last Used</p>
                    <p className="text-white font-medium">{endpoint.last_used}</p>
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm">Rate Limit</p>
                    <p className="text-white font-medium">{endpoint.rate_limit.requests_per_minute}/min</p>
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm">Authentication</p>
                    <p className="text-white font-medium capitalize">{endpoint.authentication.replace('_', ' ')}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <button className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
                      Test Endpoint
                    </button>
                    <button className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                      View Logs
                    </button>
                  </div>
                  <Link
                    href={endpoint.documentation_url}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors border border-white/20 flex items-center"
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    Documentation
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'webhooks' && (
          <div className="space-y-6">
            {mockWebhooks.map((webhook) => (
              <div key={webhook.id} className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{webhook.name}</h3>
                    <code className="text-blue-300 text-sm bg-slate-800/50 px-2 py-1 rounded">{webhook.url}</code>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(webhook.status)}`}>
                    {webhook.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-blue-200 text-sm">Events</p>
                    <p className="text-white font-medium">{webhook.events.length} configured</p>
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm">Success Rate</p>
                    <p className="text-white font-medium">
                      {Math.round((webhook.success_count / (webhook.success_count + webhook.failure_count)) * 100)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm">Last Triggered</p>
                    <p className="text-white font-medium">{webhook.last_triggered}</p>
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm">Retry Policy</p>
                    <p className="text-white font-medium">{webhook.retry_policy.max_attempts} attempts</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-white font-medium mb-2">Subscribed Events:</p>
                  <div className="flex flex-wrap gap-2">
                    {webhook.events.map((event) => (
                      <span key={event} className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full border border-purple-500/30">
                        {event}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-green-400 mr-1" />
                      <span className="text-green-400">{webhook.success_count} successes</span>
                    </div>
                    <div className="flex items-center">
                      <XCircleIcon className="h-4 w-4 text-red-400 mr-1" />
                      <span className="text-red-400">{webhook.failure_count} failures</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
                      Configure
                    </button>
                    <button className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                      Test Webhook
                    </button>
                    <button className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors border border-white/20">
                      View Logs
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockTemplates.map((template) => (
              <div key={template.id} className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{template.name}</h3>
                    <p className="text-blue-200 text-sm mb-4">{template.description}</p>
                  </div>
                  {template.popular && (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">
                      Popular
                    </span>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200 text-sm">Category</span>
                    <span className="text-white text-sm">{template.category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200 text-sm">Difficulty</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getDifficultyColor(template.difficulty)}`}>
                      {template.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200 text-sm">Setup Time</span>
                    <span className="text-white text-sm">{template.setup_time}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-white font-medium mb-2">Features:</p>
                  <ul className="space-y-1">
                    {template.features.map((feature) => (
                      <li key={feature} className="text-blue-200 text-sm flex items-center">
                        <CheckCircleIcon className="h-3 w-3 text-green-400 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex space-x-2">
                  <button className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
                    Use Template
                  </button>
                  <Link
                    href={template.documentation_url}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors border border-white/20"
                  >
                    <DocumentTextIcon className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'testing' && (
          <div className="text-center py-12">
            <BeakerIcon className="h-24 w-24 text-purple-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-4">API Testing Suite</h3>
            <p className="text-blue-200 mb-8 max-w-2xl mx-auto">
              Test your API endpoints, validate responses, and monitor performance with our comprehensive testing tools. 
              Build test suites, automate validation, and ensure your integrations are working perfectly.
            </p>
            <div className="flex justify-center space-x-4">
              <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center">
                <BeakerIcon className="h-5 w-5 mr-2" />
                Start Testing
              </button>
              <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors border border-white/20">
                View Test Results
              </button>
            </div>
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <CodeBracketIcon className="h-8 w-8 text-blue-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">Endpoint Testing</h4>
                <p className="text-blue-200 text-sm">Test individual API endpoints with custom parameters and headers</p>
              </div>
              <div className="p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <ChartBarIcon className="h-8 w-8 text-green-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">Performance Monitoring</h4>
                <p className="text-blue-200 text-sm">Monitor response times, success rates, and error patterns</p>
              </div>
              <div className="p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <ShieldCheckIcon className="h-8 w-8 text-purple-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">Automated Testing</h4>
                <p className="text-blue-200 text-sm">Set up automated test suites and continuous validation</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}