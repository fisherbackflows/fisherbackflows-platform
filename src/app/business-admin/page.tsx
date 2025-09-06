'use client';

import { useState, useEffect } from 'react';
import UnifiedCard from '@/components/ui/UnifiedCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  property_type: string;
  lead_source: string;
  status: string;
  priority: number;
  estimated_value: number;
  created_at: string;
  notes?: string;
  converted_at?: string;
  customer_id?: string;
}

interface LeadStats {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  totalValue: number;
  conversionRate: number;
}

export default function BusinessAdminPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats>({
    totalLeads: 0,
    newLeads: 0,
    qualifiedLeads: 0,
    convertedLeads: 0,
    totalValue: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    fetchLeads();
  }, [selectedStatus]);

  async function fetchLeads() {
    try {
      setLoading(true);
      const url = selectedStatus === 'all' 
        ? '/api/leads/generate' 
        : `/api/leads/generate?status=${selectedStatus}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch leads');
      
      const data = await res.json();
      
      if (data.success) {
        setLeads(data.leads || []);
        calculateStats(data.leads || []);
      } else {
        throw new Error(data.error || 'Failed to load leads');
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError('Failed to load lead data');
    } finally {
      setLoading(false);
    }
  }

  function calculateStats(leadData: Lead[]) {
    const stats: LeadStats = {
      totalLeads: leadData.length,
      newLeads: leadData.filter(l => l.status === 'New Lead').length,
      qualifiedLeads: leadData.filter(l => l.priority >= 4).length,
      convertedLeads: leadData.filter(l => l.status === 'Converted').length,
      totalValue: leadData.reduce((sum, l) => sum + (l.estimated_value || 0), 0),
      conversionRate: 0
    };
    
    if (stats.totalLeads > 0) {
      stats.conversionRate = (stats.convertedLeads / stats.totalLeads) * 100;
    }
    
    setStats(stats);
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'text-red-400';
    if (priority >= 3) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Converted':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'New Lead':
        return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-sky-900 to-slate-900">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-sky-900 to-slate-900">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-sky-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Business Admin - Lead Management</h1>
          <p className="text-gray-400">Real-time lead tracking and conversion analytics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <UnifiedCard variant="elevated" glow="blue">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Leads</p>
                <p className="text-2xl font-bold text-white">{stats.totalLeads}</p>
              </div>
              <Users className="h-10 w-10 text-sky-400" />
            </div>
          </UnifiedCard>

          <UnifiedCard variant="elevated" glow="yellow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">New Leads</p>
                <p className="text-2xl font-bold text-white">{stats.newLeads}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-yellow-400" />
            </div>
          </UnifiedCard>

          <UnifiedCard variant="elevated" glow="green">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Conversion Rate</p>
                <p className="text-2xl font-bold text-white">{stats.conversionRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-400" />
            </div>
          </UnifiedCard>

          <UnifiedCard variant="elevated" glow="emerald">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Value</p>
                <p className="text-2xl font-bold text-white">${stats.totalValue}</p>
              </div>
              <DollarSign className="h-10 w-10 text-emerald-400" />
            </div>
          </UnifiedCard>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setSelectedStatus('all')}
            className={selectedStatus === 'all' ? 'bg-sky-600' : 'bg-gray-700'}
          >
            All Leads
          </Button>
          <Button
            onClick={() => setSelectedStatus('New Lead')}
            className={selectedStatus === 'New Lead' ? 'bg-sky-600' : 'bg-gray-700'}
          >
            New
          </Button>
          <Button
            onClick={() => setSelectedStatus('Qualified')}
            className={selectedStatus === 'Qualified' ? 'bg-sky-600' : 'bg-gray-700'}
          >
            Qualified
          </Button>
          <Button
            onClick={() => setSelectedStatus('Converted')}
            className={selectedStatus === 'Converted' ? 'bg-sky-600' : 'bg-gray-700'}
          >
            Converted
          </Button>
        </div>

        {/* Leads List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white mb-4">Lead Details</h2>
          {leads.length === 0 ? (
            <UnifiedCard variant="base">
              <p className="text-gray-400 text-center py-8">No leads found</p>
            </UnifiedCard>
          ) : (
            leads.map((lead) => (
              <UnifiedCard key={lead.id} variant="elevated" hover>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(lead.status)}
                      <h3 className="text-lg font-semibold text-white">{lead.name}</h3>
                      <span className={`text-sm font-medium ${getPriorityColor(lead.priority)}`}>
                        Priority: {lead.priority}/5
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Mail className="h-4 w-4" />
                          <span>{lead.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Phone className="h-4 w-4" />
                          <span>{lead.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <MapPin className="h-4 w-4" />
                          <span>{lead.address}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="h-4 w-4" />
                          <span>Created: {new Date(lead.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-400">
                          Type: <span className="text-white">{lead.property_type}</span>
                        </p>
                        <p className="text-sm text-gray-400">
                          Source: <span className="text-white">{lead.lead_source}</span>
                        </p>
                      </div>
                    </div>

                    {lead.notes && (
                      <p className="text-sm text-gray-400 mt-3 italic">"{lead.notes}"</p>
                    )}
                  </div>
                  
                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-emerald-400">${lead.estimated_value}</p>
                    <p className="text-xs text-gray-400">Est. Annual Value</p>
                    <div className="mt-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        lead.status === 'Converted' ? 'bg-green-900 text-green-300' :
                        lead.status === 'New Lead' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-gray-800 text-gray-300'
                      }`}>
                        {lead.status}
                      </span>
                    </div>
                  </div>
                </div>
              </UnifiedCard>
            ))
          )}
        </div>
      </div>
    </div>
  );
}