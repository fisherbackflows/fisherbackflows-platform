'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Users,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Star,
  Eye,
  Edit,
  Plus,
  Search,
  Filter,
  ArrowLeft,
  TrendingUp,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  Building2,
  Zap,
  MoreVertical,
  ArrowRight
} from 'lucide-react'

interface Lead {
  id: string
  first_name: string
  last_name: string
  company_name?: string
  title?: string
  email?: string
  phone: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  source: string
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
  estimated_value: number
  notes?: string
  assigned_to?: string
  contacted_date?: string
  qualified_date?: string
  converted_date?: string
  created_at: string
  priority_score: number
  lead_score: number
  next_follow_up?: string
}

interface LeadStats {
  total: number
  new: number
  contacted: number
  qualified: number
  converted: number
  lost: number
  conversion_rate: number
  pipeline_value: number
  avg_lead_value: number
  response_time: number
}

export default function TesterPortalLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<LeadStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')

  useEffect(() => {
    fetchLeads()
  }, [])

  useEffect(() => {
    filterLeads()
  }, [searchTerm, statusFilter, sourceFilter, leads])

  const fetchLeads = async () => {
    try {
      // Mock data - will be replaced with real API
      const mockLeads: Lead[] = [
        {
          id: '1',
          first_name: 'Sarah',
          last_name: 'Johnson',
          company_name: 'Pacific Coffee Roasters',
          title: 'Facilities Manager',
          email: 'sarah.johnson@pacificcoffee.com',
          phone: '(555) 123-4567',
          address: '789 Industrial Park Dr',
          city: 'Seattle',
          state: 'WA',
          zip_code: '98101',
          source: 'Website Form',
          status: 'new',
          estimated_value: 350,
          notes: 'New facility needs initial backflow testing setup',
          priority_score: 8,
          lead_score: 85,
          next_follow_up: '2025-01-14',
          created_at: '2025-01-12T10:30:00Z'
        },
        {
          id: '2',
          first_name: 'Mike',
          last_name: 'Chen',
          company_name: 'Chen Restaurant Group',
          title: 'Operations Director',
          email: 'mike@chenrestaurants.com',
          phone: '(555) 987-6543',
          address: '456 Main Street',
          city: 'Tacoma',
          state: 'WA',
          zip_code: '98402',
          source: 'Referral',
          status: 'contacted',
          estimated_value: 1200,
          notes: '3 restaurant locations need annual testing',
          contacted_date: '2025-01-10T14:15:00Z',
          priority_score: 9,
          lead_score: 92,
          next_follow_up: '2025-01-15',
          created_at: '2025-01-09T09:20:00Z'
        },
        {
          id: '3',
          first_name: 'Jennifer',
          last_name: 'Martinez',
          company_name: 'Evergreen Apartments',
          title: 'Property Manager',
          email: 'jennifer@evergreeapts.com',
          phone: '(555) 456-7890',
          address: '321 Pine Street',
          city: 'Bellevue',
          state: 'WA',
          zip_code: '98004',
          source: 'Cold Call',
          status: 'qualified',
          estimated_value: 800,
          notes: 'Large apartment complex, potential for ongoing work',
          contacted_date: '2025-01-08T11:45:00Z',
          qualified_date: '2025-01-11T16:30:00Z',
          priority_score: 7,
          lead_score: 78,
          next_follow_up: '2025-01-16',
          created_at: '2025-01-07T13:10:00Z'
        },
        {
          id: '4',
          first_name: 'David',
          last_name: 'Wilson',
          company_name: 'Wilson Medical Center',
          title: 'Maintenance Supervisor',
          email: 'david.wilson@wilsonmedical.com',
          phone: '(555) 234-5678',
          address: '555 Healthcare Blvd',
          city: 'Spokane',
          state: 'WA',
          zip_code: '99201',
          source: 'Google Search',
          status: 'converted',
          estimated_value: 2500,
          notes: 'Medical facility converted to customer - high value',
          contacted_date: '2025-01-05T10:00:00Z',
          qualified_date: '2025-01-06T14:20:00Z',
          converted_date: '2025-01-09T12:15:00Z',
          priority_score: 10,
          lead_score: 95,
          created_at: '2025-01-04T08:30:00Z'
        }
      ]

      const mockStats: LeadStats = {
        total: 4,
        new: 1,
        contacted: 1,
        qualified: 1,
        converted: 1,
        lost: 0,
        conversion_rate: 25.0,
        pipeline_value: 4850,
        avg_lead_value: 1212,
        response_time: 2.3
      }

      setLeads(mockLeads)
      setStats(mockStats)
    } catch (error) {
      console.error('Failed to fetch leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterLeads = () => {
    let filtered = leads

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(lead =>
        lead.first_name.toLowerCase().includes(term) ||
        lead.last_name.toLowerCase().includes(term) ||
        lead.company_name?.toLowerCase().includes(term) ||
        lead.email?.toLowerCase().includes(term) ||
        lead.phone.includes(term)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter)
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(lead => lead.source === sourceFilter)
    }

    // Sort by priority score and lead score
    filtered.sort((a, b) => {
      if (a.priority_score !== b.priority_score) {
        return b.priority_score - a.priority_score
      }
      return b.lead_score - a.lead_score
    })

    setFilteredLeads(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'text-blue-400 bg-blue-400/20'
      case 'contacted': return 'text-yellow-400 bg-yellow-400/20'
      case 'qualified': return 'text-green-400 bg-green-400/20'
      case 'converted': return 'text-emerald-400 bg-emerald-400/20'
      case 'lost': return 'text-red-400 bg-red-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <UserPlus className="h-4 w-4" />
      case 'contacted': return <Phone className="h-4 w-4" />
      case 'qualified': return <CheckCircle className="h-4 w-4" />
      case 'converted': return <Star className="h-4 w-4" />
      case 'lost': return <AlertTriangle className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getPriorityColor = (score: number) => {
    if (score >= 8) return 'border-l-red-400 bg-red-400/5'
    if (score >= 6) return 'border-l-yellow-400 bg-yellow-400/5'
    if (score >= 4) return 'border-l-blue-400 bg-blue-400/5'
    return 'border-l-gray-400 bg-gray-400/5'
  }

  const getLeadScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400'
    if (score >= 70) return 'text-yellow-400'
    if (score >= 50) return 'text-blue-400'
    return 'text-gray-400'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getDaysAgo = (dateString: string) => {
    const days = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24))
    return days === 0 ? 'Today' : `${days}d ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-white/80">Loading leads...</p>
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
                <Users className="h-8 w-8 text-cyan-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Lead Management</h1>
                  <p className="text-cyan-400">Sales pipeline and lead nurturing</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/tester-portal/leads/new"
                className="bg-cyan-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-cyan-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Lead</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lead Performance Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-300 text-sm font-medium">Pipeline Value</p>
                  <p className="text-3xl font-bold text-white">${stats.pipeline_value.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
              <p className="text-green-400 text-sm mt-2">Total potential revenue</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-300 text-sm font-medium">Conversion Rate</p>
                  <p className="text-3xl font-bold text-white">{stats.conversion_rate.toFixed(1)}%</p>
                </div>
                <Target className="h-8 w-8 text-purple-400" />
              </div>
              <p className="text-green-400 text-sm mt-2">{stats.converted} of {stats.total} leads</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-300 text-sm font-medium">Avg Lead Value</p>
                  <p className="text-3xl font-bold text-white">${stats.avg_lead_value.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-emerald-400" />
              </div>
              <p className="text-blue-400 text-sm mt-2">Per lead potential</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-300 text-sm font-medium">Response Time</p>
                  <p className="text-3xl font-bold text-white">{stats.response_time.toFixed(1)}d</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
              <p className="text-yellow-400 text-sm mt-2">Average response</p>
            </div>
          </div>
        )}

        {/* Lead Status Overview */}
        {stats && (
          <div className="mb-8 bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Lead Status Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-blue-400/10 border border-blue-400/20 rounded-lg">
                <UserPlus className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-400">{stats.new}</p>
                <p className="text-white/80 text-sm">New</p>
              </div>
              <div className="text-center p-3 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
                <Phone className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-400">{stats.contacted}</p>
                <p className="text-white/80 text-sm">Contacted</p>
              </div>
              <div className="text-center p-3 bg-green-400/10 border border-green-400/20 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-400">{stats.qualified}</p>
                <p className="text-white/80 text-sm">Qualified</p>
              </div>
              <div className="text-center p-3 bg-emerald-400/10 border border-emerald-400/20 rounded-lg">
                <Star className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-emerald-400">{stats.converted}</p>
                <p className="text-white/80 text-sm">Converted</p>
              </div>
              <div className="text-center p-3 bg-red-400/10 border border-red-400/20 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-400">{stats.lost}</p>
                <p className="text-white/80 text-sm">Lost</p>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="mb-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-cyan-400/20">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cyan-400" />
              <input
                type="text"
                placeholder="Search leads..."
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
                <option value="new" className="bg-slate-800">New</option>
                <option value="contacted" className="bg-slate-800">Contacted</option>
                <option value="qualified" className="bg-slate-800">Qualified</option>
                <option value="converted" className="bg-slate-800">Converted</option>
                <option value="lost" className="bg-slate-800">Lost</option>
              </select>
            </div>

            <div className="relative">
              <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cyan-400" />
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="all" className="bg-slate-800">All Sources</option>
                <option value="Website Form" className="bg-slate-800">Website Form</option>
                <option value="Referral" className="bg-slate-800">Referral</option>
                <option value="Cold Call" className="bg-slate-800">Cold Call</option>
                <option value="Google Search" className="bg-slate-800">Google Search</option>
              </select>
            </div>
          </div>
        </div>

        {/* Leads List */}
        <div className="space-y-4">
          {filteredLeads.map((lead) => (
            <div 
              key={lead.id}
              className={`bg-white/10 backdrop-blur-sm border-l-4 rounded-xl p-6 hover:bg-white/15 transition-all duration-200 ${getPriorityColor(lead.priority_score)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-bold text-white">
                        {lead.first_name} {lead.last_name}
                      </h3>
                      {lead.company_name && (
                        <>
                          <span className="text-white/60">•</span>
                          <div className="flex items-center space-x-1 text-white/80">
                            <Building2 className="h-4 w-4" />
                            <span>{lead.company_name}</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                        {getStatusIcon(lead.status)}
                        <span className="capitalize">{lead.status}</span>
                      </div>
                      {lead.priority_score >= 8 && (
                        <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium text-red-400 bg-red-400/20">
                          <Zap className="h-3 w-3" />
                          <span>High Priority</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Contact Info */}
                    <div className="space-y-2">
                      <p className="text-white/60 text-xs uppercase tracking-wide">Contact</p>
                      <div className="space-y-1">
                        {lead.email && (
                          <div className="flex items-center space-x-2 text-white/80 text-sm">
                            <Mail className="h-4 w-4 text-cyan-400" />
                            <span>{lead.email}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 text-white/80 text-sm">
                          <Phone className="h-4 w-4 text-cyan-400" />
                          <span>{lead.phone}</span>
                        </div>
                        {lead.city && lead.state && (
                          <div className="flex items-center space-x-2 text-white/80 text-sm">
                            <MapPin className="h-4 w-4 text-cyan-400" />
                            <span>{lead.city}, {lead.state}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Lead Details */}
                    <div className="space-y-2">
                      <p className="text-white/60 text-xs uppercase tracking-wide">Details</p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/80">Lead Score:</span>
                          <span className={`font-bold ${getLeadScoreColor(lead.lead_score)}`}>
                            {lead.lead_score}/100
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/80">Source:</span>
                          <span className="text-cyan-400">{lead.source}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/80">Created:</span>
                          <span className="text-white/80">{getDaysAgo(lead.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Opportunity */}
                    <div className="space-y-2">
                      <p className="text-white/60 text-xs uppercase tracking-wide">Opportunity</p>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-emerald-400" />
                          <span className="text-2xl font-bold text-white">
                            ${lead.estimated_value.toLocaleString()}
                          </span>
                        </div>
                        {lead.next_follow_up && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Calendar className="h-4 w-4 text-yellow-400" />
                            <span className="text-white/80">
                              Follow-up: {formatDate(lead.next_follow_up)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {lead.notes && (
                    <div className="mt-4 p-3 bg-white/5 rounded-lg">
                      <p className="text-white/80 text-sm">{lead.notes}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="ml-6 flex flex-col space-y-2">
                  <Link
                    href={`/tester-portal/leads/${lead.id}`}
                    className="p-2 bg-cyan-600/20 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-600/30 hover:text-white rounded-lg transition-all flex items-center justify-center"
                    title="View Lead"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/tester-portal/leads/${lead.id}/edit`}
                    className="p-2 bg-blue-600/20 border border-blue-400/30 text-blue-300 hover:bg-blue-600/30 hover:text-white rounded-lg transition-all flex items-center justify-center"
                    title="Edit Lead"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button 
                    className="p-2 bg-green-600/20 border border-green-400/30 text-green-300 hover:bg-green-600/30 hover:text-white rounded-lg transition-all flex items-center justify-center"
                    title="Convert to Customer"
                  >
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

        {/* No Results */}
        {filteredLeads.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-md mx-auto">
              <Users className="h-16 w-16 text-cyan-400/50 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Leads Found</h3>
              <p className="text-white/80 mb-4">
                {searchTerm || statusFilter !== 'all' || sourceFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Start building your sales pipeline by adding leads.'
                }
              </p>
              <Link
                href="/tester-portal/leads/new"
                className="inline-flex items-center px-4 py-2 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Lead
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}