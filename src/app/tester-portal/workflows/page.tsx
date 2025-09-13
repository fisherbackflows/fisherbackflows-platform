'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  Cog6ToothIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisHorizontalIcon,
  ClockIcon,
  BoltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CodeBracketIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { 
  PlayIcon as PlayIconSolid,
  PauseIcon as PauseIconSolid,
  StopIcon as StopIconSolid 
} from '@heroicons/react/24/solid'

interface WorkflowStep {
  id: string
  type: 'trigger' | 'condition' | 'action' | 'delay'
  name: string
  description: string
  settings: Record<string, any>
  position: { x: number; y: number }
}

interface Workflow {
  id: string
  name: string
  description: string
  category: 'customer_service' | 'operations' | 'marketing' | 'billing' | 'quality_assurance'
  status: 'active' | 'paused' | 'draft' | 'archived'
  trigger_type: 'manual' | 'scheduled' | 'event_based' | 'api_webhook'
  steps: WorkflowStep[]
  stats: {
    executions: number
    success_rate: number
    avg_execution_time: string
    last_run: string
  }
  created_at: string
  updated_at: string
}

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  complexity: 'simple' | 'intermediate' | 'advanced'
  estimated_setup_time: string
  use_cases: string[]
}

interface WorkflowExecution {
  id: string
  workflow_id: string
  workflow_name: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  started_at: string
  completed_at?: string
  duration?: string
  steps_completed: number
  total_steps: number
  error_message?: string
}

