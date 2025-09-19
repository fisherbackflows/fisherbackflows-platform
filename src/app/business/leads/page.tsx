'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
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
  ArrowRight,
  Download
} from 'lucide-react';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  title?: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  estimatedValue: number;
  notes?: string;
  assignedTo?: string;
  contactedDate?: string;
  qualifiedDate?: string;
  convertedDate?: string;
  createdAt: string;
  priorityScore: number;
  leadScore: number;
  nextFollowUp?: string;
}

interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  qualified: number;
  converted: number;
  lost: number;
  conversionRate: number;
  pipelineValue: number;
  avgLeadValue: number;
  responseTime: number;
}

export default function BusinessLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [searchTerm, statusFilter, sourceFilter, leads]);

  const fetchLeads = async () => {
    try {
      // Mock data - will be replaced with real API
      const mockLeads: Lead[] = [
        {
          id: '1',
          firstName: 'Sarah',
          lastName: 'Johnson',
          companyName: 'Pacific Coffee Roasters',
          title: 'Facilities Manager',
          email: 'sarah.johnson@pacificcoffee.com',
          phone: '(555) 123-4567',
          address: '789 Industrial Park Dr',
          city: 'Seattle',
          state: 'WA',
          zipCode: '98101',
          source: 'Website Form',
          status: 'new',
          estimatedValue: 350,
          notes: 'New facility needs initial backflow testing setup',
          priorityScore: 8,
          leadScore: 85,
          nextFollowUp: '2025-01-14',
          createdAt: '2025-01-12T10:30:00Z'
        },
        {
          id: '2',
          firstName: 'Mike',
          lastName: 'Chen',
          companyName: 'Chen Restaurant Group',
          title: 'Operations Director',
          email: 'mike@chenrestaurants.com',
          phone: '(555) 987-6543',
          address: '456 Main Street',
          city: 'Tacoma',
          state: 'WA',
          zipCode: '98402',
          source: 'Referral',
          status: 'contacted',
          estimatedValue: 1200,
          notes: '3 restaurant locations need annual testing',
          contactedDate: '2025-01-10T14:15:00Z',
          priorityScore: 9,
          leadScore: 92,
          nextFollowUp: '2025-01-15',
          createdAt: '2025-01-09T09:20:00Z'
        },
        {
          id: '3',
          firstName: 'Jennifer',
          lastName: 'Martinez',
          companyName: 'Evergreen Apartments',
          title: 'Property Manager',
          email: 'jennifer@evergreeapts.com',
          phone: '(555) 456-7890',
          address: '321 Pine Street',
          city: 'Bellevue',
          state: 'WA',
          zipCode: '98004',
          source: 'Cold Call',
          status: 'qualified',
          estimatedValue: 800,
          notes: 'Large apartment complex, potential for ongoing work',
          contactedDate: '2025-01-08T11:45:00Z',
          qualifiedDate: '2025-01-11T16:30:00Z',
          priorityScore: 7,
          leadScore: 78,
          nextFollowUp: '2025-01-16',
          createdAt: '2025-01-07T13:10:00Z'
        },
        {
          id: '4',
          firstName: 'David',
          lastName: 'Wilson',
          companyName: 'Wilson Medical Center',
          title: 'Maintenance Supervisor',
          email: 'david.wilson@wilsonmedical.com',
          phone: '(555) 234-5678',
          address: '555 Healthcare Blvd',
          city: 'Spokane',
          state: 'WA',
          zipCode: '99201',
          source: 'Google Search',
          status: 'converted',
          estimatedValue: 2500,
          notes: 'Medical facility converted to customer - high value',
          contactedDate: '2025-01-05T10:00:00Z',
          qualifiedDate: '2025-01-06T14:20:00Z',
          convertedDate: '2025-01-09T12:15:00Z',
          priorityScore: 10,
          leadScore: 95,
          createdAt: '2025-01-04T08:30:00Z'
        }
      ];

      const mockStats: LeadStats = {
        total: 4,
        new: 1,
        contacted: 1,
        qualified: 1,
        converted: 1,
        lost: 0,
        conversionRate: 25.0,
        pipelineValue: 4850,
        avgLeadValue: 1212,
        responseTime: 2.3
      };

      setLeads(mockLeads);
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = leads;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.firstName.toLowerCase().includes(term) ||
        lead.lastName.toLowerCase().includes(term) ||
        lead.companyName?.toLowerCase().includes(term) ||
        lead.email?.toLowerCase().includes(term) ||
        lead.phone.includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(lead => lead.source === sourceFilter);
    }

    // Sort by priority score and lead score
    filtered.sort((a, b) => {
      if (a.priorityScore !== b.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      return b.leadScore - a.leadScore;
    });

    setFilteredLeads(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'border-blue-400 bg-blue-500/20 text-blue-200';
      case 'contacted': return 'border-amber-400 bg-amber-500/20 text-amber-200';
      case 'qualified': return 'border-emerald-400 bg-emerald-500/20 text-emerald-200';
      case 'converted': return 'border-emerald-400 bg-emerald-500/20 text-emerald-200';
      case 'lost': return 'border-red-400 bg-red-500/20 text-red-200';
      default: return 'border-gray-400 bg-gray-500/20 text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <UserPlus className="h-4 w-4" />;
      case 'contacted': return <Phone className="h-4 w-4" />;
      case 'qualified': return <CheckCircle className="h-4 w-4" />;
      case 'converted': return <Star className="h-4 w-4" />;
      case 'lost': return <AlertTriangle className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (score: number) => {
    if (score >= 8) return 'border-l-red-400 bg-red-400/5';
    if (score >= 6) return 'border-l-amber-400 bg-amber-400/5';
    if (score >= 4) return 'border-l-blue-400 bg-blue-400/5';
    return 'border-l-gray-400 bg-gray-400/5';
  };

  const getLeadScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 70) return 'text-amber-400';
    if (score >= 50) return 'text-blue-400';
    return 'text-gray-400';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysAgo = (dateString: string) => {
    const days = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
    return days === 0 ? 'Today' : `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-white/80">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-grid opacity-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-blue-500/5" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/business">
                <Button variant="outline" className="border-blue-400 text-white/80">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center">
                  <Users className="h-6 w-6 mr-3 text-blue-400" />
                  Lead Management
                </h1>
                <p className="text-white/60">Sales pipeline and lead nurturing</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline" className="border-blue-400 text-white/80">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button className="glass-btn-primary hover:glow-blue text-white">
                <Plus className="h-4 w-4 mr-2" />
                New Lead
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 relative z-10">

        {/* Lead Performance Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm font-medium">Pipeline Value</p>
                  <p className="text-3xl font-bold text-white">${stats.pipelineValue.toLocaleString()}</p>
                  <p className="text-emerald-400 text-sm mt-1">Total potential revenue</p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-400" />
              </div>
            </div>

            <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm font-medium">Conversion Rate</p>
                  <p className="text-3xl font-bold text-white">{stats.conversionRate.toFixed(1)}%</p>
                  <p className="text-emerald-400 text-sm mt-1">{stats.converted} of {stats.total} leads</p>
                </div>
                <Target className="h-8 w-8 text-purple-400" />
              </div>
            </div>

            <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm font-medium">Avg Lead Value</p>
                  <p className="text-3xl font-bold text-white">${stats.avgLeadValue.toLocaleString()}</p>
                  <p className="text-blue-400 text-sm mt-1">Per lead potential</p>
                </div>
                <DollarSign className="h-8 w-8 text-emerald-400" />
              </div>
            </div>

            <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm font-medium">Response Time</p>
                  <p className="text-3xl font-bold text-white">{stats.responseTime.toFixed(1)}d</p>
                  <p className="text-amber-400 text-sm mt-1">Average response</p>
                </div>
                <Clock className="h-8 w-8 text-amber-400" />
              </div>
            </div>
          </div>
        )}

        {/* Lead Status Overview */}
        {stats && (
          <div className="mb-8 glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
            <h3 className="text-lg font-semibold text-white mb-4">Lead Status Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-blue-400/10 border border-blue-400/20 rounded-lg">
                <UserPlus className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-400">{stats.new}</p>
                <p className="text-white/80 text-sm">New</p>
              </div>
              <div className="text-center p-3 bg-amber-400/10 border border-amber-400/20 rounded-lg">
                <Phone className="h-6 w-6 text-amber-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-amber-400">{stats.contacted}</p>
                <p className="text-white/80 text-sm">Contacted</p>
              </div>
              <div className="text-center p-3 bg-emerald-400/10 border border-emerald-400/20 rounded-lg">
                <CheckCircle className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-emerald-400">{stats.qualified}</p>
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
        <div className="mb-8 glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/60 focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white focus:border-blue-400 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>
            </div>

            <div className="relative">
              <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white focus:border-blue-400 focus:outline-none"
              >
                <option value="all">All Sources</option>
                <option value="Website Form">Website Form</option>
                <option value="Referral">Referral</option>
                <option value="Cold Call">Cold Call</option>
                <option value="Google Search">Google Search</option>
              </select>
            </div>
          </div>
        </div>

        {/* Leads List */}
        <div className="space-y-4">
          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className={`glass border-l-4 rounded-xl p-6 glow-blue-sm hover:bg-white/10 transition-all duration-200 ${getPriorityColor(lead.priorityScore)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-bold text-white">
                        {lead.firstName} {lead.lastName}
                      </h3>
                      {lead.companyName && (
                        <>
                          <span className="text-white/60">•</span>
                          <div className="flex items-center space-x-1 text-white/80">
                            <Building2 className="h-4 w-4" />
                            <span>{lead.companyName}</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(lead.status)}`}>
                        {getStatusIcon(lead.status)}
                        <span className="capitalize">{lead.status}</span>
                      </span>
                      {lead.priorityScore >= 8 && (
                        <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border border-red-400 bg-red-500/20 text-red-200">
                          <Zap className="h-3 w-3" />
                          <span>High Priority</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Contact Info */}
                    <div className="space-y-2">
                      <p className="text-white/60 text-xs uppercase tracking-wide font-medium">Contact</p>
                      <div className="space-y-1">
                        {lead.email && (
                          <div className="flex items-center space-x-2 text-white/80 text-sm">
                            <Mail className="h-4 w-4 text-blue-400" />
                            <span>{lead.email}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 text-white/80 text-sm">
                          <Phone className="h-4 w-4 text-blue-400" />
                          <span>{lead.phone}</span>
                        </div>
                        {lead.city && lead.state && (
                          <div className="flex items-center space-x-2 text-white/80 text-sm">
                            <MapPin className="h-4 w-4 text-blue-400" />
                            <span>{lead.city}, {lead.state}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Lead Details */}
                    <div className="space-y-2">
                      <p className="text-white/60 text-xs uppercase tracking-wide font-medium">Details</p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/80">Lead Score:</span>
                          <span className={`font-bold ${getLeadScoreColor(lead.leadScore)}`}>
                            {lead.leadScore}/100
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/80">Source:</span>
                          <span className="text-blue-400">{lead.source}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/80">Created:</span>
                          <span className="text-white/80">{getDaysAgo(lead.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Opportunity */}
                    <div className="space-y-2">
                      <p className="text-white/60 text-xs uppercase tracking-wide font-medium">Opportunity</p>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-emerald-400" />
                          <span className="text-2xl font-bold text-white">
                            ${lead.estimatedValue.toLocaleString()}
                          </span>
                        </div>
                        {lead.nextFollowUp && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Calendar className="h-4 w-4 text-amber-400" />
                            <span className="text-white/80">
                              Follow-up: {formatDate(lead.nextFollowUp)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {lead.notes && (
                    <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-white/80 text-sm">{lead.notes}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="ml-6 flex flex-col space-y-2">
                  <Button variant="outline" size="sm" className="border-blue-400 text-white/80">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="border-blue-400 text-white/80">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="border-emerald-400 text-emerald-200 hover:bg-emerald-500/20">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="border-white/20 text-white/60 hover:bg-white/10">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredLeads.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="glass border border-blue-400 rounded-xl p-8 max-w-md mx-auto glow-blue-sm">
              <Users className="h-16 w-16 text-blue-400/50 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Leads Found</h3>
              <p className="text-white/80 mb-4">
                {searchTerm || statusFilter !== 'all' || sourceFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Start building your sales pipeline by adding leads.'
                }
              </p>
              <Button className="glass-btn-primary hover:glow-blue text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Lead
              </Button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}