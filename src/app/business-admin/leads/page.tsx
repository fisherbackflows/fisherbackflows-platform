'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  UserPlus, 
  Phone, 
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Eye,
  Filter,
  Search,
  ArrowLeft,
  ExternalLink,
  Building2,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Zap,
  Target,
  TrendingUp,
  BarChart3,
  PieChart,
  Briefcase,
  Server,
  FileText,
  Download
} from 'lucide-react';

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  title?: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  estimated_value: number;
  notes?: string;
  assigned_to?: string;
  contacted_date?: string;
  qualified_date?: string;
  converted_date?: string;
  converted_customer_id?: string;
  created_at: string;
  updated_at: string;
  lead_type: 'backflow' | 'saas';
  priority_score: number;
}

interface LeadStats {
  total_leads: number;
  backflow: {
    type: 'backflow';
    total: number;
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
    lost: number;
    average_value: number;
    total_value: number;
  };
  saas: {
    type: 'saas';
    total: number;
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
    lost: number;
    average_value: number;
    total_value: number;
  };
  by_status: {
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
    lost: number;
  };
  by_source: Record<string, number>;
  recent_activity: number;
  conversion_rate: number;
  pipeline_value: number;
}

const ITEMS_PER_PAGE = 20;

const STATUS_CONFIG = {
  new: { color: 'bg-blue-500/20 text-blue-300 border-blue-400', icon: UserPlus },
  contacted: { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-400', icon: Phone },
  qualified: { color: 'bg-green-500/20 text-green-300 border-green-400', icon: CheckCircle },
  converted: { color: 'bg-emerald-500/20 text-emerald-300 border-emerald-400', icon: Star },
  lost: { color: 'bg-red-500/20 text-red-300 border-red-400', icon: XCircle }
};

// Components
const LeadCard = ({ lead, onClick }: { 
  lead: Lead; 
  onClick: () => void; 
}) => {
  const StatusIcon = STATUS_CONFIG[lead.status].icon;
  const LeadTypeIcon = lead.lead_type === 'saas' ? Server : Briefcase;
  
  return (
    <div
      onClick={onClick}
      className="glass rounded-lg p-4 border border-white/10 hover:border-blue-400/50 transition-all cursor-pointer group"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="flex items-start space-x-4">
        {/* Priority Indicator */}
        <div className={`w-1 h-12 rounded-full flex-shrink-0 ${
          lead.priority_score >= 6 ? 'bg-red-500' :
          lead.priority_score >= 4 ? 'bg-yellow-500' :
          lead.priority_score >= 2 ? 'bg-blue-500' : 'bg-gray-500'
        }`} />
        
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <h3 className="text-white font-medium group-hover:text-blue-300 transition-colors truncate">
                {lead.first_name} {lead.last_name}
              </h3>
              {lead.company_name && (
                <div className="flex items-center space-x-1 text-white/60 text-sm">
                  <Building2 className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{lead.company_name}</span>
                </div>
              )}
              {/* Lead Type Badge */}
              <Badge className={`${lead.lead_type === 'saas' ? 'bg-purple-500/20 text-purple-300 border-purple-400' : 'bg-blue-500/20 text-blue-300 border-blue-400'} text-xs border flex-shrink-0`}>
                <LeadTypeIcon className="h-3 w-3 mr-1" />
                {lead.lead_type === 'saas' ? 'SaaS' : 'Backflow'}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              {lead.priority_score >= 6 && (
                <Badge className="bg-red-500/20 text-red-300 border-red-400 text-xs border flex-shrink-0">
                  <Zap className="h-3 w-3 mr-1" />
                  High Priority
                </Badge>
              )}
              <Badge className={`${STATUS_CONFIG[lead.status].color} text-xs border flex-shrink-0`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {lead.status}
              </Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-white/60 mb-2">
            {lead.email && (
              <div className="flex items-center space-x-1 min-w-0">
                <Mail className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{lead.email}</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Phone className="h-3 w-3 flex-shrink-0" />
              <span>{lead.phone}</span>
            </div>
            {lead.city && lead.state && (
              <div className="flex items-center space-x-1 min-w-0">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{lead.city}, {lead.state}</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span>{new Date(lead.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          
          {lead.notes && (
            <p className="text-white/50 text-sm line-clamp-2 mb-2">{lead.notes}</p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="text-xs text-white/50">
              {lead.source && <span className="mr-3">Source: {lead.source}</span>}
              {lead.assigned_to && <span>Assigned: {lead.assigned_to}</span>}
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-white font-medium">
                ${lead.estimated_value.toLocaleString()}
              </span>
              <Eye className="h-4 w-4 text-white/40 group-hover:text-blue-300 transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ title, value, color }: { title: string; value: number; color: string }) => (
  <Card className={`glass border-${color}-400/30`}>
    <CardContent className="p-4 text-center">
      <p className={`text-2xl font-bold text-${color}-300`}>{value}</p>
      <p className="text-white/70 text-sm">{title}</p>
    </CardContent>
  </Card>
);

const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <Card className="glass border-red-400/30">
    <CardContent className="p-8 text-center">
      <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
      <h3 className="text-white text-lg font-medium mb-2">Error Loading Leads</h3>
      <p className="text-white/60 mb-4">{message}</p>
      <Button onClick={onRetry} variant="outline" className="glass border-red-400/50">
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </CardContent>
  </Card>
);

const EmptyState = ({ hasFilters, onReset }: { hasFilters: boolean; onReset: () => void }) => (
  <div className="text-center py-12">
    <Users className="h-16 w-16 text-white/30 mx-auto mb-4" />
    <h3 className="text-white/70 text-lg mb-2">No leads found</h3>
    <p className="text-white/50 mb-4">
      {hasFilters ? 'Try adjusting your filters' : 'Start by importing leads or create new ones'}
    </p>
    {hasFilters && (
      <Button onClick={onReset} variant="outline" size="sm" className="glass border-blue-400/50">
        Clear Filters
      </Button>
    )}
  </div>
);

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void; 
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-6 px-4">
      <p className="text-white/60 text-sm">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex items-center space-x-2">
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          variant="outline"
          size="sm"
          className="glass border-blue-400/50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          variant="outline"
          size="sm"
          className="glass border-blue-400/50"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default function LeadsManagementPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [leadTypeFilter, setLeadTypeFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        limit: '50',
        offset: ((currentPage - 1) * 50).toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(sourceFilter !== 'all' && { source: sourceFilter }),
        ...(leadTypeFilter !== 'all' && { type: leadTypeFilter }),
        ...(assignedFilter !== 'all' && { assigned_to: assignedFilter }),
        ...(searchTerm && { search: searchTerm }),
        sortBy: 'priority_score',
        sortOrder: 'desc'
      });

      const response = await fetch(`/api/admin/leads?${params}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load leads: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to load leads');
      }
      
      setLeads(data.leads || []);
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to load leads:', error);
      setError(error instanceof Error ? error.message : 'Failed to load leads');
      setLeads([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, sourceFilter, leadTypeFilter, assignedFilter, searchTerm]);

  const getPriorityScore = useCallback((lead: Lead) => {
    let score = 0;
    if (lead.estimated_value && lead.estimated_value > 1000) score += 3;
    if (lead.status === 'qualified') score += 2;
    if (lead.status === 'contacted') score += 1;
    if (lead.source === 'referral') score += 2;
    return score;
  }, []);

  const uniqueSources = useMemo(() => 
    stats ? Object.keys(stats.by_source).sort() : [], [stats]
  );
  
  const uniqueAssignees = useMemo(() => 
    [...new Set(leads.map(l => l.assigned_to).filter(Boolean))].sort(), [leads]
  );

  const handleLeadClick = useCallback((leadId: string) => {
    router.push(`/business-admin/leads/${leadId}`);
  }, [router]);

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setSourceFilter('all');
    setLeadTypeFilter('all');
    setAssignedFilter('all');
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || sourceFilter !== 'all' || leadTypeFilter !== 'all' || assignedFilter !== 'all';

  // Effects
  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sourceFilter, leadTypeFilter, assignedFilter]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="absolute inset-0 glass pointer-events-none" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-blue-400/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <Link href="/business-admin">
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">Leads Management</h1>
                <p className="text-sm text-white/60 hidden sm:block">Track and manage your leads</p>
              </div>
            </div>
            
            <Button 
              onClick={loadLeads} 
              variant="outline" 
              size="sm" 
              className="glass border-blue-400/50"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Lead Category Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="glass border-blue-400/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                Backflow Leads ({stats?.backflow.total || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-300">{stats?.backflow.new || 0}</div>
                  <div className="text-white/60">New</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-300">{stats?.backflow.contacted || 0}</div>
                  <div className="text-white/60">Contacted</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-300">{stats?.backflow.converted || 0}</div>
                  <div className="text-white/60">Converted</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Average Value:</span>
                  <span className="text-white font-medium">${(stats?.backflow.average_value || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-white/70">Total Value:</span>
                  <span className="text-white font-medium">${(stats?.backflow.total_value || 0).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-purple-400/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Server className="h-5 w-5 mr-2" />
                SaaS Leads ({stats?.saas.total || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-300">{stats?.saas.new || 0}</div>
                  <div className="text-white/60">New</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-300">{stats?.saas.contacted || 0}</div>
                  <div className="text-white/60">Contacted</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-300">{stats?.saas.converted || 0}</div>
                  <div className="text-white/60">Converted</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Average Value:</span>
                  <span className="text-white font-medium">${(stats?.saas.average_value || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-white/70">Total Value:</span>
                  <span className="text-white font-medium">${(stats?.saas.total_value || 0).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatsCard title="Total" value={stats?.total_leads || 0} color="white" />
          <StatsCard title="New" value={stats?.by_status.new || 0} color="blue" />
          <StatsCard title="Contacted" value={stats?.by_status.contacted || 0} color="yellow" />
          <StatsCard title="Qualified" value={stats?.by_status.qualified || 0} color="green" />
          <StatsCard title="Converted" value={stats?.by_status.converted || 0} color="emerald" />
          <StatsCard title="Lost" value={stats?.by_status.lost || 0} color="red" />
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass border-emerald-400/30">
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-emerald-300">{(stats?.conversion_rate || 0).toFixed(1)}%</div>
              <div className="text-white/70 text-sm">Conversion Rate</div>
            </CardContent>
          </Card>
          
          <Card className="glass border-yellow-400/30">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-300">${(stats?.pipeline_value || 0).toLocaleString()}</div>
              <div className="text-white/70 text-sm">Pipeline Value</div>
            </CardContent>
          </Card>
          
          <Card className="glass border-blue-400/30">
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-300">{stats?.recent_activity || 0}</div>
              <div className="text-white/70 text-sm">Recent (7 days)</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass border-blue-400/30">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="flex items-center space-x-2 sm:col-span-2 xl:col-span-1">
                <Search className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <Input
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="glass border-blue-400/50 text-white"
                />
              </div>

              <Select value={leadTypeFilter} onValueChange={setLeadTypeFilter}>
                <SelectTrigger className="glass border-blue-400/50 text-white">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="backflow">Backflow Leads</SelectItem>
                  <SelectItem value="saas">SaaS Leads</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="glass border-blue-400/50 text-white">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="glass border-blue-400/50 text-white">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {uniqueSources.map(source => (
                    <SelectItem key={source} value={source || 'unknown'}>
                      {source || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                <SelectTrigger className="glass border-blue-400/50 text-white">
                  <SelectValue placeholder="All Assigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assigned</SelectItem>
                  {uniqueAssignees.map(assignee => (
                    <SelectItem key={assignee} value={assignee || 'unassigned'}>
                      {assignee || 'Unassigned'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center justify-between text-white/70 text-sm">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span>{leads.length} leads</span>
                </div>
                {hasActiveFilters && (
                  <Button 
                    onClick={resetFilters} 
                    variant="ghost" 
                    size="sm"
                    className="text-blue-400 hover:text-blue-300 p-1 h-auto"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leads Content */}
        <Card className="glass border-blue-400/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Leads ({leads.length})
                {hasActiveFilters && (
                  <Badge className="ml-2 bg-yellow-500/20 text-yellow-300 border-yellow-400">
                    Filtered
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {stats && (
                  <div className="text-sm text-white/60">
                    <span>{stats.backflow.total} Backflow • {stats.saas.total} SaaS</span>
                  </div>
                )}
                <Button
                  onClick={loadLeads}
                  variant="outline"
                  size="sm"
                  className="glass border-blue-400/50"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardTitle>
            {hasActiveFilters && (
              <CardDescription className="text-white/70">
                Showing filtered results. <Button 
                  onClick={resetFilters} 
                  variant="link" 
                  className="p-0 h-auto text-blue-400 hover:text-blue-300"
                >
                  Clear all filters
                </Button> to see all leads.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {error ? (
              <ErrorState message={error} onRetry={loadLeads} />
            ) : loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-white/70">Loading leads...</p>
              </div>
            ) : leads.length === 0 ? (
              <EmptyState hasFilters={hasActiveFilters} onReset={resetFilters} />
            ) : (
              <div className="space-y-3">
                {leads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onClick={() => handleLeadClick(lead.id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}