const mockWorkflows: Workflow[] = [
  {
    id: '1',
    name: 'New Customer Onboarding',
    description: 'Automated workflow for new customer registration, welcome email, and initial setup',
    category: 'customer_service',
    status: 'active',
    trigger_type: 'event_based',
    steps: [
      { id: '1', type: 'trigger', name: 'Customer Registered', description: 'Trigger when new customer signs up', settings: {}, position: { x: 0, y: 0 } },
      { id: '2', type: 'action', name: 'Send Welcome Email', description: 'Send personalized welcome email', settings: { template: 'welcome', delay: 0 }, position: { x: 1, y: 0 } },
      { id: '3', type: 'action', name: 'Create Initial Device Records', description: 'Set up basic device tracking', settings: {}, position: { x: 2, y: 0 } },
      { id: '4', type: 'action', name: 'Schedule Follow-up Call', description: 'Book initial consultation call', settings: { delay: '24h' }, position: { x: 3, y: 0 } }
    ],
    stats: {
      executions: 247,
      success_rate: 94.3,
      avg_execution_time: '2.4 min',
      last_run: '2 hours ago'
    },
    created_at: '2024-01-05',
    updated_at: '2024-01-14'
  },
  {
    id: '2',
    name: 'Test Due Reminder System',
    description: 'Multi-channel reminder system for upcoming backflow tests',
    category: 'operations',
    status: 'active',
    trigger_type: 'scheduled',
    steps: [
      { id: '1', type: 'trigger', name: 'Daily Schedule Check', description: 'Check for tests due in next 30 days', settings: { schedule: 'daily', time: '08:00' }, position: { x: 0, y: 0 } },
      { id: '2', type: 'condition', name: 'Test Due Filter', description: 'Filter tests by due date ranges', settings: { ranges: ['30d', '14d', '7d', '1d'] }, position: { x: 1, y: 0 } },
      { id: '3', type: 'action', name: 'Send Email Notification', description: 'Email reminder to customers', settings: { template: 'test_reminder' }, position: { x: 2, y: 0 } },
      { id: '4', type: 'action', name: 'SMS Alert (7 days)', description: 'SMS for urgent reminders', settings: { condition: '7d_or_less' }, position: { x: 2, y: 1 } },
      { id: '5', type: 'action', name: 'Create Task for Tester', description: 'Assign follow-up task', settings: {}, position: { x: 3, y: 0 } }
    ],
    stats: {
      executions: 1843,
      success_rate: 98.7,
      avg_execution_time: '45 sec',
      last_run: '8 hours ago'
    },
    created_at: '2023-12-20',
    updated_at: '2024-01-10'
  },
  {
    id: '3',
    name: 'Failed Test Follow-up',
    description: 'Automated follow-up process for failed backflow tests',
    category: 'quality_assurance',
    status: 'active',
    trigger_type: 'event_based',
    steps: [
      { id: '1', type: 'trigger', name: 'Test Failed', description: 'Trigger on test failure', settings: {}, position: { x: 0, y: 0 } },
      { id: '2', type: 'action', name: 'Immediate Customer Notification', description: 'Alert customer of failure', settings: { method: 'email_sms' }, position: { x: 1, y: 0 } },
      { id: '3', type: 'action', name: 'Schedule Repair Quote', description: 'Book repair assessment', settings: { priority: 'high' }, position: { x: 2, y: 0 } },
      { id: '4', type: 'action', name: 'Notify Water District', description: 'Report failure to authorities', settings: { delay: '24h' }, position: { x: 3, y: 0 } },
      { id: '5', type: 'condition', name: 'Check Repair Status', description: 'Monitor repair completion', settings: { check_interval: '7d' }, position: { x: 4, y: 0 } },
      { id: '6', type: 'action', name: 'Schedule Retest', description: 'Book follow-up test', settings: {}, position: { x: 5, y: 0 } }
    ],
    stats: {
      executions: 89,
      success_rate: 91.0,
      avg_execution_time: '12.3 min',
      last_run: '1 day ago'
    },
    created_at: '2024-01-02',
    updated_at: '2024-01-12'
  },
  {
    id: '4',
    name: 'Monthly Billing Automation',
    description: 'Generate and send monthly invoices with payment processing',
    category: 'billing',
    status: 'paused',
    trigger_type: 'scheduled',
    steps: [
      { id: '1', type: 'trigger', name: 'Monthly Schedule', description: 'Run on 1st of each month', settings: { schedule: 'monthly', day: 1 }, position: { x: 0, y: 0 } },
      { id: '2', type: 'action', name: 'Generate Invoices', description: 'Create monthly invoices', settings: {}, position: { x: 1, y: 0 } },
      { id: '3', type: 'action', name: 'Send Invoice Emails', description: 'Email invoices to customers', settings: { template: 'monthly_invoice' }, position: { x: 2, y: 0 } },
      { id: '4', type: 'delay', name: 'Payment Grace Period', description: 'Wait 14 days for payment', settings: { duration: '14d' }, position: { x: 3, y: 0 } },
      { id: '5', type: 'condition', name: 'Check Payment Status', description: 'Verify payment received', settings: {}, position: { x: 4, y: 0 } },
      { id: '6', type: 'action', name: 'Send Payment Reminder', description: 'Reminder for unpaid invoices', settings: {}, position: { x: 5, y: 0 } }
    ],
    stats: {
      executions: 12,
      success_rate: 100.0,
      avg_execution_time: '8.7 min',
      last_run: '15 days ago'
    },
    created_at: '2023-11-15',
    updated_at: '2024-01-08'
  }
]

const mockTemplates: WorkflowTemplate[] = [
  {
    id: '1',
    name: 'Lead Nurturing Sequence',
    description: 'Multi-touch email sequence for converting prospects to customers',
    category: 'Marketing',
    complexity: 'intermediate',
    estimated_setup_time: '30 minutes',
    use_cases: ['Lead conversion', 'Customer acquisition', 'Email marketing']
  },
  {
    id: '2',
    name: 'Equipment Maintenance Scheduler',
    description: 'Automated scheduling and tracking of equipment maintenance',
    category: 'Operations',
    complexity: 'advanced',
    estimated_setup_time: '45 minutes',
    use_cases: ['Preventive maintenance', 'Asset management', 'Cost optimization']
  },
  {
    id: '3',
    name: 'Customer Feedback Collection',
    description: 'Automated post-service feedback requests and analysis',
    category: 'Customer Service',
    complexity: 'simple',
    estimated_setup_time: '15 minutes',
    use_cases: ['Service quality', 'Customer satisfaction', 'Process improvement']
  }
]

