'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bell, Calendar, Mail, Phone, Send, Plus, Play, Pause, CheckCircle, Edit, Trash2, Settings, Clock, AlertTriangle, FileText } from 'lucide-react'

interface UserPermissions {
  isOwner: boolean
  subscriptions: string[]
  userInfo: any
}

interface ReminderRule {
  id: string
  name: string
  description: string
  triggerType: 'days_before_due' | 'days_after_due' | 'monthly' | 'custom_date'
  triggerValue: number
  customerType: 'all' | 'residential' | 'commercial' | 'industrial'
  waterDistrict: 'all' | string
  contactMethod: 'email' | 'phone' | 'text' | 'mail' | 'all_preferred'
  template: string
  active: boolean
  lastRun: string | null
  nextRun: string | null
  totalSent: number
  successRate: number
  autoSchedule: boolean
  createdDate: string
}

interface ScheduledReminder {
  id: string
  ruleId: string
  ruleName: string
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  contactMethod: 'email' | 'phone' | 'text' | 'mail'
  scheduledDate: string
  scheduledTime: string
  status: 'scheduled' | 'sent' | 'delivered' | 'failed' | 'responded'
  message: string
  sentDate?: string
  responseDate?: string
  appointmentScheduled?: boolean
  devicesDue: {
    type: string
    serialNumber: string
    dueDate: string
  }[]
  retryCount: number
  lastError?: string
}

