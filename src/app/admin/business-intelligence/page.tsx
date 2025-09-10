'use client';

import { useState, useEffect } from 'react';
import AdminProtection from '@/components/auth/AdminProtection';
import { AdminNavigation } from '@/components/navigation/UnifiedNavigation';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  UserPlus, 
  Building2, 
  Phone, 
  Mail,
  Activity,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Download,
  Search,
  RefreshCw,
  Settings,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Edit,
  Trash2,
  Plus,
  BarChart3,
  PieChart,
  MapPin,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface SaasClient {
  id: string;
  company_name: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_email: string;
  contact_phone?: string;
  industry?: string;
  company_size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  subscription_plan: 'trial' | 'basic' | 'professional' | 'enterprise' | 'custom';
  monthly_revenue: number;
  subscription_start_date?: string;
  subscription_end_date?: string;
  account_status: 'prospect' | 'trial' | 'active' | 'suspended' | 'churned';
  lead_source?: string;
  assigned_account_manager?: string;
  company_website?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  lead_score?: number;
  last_contact_date?: string;
  next_follow_up_date?: string;
  notes?: string;
  tags?: string[];
  api_key?: string;
  webhook_url?: string;
  custom_domain?: string;
  integration_status?: 'pending' | 'configured' | 'active' | 'error';
  created_at: string;
  updated_at: string;
}

interface BusinessMetrics {
  backflow_leads: {
    total: number;
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
    lost: number;
    conversion_rate: number;
    average_value: number;
  };
  saas_clients: {
    total: number;
    prospects: number;
    trials: number;
    active: number;
    suspended: number;
    churned: number;
    mrr: number;
    arr: number;
    churn_rate: number;
  };
  revenue: {
    total_ytd: number;
    backflow_revenue: number;
    saas_revenue: number;
    monthly_growth: number;
    projected_annual: number;
  };
}

