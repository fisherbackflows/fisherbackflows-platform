'use client'

import { useState, useEffect } from 'react'
import { 
  Key, 
  Copy, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  BarChart3, 
  Users, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Code,
  Webhook,
  Settings
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

export default function BackflowBuddyDashboard() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [usage, setUsage] = useState<Usage | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyGenerated, setNewKeyGenerated] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchApiKeys()
    fetchUsage()
  }, [])

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/tester-portal/api-keys')
      const data = await response.json()
      if (response.ok) {
        setApiKeys(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error)
    }
  }

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/tester-portal/usage')
      const data = await response.json()
      if (response.ok) {
        setUsage(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error)
    } finally {
      setLoading(false)
    }
  }

  const createApiKey = async () => {
    if (!newKeyName.trim()) return

    try {
      const response = await fetch('/api/tester-portal/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName })
      })
      
      const data = await response.json()
      if (response.ok) {
        setNewKeyGenerated(data.api_key)
        setNewKeyName('')
        fetchApiKeys()
      }
    } catch (error) {
      console.error('Failed to create API key:', error)
    }
  }

  const deleteApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/tester-portal/api-keys/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        fetchApiKeys()
      }
    } catch (error) {
      console.error('Failed to delete API key:', error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // TODO: Show toast notification
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-white/80">Loading dashboard...</p>
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
              <Code className="h-8 w-8 text-cyan-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">Tester Portal API</h1>
                <p className="text-cyan-400">Developer Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <a
                href="/tester-portal/docs"
                className="text-cyan-400 hover:text-white transition-colors"
              >
                API Docs
              </a>
              <a
                href="/team-portal"
                className="bg-cyan-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-cyan-700 transition-colors"
              >
                Team Portal
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 bg-white/5 rounded-lg p-1 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'api-keys', label: 'API Keys', icon: Key },
            { id: 'webhooks', label: 'Webhooks', icon: Webhook },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all font-medium ${
                activeTab === id 
                  ? 'bg-cyan-600 text-white' 
                  : 'text-cyan-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Usage Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-cyan-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">Today's Calls</h3>
                <p className="text-3xl font-bold text-cyan-400">{usage?.total_calls_today || 0}</p>
                <p className="text-sm text-cyan-300 mt-2">
                  {usage?.rate_limit_remaining || 0} remaining this hour
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">This Month</h3>
                <p className="text-3xl font-bold text-blue-400">{usage?.total_calls_month || 0}</p>
                <p className="text-sm text-blue-300 mt-2">API calls</p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Key className="h-6 w-6 text-green-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">Active Keys</h3>
                <p className="text-3xl font-bold text-green-400">{apiKeys.filter(k => k.is_active).length}</p>
                <p className="text-sm text-green-300 mt-2">API keys</p>
              </div>
            </div>

            {/* Most Used Endpoints */}
            <div className="bg-white/5 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Most Used Endpoints</h3>
              <div className="space-y-3">
                {usage?.most_used_endpoints?.map((endpoint, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-cyan-400 font-mono text-sm">{endpoint.endpoint}</span>
                    </div>
                    <span className="text-white font-semibold">{endpoint.calls} calls</span>
                  </div>
                )) || (
                  <p className="text-cyan-300">No API usage yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === 'api-keys' && (
          <div className="space-y-6">
            {/* Create New Key */}
            <div className="bg-white/5 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">API Keys</h3>
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="flex items-center space-x-2 bg-cyan-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-cyan-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Key</span>
                </button>
              </div>

              {showCreateForm && (
                <div className="mb-6 p-4 bg-white/5 rounded-lg border border-cyan-400/20">
                  <div className="flex items-center space-x-4">
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="API Key Name (e.g., 'Production', 'Development')"
                      className="flex-1 px-4 py-2 bg-white/10 border border-cyan-400/30 rounded-lg text-white placeholder-cyan-300 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      onClick={createApiKey}
                      disabled={!newKeyName.trim()}
                      className="bg-cyan-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create
                    </button>
                  </div>
                </div>
              )}

              {newKeyGenerated && (
                <div className="mb-6 p-4 bg-green-500/20 border border-green-400/30 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-green-400 font-semibold">API Key Created Successfully</span>
                  </div>
                  <p className="text-white text-sm mb-3">
                    Copy this key now - it won't be shown again for security reasons.
                  </p>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 bg-black/30 text-cyan-400 p-3 rounded font-mono text-sm">
                      {newKeyGenerated}
                    </code>
                    <button
                      onClick={() => copyToClipboard(newKeyGenerated)}
                      className="p-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => setNewKeyGenerated('')}
                    className="mt-3 text-green-400 hover:text-green-300 text-sm"
                  >
                    I've copied the key safely
                  </button>
                </div>
              )}

              {/* API Keys List */}
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div key={key.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-cyan-400/10">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-white">{key.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          key.is_active 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {key.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-cyan-300">
                        <span>Key: {key.key_preview}</span>
                        <span>Created: {new Date(key.created_at).toLocaleDateString()}</span>
                        {key.last_used_at && (
                          <span>Last used: {new Date(key.last_used_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => deleteApiKey(key.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {apiKeys.length === 0 && (
                  <div className="text-center py-8">
                    <Key className="h-12 w-12 text-cyan-400/50 mx-auto mb-4" />
                    <p className="text-cyan-300">No API keys created yet</p>
                    <p className="text-cyan-400 text-sm mt-2">Create your first API key to start integrating</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Webhooks Tab */}
        {activeTab === 'webhooks' && (
          <div className="bg-white/5 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Webhooks</h3>
            <p className="text-cyan-300 mb-6">
              Configure webhooks to receive real-time notifications about events in your account.
            </p>
            <div className="text-center py-8">
              <Webhook className="h-12 w-12 text-cyan-400/50 mx-auto mb-4" />
              <p className="text-cyan-300">Webhook configuration coming soon</p>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white/5 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">API Settings</h3>
            <p className="text-cyan-300 mb-6">
              Configure your API preferences and security settings.
            </p>
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-cyan-400/50 mx-auto mb-4" />
              <p className="text-cyan-300">Settings panel coming soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}