export default function RemindersPage() {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'rules' | 'scheduled' | 'sent'>('rules')
  const [rules, setRules] = useState<ReminderRule[]>([])
  const [scheduledReminders, setScheduledReminders] = useState<ScheduledReminder[]>([])

  useEffect(() => {
    fetchPermissions()
  }, [])

  useEffect(() => {
    if (permissions && hasAccess('communications')) {
      loadReminderData()
    }
  }, [permissions])

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/tester-portal/permissions')
      if (response.ok) {
        const data = await response.json()
        setPermissions(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const hasAccess = (feature: string) => {
    if (!permissions) return false
    return permissions.isOwner || permissions.subscriptions.includes(feature)
  }

  const loadReminderData = async () => {
    try {
      const response = await fetch('/api/tester-portal/reminders')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setRules(data.rules || [])
          setScheduledReminders(data.scheduled || [])
        }
      }
    } catch (error) {
      console.error('Failed to load reminder data:', error)
    }
  }

  const toggleRuleStatus = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/tester-portal/reminders/${ruleId}/toggle`, {
        method: 'POST'
      })
      
      if (response.ok) {
        setRules(prev => prev.map(rule => 
          rule.id === ruleId ? { ...rule, active: !rule.active } : rule
        ))
      }
    } catch (error) {
      console.error('Failed to toggle rule status:', error)
    }
  }

  const runRuleNow = async (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId)
    if (!rule) return

    try {
      const response = await fetch(`/api/tester-portal/reminders/${ruleId}/run`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setRules(prev => prev.map(r => 
          r.id === ruleId 
            ? { ...r, lastRun: new Date().toISOString().split('T')[0], totalSent: r.totalSent + data.remindersSent }
            : r
        ))
        alert(`Rule "${rule.name}" executed successfully! ${data.remindersSent} reminders scheduled.`)
      }
    } catch (error) {
      alert('Error running rule. Please try again.')
    }
  }

  const sendReminderNow = async (reminderId: string) => {
    try {
      const response = await fetch(`/api/tester-portal/reminders/send/${reminderId}`, {
        method: 'POST'
      })
      
      if (response.ok) {
        setScheduledReminders(prev => prev.map(reminder => 
          reminder.id === reminderId 
            ? { 
                ...reminder, 
                status: 'sent', 
                sentDate: new Date().toISOString().split('T')[0] 
              }
            : reminder
        ))
        alert('Reminder sent successfully!')
      }
    } catch (error) {
      alert('Error sending reminder. Please try again.')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const getReminderStats = () => {
    const total = scheduledReminders.length
    const scheduled = scheduledReminders.filter(r => r.status === 'scheduled').length
    const sent = scheduledReminders.filter(r => r.status === 'sent' || r.status === 'delivered').length
    const failed = scheduledReminders.filter(r => r.status === 'failed').length
    
    return { total, scheduled, sent, failed }
  }

  if (!hasAccess('communications') && !permissions?.isOwner) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
            <Bell className="h-8 w-8 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Automated Reminders</h2>
          <p className="text-white/80 mb-6">
            This feature requires a communications subscription to create and manage automated customer reminders.
          </p>
          <div className="space-y-3">
            <Link
              href="/tester-portal/upgrade"
              className="block glass-btn-primary glow-blue text-white px-6 py-3 rounded-lg font-semibold hover:glow-blue transition-all"
            >
              Upgrade to Access
            </Link>
            <Link
              href="/tester-portal/dashboard"
              className="block text-blue-300 hover:text-white transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-4 text-white/80">Loading reminder system...</p>
        </div>
      </div>
    )
  }

  const stats = getReminderStats()

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-blue-400/20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <Bell className="h-8 w-8 text-blue-300 mr-3" />
                Automated Reminders
                {permissions?.isOwner && (
                  <span className="ml-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    OWNER ACCESS
                  </span>
                )}
              </h1>
              <p className="text-white/80 mt-2">Manage customer notification rules and scheduled reminders</p>
            </div>
            <Link
              href="/tester-portal/reminders/new"
              className="glass-btn-primary glow-blue text-white px-6 py-3 rounded-lg font-semibold hover:glow-blue transition-all"
            >
              <Plus className="h-5 w-5 inline mr-2" />
              New Rule
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="bg-black/40 backdrop-blur-sm border border-blue-400/20 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">System Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-blue-500/20 to-blue-500/20 border border-blue-400/30 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-300">{rules.filter(r => r.active).length}</div>
              <div className="text-sm text-blue-300 mt-1">Active Rules</div>
            </div>
            <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-400/30 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-yellow-400">{stats.scheduled}</div>
              <div className="text-sm text-yellow-300 mt-1">Scheduled</div>
            </div>
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-green-400">{stats.sent}</div>
              <div className="text-sm text-green-300 mt-1">Sent Today</div>
            </div>
            <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-400/30 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-red-400">{stats.failed}</div>
              <div className="text-sm text-red-300 mt-1">Failed</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-black/40 backdrop-blur-sm border border-blue-400/20 rounded-xl p-6 mb-8">
          <div className="flex space-x-2 bg-black/20 p-2 rounded-lg">
            {[
              { key: 'rules', label: 'Automation Rules', icon: Settings },
              { key: 'scheduled', label: 'Scheduled', icon: Clock },
              { key: 'sent', label: 'Sent History', icon: CheckCircle }
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? 'glass-btn-primary glow-blue text-white'
                      : 'text-blue-300 hover:text-white hover:bg-blue-500/20 border border-blue-400 glow-blue-sm'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Automation Rules Tab */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            {rules.map((rule) => (
              <div key={rule.id} className="bg-black/40 backdrop-blur-sm border border-blue-400/20 rounded-xl p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">{rule.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        rule.active 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                          : 'bg-gray-500/20 text-gray-300'
                      }`}>
                        {rule.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      {rule.autoSchedule && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium glass-btn-primary glow-blue text-white">
                          AUTO-SCHEDULE
                        </span>
                      )}
                    </div>
                    <p className="text-white/80">{rule.description}</p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => toggleRuleStatus(rule.id)}
                      className="bg-blue-500/20 border border-blue-400 glow-blue-sm text-blue-300 px-4 py-2 rounded-lg font-semibold hover:glow-blue/30 transition-all"
                    >
                      {rule.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => runRuleNow(rule.id)}
                      disabled={!rule.active}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div>
                    <div className="text-sm text-blue-300 mb-1">Trigger</div>
                    <div className="text-white font-medium">
                      {rule.triggerValue} days {rule.triggerType.includes('before') ? 'before' : 'after'} due
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-blue-300 mb-1">Contact Method</div>
                    <div className="text-white font-medium capitalize">{rule.contactMethod.replace('_', ' ')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-blue-300 mb-1">Customer Type</div>
                    <div className="text-white font-medium capitalize">{rule.customerType}</div>
                  </div>
                  <div>
                    <div className="text-sm text-blue-300 mb-1">Success Rate</div>
                    <div className="text-green-400 font-medium">{rule.successRate}%</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-blue-300 mb-6">
                  <div>
                    <span>Last run: {formatDate(rule.lastRun)}</span>
                    <span className="mx-3">•</span>
                    <span>Total sent: {rule.totalSent}</span>
                  </div>
                  <div>
                    Next run: {formatDate(rule.nextRun)}
                  </div>
                </div>

                {/* Message Preview */}
                <div className="bg-black/20 border border-blue-400/20 rounded-lg p-4 mb-6">
                  <div className="text-sm font-medium text-blue-300 mb-2">Message Preview:</div>
                  <div className="text-sm text-white line-clamp-3">
                    {rule.template.split('\n')[0]}...
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-blue-400/20">
                  <div className="flex space-x-3">
                    <button className="bg-blue-500/20 border border-blue-400 glow-blue-sm text-blue-300 px-4 py-2 rounded-lg font-semibold hover:glow-blue/30 transition-all">
                      <Edit className="h-4 w-4 inline mr-2" />
                      Edit
                    </button>
                    <button className="bg-purple-500/20 text-purple-400 px-4 py-2 rounded-lg font-semibold hover:bg-purple-500/30 transition-all">
                      <FileText className="h-4 w-4 inline mr-2" />
                      Template
                    </button>
                  </div>
                  <button className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg font-semibold hover:bg-red-500/30 transition-all">
                    <Trash2 className="h-4 w-4 inline mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {rules.length === 0 && (
              <div className="bg-black/40 backdrop-blur-sm border border-blue-400/20 rounded-xl p-12 text-center">
                <Bell className="h-16 w-16 text-blue-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-4">No automation rules</h3>
                <p className="text-white/80 text-lg mb-6">Create your first rule to start sending automated reminders</p>
                <Link
                  href="/tester-portal/reminders/new"
                  className="glass-btn-primary glow-blue text-white px-8 py-3 rounded-lg font-semibold hover:glow-blue transition-all inline-block"
                >
                  <Plus className="h-5 w-5 inline mr-2" />
                  Create First Rule
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Scheduled Reminders Tab */}
        {activeTab === 'scheduled' && (
          <div className="space-y-6">
            {scheduledReminders.filter(r => r.status === 'scheduled').map((reminder) => (
              <div key={reminder.id} className="bg-black/40 backdrop-blur-sm border border-blue-400/20 rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">{reminder.customerName}</h3>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-400/30 text-yellow-400">
                        {reminder.contactMethod.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-white/80">Rule: {reminder.ruleName}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium text-lg">
                      {formatDate(reminder.scheduledDate)} at {reminder.scheduledTime}
                    </div>
                    {reminder.retryCount > 0 && (
                      <div className="text-red-400 text-sm">Retry #{reminder.retryCount}</div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-blue-300 font-medium">Contact: </span>
                    <span className="text-white">
                      {reminder.contactMethod === 'email' ? reminder.customerEmail : reminder.customerPhone}
                    </span>
                  </div>

                  <div>
                    <span className="text-blue-300 font-medium">Devices Due: </span>
                    <div className="mt-2 space-y-1">
                      {reminder.devicesDue.map((device, idx) => (
                        <div key={idx} className="text-white bg-black/20 rounded px-3 py-2">
                          {device.type} ({device.serialNumber}) - Due {formatDate(device.dueDate)}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-black/20 border border-blue-400/20 rounded-lg p-4">
                    <div className="text-sm font-medium text-blue-300 mb-2">Message:</div>
                    <div className="text-sm text-white">
                      {reminder.message}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-blue-400/20 mt-6">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => sendReminderNow(reminder.id)}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all"
                    >
                      <Send className="h-4 w-4 inline mr-2" />
                      Send Now
                    </button>
                    <button className="bg-blue-500/20 border border-blue-400 glow-blue-sm text-blue-300 px-4 py-2 rounded-lg font-semibold hover:glow-blue/30 transition-all">
                      <Edit className="h-4 w-4 inline mr-2" />
                      Edit
                    </button>
                  </div>
                  <button className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg font-semibold hover:bg-red-500/30 transition-all">
                    <Trash2 className="h-4 w-4 inline mr-2" />
                    Cancel
                  </button>
                </div>
              </div>
            ))}

            {scheduledReminders.filter(r => r.status === 'scheduled').length === 0 && (
              <div className="bg-black/40 backdrop-blur-sm border border-blue-400/20 rounded-xl p-12 text-center">
                <Clock className="h-16 w-16 text-blue-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-4">No scheduled reminders</h3>
                <p className="text-white/80 text-lg">Your automation rules will generate scheduled reminders here</p>
              </div>
            )}
          </div>
        )}

        {/* Sent History Tab */}
        {activeTab === 'sent' && (
          <div className="space-y-6">
            {scheduledReminders.filter(r => ['sent', 'delivered', 'failed'].includes(r.status)).map((reminder) => (
              <div key={reminder.id} className="bg-black/40 backdrop-blur-sm border border-blue-400/20 rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">{reminder.customerName}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        reminder.status === 'sent' ? 'glass-btn-primary glow-blue text-white' :
                        reminder.status === 'delivered' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                        'bg-gradient-to-r from-red-500 to-red-600 text-white'
                      }`}>
                        {reminder.status.toUpperCase()}
                      </span>
                      {reminder.appointmentScheduled && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                          APPOINTMENT BOOKED
                        </span>
                      )}
                    </div>
                    <p className="text-white/80">
                      Sent {formatDate(reminder.sentDate)} via {reminder.contactMethod}
                    </p>
                  </div>
                </div>

                <div className="text-white/80 space-y-1">
                  <div>Rule: {reminder.ruleName}</div>
                  <div>Contact: {reminder.contactMethod === 'email' ? reminder.customerEmail : reminder.customerPhone}</div>
                </div>

                {reminder.lastError && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-400/30 rounded-lg">
                    <div className="flex items-center text-red-400">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      <span className="text-sm">{reminder.lastError}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {scheduledReminders.filter(r => ['sent', 'delivered', 'failed'].includes(r.status)).length === 0 && (
              <div className="bg-black/40 backdrop-blur-sm border border-blue-400/20 rounded-xl p-12 text-center">
                <CheckCircle className="h-16 w-16 text-blue-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-4">No sent reminders</h3>
                <p className="text-white/80 text-lg">Your sent reminder history will appear here</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}