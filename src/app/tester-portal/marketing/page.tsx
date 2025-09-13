'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Mail,
  MessageSquare,
  Send,
  Users,
  TrendingUp,
  Calendar,
  Eye,
  MousePointer,
  ArrowLeft,
  Plus,
  Play,
  Pause,
  Edit,
  Copy,
  BarChart3,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  Filter,
  Search,
  FileText,
  Zap,
  Settings
} from 'lucide-react'

interface Campaign {
  id: string
  name: string
  type: 'email' | 'sms' | 'automated_sequence'
  status: 'draft' | 'active' | 'paused' | 'completed'
  target_audience: string
  subject?: string
  message_preview: string
  scheduled_date?: string
  created_at: string
  stats: {
    sent: number
    delivered: number
    opened: number
    clicked: number
    replies: number
    conversions: number
  }
  performance: {
    open_rate: number
    click_rate: number
    conversion_rate: number
    response_rate: number
  }
}

interface MarketingStats {
  total_campaigns: number
  active_campaigns: number
  total_contacts: number
  avg_open_rate: number
  avg_click_rate: number
  total_conversions: number
  revenue_attributed: number
  email_list_growth: number
}

interface Template {
  id: string
  name: string
  type: 'email' | 'sms'
  category: string
  description: string
  preview: string
}

