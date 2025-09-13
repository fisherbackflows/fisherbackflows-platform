'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Zap,
  Calendar,
  Mail,
  Phone,
  Bell,
  Clock,
  Users,
  Settings,
  ArrowLeft,
  Play,
  Pause,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  FileText,
  Target
} from 'lucide-react'

interface AutomationRule {
  id: string
  name: string
  description: string
  trigger: {
    type: 'test_due' | 'overdue' | 'completed' | 'invoice_sent' | 'payment_received'
    condition: string
  }
  actions: {
    type: 'email' | 'sms' | 'call_reminder' | 'invoice_generate' | 'follow_up'
    details: string
  }[]
  isActive: boolean
  lastTriggered?: string
  timesTriggered: number
  successRate: number
}

interface AutomationStats {
  totalRules: number
  activeRules: number
  triggersThisMonth: number
  successRate: number
  emailsSent: number
  remindersCreated: number
}

export default function TesterPortalAutomationPage() {
  const [automations, setAutomations] = useState<AutomationRule[]>([])
  const [stats, setStats] = useState<AutomationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    fetchAutomations()
  }, [])

  const fetchAutomations = async () => {
    try {
      // Mock data - will be replaced with real API
      const mockAutomations: AutomationRule[] = [
        {
          id: '1',
          name: 'Annual Test Reminder',
          description: 'Send email reminder 30 days before annual test is due',
          trigger: {
            type: 'test_due',
            condition: '30 days before due date'
          },
          actions: [
            {
              type: 'email',
              details: 'Send reminder email with test scheduling link'
            }
          ],
          isActive: true,
          lastTriggered: '2025-01-10T10:30:00Z',
          timesTriggered: 23,
          successRate: 89.5
        },
        {
          id: '2',
          name: 'Overdue Test Alert',
          description: 'Send urgent notification when test becomes overdue',
          trigger: {
            type: 'overdue',
            condition: 'Test past due date'
          },
          actions: [
            {
              type: 'email',
              details: 'Send overdue notice to customer'
            },
            {
              type: 'call_reminder',
              details: 'Create follow-up task for phone call'
            }
          ],
          isActive: true,
          lastTriggered: '2025-01-08T14:15:00Z',
          timesTriggered: 7,
          successRate: 95.2
        },
        {
          id: '3',
          name: 'Invoice Auto-Generation',
          description: 'Automatically create invoice when test is completed',
          trigger: {
            type: 'completed',
            condition: 'Test marked as completed'
          },
          actions: [
            {
              type: 'invoice_generate',
              details: 'Generate invoice with standard rates'
            },
            {
              type: 'email',
              details: 'Send invoice to customer'
            }
          ],
          isActive: true,
          lastTriggered: '2025-01-12T16:45:00Z',
          timesTriggered: 15,
          successRate: 100.0
        },
        {
          id: '4',
          name: 'Payment Follow-up',
          description: 'Send payment reminder 7 days after invoice due date',
          trigger: {
            type: 'invoice_sent',
            condition: '7 days after due date'
          },
          actions: [
            {
              type: 'email',
              details: 'Send payment reminder with invoice attached'
            },
            {
              type: 'follow_up',
              details: 'Schedule follow-up call task'
            }
          ],
          isActive: false,
          timesTriggered: 0,
          successRate: 0
        }
      ]

      const mockStats: AutomationStats = {
        totalRules: 4,
        activeRules: 3,
        triggersThisMonth: 45,
        successRate: 91.2,
        emailsSent: 67,
        remindersCreated: 12
      }

      setAutomations(mockAutomations)
      setStats(mockStats)
    } catch (error) {
      console.error('Failed to fetch automations:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleAutomation = async (id: string) => {
    setAutomations(prev => prev.map(automation => 
      automation.id === id 
        ? { ...automation, isActive: !automation.isActive }
        : automation
    ))
    // In real app, would make API call here
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'sms': return <MessageSquare className="h-4 w-4" />
      case 'call_reminder': return <Phone className="h-4 w-4" />
      case 'invoice_generate': return <FileText className="h-4 w-4" />
      case 'follow_up': return <Bell className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const getTriggerColor = (type: string) => {
    switch (type) {
      case 'test_due': return 'text-blue-400 bg-blue-400/20'
      case 'overdue': return 'text-red-400 bg-red-400/20'
      case 'completed': return 'text-green-400 bg-green-400/20'
      case 'invoice_sent': return 'text-purple-400 bg-purple-400/20'
      case 'payment_received': return 'text-emerald-400 bg-emerald-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  const filteredAutomations = selectedCategory === 'all' 
    ? automations 
    : automations.filter(automation => 
        selectedCategory === 'active' ? automation.isActive : !automation.isActive
      )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-white/80">Loading automation rules...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900">
      {/* Header */}
      <header className="border-b border-cyan-400/20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/tester-portal/dashboard/crm" className="text-cyan-400 hover:text-white">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div className="flex items-center space-x-3">
                <Zap className="h-8 w-8 text-cyan-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Workflow Automation</h1>
                  <p className="text-cyan-400">Smart business process automation</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="bg-cyan-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-cyan-700 transition-colors flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>New Rule</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Automation Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-300 text-sm font-medium">Active Rules</p>
                  <p className="text-3xl font-bold text-white">{stats.activeRules}</p>
                </div>
                <Zap className="h-8 w-8 text-cyan-400" />
              </div>
              <p className="text-green-400 text-sm mt-2">of {stats.totalRules} total rules</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-300 text-sm font-medium">Triggers This Month</p>
                  <p className="text-3xl font-bold text-white">{stats.triggersThisMonth}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
              <p className="text-green-400 text-sm mt-2">+{Math.round(stats.triggersThisMonth * 0.15)} from last month</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-300 text-sm font-medium">Success Rate</p>
                  <p className="text-3xl font-bold text-white">{stats.successRate.toFixed(1)}%</p>
                </div>
                <Target className="h-8 w-8 text-purple-400" />
              </div>
              <p className="text-green-400 text-sm mt-2">High performance</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-300 text-sm font-medium">Emails Sent</p>
                  <p className="text-3xl font-bold text-white">{stats.emailsSent}</p>
                </div>
                <Mail className="h-8 w-8 text-blue-400" />
              </div>
              <p className="text-blue-400 text-sm mt-2">{stats.remindersCreated} reminders created</p>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-cyan-400/20">
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'All Rules', count: automations.length },
              { key: 'active', label: 'Active', count: automations.filter(a => a.isActive).length },
              { key: 'inactive', label: 'Inactive', count: automations.filter(a => !a.isActive).length }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setSelectedCategory(filter.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === filter.key
                    ? 'bg-cyan-600 text-white'
                    : 'text-cyan-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>

        {/* Automation Rules */}
        <div className="space-y-4">
          {filteredAutomations.map((automation) => (
            <div 
              key={automation.id}
              className={`bg-white/10 backdrop-blur-sm border rounded-xl p-6 transition-all duration-200 ${
                automation.isActive 
                  ? 'border-cyan-400/20 hover:bg-white/15' 
                  : 'border-gray-400/20 hover:bg-white/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-bold text-white">{automation.name}</h3>
                    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getTriggerColor(automation.trigger.type)}`}>
                      <span className="capitalize">{automation.trigger.type.replace('_', ' ')}</span>
                    </div>
                    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                      automation.isActive ? 'text-green-400 bg-green-400/20' : 'text-gray-400 bg-gray-400/20'
                    }`}>
                      {automation.isActive ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                      <span>{automation.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>

                  <p className="text-white/80 text-sm mb-4">{automation.description}</p>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Trigger */}
                    <div>
                      <p className="text-white/60 text-xs uppercase tracking-wide mb-2">Trigger</p>
                      <div className="p-3 bg-white/5 rounded-lg">
                        <p className="text-white text-sm font-medium">When: {automation.trigger.condition}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div>
                      <p className="text-white/60 text-xs uppercase tracking-wide mb-2">Actions ({automation.actions.length})</p>
                      <div className="space-y-2">
                        {automation.actions.map((action, index) => (
                          <div key={index} className="flex items-center space-x-2 p-2 bg-white/5 rounded-lg">
                            {getActionIcon(action.type)}
                            <span className="text-white/80 text-sm">{action.details}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Performance Stats */}
                  <div className="mt-4 grid grid-cols-3 gap-4 p-4 bg-cyan-500/10 border border-cyan-400/20 rounded-lg">
                    <div className="text-center">
                      <p className="text-white font-bold text-lg">{automation.timesTriggered}</p>
                      <p className="text-white/60 text-xs">Times Triggered</p>
                    </div>
                    <div className="text-center">
                      <p className="text-green-400 font-bold text-lg">{automation.successRate.toFixed(1)}%</p>
                      <p className="text-white/60 text-xs">Success Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white/80 text-sm">
                        {automation.lastTriggered 
                          ? new Date(automation.lastTriggered).toLocaleDateString()
                          : 'Never'
                        }
                      </p>
                      <p className="text-white/60 text-xs">Last Triggered</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="ml-6 flex flex-col space-y-2">
                  <button
                    onClick={() => toggleAutomation(automation.id)}
                    className={`p-2 rounded-lg transition-all ${
                      automation.isActive
                        ? 'bg-yellow-600/20 border border-yellow-400/30 text-yellow-300 hover:bg-yellow-600/30'
                        : 'bg-green-600/20 border border-green-400/30 text-green-300 hover:bg-green-600/30'
                    }`}
                    title={automation.isActive ? 'Pause Automation' : 'Activate Automation'}
                  >
                    {automation.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button 
                    className="p-2 bg-blue-600/20 border border-blue-400/30 text-blue-300 hover:bg-blue-600/30 hover:text-white rounded-lg transition-all"
                    title="Edit Rule"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    className="p-2 bg-red-600/20 border border-red-400/30 text-red-300 hover:bg-red-600/30 hover:text-white rounded-lg transition-all"
                    title="Delete Rule"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredAutomations.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-md mx-auto">
              <Zap className="h-16 w-16 text-cyan-400/50 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Automation Rules</h3>
              <p className="text-white/80 mb-4">
                {selectedCategory === 'all' 
                  ? 'Create your first automation rule to streamline your business processes.'
                  : `No ${selectedCategory} automation rules found.`
                }
              </p>
              <button className="inline-flex items-center px-4 py-2 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                Create Automation Rule
              </button>
            </div>
          </div>
        )}

        {/* Popular Templates */}
        <div className="mt-12 bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Popular Automation Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-white/5 border border-cyan-400/20 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3 mb-3">
                <Calendar className="h-6 w-6 text-blue-400" />
                <h4 className="text-white font-medium">Test Reminder Series</h4>
              </div>
              <p className="text-white/80 text-sm">
                Complete automation for test reminders: 30-day, 7-day, and overdue notifications.
              </p>
            </div>

            <div className="p-4 bg-white/5 border border-cyan-400/20 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3 mb-3">
                <FileText className="h-6 w-6 text-green-400" />
                <h4 className="text-white font-medium">Invoice Workflow</h4>
              </div>
              <p className="text-white/80 text-sm">
                Auto-generate and send invoices when tests are completed, with payment reminders.
              </p>
            </div>

            <div className="p-4 bg-white/5 border border-cyan-400/20 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3 mb-3">
                <Users className="h-6 w-6 text-purple-400" />
                <h4 className="text-white font-medium">Customer Onboarding</h4>
              </div>
              <p className="text-white/80 text-sm">
                Welcome new customers with information packets and schedule their first test.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}