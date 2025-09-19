'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Target,
  ArrowLeft,
  Plus,
  DollarSign,
  Calendar,
  Clock,
  Users,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Eye,
  Edit,
  MoreVertical,
  Filter,
  Search,
  Building2,
  Phone,
  Mail,
  MapPin,
  Star,
  Zap,
  ArrowRight
} from 'lucide-react'

interface Deal {
  id: string
  title: string
  company_name: string
  contact_name: string
  contact_email?: string
  contact_phone: string
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closing' | 'won' | 'lost'
  value: number
  probability: number
  expected_close_date: string
  created_at: string
  last_activity_date?: string
  notes?: string
  source: string
  assigned_to?: string
  priority: 'low' | 'medium' | 'high'
  activities_count: number
  next_follow_up?: string
}

interface PipelineStats {
  total_deals: number
  total_value: number
  weighted_value: number
  avg_deal_size: number
  conversion_rate: number
  avg_sales_cycle: number
  deals_by_stage: {
    prospecting: number
    qualification: number
    proposal: number
    negotiation: number
    closing: number
    won: number
    lost: number
  }
  stage_values: {
    prospecting: number
    qualification: number
    proposal: number
    negotiation: number
    closing: number
    won: number
    lost: number
  }
}

const STAGES = [
  { key: 'prospecting', label: 'Prospecting', color: 'bg-blue-500/20 border-blue-400' },
  { key: 'qualification', label: 'Qualification', color: 'bg-yellow-500/20 border-yellow-400' },
  { key: 'proposal', label: 'Proposal', color: 'bg-orange-500/20 border-orange-400' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-purple-500/20 border-purple-400' },
  { key: 'closing', label: 'Closing', color: 'bg-green-500/20 border-green-400' },
  { key: 'won', label: 'Won', color: 'bg-emerald-500/20 border-emerald-400' },
  { key: 'lost', label: 'Lost', color: 'bg-red-500/20 border-red-400' }
]

export default function TesterPortalPipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [stats, setStats] = useState<PipelineStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStage, setSelectedStage] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [view, setView] = useState<'kanban' | 'list'>('kanban')

  useEffect(() => {
    fetchPipelineData()
  }, [])

  const fetchPipelineData = async () => {
    try {
      // Mock data - will be replaced with real API
      const mockDeals: Deal[] = [
        {
          id: '1',
          title: 'Pacific Coffee Roasters - Initial Setup',
          company_name: 'Pacific Coffee Roasters',
          contact_name: 'Sarah Johnson',
          contact_email: 'sarah.johnson@pacificcoffee.com',
          contact_phone: '(555) 123-4567',
          stage: 'prospecting',
          value: 350,
          probability: 20,
          expected_close_date: '2025-02-15',
          created_at: '2025-01-12T10:30:00Z',
          last_activity_date: '2025-01-13T14:20:00Z',
          notes: 'New facility needs initial backflow testing setup',
          source: 'Website Form',
          priority: 'medium',
          activities_count: 2,
          next_follow_up: '2025-01-16'
        },
        {
          id: '2',
          title: 'Chen Restaurant Group - Multi-Location',
          company_name: 'Chen Restaurant Group',
          contact_name: 'Mike Chen',
          contact_email: 'mike@chenrestaurants.com',
          contact_phone: '(555) 987-6543',
          stage: 'qualification',
          value: 1200,
          probability: 40,
          expected_close_date: '2025-01-25',
          created_at: '2025-01-09T09:20:00Z',
          last_activity_date: '2025-01-12T16:45:00Z',
          notes: '3 restaurant locations need annual testing',
          source: 'Referral',
          assigned_to: 'John Fisher',
          priority: 'high',
          activities_count: 5,
          next_follow_up: '2025-01-17'
        },
        {
          id: '3',
          title: 'Evergreen Apartments - Property Management',
          company_name: 'Evergreen Apartments',
          contact_name: 'Jennifer Martinez',
          contact_email: 'jennifer@evergreeapts.com',
          contact_phone: '(555) 456-7890',
          stage: 'proposal',
          value: 800,
          probability: 60,
          expected_close_date: '2025-01-30',
          created_at: '2025-01-07T13:10:00Z',
          last_activity_date: '2025-01-11T11:30:00Z',
          notes: 'Large apartment complex, potential for ongoing work',
          source: 'Cold Call',
          assigned_to: 'John Fisher',
          priority: 'medium',
          activities_count: 8,
          next_follow_up: '2025-01-18'
        },
        {
          id: '4',
          title: 'Wilson Medical Center - Healthcare Facility',
          company_name: 'Wilson Medical Center',
          contact_name: 'David Wilson',
          contact_email: 'david.wilson@wilsonmedical.com',
          contact_phone: '(555) 234-5678',
          stage: 'won',
          value: 2500,
          probability: 100,
          expected_close_date: '2025-01-15',
          created_at: '2025-01-04T08:30:00Z',
          last_activity_date: '2025-01-14T15:20:00Z',
          notes: 'Medical facility - high value contract signed',
          source: 'Google Search',
          assigned_to: 'John Fisher',
          priority: 'high',
          activities_count: 12
        }
      ]

      const mockStats: PipelineStats = {
        total_deals: 4,
        total_value: 4850,
        weighted_value: 2070,
        avg_deal_size: 1212,
        conversion_rate: 25.0,
        avg_sales_cycle: 18.5,
        deals_by_stage: {
          prospecting: 1,
          qualification: 1,
          proposal: 1,
          negotiation: 0,
          closing: 0,
          won: 1,
          lost: 0
        },
        stage_values: {
          prospecting: 350,
          qualification: 1200,
          proposal: 800,
          negotiation: 0,
          closing: 0,
          won: 2500,
          lost: 0
        }
      }

      setDeals(mockDeals)
      setStats(mockStats)
    } catch (error) {
      console.error('Failed to fetch pipeline data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStageColor = (stage: string) => {
    const stageConfig = STAGES.find(s => s.key === stage)
    return stageConfig?.color || 'bg-gray-500/20 border-gray-400'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-400/20'
      case 'medium': return 'text-yellow-400 bg-yellow-400/20'
      case 'low': return 'text-green-400 bg-green-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  const filteredDeals = deals.filter(deal => {
    const matchesStage = selectedStage === 'all' || deal.stage === selectedStage
    const matchesSearch = !searchTerm || 
      deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.contact_name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStage && matchesSearch
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getDaysUntilClose = (dateString: string) => {
    const days = Math.ceil((new Date(dateString).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-white/80">Loading sales pipeline...</p>
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
                <Target className="h-8 w-8 text-cyan-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Sales Pipeline</h1>
                  <p className="text-cyan-400">Deal tracking and opportunity management</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setView('kanban')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    view === 'kanban' ? 'bg-cyan-600 text-white' : 'text-cyan-300 hover:text-white'
                  }`}
                >
                  Kanban
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    view === 'list' ? 'bg-cyan-600 text-white' : 'text-cyan-300 hover:text-white'
                  }`}
                >
                  List
                </button>
              </div>
              <button className="bg-cyan-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-cyan-700 transition-colors flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>New Deal</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pipeline Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-300 text-sm font-medium">Pipeline Value</p>
                  <p className="text-3xl font-bold text-white">{formatCurrency(stats.total_value)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-400" />
              </div>
              <p className="text-green-400 text-sm mt-2">Total opportunity value</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-300 text-sm font-medium">Weighted Value</p>
                  <p className="text-3xl font-bold text-white">{formatCurrency(stats.weighted_value)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-400" />
              </div>
              <p className="text-purple-400 text-sm mt-2">Probability weighted</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-300 text-sm font-medium">Avg Deal Size</p>
                  <p className="text-3xl font-bold text-white">{formatCurrency(stats.avg_deal_size)}</p>
                </div>
                <Target className="h-8 w-8 text-blue-400" />
              </div>
              <p className="text-blue-400 text-sm mt-2">Per opportunity</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-300 text-sm font-medium">Conversion Rate</p>
                  <p className="text-3xl font-bold text-white">{stats.conversion_rate.toFixed(1)}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-emerald-400" />
              </div>
              <p className="text-emerald-400 text-sm mt-2">Win rate</p>
            </div>
          </div>
        )}

        {/* Stage Overview */}
        {stats && (
          <div className="mb-8 bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Pipeline Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {STAGES.filter(stage => stage.key !== 'won' && stage.key !== 'lost').map((stage) => (
                <div key={stage.key} className={`text-center p-4 ${stage.color} rounded-lg`}>
                  <p className="text-2xl font-bold text-white">{stats.deals_by_stage[stage.key as keyof typeof stats.deals_by_stage]}</p>
                  <p className="text-white/80 text-xs mb-1">{stage.label}</p>
                  <p className="text-white/60 text-xs">{formatCurrency(stats.stage_values[stage.key as keyof typeof stats.stage_values])}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-cyan-400/20">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cyan-400" />
              <input
                type="text"
                placeholder="Search deals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-cyan-400/30 rounded-lg text-white placeholder-cyan-300 focus:outline-none focus:border-cyan-400"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cyan-400" />
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="all" className="bg-slate-800">All Stages</option>
                {STAGES.map(stage => (
                  <option key={stage.key} value={stage.key} className="bg-slate-800">
                    {stage.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center text-white/80">
              <Target className="h-5 w-5 text-cyan-400 mr-2" />
              <span className="text-sm">Total: {filteredDeals.length} deals</span>
            </div>
          </div>
        </div>

        {/* Pipeline Content */}
        {view === 'kanban' ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {STAGES.filter(stage => stage.key !== 'won' && stage.key !== 'lost').map((stage) => (
              <div key={stage.key} className="space-y-4">
                <div className={`p-4 ${stage.color} rounded-xl`}>
                  <h3 className="font-semibold text-white text-center">{stage.label}</h3>
                  <div className="text-center text-sm text-white/80 mt-1">
                    {filteredDeals.filter(deal => deal.stage === stage.key).length} deals •{' '}
                    {formatCurrency(
                      filteredDeals
                        .filter(deal => deal.stage === stage.key)
                        .reduce((sum, deal) => sum + deal.value, 0)
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {filteredDeals
                    .filter(deal => deal.stage === stage.key)
                    .map((deal) => (
                      <div key={deal.id} className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-lg p-4 hover:bg-white/15 transition-all">
                        <div className="mb-3">
                          <h4 className="font-medium text-white text-sm mb-1">{deal.title}</h4>
                          <p className="text-white/60 text-xs">{deal.company_name}</p>
                        </div>
                        
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-white/60">Value:</span>
                            <span className="text-white font-medium">{formatCurrency(deal.value)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-white/60">Probability:</span>
                            <span className="text-green-400 font-medium">{deal.probability}%</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-white/60">Close Date:</span>
                            <span className="text-white/80">{formatDate(deal.expected_close_date)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(deal.priority)}`}>
                            {deal.priority === 'high' && <Zap className="h-3 w-3 mr-1" />}
                            <span className="capitalize">{deal.priority}</span>
                          </div>
                          <div className="flex space-x-1">
                            <button className="p-1 hover:bg-white/10 rounded">
                              <Eye className="h-3 w-3 text-white/60" />
                            </button>
                            <button className="p-1 hover:bg-white/10 rounded">
                              <Edit className="h-3 w-3 text-white/60" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDeals.map((deal) => (
              <div 
                key={deal.id}
                className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6 hover:bg-white/15 transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">{deal.title}</h3>
                        <div className="flex items-center space-x-2 text-white/80">
                          <Building2 className="h-4 w-4" />
                          <span>{deal.company_name}</span>
                          <span className="text-white/60">•</span>
                          <Users className="h-4 w-4" />
                          <span>{deal.contact_name}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStageColor(deal.stage)}`}>
                          <span className="capitalize">{deal.stage}</span>
                        </div>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(deal.priority)}`}>
                          {deal.priority === 'high' && <Zap className="h-3 w-3 mr-1" />}
                          <span className="capitalize">{deal.priority}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Contact Info */}
                      <div className="space-y-2">
                        <p className="text-white/60 text-xs uppercase tracking-wide">Contact</p>
                        <div className="space-y-1">
                          {deal.contact_email && (
                            <div className="flex items-center space-x-2 text-white/80 text-sm">
                              <Mail className="h-4 w-4 text-cyan-400" />
                              <span>{deal.contact_email}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2 text-white/80 text-sm">
                            <Phone className="h-4 w-4 text-cyan-400" />
                            <span>{deal.contact_phone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Deal Value */}
                      <div className="space-y-2">
                        <p className="text-white/60 text-xs uppercase tracking-wide">Opportunity</p>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-emerald-400" />
                            <span className="text-xl font-bold text-white">{formatCurrency(deal.value)}</span>
                          </div>
                          <p className="text-green-400 text-sm">{deal.probability}% probability</p>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="space-y-2">
                        <p className="text-white/60 text-xs uppercase tracking-wide">Timeline</p>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-white/80 text-sm">
                            <Calendar className="h-4 w-4 text-yellow-400" />
                            <span>Close: {formatDate(deal.expected_close_date)}</span>
                          </div>
                          <p className="text-white/60 text-sm">
                            {getDaysUntilClose(deal.expected_close_date)} days remaining
                          </p>
                        </div>
                      </div>

                      {/* Activity */}
                      <div className="space-y-2">
                        <p className="text-white/60 text-xs uppercase tracking-wide">Activity</p>
                        <div className="space-y-1">
                          <p className="text-white/80 text-sm">{deal.activities_count} activities</p>
                          {deal.next_follow_up && (
                            <div className="flex items-center space-x-2 text-white/80 text-sm">
                              <Clock className="h-4 w-4 text-blue-400" />
                              <span>Next: {formatDate(deal.next_follow_up)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {deal.notes && (
                      <div className="mt-4 p-3 bg-white/5 rounded-lg">
                        <p className="text-white/80 text-sm">{deal.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="ml-6 flex flex-col space-y-2">
                    <button className="p-2 bg-cyan-600/20 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-600/30 hover:text-white rounded-lg transition-all">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 bg-blue-600/20 border border-blue-400/30 text-blue-300 hover:bg-blue-600/30 hover:text-white rounded-lg transition-all">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-2 bg-green-600/20 border border-green-400/30 text-green-300 hover:bg-green-600/30 hover:text-white rounded-lg transition-all">
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <MoreVertical className="h-4 w-4 text-white/60" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {filteredDeals.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-md mx-auto">
              <Target className="h-16 w-16 text-cyan-400/50 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Deals Found</h3>
              <p className="text-white/80 mb-4">
                {searchTerm || selectedStage !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Start building your sales pipeline by adding deals.'
                }
              </p>
              <button className="bg-cyan-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-cyan-700 transition-colors flex items-center mx-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Deal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}