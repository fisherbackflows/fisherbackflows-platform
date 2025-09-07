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
  AlertTriangle
} from 'lucide-react';

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  email?: string;
  phone: string;
  address_line1?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  source?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  estimated_value?: number;
  notes?: string;
  assigned_to?: string;
  contacted_date?: string;
  qualified_date?: string;
  converted_date?: string;
  converted_customer_id?: string;
  created_at: string;
  updated_at: string;
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
const LeadCard = ({ lead, onClick, priorityScore }: { 
  lead: Lead; 
  onClick: () => void; 
  priorityScore: number; 
}) => {
  const StatusIcon = STATUS_CONFIG[lead.status].icon;
  
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
          priorityScore >= 4 ? 'bg-red-500' :
          priorityScore >= 2 ? 'bg-yellow-500' : 'bg-gray-500'
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
            </div>
            <Badge className={`${STATUS_CONFIG[lead.status].color} text-xs border flex-shrink-0`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {lead.status}
            </Badge>
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
                ${(lead.estimated_value || 0).toLocaleString()}
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/business-admin/leads');
      if (!response.ok) {
        throw new Error(`Failed to load leads: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      if (!data.success || !data.leads) {
        throw new Error('Invalid response format');
      }
      
      const formattedLeads: Lead[] = data.leads.map((lead: any) => ({
        id: lead.id,
        first_name: lead.first_name || '',
        last_name: lead.last_name || '',
        company_name: lead.company_name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        address_line1: lead.address || '',
        city: lead.city || '',
        state: lead.state || '',
        zip_code: lead.zip_code || '',
        source: lead.source || 'unknown',
        status: lead.status || 'new',
        estimated_value: lead.estimated_value || 0,
        notes: lead.notes || '',
        assigned_to: lead.assigned_to || 'Unassigned',
        contacted_date: lead.contacted_date || '',
        qualified_date: lead.qualified_date || '',
        converted_date: lead.converted_date || '',
        converted_customer_id: lead.converted_customer_id || '',
        created_at: lead.created_at || new Date().toISOString(),
        updated_at: lead.updated_at || new Date().toISOString()
      }));
      
      setLeads(formattedLeads);
    } catch (error) {
      console.error('Failed to load leads:', error);
      setError(error instanceof Error ? error.message : 'Failed to load leads');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getPriorityScore = useCallback((lead: Lead) => {
    let score = 0;
    if (lead.estimated_value && lead.estimated_value > 1000) score += 3;
    if (lead.status === 'qualified') score += 2;
    if (lead.status === 'contacted') score += 1;
    if (lead.source === 'referral') score += 2;
    return score;
  }, []);

  const filteredLeads = useMemo(() => {
    if (!leads.length) return [];
    
    const searchLower = searchTerm.toLowerCase().trim();
    
    const filtered = leads.filter(lead => {
      const matchesSearch = !searchLower || 
        lead.first_name.toLowerCase().includes(searchLower) ||
        lead.last_name.toLowerCase().includes(searchLower) ||
        lead.company_name?.toLowerCase().includes(searchLower) ||
        lead.email?.toLowerCase().includes(searchLower) ||
        lead.phone.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
      const matchesAssigned = assignedFilter === 'all' || lead.assigned_to === assignedFilter;
      
      return matchesSearch && matchesStatus && matchesSource && matchesAssigned;
    });

    return filtered.sort((a, b) => {
      const scoreDiff = getPriorityScore(b) - getPriorityScore(a);
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [leads, searchTerm, statusFilter, sourceFilter, assignedFilter, getPriorityScore]);

  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLeads.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredLeads, currentPage]);

  const totalPages = Math.ceil(filteredLeads.length / ITEMS_PER_PAGE);

  const leadStats = useMemo(() => ({
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    converted: leads.filter(l => l.status === 'converted').length,
    lost: leads.filter(l => l.status === 'lost').length
  }), [leads]);

  const uniqueSources = useMemo(() => 
    [...new Set(leads.map(l => l.source).filter(Boolean))].sort(), [leads]
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
    setAssignedFilter('all');
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || sourceFilter !== 'all' || assignedFilter !== 'all';

  // Effects
  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sourceFilter, assignedFilter]);

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
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatsCard title="Total" value={leadStats.total} color="white" />
          <StatsCard title="New" value={leadStats.new} color="blue" />
          <StatsCard title="Contacted" value={leadStats.contacted} color="yellow" />
          <StatsCard title="Qualified" value={leadStats.qualified} color="green" />
          <StatsCard title="Converted" value={leadStats.converted} color="emerald" />
          <StatsCard title="Lost" value={leadStats.lost} color="red" />
        </div>

        {/* Filters */}
        <Card className="glass border-blue-400/30">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              <div className="flex items-center space-x-2 sm:col-span-2 lg:col-span-1">
                <Search className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <Input
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="glass border-blue-400/50 text-white"
                />
              </div>
              
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
                  <span>{filteredLeads.length} of {leads.length}</span>
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
                Leads ({filteredLeads.length})
              </div>
              {totalPages > 1 && (
                <span className="text-sm text-white/60 font-normal">
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredLeads.length)}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <ErrorState message={error} onRetry={loadLeads} />
            ) : loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-white/70">Loading leads...</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <EmptyState hasFilters={hasActiveFilters} onReset={resetFilters} />
            ) : (
              <>
                <div className="space-y-3">
                  {paginatedLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onClick={() => handleLeadClick(lead.id)}
                      priorityScore={getPriorityScore(lead)}
                    />
                  ))}
                </div>
                
                <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}