export default function BusinessIntelligencePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [saasClients, setSaasClients] = useState<SaasClient[]>([]);
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data for demonstration
  const mockMetrics: BusinessMetrics = {
    backflow_leads: {
      total: 47,
      new: 12,
      contacted: 18,
      qualified: 8,
      converted: 6,
      lost: 3,
      conversion_rate: 68.2,
      average_value: 485
    },
    saas_clients: {
      total: 23,
      prospects: 8,
      trials: 4,
      active: 7,
      suspended: 2,
      churned: 2,
      mrr: 12450,
      arr: 149400,
      churn_rate: 8.7
    },
    revenue: {
      total_ytd: 247350,
      backflow_revenue: 189200,
      saas_revenue: 58150,
      monthly_growth: 15.3,
      projected_annual: 325000
    }
  };

  const mockLeads: Lead[] = [
    {
      id: '1',
      first_name: 'John',
      last_name: 'Mitchell',
      company_name: 'Mitchell Properties LLC',
      email: 'john@mitchell-props.com',
      phone: '(253) 555-0123',
      address_line1: '1234 Main St',
      city: 'Tacoma',
      state: 'WA',
      zip_code: '98402',
      source: 'Google Ads',
      status: 'qualified',
      estimated_value: 650,
      notes: 'Has 3 commercial properties needing annual testing',
      assigned_to: 'Fisher Admin',
      contacted_date: '2024-01-15T10:30:00Z',
      qualified_date: '2024-01-16T14:20:00Z',
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-16T14:20:00Z'
    },
    {
      id: '2',
      first_name: 'Sarah',
      last_name: 'Chen',
      company_name: 'Pacific Northwest Restaurant Group',
      email: 'sarah.chen@pnrg.com',
      phone: '(253) 555-0456',
      address_line1: '5678 Commercial Ave',
      city: 'Lakewood',
      state: 'WA',
      zip_code: '98499',
      source: 'Referral - Mike Rodriguez',
      status: 'new',
      estimated_value: 1850,
      notes: 'Restaurant chain with 12 locations, interested in maintenance contract',
      assigned_to: 'Fisher Admin',
      created_at: '2024-01-18T14:15:00Z',
      updated_at: '2024-01-18T14:15:00Z'
    },
    {
      id: '3',
      first_name: 'Mike',
      last_name: 'Rodriguez', 
      email: 'mike.r@buildingmgmt.com',
      phone: '(253) 555-0789',
      company_name: 'Rodriguez Building Management',
      address_line1: '910 Industrial Blvd',
      city: 'Puyallup',
      state: 'WA',
      zip_code: '98371',
      source: 'Website Contact Form',
      status: 'contacted',
      estimated_value: 420,
      notes: 'Property manager for 8 small commercial buildings',
      assigned_to: 'Fisher Admin',
      contacted_date: '2024-01-20T11:45:00Z',
      created_at: '2024-01-20T09:45:00Z',
      updated_at: '2024-01-20T11:45:00Z'
    },
    {
      id: '4',
      first_name: 'Jennifer',
      last_name: 'Williams',
      company_name: 'Cascade Medical Center',
      email: 'j.williams@cascademedical.org',
      phone: '(253) 555-0321',
      address_line1: '2100 Health Plaza Dr',
      city: 'Federal Way',
      state: 'WA', 
      zip_code: '98003',
      source: 'Cold Call',
      status: 'converted',
      estimated_value: 2400,
      notes: 'Large medical facility with complex backflow system - converted to customer',
      assigned_to: 'Fisher Admin',
      contacted_date: '2024-01-12T09:15:00Z',
      qualified_date: '2024-01-13T16:30:00Z',
      converted_date: '2024-01-25T10:00:00Z',
      converted_customer_id: 'cust_001',
      created_at: '2024-01-12T09:15:00Z',
      updated_at: '2024-01-25T10:00:00Z'
    }
  ];

  const mockSaasClients: SaasClient[] = [
    {
      id: '1',
      company_name: 'AquaTech Solutions',
      contact_first_name: 'David',
      contact_last_name: 'Park',
      contact_email: 'david@aquatech.com',
      contact_phone: '(206) 555-0123',
      industry: 'Water Management',
      company_size: 'medium',
      subscription_plan: 'professional',
      monthly_revenue: 299,
      subscription_start_date: '2024-01-15T00:00:00Z',
      account_status: 'active',
      lead_source: 'Industry Conference - WaterTech 2024',
      assigned_account_manager: 'Fisher Admin',
      company_website: 'https://aquatech.com',
      address_line1: '1500 Tech Center Dr',
      city: 'Seattle',
      state: 'WA',
      zip_code: '98101',
      lead_score: 85,
      last_contact_date: '2024-01-20T14:30:00Z',
      notes: 'Impressed with our automation capabilities. Potential for enterprise upgrade.',
      tags: ['high-value', 'upsell-potential', 'reference-customer'],
      integration_status: 'active',
      created_at: '2024-01-10T08:00:00Z',
      updated_at: '2024-01-20T14:30:00Z'
    },
    {
      id: '2',
      company_name: 'Western States Compliance',
      contact_first_name: 'Jennifer',
      contact_last_name: 'Williams',
      contact_email: 'jwilliams@wsccorp.com',
      contact_phone: '(503) 555-0456',
      industry: 'Compliance & Consulting',
      company_size: 'large',
      subscription_plan: 'enterprise',
      monthly_revenue: 599,
      subscription_start_date: '2024-01-20T00:00:00Z',
      account_status: 'trial',
      lead_source: 'Cold Outreach - LinkedIn',
      assigned_account_manager: 'Fisher Admin',
      company_website: 'https://westernstatescompliance.com',
      address_line1: '800 Corporate Plaza',
      city: 'Portland',
      state: 'OR',
      zip_code: '97201',
      lead_score: 92,
      next_follow_up_date: '2024-02-01T10:00:00Z',
      notes: 'Evaluating our platform for their client base of 200+ properties. Decision expected by Feb 1.',
      tags: ['enterprise-trial', 'high-value', 'decision-pending'],
      integration_status: 'configured',
      created_at: '2024-01-12T11:30:00Z',
      updated_at: '2024-01-22T16:45:00Z'
    },
    {
      id: '3',
      company_name: 'Northwest Property Services',
      contact_first_name: 'Michael',
      contact_last_name: 'Thompson',
      contact_email: 'mthompson@nwproperty.com',
      contact_phone: '(425) 555-0789',
      industry: 'Property Management',
      company_size: 'small',
      subscription_plan: 'basic',
      monthly_revenue: 99,
      subscription_start_date: '2024-01-18T00:00:00Z',
      account_status: 'active',
      lead_source: 'Partner Referral - ABC Testing',
      assigned_account_manager: 'Fisher Admin',
      company_website: 'https://nwproperty.com',
      address_line1: '456 Business Park Way',
      city: 'Bellevue',
      state: 'WA',
      zip_code: '98004',
      lead_score: 67,
      last_contact_date: '2024-01-19T13:15:00Z',
      notes: 'Small property management company with 25 properties. Good fit for basic plan.',
      tags: ['small-business', 'stable'],
      integration_status: 'active',
      created_at: '2024-01-16T09:20:00Z',
      updated_at: '2024-01-19T13:15:00Z'
    }
  ];

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setMetrics(mockMetrics);
      setLeads(mockLeads);
      setSaasClients(mockSaasClients);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'new': 'bg-blue-500/20 text-blue-300 border-blue-400',
      'contacted': 'bg-yellow-500/20 text-yellow-300 border-yellow-400',
      'qualified': 'bg-green-500/20 text-green-300 border-green-400',
      'converted': 'bg-emerald-500/20 text-emerald-300 border-emerald-400',
      'lost': 'bg-red-500/20 text-red-300 border-red-400',
      'prospect': 'bg-blue-500/20 text-blue-300 border-blue-400',
      'trial': 'bg-orange-500/20 text-orange-300 border-orange-400',
      'active': 'bg-green-500/20 text-green-300 border-green-400',
      'suspended': 'bg-red-500/20 text-red-300 border-red-400',
      'churned': 'bg-gray-500/20 text-gray-300 border-gray-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300 border-gray-400';
  };

  const getPlanColor = (plan: string) => {
    const colors: { [key: string]: string } = {
      'trial': 'bg-orange-500/20 text-orange-300 border-orange-400',
      'basic': 'bg-blue-500/20 text-blue-300 border-blue-400',
      'professional': 'bg-purple-500/20 text-purple-300 border-purple-400',
      'enterprise': 'bg-emerald-500/20 text-emerald-300 border-emerald-400',
      'custom': 'bg-amber-500/20 text-amber-300 border-amber-400'
    };
    return colors[plan] || 'bg-gray-500/20 text-gray-300 border-gray-400';
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = searchTerm === '' || 
      lead.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredSaasClients = saasClients.filter(client => {
    const matchesSearch = searchTerm === '' ||
      client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact_first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact_last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || client.account_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <AdminProtection requiredRole="admin">
        <div className="min-h-screen bg-black">
          <AdminNavigation userInfo={{ name: 'Admin', role: 'admin' }} />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg font-medium text-white/80">Loading Business Intelligence...</p>
            </div>
          </div>
        </div>
      </AdminProtection>
    );
  }

  return (
    <AdminProtection requiredRole="admin">
      <div className="min-h-screen bg-black text-white">
        <AdminNavigation userInfo={{ name: 'Admin', role: 'admin' }} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Page Header */}
          <div className="space-y-2 mb-8">
            <h1 className="text-3xl font-bold text-white">Business Intelligence</h1>
            <p className="text-white/70">Lead Tracking & SaaS Client Management</p>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 mb-8 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'backflow-leads', label: 'Backflow Leads', icon: UserPlus },
              { id: 'saas-clients', label: 'SaaS Clients', icon: Building2 },
              { id: 'revenue', label: 'Revenue Analytics', icon: DollarSign },
              { id: 'pipeline', label: 'Sales Pipeline', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-500/30 text-white border border-blue-400/50'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Main Content */}
          <main className="space-y-8">
          {activeTab === 'overview' && (
            <>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white">Business Overview</h2>
                <p className="text-white/70">Comprehensive view of your backflow business and SaaS operations</p>
              </div>
              
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="glass border-blue-400/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-white/70 text-sm font-medium">Total YTD Revenue</p>
                        <p className="text-3xl font-bold text-white">${metrics?.revenue.total_ytd.toLocaleString()}</p>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-500/20 text-green-300 border-0 text-xs">
                            +{metrics?.revenue.monthly_growth}%
                          </Badge>
                          <span className="text-white/50 text-xs">vs last month</span>
                        </div>
                      </div>
                      <div className="p-3 rounded-2xl bg-black/40 text-green-400">
                        <DollarSign className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass border-blue-400/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-white/70 text-sm font-medium">Backflow Leads</p>
                        <p className="text-3xl font-bold text-white">{metrics?.backflow_leads.total}</p>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-blue-500/20 text-blue-300 border-0 text-xs">
                            {metrics?.backflow_leads.conversion_rate}% conversion
                          </Badge>
                        </div>
                      </div>
                      <div className="p-3 rounded-2xl bg-black/40 text-blue-400">
                        <UserPlus className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass border-blue-400/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-white/70 text-sm font-medium">SaaS Clients</p>
                        <p className="text-3xl font-bold text-white">{metrics?.saas_clients.total}</p>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-purple-500/20 text-purple-300 border-0 text-xs">
                            ${metrics?.saas_clients.mrr.toLocaleString()} MRR
                          </Badge>
                        </div>
                      </div>
                      <div className="p-3 rounded-2xl bg-black/40 text-purple-400">
                        <Building2 className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass border-blue-400/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-white/70 text-sm font-medium">Projected Annual</p>
                        <p className="text-3xl font-bold text-white">${metrics?.revenue.projected_annual.toLocaleString()}</p>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-0 text-xs">
                            On track
                          </Badge>
                        </div>
                      </div>
                      <div className="p-3 rounded-2xl bg-black/40 text-emerald-400">
                        <TrendingUp className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Breakdown */}
              <div className="grid lg:grid-cols-2 gap-8">
                <Card className="glass border-blue-400/30">
                  <CardHeader>
                    <CardTitle className="text-white">Revenue Breakdown</CardTitle>
                    <CardDescription className="text-white/70">By business segment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white/70">Backflow Services</span>
                          <span className="text-white font-semibold">${metrics?.revenue.backflow_revenue.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full" 
                            style={{ width: `${(metrics?.revenue.backflow_revenue || 0) / (metrics?.revenue.total_ytd || 1) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white/70">SaaS Subscriptions</span>
                          <span className="text-white font-semibold">${metrics?.revenue.saas_revenue.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full" 
                            style={{ width: `${(metrics?.revenue.saas_revenue || 0) / (metrics?.revenue.total_ytd || 1) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass border-blue-400/30">
                  <CardHeader>
                    <CardTitle className="text-white">Lead Status Distribution</CardTitle>
                    <CardDescription className="text-white/70">Backflow leads by status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { status: 'New', count: metrics?.backflow_leads.new || 0, color: 'bg-blue-500' },
                        { status: 'Contacted', count: metrics?.backflow_leads.contacted || 0, color: 'bg-yellow-500' },
                        { status: 'Qualified', count: metrics?.backflow_leads.qualified || 0, color: 'bg-green-500' },
                        { status: 'Converted', count: metrics?.backflow_leads.converted || 0, color: 'bg-emerald-500' },
                        { status: 'Lost', count: metrics?.backflow_leads.lost || 0, color: 'bg-red-500' }
                      ].map((item) => (
                        <div key={item.status} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                            <span className="text-white/70">{item.status}</span>
                          </div>
                          <span className="text-white font-semibold">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {activeTab === 'backflow-leads' && (
            <>
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-white">Backflow Leads</h2>
                  <p className="text-white/70">Manage your backflow testing prospects and opportunities</p>
                </div>
                <Button className="glass-btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
                    <Input
                      placeholder="Search leads by name, company, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 glass border-blue-400/50"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48 glass border-blue-400/50">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="glass border-blue-400/50">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              {/* Leads Table */}
              <Card className="glass border-blue-400/30">
                <CardContent className="p-0">
                  <div className="space-y-0">
                    {filteredLeads.map((lead) => (
                      <div key={lead.id} className="border-b border-blue-400/20 last:border-b-0 p-6 hover:bg-white/5 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white font-semibold">
                                {lead.first_name[0]}{lead.last_name[0]}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-3">
                                <h3 className="font-semibold text-white text-lg">
                                  {lead.first_name} {lead.last_name}
                                </h3>
                                <Badge className={`${getStatusColor(lead.status)} border text-xs`}>
                                  {lead.status}
                                </Badge>
                              </div>
                              {lead.company_name && (
                                <p className="text-white/70 font-medium">{lead.company_name}</p>
                              )}
                              <div className="flex items-center space-x-4 text-sm">
                                {lead.email && (
                                  <a href={`mailto:${lead.email}`} className="flex items-center text-blue-400 hover:text-blue-300">
                                    <Mail className="h-3 w-3 mr-1" />
                                    {lead.email}
                                  </a>
                                )}
                                <a href={`tel:${lead.phone}`} className="flex items-center text-green-400 hover:text-green-300">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {lead.phone}
                                </a>
                                {lead.address_line1 && (
                                  <span className="flex items-center text-white/60">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {lead.city}, {lead.state}
                                  </span>
                                )}
                              </div>
                              {lead.notes && (
                                <p className="text-white/60 text-sm mt-2 max-w-2xl">{lead.notes}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <div className="text-white font-semibold text-lg">
                              {lead.estimated_value ? `$${lead.estimated_value.toLocaleString()}` : 'TBD'}
                            </div>
                            <div className="text-white/50 text-sm">
                              {lead.source && `via ${lead.source}`}
                            </div>
                            <div className="text-white/40 text-xs">
                              Created: {new Date(lead.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex space-x-2 mt-3">
                              <Button size="sm" variant="outline" className="glass border-blue-400/50 text-xs">
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button size="sm" variant="outline" className="glass border-green-400/50 text-xs">
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                Schedule
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'saas-clients' && (
            <>
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-white">SaaS Clients</h2>
                  <p className="text-white/70">Manage your software service clients and subscriptions</p>
                </div>
                <Button className="glass-btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
                    <Input
                      placeholder="Search clients by company name, contact, or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 glass border-blue-400/50"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48 glass border-blue-400/50">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="churned">Churned</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="glass border-blue-400/50">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              {/* SaaS Clients Table */}
              <Card className="glass border-blue-400/30">
                <CardContent className="p-0">
                  <div className="space-y-0">
                    {filteredSaasClients.map((client) => (
                      <div key={client.id} className="border-b border-blue-400/20 last:border-b-0 p-6 hover:bg-white/5 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-white" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-3">
                                <h3 className="font-semibold text-white text-lg">{client.company_name}</h3>
                                <Badge className={`${getStatusColor(client.account_status)} border text-xs`}>
                                  {client.account_status}
                                </Badge>
                                <Badge className={`${getPlanColor(client.subscription_plan)} border text-xs`}>
                                  {client.subscription_plan}
                                </Badge>
                                {client.integration_status && (
                                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400 text-xs">
                                    {client.integration_status}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-white/70 font-medium">
                                {client.contact_first_name} {client.contact_last_name}
                              </p>
                              <div className="flex items-center space-x-4 text-sm">
                                <a href={`mailto:${client.contact_email}`} className="flex items-center text-blue-400 hover:text-blue-300">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {client.contact_email}
                                </a>
                                {client.contact_phone && (
                                  <a href={`tel:${client.contact_phone}`} className="flex items-center text-green-400 hover:text-green-300">
                                    <Phone className="h-3 w-3 mr-1" />
                                    {client.contact_phone}
                                  </a>
                                )}
                                {client.company_website && (
                                  <a href={client.company_website} target="_blank" rel="noopener noreferrer" className="flex items-center text-purple-400 hover:text-purple-300">
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Website
                                  </a>
                                )}
                              </div>
                              {client.industry && (
                                <p className="text-white/50 text-sm">Industry: {client.industry}</p>
                              )}
                              {client.tags && client.tags.length > 0 && (
                                <div className="flex space-x-1 mt-2">
                                  {client.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs glass border-white/30">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              {client.notes && (
                                <p className="text-white/60 text-sm mt-2 max-w-2xl">{client.notes}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <div className="text-white font-semibold text-lg">
                              ${client.monthly_revenue}/mo
                            </div>
                            {client.lead_score && (
                              <div className="text-white/70 text-sm">
                                Lead Score: {client.lead_score}/100
                              </div>
                            )}
                            <div className="text-white/50 text-sm">
                              {client.lead_source && `via ${client.lead_source}`}
                            </div>
                            <div className="text-white/40 text-xs">
                              Since: {new Date(client.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex space-x-2 mt-3">
                              <Button size="sm" variant="outline" className="glass border-blue-400/50 text-xs">
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button size="sm" variant="outline" className="glass border-green-400/50 text-xs">
                                <Activity className="h-3 w-3 mr-1" />
                                Activity
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'revenue' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white">Revenue Analytics</h2>
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="glass border-blue-400/30">
                  <CardHeader>
                    <CardTitle className="text-white">Revenue by Source</CardTitle>
                    <CardDescription className="text-white/70">Year-to-date breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Backflow Testing Services</span>
                        <span className="text-white font-semibold">${metrics?.revenue.backflow_revenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">SaaS Subscriptions</span>
                        <span className="text-white font-semibold">${metrics?.revenue.saas_revenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-white/20">
                        <span className="text-white font-semibold">Total YTD</span>
                        <span className="text-white font-bold text-xl">${metrics?.revenue.total_ytd.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass border-blue-400/30">
                  <CardHeader>
                    <CardTitle className="text-white">SaaS Metrics</CardTitle>
                    <CardDescription className="text-white/70">Subscription analytics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Monthly Recurring Revenue</span>
                        <span className="text-white font-semibold">${metrics?.saas_clients.mrr.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Annual Recurring Revenue</span>
                        <span className="text-white font-semibold">${metrics?.saas_clients.arr.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Churn Rate</span>
                        <span className="text-white font-semibold">{metrics?.saas_clients.churn_rate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Active Subscriptions</span>
                        <span className="text-white font-semibold">{metrics?.saas_clients.active}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'pipeline' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white">Sales Pipeline</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="glass border-blue-400/30">
                  <CardHeader>
                    <CardTitle className="text-white">Backflow Pipeline</CardTitle>
                    <CardDescription className="text-white/70">Lead progression and values</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { stage: 'New Leads', count: metrics?.backflow_leads.new || 0, value: 14580, color: 'bg-blue-500' },
                        { stage: 'Contacted', count: metrics?.backflow_leads.contacted || 0, value: 21340, color: 'bg-yellow-500' },
                        { stage: 'Qualified', count: metrics?.backflow_leads.qualified || 0, value: 15200, color: 'bg-green-500' },
                        { stage: 'Ready to Convert', count: metrics?.backflow_leads.qualified || 0, value: 8750, color: 'bg-emerald-500' }
                      ].map((stage) => (
                        <div key={stage.stage} className="flex items-center justify-between p-3 glass rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full ${stage.color}`}></div>
                            <span className="text-white/70">{stage.stage}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-semibold">{stage.count} leads</div>
                            <div className="text-white/60 text-sm">${stage.value.toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass border-blue-400/30">
                  <CardHeader>
                    <CardTitle className="text-white">SaaS Pipeline</CardTitle>
                    <CardDescription className="text-white/70">Client acquisition funnel</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { stage: 'Prospects', count: metrics?.saas_clients.prospects || 0, value: 47920, color: 'bg-purple-500' },
                        { stage: 'Trials', count: metrics?.saas_clients.trials || 0, value: 23960, color: 'bg-orange-500' },
                        { stage: 'Active Clients', count: metrics?.saas_clients.active || 0, value: 14980, color: 'bg-green-500' },
                        { stage: 'Enterprise Deals', count: 2, value: 35940, color: 'bg-emerald-500' }
                      ].map((stage) => (
                        <div key={stage.stage} className="flex items-center justify-between p-3 glass rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full ${stage.color}`}></div>
                            <span className="text-white/70">{stage.stage}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-semibold">{stage.count} clients</div>
                            <div className="text-white/60 text-sm">${stage.value.toLocaleString()} ARR</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          </main>
        </div>
      </div>
    </AdminProtection>
  );
}