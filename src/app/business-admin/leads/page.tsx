'use client';

import { useState, useEffect } from 'react';
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
  Edit,
  Filter,
  Search,
  ArrowLeft,
  ExternalLink,
  Building2,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
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

export default function LeadsManagementPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/business-admin/leads');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.leads) {
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
            source: lead.source || 'Unknown',
            status: lead.status || 'new',
            estimated_value: parseFloat(lead.estimated_value) || 0,
            notes: lead.message || lead.notes || '',
            assigned_to: lead.assigned_to || 'Unassigned',
            contacted_date: lead.contacted_date,
            qualified_date: lead.qualified_date,
            converted_date: lead.converted_date,
            converted_customer_id: lead.converted_customer_id,
            created_at: lead.created_at,
            updated_at: lead.updated_at || lead.created_at
          }));
          setLeads(formattedLeads);
        }
      }
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'new': 'bg-blue-500/20 text-blue-300 border-blue-400',
      'contacted': 'bg-yellow-500/20 text-yellow-300 border-yellow-400',
      'qualified': 'bg-green-500/20 text-green-300 border-green-400',
      'converted': 'bg-emerald-500/20 text-emerald-300 border-emerald-400',
      'lost': 'bg-red-500/20 text-red-300 border-red-400'
    };
    return colors[status as keyof typeof colors] || colors.new;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      'new': UserPlus,
      'contacted': Phone,
      'qualified': CheckCircle,
      'converted': Star,
      'lost': XCircle
    };
    const Icon = icons[status as keyof typeof icons] || UserPlus;
    return <Icon className="h-3 w-3" />;
  };

  const getPriorityScore = (lead: Lead) => {
    let score = 0;
    if (lead.estimated_value && lead.estimated_value > 1000) score += 3;
    if (lead.status === 'qualified') score += 2;
    if (lead.status === 'contacted') score += 1;
    if (lead.source === 'referral') score += 2;
    return score;
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = searchTerm === '' || 
      lead.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
    const matchesAssigned = assignedFilter === 'all' || lead.assigned_to === assignedFilter;
    
    return matchesSearch && matchesStatus && matchesSource && matchesAssigned;
  });

  const sortedLeads = filteredLeads.sort((a, b) => {
    // Sort by priority score (high to low), then by creation date (newest first)
    const scoreDiff = getPriorityScore(b) - getPriorityScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const leadStats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    converted: leads.filter(l => l.status === 'converted').length,
    lost: leads.filter(l => l.status === 'lost').length
  };

  const uniqueSources = [...new Set(leads.map(l => l.source).filter(Boolean))];
  const uniqueAssignees = [...new Set(leads.map(l => l.assigned_to).filter(Boolean))];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="absolute inset-0 glass pointer-events-none"></div>
      
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-blue-400/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/business-admin">
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Admin
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Leads Management</h1>
                <p className="text-sm text-white/60">Comprehensive lead tracking and management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                onClick={loadLeads} 
                variant="outline" 
                size="sm" 
                className="glass border-blue-400/50"
                disabled={loading}
              >
                <Clock className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="glass border-blue-400/30">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{leadStats.total}</p>
                <p className="text-white/70 text-sm">Total Leads</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-blue-400/30">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-300">{leadStats.new}</p>
                <p className="text-white/70 text-sm">New</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-yellow-400/30">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-300">{leadStats.contacted}</p>
                <p className="text-white/70 text-sm">Contacted</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-green-400/30">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-300">{leadStats.qualified}</p>
                <p className="text-white/70 text-sm">Qualified</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-emerald-400/30">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-300">{leadStats.converted}</p>
                <p className="text-white/70 text-sm">Converted</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-red-400/30">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-300">{leadStats.lost}</p>
                <p className="text-white/70 text-sm">Lost</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass border-blue-400/30">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-blue-400" />
                <Input
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="glass border-blue-400/50 text-white flex-1"
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
              
              <div className="text-white/70 text-sm flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                {filteredLeads.length} of {leads.length} leads
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card className="glass border-blue-400/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Users className="h-5 w-5 mr-2" />
              All Leads ({filteredLeads.length})
            </CardTitle>
            <CardDescription className="text-white/70">
              Click on any lead to view detailed profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-white/70 mt-4">Loading leads...</p>
              </div>
            ) : sortedLeads.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-16 w-16 text-white/30 mx-auto mb-4" />
                <p className="text-white/70 text-lg">No leads found</p>
                <p className="text-white/50">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedLeads.map((lead) => {
                  const priorityScore = getPriorityScore(lead);
                  return (
                    <div
                      key={lead.id}
                      onClick={() => router.push(`/business-admin/leads/${lead.id}`)}
                      className="glass rounded-xl p-4 border border-white/10 hover:border-blue-400/50 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          {/* Priority Indicator */}
                          <div className="flex flex-col items-center">
                            <div className={`w-2 h-8 rounded-full ${
                              priorityScore >= 4 ? 'bg-red-500' :
                              priorityScore >= 2 ? 'bg-yellow-500' :
                              'bg-gray-500'
                            }`}></div>
                          </div>
                          
                          {/* Lead Info */}
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-white font-semibold group-hover:text-blue-300 transition-colors">
                                {lead.first_name} {lead.last_name}
                              </h3>
                              {lead.company_name && (
                                <div className="flex items-center space-x-1 text-white/70">
                                  <Building2 className="h-3 w-3" />
                                  <span className="text-sm">{lead.company_name}</span>
                                </div>
                              )}
                              <Badge className={`${getStatusColor(lead.status)} text-xs border`}>
                                {getStatusIcon(lead.status)}
                                <span className="ml-1">{lead.status}</span>
                              </Badge>
                            </div>
                            
                            <div className="flex items-center space-x-6 text-sm text-white/70">
                              {lead.email && (
                                <div className="flex items-center space-x-1">
                                  <Mail className="h-3 w-3" />
                                  <span>{lead.email}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-1">
                                <Phone className="h-3 w-3" />
                                <span>{lead.phone}</span>
                              </div>
                              {lead.city && lead.state && (
                                <div className="flex items-center space-x-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{lead.city}, {lead.state}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            
                            {lead.notes && (
                              <p className="text-white/60 text-sm mt-2 line-clamp-1">{lead.notes}</p>
                            )}
                          </div>
                          
                          {/* Value & Actions */}
                          <div className="text-right">
                            <div className="text-white font-semibold mb-1">
                              ${(lead.estimated_value || 0).toLocaleString()}
                            </div>
                            <div className="text-white/60 text-xs">{lead.source}</div>
                            <div className="text-white/60 text-xs">{lead.assigned_to}</div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Eye className="h-4 w-4 text-white/70 group-hover:text-blue-300 transition-colors" />
                            <ExternalLink className="h-3 w-3 text-white/50" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}