const mockExecutions: WorkflowExecution[] = [
  {
    id: '1',
    workflow_id: '1',
    workflow_name: 'New Customer Onboarding',
    status: 'completed',
    started_at: '2024-01-15T10:30:00',
    completed_at: '2024-01-15T10:32:24',
    duration: '2m 24s',
    steps_completed: 4,
    total_steps: 4
  },
  {
    id: '2',
    workflow_id: '2',
    workflow_name: 'Test Due Reminder System',
    status: 'running',
    started_at: '2024-01-15T08:00:00',
    steps_completed: 3,
    total_steps: 5
  },
  {
    id: '3',
    workflow_id: '3',
    workflow_name: 'Failed Test Follow-up',
    status: 'failed',
    started_at: '2024-01-14T15:45:00',
    completed_at: '2024-01-14T15:52:15',
    duration: '7m 15s',
    steps_completed: 3,
    total_steps: 6,
    error_message: 'Failed to send SMS notification - invalid phone number'
  }
]

export default function AdvancedWorkflows() {
  const [activeTab, setActiveTab] = useState('workflows')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20 border-green-500/30'
      case 'paused': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
      case 'draft': return 'text-blue-400 bg-blue-500/20 border-blue-500/30'
      case 'archived': return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
      case 'running': return 'text-blue-400 bg-blue-500/20 border-blue-500/30'
      case 'completed': return 'text-green-400 bg-green-500/20 border-green-500/30'
      case 'failed': return 'text-red-400 bg-red-500/20 border-red-500/30'
      case 'cancelled': return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'customer_service': return UserGroupIcon
      case 'operations': return Cog6ToothIcon
      case 'marketing': return ChartBarIcon
      case 'billing': return CurrencyDollarIcon
      case 'quality_assurance': return CheckCircleIcon
      default: return Cog6ToothIcon
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'text-green-400 bg-green-500/20'
      case 'intermediate': return 'text-yellow-400 bg-yellow-500/20'
      case 'advanced': return 'text-red-400 bg-red-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const filteredWorkflows = mockWorkflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || workflow.category === filterCategory
    const matchesStatus = filterStatus === 'all' || workflow.status === filterStatus
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
                <BoltIcon className="h-8 w-8 mr-3 text-yellow-400" />
                Advanced Workflows
              </h1>
              <p className="text-blue-200 mt-1">Enterprise automation and business process management</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300" />
              <input
                type="text"
                placeholder="Search workflows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 backdrop-blur-sm"
              />
            </div>
            <button className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors flex items-center">
              <PlusIcon className="h-5 w-5 mr-2" />
              New Workflow
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-1 mb-8 w-fit">
          {[
            { id: 'workflows', label: 'Active Workflows', icon: BoltIcon },
            { id: 'templates', label: 'Templates', icon: DocumentTextIcon },
            { id: 'executions', label: 'Execution History', icon: ClockIcon },
            { id: 'builder', label: 'Workflow Builder', icon: CodeBracketIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                activeTab === tab.id
                  ? 'bg-yellow-600 text-white'
                  : 'text-blue-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Sections */}
        {activeTab === 'workflows' && (
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Total Workflows</h3>
                <p className="text-3xl font-bold text-yellow-400">{mockWorkflows.length}</p>
                <p className="text-blue-200 text-sm mt-1">
                  {mockWorkflows.filter(w => w.status === 'active').length} active
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Total Executions</h3>
                <p className="text-3xl font-bold text-blue-400">
                  {mockWorkflows.reduce((sum, w) => sum + w.stats.executions, 0).toLocaleString()}
                </p>
                <p className="text-blue-200 text-sm mt-1">This month</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Success Rate</h3>
                <p className="text-3xl font-bold text-green-400">
                  {Math.round(mockWorkflows.reduce((sum, w) => sum + w.stats.success_rate, 0) / mockWorkflows.length)}%
                </p>
                <p className="text-blue-200 text-sm mt-1">Average</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Time Saved</h3>
                <p className="text-3xl font-bold text-purple-400">847h</p>
                <p className="text-blue-200 text-sm mt-1">This month</p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="all" className="bg-slate-800">All Categories</option>
                <option value="customer_service" className="bg-slate-800">Customer Service</option>
                <option value="operations" className="bg-slate-800">Operations</option>
                <option value="marketing" className="bg-slate-800">Marketing</option>
                <option value="billing" className="bg-slate-800">Billing</option>
                <option value="quality_assurance" className="bg-slate-800">Quality Assurance</option>
              </select>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="all" className="bg-slate-800">All Status</option>
                <option value="active" className="bg-slate-800">Active</option>
                <option value="paused" className="bg-slate-800">Paused</option>
                <option value="draft" className="bg-slate-800">Draft</option>
                <option value="archived" className="bg-slate-800">Archived</option>
              </select>
            </div>

            {/* Workflows List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {filteredWorkflows.map((workflow) => {
                const CategoryIcon = getCategoryIcon(workflow.category)
                
                return (
                  <div key={workflow.id} className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3">
                        <CategoryIcon className="h-8 w-8 text-yellow-400 mt-1" />
                        <div>
                          <h3 className="text-xl font-semibold text-white mb-2">{workflow.name}</h3>
                          <p className="text-blue-200 text-sm mb-3">{workflow.description}</p>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-blue-300 capitalize">{workflow.category.replace('_', ' ')}</span>
                            <span className="text-blue-300 capitalize">{workflow.trigger_type.replace('_', ' ')} trigger</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(workflow.status)}`}>
                          {workflow.status}
                        </span>
                        <button className="p-1 text-blue-300 hover:text-white">
                          <EllipsisHorizontalIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Workflow Steps Preview */}
                    <div className="mb-6">
                      <p className="text-white font-medium mb-3">{workflow.steps.length} Steps:</p>
                      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                        {workflow.steps.map((step, index) => (
                          <div key={step.id} className="flex items-center space-x-2 flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                              step.type === 'trigger' ? 'bg-green-500/20 text-green-400' :
                              step.type === 'condition' ? 'bg-yellow-500/20 text-yellow-400' :
                              step.type === 'action' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-purple-500/20 text-purple-400'
                            }`}>
                              {index + 1}
                            </div>
                            {index < workflow.steps.length - 1 && (
                              <ArrowPathIcon className="h-3 w-3 text-blue-300 rotate-90" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-200 text-sm">Executions</p>
                            <p className="text-lg font-bold text-white">{workflow.stats.executions.toLocaleString()}</p>
                          </div>
                          <PlayIconSolid className="h-6 w-6 text-green-400" />
                        </div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-200 text-sm">Success Rate</p>
                            <p className="text-lg font-bold text-white">{workflow.stats.success_rate}%</p>
                          </div>
                          <CheckCircleIcon className="h-6 w-6 text-green-400" />
                        </div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-200 text-sm">Avg Time</p>
                            <p className="text-lg font-bold text-white">{workflow.stats.avg_execution_time}</p>
                          </div>
                          <ClockIcon className="h-6 w-6 text-blue-400" />
                        </div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-200 text-sm">Last Run</p>
                            <p className="text-lg font-bold text-white text-xs">{workflow.stats.last_run}</p>
                          </div>
                          <ClockIcon className="h-6 w-6 text-purple-400" />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        {workflow.status === 'active' ? (
                          <button className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors">
                            <PauseIconSolid className="h-4 w-4" />
                          </button>
                        ) : (
                          <button className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                            <PlayIconSolid className="h-4 w-4" />
                          </button>
                        )}
                        <button className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                          <StopIconSolid className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors">
                          Edit
                        </button>
                        <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors border border-white/20">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockTemplates.map((template) => (
              <div key={template.id} className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">{template.name}</h3>
                  <p className="text-blue-200 text-sm mb-4">{template.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-blue-300 text-sm">{template.category}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(template.complexity)}`}>
                      {template.complexity}
                    </span>
                  </div>
                  
                  <div className="text-sm mb-4">
                    <p className="text-blue-200 mb-1">Setup Time: <span className="text-white">{template.estimated_setup_time}</span></p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-white font-medium mb-2">Use Cases:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.use_cases.map((useCase) => (
                      <span key={useCase} className="px-2 py-1 bg-white/10 text-blue-300 text-xs rounded-full border border-white/20">
                        {useCase}
                      </span>
                    ))}
                  </div>
                </div>

                <button className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors">
                  Use Template
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'executions' && (
          <div className="space-y-6">
            {mockExecutions.map((execution) => (
              <div key={execution.id} className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{execution.workflow_name}</h3>
                    <p className="text-blue-200 text-sm">Execution ID: {execution.id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border capitalize ${getStatusColor(execution.status)}`}>
                    {execution.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-blue-200 text-sm">Started</p>
                    <p className="text-white font-medium">{new Date(execution.started_at).toLocaleString()}</p>
                  </div>
                  {execution.completed_at && (
                    <div>
                      <p className="text-blue-200 text-sm">Completed</p>
                      <p className="text-white font-medium">{new Date(execution.completed_at).toLocaleString()}</p>
                    </div>
                  )}
                  {execution.duration && (
                    <div>
                      <p className="text-blue-200 text-sm">Duration</p>
                      <p className="text-white font-medium">{execution.duration}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-blue-200 text-sm">Progress</p>
                    <p className="text-white font-medium">{execution.steps_completed} / {execution.total_steps} steps</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-blue-200">Progress</span>
                    <span className="text-white font-medium">
                      {Math.round((execution.steps_completed / execution.total_steps) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        execution.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                        execution.status === 'failed' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                        execution.status === 'running' ? 'bg-gradient-to-r from-blue-500 to-purple-600' :
                        'bg-gradient-to-r from-gray-500 to-gray-600'
                      }`}
                      style={{ width: `${(execution.steps_completed / execution.total_steps) * 100}%` }}
                    />
                  </div>
                </div>

                {execution.error_message && (
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                      <span className="text-red-300 text-sm">{execution.error_message}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'builder' && (
          <div className="text-center py-12">
            <CodeBracketIcon className="h-24 w-24 text-yellow-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-4">Visual Workflow Builder</h3>
            <p className="text-blue-200 mb-8 max-w-2xl mx-auto">
              Create and customize complex automation workflows with our intuitive drag-and-drop interface. 
              Connect triggers, conditions, actions, and delays to build powerful business processes.
            </p>
            <div className="flex justify-center space-x-4">
              <button className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors flex items-center">
                <PlusIcon className="h-5 w-5 mr-2" />
                Create New Workflow
              </button>
              <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors border border-white/20">
                Import Workflow
              </button>
            </div>
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <BoltIcon className="h-8 w-8 text-green-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">Triggers</h4>
                <p className="text-blue-200 text-sm">Event-based, scheduled, manual, and API triggers</p>
              </div>
              <div className="p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <FunnelIcon className="h-8 w-8 text-yellow-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">Conditions</h4>
                <p className="text-blue-200 text-sm">Smart filtering and decision logic</p>
              </div>
              <div className="p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <Cog6ToothIcon className="h-8 w-8 text-blue-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">Actions</h4>
                <p className="text-blue-200 text-sm">Email, SMS, tasks, API calls, and more</p>
              </div>
              <div className="p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <ClockIcon className="h-8 w-8 text-purple-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">Delays</h4>
                <p className="text-blue-200 text-sm">Time-based workflow pauses and scheduling</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}