export default function TesterPortalMarketingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [stats, setStats] = useState<MarketingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('campaigns')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchMarketingData()
  }, [])

  const fetchMarketingData = async () => {
    try {
      // Mock data - will be replaced with real API
      const mockCampaigns: Campaign[] = [
        {
          id: '1',
          name: 'Annual Test Reminder Campaign',
          type: 'email',
          status: 'active',
          target_audience: 'Customers with tests due in 30 days',
          subject: 'Your Annual Backflow Test is Coming Due',
          message_preview: 'Hi {name}, your backflow test is scheduled for renewal...',
          scheduled_date: '2025-01-15T09:00:00Z',
          created_at: '2025-01-10T10:30:00Z',
          stats: {
            sent: 45,
            delivered: 43,
            opened: 28,
            clicked: 12,
            replies: 5,
            conversions: 3
          },
          performance: {
            open_rate: 65.1,
            click_rate: 27.9,
            conversion_rate: 25.0,
            response_rate: 11.6
          }
        },
        {
          id: '2',
          name: 'New Customer Welcome Sequence',
          type: 'automated_sequence',
          status: 'active',
          target_audience: 'New customers (first 30 days)',
          message_preview: 'Welcome to Fisher Backflows! Here\'s what to expect...',
          created_at: '2025-01-05T14:20:00Z',
          stats: {
            sent: 23,
            delivered: 23,
            opened: 21,
            clicked: 15,
            replies: 8,
            conversions: 6
          },
          performance: {
            open_rate: 91.3,
            click_rate: 71.4,
            conversion_rate: 40.0,
            response_rate: 34.8
          }
        },
        {
          id: '3',
          name: 'Overdue Test Urgent Notice',
          type: 'sms',
          status: 'completed',
          target_audience: 'Customers with overdue tests',
          message_preview: 'URGENT: Your backflow test is now overdue. Schedule today...',
          scheduled_date: '2025-01-08T08:00:00Z',
          created_at: '2025-01-07T16:45:00Z',
          stats: {
            sent: 12,
            delivered: 12,
            opened: 12,
            clicked: 8,
            replies: 6,
            conversions: 5
          },
          performance: {
            open_rate: 100.0,
            click_rate: 66.7,
            conversion_rate: 62.5,
            response_rate: 50.0
          }
        }
      ]

      const mockTemplates: Template[] = [
        {
          id: '1',
          name: 'Test Reminder - 30 Days',
          type: 'email',
          category: 'Test Reminders',
          description: 'Friendly reminder for upcoming annual test',
          preview: 'Your annual backflow test is coming up in 30 days...'
        },
        {
          id: '2',
          name: 'Test Reminder - 7 Days',
          type: 'email',
          category: 'Test Reminders',
          description: 'Urgent reminder for test due next week',
          preview: 'Just a quick reminder that your test is due next week...'
        },
        {
          id: '3',
          name: 'Welcome New Customer',
          type: 'email',
          category: 'Onboarding',
          description: 'Welcome email for new customers',
          preview: 'Welcome to our backflow testing service! Here\'s what you need to know...'
        },
        {
          id: '4',
          name: 'Overdue Test SMS',
          type: 'sms',
          category: 'Urgent Notices',
          description: 'SMS for overdue test notifications',
          preview: 'URGENT: Your backflow test is overdue. Please schedule immediately.'
        }
      ]

      const mockStats: MarketingStats = {
        total_campaigns: 3,
        active_campaigns: 2,
        total_contacts: 247,
        avg_open_rate: 85.5,
        avg_click_rate: 55.3,
        total_conversions: 14,
        revenue_attributed: 4200,
        email_list_growth: 12.5
      }

      setCampaigns(mockCampaigns)
      setTemplates(mockTemplates)
      setStats(mockStats)
    } catch (error) {
      console.error('Failed to fetch marketing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-400 bg-gray-400/20'
      case 'active': return 'text-green-400 bg-green-400/20'
      case 'paused': return 'text-yellow-400 bg-yellow-400/20'
      case 'completed': return 'text-blue-400 bg-blue-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit className="h-4 w-4" />
      case 'active': return <Play className="h-4 w-4" />
      case 'paused': return <Pause className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getCampaignIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-5 w-5" />
      case 'sms': return <MessageSquare className="h-5 w-5" />
      case 'automated_sequence': return <Zap className="h-5 w-5" />
      default: return <Send className="h-5 w-5" />
    }
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter
    const matchesSearch = !searchTerm || 
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.target_audience.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-white/80">Loading marketing campaigns...</p>
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
                <Mail className="h-8 w-8 text-cyan-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Marketing Automation</h1>
                  <p className="text-cyan-400">Customer engagement and campaigns</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="bg-cyan-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-cyan-700 transition-colors flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>New Campaign</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Marketing Performance Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-300 text-sm font-medium">Revenue Attributed</p>
                  <p className="text-3xl font-bold text-white">${stats.revenue_attributed.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
              <p className="text-green-400 text-sm mt-2">From {stats.total_conversions} conversions</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-300 text-sm font-medium">Avg Open Rate</p>
                  <p className="text-3xl font-bold text-white">{stats.avg_open_rate.toFixed(1)}%</p>
                </div>
                <Eye className="h-8 w-8 text-blue-400" />
              </div>
              <p className="text-blue-400 text-sm mt-2">Above industry avg (21%)</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-300 text-sm font-medium">Click Rate</p>
                  <p className="text-3xl font-bold text-white">{stats.avg_click_rate.toFixed(1)}%</p>
                </div>
                <MousePointer className="h-8 w-8 text-purple-400" />
              </div>
              <p className="text-purple-400 text-sm mt-2">High engagement</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-300 text-sm font-medium">List Growth</p>
                  <p className="text-3xl font-bold text-white">+{stats.email_list_growth.toFixed(1)}%</p>
                </div>
                <Users className="h-8 w-8 text-yellow-400" />
              </div>
              <p className="text-yellow-400 text-sm mt-2">{stats.total_contacts} total contacts</p>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white/5 rounded-lg p-1 mb-8">
          {[
            { id: 'campaigns', label: 'Campaigns', icon: Send },
            { id: 'templates', label: 'Templates', icon: FileText },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'contacts', label: 'Contacts', icon: Users }
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

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            {/* Campaign Filters */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-cyan-400/20">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cyan-400" />
                  <input
                    type="text"
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-cyan-400/30 rounded-lg text-white placeholder-cyan-300 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cyan-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="all" className="bg-slate-800">All Status</option>
                    <option value="draft" className="bg-slate-800">Draft</option>
                    <option value="active" className="bg-slate-800">Active</option>
                    <option value="paused" className="bg-slate-800">Paused</option>
                    <option value="completed" className="bg-slate-800">Completed</option>
                  </select>
                </div>

                <div className="flex items-center text-white/80">
                  <Send className="h-5 w-5 text-cyan-400 mr-2" />
                  <span className="text-sm">Total: {filteredCampaigns.length} campaigns</span>
                </div>
              </div>
            </div>

            {/* Campaigns List */}
            <div className="space-y-4">
              {filteredCampaigns.map((campaign) => (
                <div 
                  key={campaign.id}
                  className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6 hover:bg-white/15 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-cyan-400/20 rounded-lg">
                          {getCampaignIcon(campaign.type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white">{campaign.name}</h3>
                          <p className="text-white/60 text-sm">{campaign.target_audience}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                            {getStatusIcon(campaign.status)}
                            <span className="capitalize">{campaign.status}</span>
                          </div>
                          <span className="px-2 py-1 rounded-full text-xs font-medium text-blue-400 bg-blue-400/20 capitalize">
                            {campaign.type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Preview */}
                      <div className="mb-4 p-3 bg-white/5 rounded-lg">
                        {campaign.subject && (
                          <p className="text-white font-medium text-sm mb-1">Subject: {campaign.subject}</p>
                        )}
                        <p className="text-white/80 text-sm">{campaign.message_preview}</p>
                      </div>

                      {/* Performance Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-3 bg-blue-400/10 border border-blue-400/20 rounded-lg">
                          <p className="text-lg font-bold text-blue-400">{campaign.stats.sent}</p>
                          <p className="text-white/60 text-xs">Sent</p>
                        </div>
                        <div className="text-center p-3 bg-green-400/10 border border-green-400/20 rounded-lg">
                          <p className="text-lg font-bold text-green-400">{campaign.performance.open_rate.toFixed(1)}%</p>
                          <p className="text-white/60 text-xs">Open Rate</p>
                        </div>
                        <div className="text-center p-3 bg-purple-400/10 border border-purple-400/20 rounded-lg">
                          <p className="text-lg font-bold text-purple-400">{campaign.performance.click_rate.toFixed(1)}%</p>
                          <p className="text-white/60 text-xs">Click Rate</p>
                        </div>
                        <div className="text-center p-3 bg-emerald-400/10 border border-emerald-400/20 rounded-lg">
                          <p className="text-lg font-bold text-emerald-400">{campaign.stats.conversions}</p>
                          <p className="text-white/60 text-xs">Conversions</p>
                        </div>
                      </div>

                      {/* Timing */}
                      <div className="flex items-center justify-between text-sm text-white/80">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4 text-cyan-400" />
                            <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
                          </div>
                          {campaign.scheduled_date && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4 text-yellow-400" />
                              <span>Scheduled: {new Date(campaign.scheduled_date).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-2 bg-cyan-600/20 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-600/30 hover:text-white rounded-lg transition-all">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-2 bg-blue-600/20 border border-blue-400/30 text-blue-300 hover:bg-blue-600/30 hover:text-white rounded-lg transition-all">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-2 bg-green-600/20 border border-green-400/30 text-green-300 hover:bg-green-600/30 hover:text-white rounded-lg transition-all">
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6 hover:bg-white/15 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-cyan-400/20 rounded-lg">
                      {template.type === 'email' ? <Mail className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{template.name}</h3>
                      <p className="text-cyan-400 text-sm">{template.category}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium text-blue-400 bg-blue-400/20 capitalize">
                    {template.type}
                  </span>
                </div>
                
                <p className="text-white/80 text-sm mb-4">{template.description}</p>
                
                <div className="p-3 bg-white/5 rounded-lg mb-4">
                  <p className="text-white/70 text-sm italic">{template.preview}</p>
                </div>
                
                <div className="flex space-x-2">
                  <button className="flex-1 py-2 bg-cyan-600/20 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-600/30 hover:text-white rounded-lg text-sm transition-all">
                    Use Template
                  </button>
                  <button className="py-2 px-3 bg-blue-600/20 border border-blue-400/30 text-blue-300 hover:bg-blue-600/30 hover:text-white rounded-lg transition-all">
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Placeholder for other tabs */}
        {(activeTab === 'analytics' || activeTab === 'contacts') && (
          <div className="text-center py-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-md mx-auto">
              <Settings className="h-16 w-16 text-cyan-400/50 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">{activeTab === 'analytics' ? 'Advanced Analytics' : 'Contact Management'}</h3>
              <p className="text-white/80 mb-4">
                {activeTab === 'analytics' 
                  ? 'Detailed campaign performance analytics and insights.'
                  : 'Comprehensive contact list management and segmentation.'
                }
              </p>
              <button className="bg-cyan-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-cyan-700 transition-colors">
                Coming Soon
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}