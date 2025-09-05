'use client';

import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Thermometer, 
  Target, 
  Building2, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Navigation, 
  Search, 
  Filter, 
  Plus, 
  RefreshCw, 
  Download, 
  Eye, 
  Edit, 
  Route,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  Gauge,
  Activity,
  BarChart3,
  PieChart,
  Database,
  Bot,
  Radar,
  Cpu,
  Settings,
  Play,
  Pause,
  StopCircle,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Lead {
  id: string;
  business_name: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  facility_type: string;
  temperature: 'HOT' | 'WARM' | 'COLD';
  score: number;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  estimated_value: number;
  device_count: number;
  distance: number;
  compliance_status?: string;
  days_past_due?: number;
  contact_person?: string;
  business_size?: string;
  lat: number;
  lng: number;
  source: string;
  generated_at: string;
  last_contacted_at?: string;
  contact_count: number;
  status: 'new' | 'contacted' | 'qualified' | 'scheduled' | 'completed' | 'lost';
  notes?: string;
  scoring_breakdown?: any;
  action_plan?: any;
  route_optimization?: any;
}

interface ComplianceAlert {
  id: string;
  business_name: string;
  address: string;
  phone?: string;
  facility_type: string;
  device_count: number;
  days_past_due: number;
  estimated_value: number;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  alert_time: string;
  contacted: boolean;
  scheduled_visit?: string;
}

interface AutomationJob {
  id: string;
  job_type: string;
  source: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  leads_found: number;
  leads_scored: number;
  hot_leads: number;
  warm_leads: number;
  cold_leads: number;
  total_estimated_value: number;
  processing_time_ms?: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

interface SystemStats {
  leads: {
    total: number;
    hot: number;
    warm: number;
    cold: number;
    averageScore: number;
    totalValue: number;
  };
  alerts: {
    total: number;
    critical: number;
    high: number;
    contacted: number;
    totalValue: number;
  };
  jobs: {
    total: number;
    completed: number;
    running: number;
    failed: number;
    totalLeadsFound: number;
  };
}

export default function LeadGeneratorPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [jobs, setJobs] = useState<AutomationJob[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leads' | 'alerts' | 'automation'>('dashboard');
  const [activeFilter, setActiveFilter] = useState<'all' | 'HOT' | 'WARM' | 'COLD'>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [automationStatus, setAutomationStatus] = useState<'active' | 'paused' | 'stopped'>('active');

  // Load data on component mount
  useEffect(() => {
    loadSystemStats();
    loadLeads();
    loadAlerts();
    loadJobs();
  }, []);

  // Load system statistics
  const loadSystemStats = async () => {
    try {
      const response = await fetch('/api/lead-generation/database-integration?type=stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load system stats:', error);
    }
  };

  // Load leads from database
  const loadLeads = async (temperature?: string) => {
    try {
      const url = new URL('/api/lead-generation/database-integration', window.location.origin);
      url.searchParams.set('type', 'leads');
      url.searchParams.set('limit', '100');
      if (temperature && temperature !== 'all') {
        url.searchParams.set('temperature', temperature);
      }

      const response = await fetch(url.toString());
      const data = await response.json();
      if (data.success) {
        setLeads(data.leads);
      }
    } catch (error) {
      console.error('Failed to load leads:', error);
    }
  };

  // Load compliance alerts
  const loadAlerts = async () => {
    try {
      const response = await fetch('/api/lead-generation/database-integration?type=alerts&limit=50');
      const data = await response.json();
      if (data.success) {
        setAlerts(data.alerts);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  // Load automation jobs
  const loadJobs = async () => {
    try {
      const response = await fetch('/api/lead-generation/database-integration?type=jobs&limit=20');
      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

  // Run manual lead generation
  const runLeadGeneration = async (source: 'data_mining' | 'web_scraper' | 'compliance_monitor' | 'full_pipeline') => {
    setIsGenerating(true);
    try {
      let endpoint = '';
      let params: any = {};

      switch (source) {
        case 'data_mining':
          endpoint = '/api/lead-generation/data-mining';
          params = { radius: 20, minScore: 60 };
          break;
        case 'web_scraper':
          endpoint = '/api/lead-generation/web-scraper';
          params = { 
            sources: ['google_maps', 'yelp', 'yellow_pages'],
            location: 'Puyallup, WA',
            radius: 20
          };
          break;
        case 'compliance_monitor':
          endpoint = '/api/lead-generation/compliance-monitor?mode=scan&minScore=60';
          break;
        case 'full_pipeline':
          // Run all systems and integrate results
          await runFullPipeline();
          return;
      }

      const response = await fetch(endpoint, {
        method: source === 'compliance_monitor' ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: source !== 'compliance_monitor' ? JSON.stringify(params) : undefined
      });

      const data = await response.json();
      if (data.success) {
        // Store results in database
        if (data.leads && data.leads.length > 0) {
          await storeGeneratedLeads(data.leads, source);
        }
        if (data.urgentAlerts && data.urgentAlerts.length > 0) {
          await storeComplianceAlerts(data.urgentAlerts);
        }
        
        // Reload data
        await loadSystemStats();
        await loadLeads();
        await loadAlerts();
      }
    } catch (error) {
      console.error('Lead generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Run full automated pipeline
  const runFullPipeline = async () => {
    try {
      const response = await fetch('/api/lead-generation/database-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'full_pipeline',
          data: {
            source: 'automated_pipeline',
            params: {
              radius: 20,
              centerLat: 47.1853,
              centerLng: -122.2928,
              minScore: 60,
              includeCompliance: true,
              includeWebScraping: true,
              includeDataMining: true
            }
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        console.log('Full pipeline executed successfully:', data.pipeline);
        await loadSystemStats();
        await loadLeads();
        await loadAlerts();
        await loadJobs();
      }
    } catch (error) {
      console.error('Full pipeline failed:', error);
    }
  };

  // Store generated leads in database
  const storeGeneratedLeads = async (generatedLeads: any[], source: string) => {
    try {
      const response = await fetch('/api/lead-generation/database-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'store_leads',
          data: { leads: generatedLeads }
        })
      });

      const data = await response.json();
      if (!data.success) {
        console.error('Failed to store leads:', data.error);
      }
    } catch (error) {
      console.error('Failed to store leads:', error);
    }
  };

  // Store compliance alerts
  const storeComplianceAlerts = async (generatedAlerts: any[]) => {
    try {
      const response = await fetch('/api/lead-generation/database-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'store_alerts',
          data: { alerts: generatedAlerts }
        })
      });

      const data = await response.json();
      if (!data.success) {
        console.error('Failed to store alerts:', data.error);
      }
    } catch (error) {
      console.error('Failed to store alerts:', error);
    }
  };

  // Run compliance check (manual trigger)
  const runComplianceCheck = async (jobType: 'hourly' | 'daily' = 'hourly') => {
    try {
      const response = await fetch(`/api/cron/compliance-check?action=run&job=${jobType}`);
      const data = await response.json();
      
      if (data.success && data.newAlerts > 0) {
        await loadAlerts();
        await loadSystemStats();
      }
      
      console.log(`Compliance check completed: ${data.newAlerts} new alerts`);
    } catch (error) {
      console.error('Compliance check failed:', error);
    }
  };

  // Get temperature color
  const getTemperatureColor = (temp: string) => {
    switch (temp) {
      case 'HOT': return 'bg-red-500';
      case 'WARM': return 'bg-orange-500';
      case 'COLD': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-600 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-black';
      case 'LOW': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Filter leads based on active filter
  const filteredLeads = activeFilter === 'all' 
    ? leads 
    : leads.filter(lead => lead.temperature === activeFilter);

  // Filter urgent alerts
  const urgentAlerts = alerts.filter(alert => 
    alert.urgency === 'CRITICAL' && !alert.contacted
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Bot className="h-8 w-8 text-blue-600" />
                Fisher Backflows Lead Generation Engine
              </h1>
              <p className="text-gray-600 mt-2">
                Automated lead generation with temperature scoring • 20-mile radius around Puyallup, WA
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={automationStatus === 'active' ? 'default' : 'secondary'} className="px-3 py-1">
                <Activity className="h-4 w-4 mr-1" />
                Automation {automationStatus.toUpperCase()}
              </Badge>
              <Button onClick={() => runFullPipeline()} disabled={isGenerating} className="bg-blue-600 hover:bg-blue-700">
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Run Full Pipeline
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
              { id: 'leads', name: 'Generated Leads', icon: Target },
              { id: 'alerts', name: 'Compliance Alerts', icon: AlertCircle },
              { id: 'automation', name: 'Automation Status', icon: Bot }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Urgent Alerts Banner */}
        {urgentAlerts.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold text-red-800">
                {urgentAlerts.length} Critical Compliance Alert{urgentAlerts.length > 1 ? 's' : ''}
              </h3>
            </div>
            <p className="text-red-700 mt-1">
              Facilities requiring immediate attention - potential revenue: ${urgentAlerts.reduce((sum, alert) => sum + alert.estimated_value, 0).toLocaleString()}
            </p>
            <Button 
              onClick={() => setActiveTab('alerts')} 
              className="mt-3 bg-red-600 hover:bg-red-700 text-white"
              size="sm"
            >
              View Critical Alerts
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.leads.total || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.leads.hot || 0} hot, {stats?.leads.warm || 0} warm, {stats?.leads.cold || 0} cold
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${stats?.leads.totalValue?.toLocaleString() || '0'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Avg: ${Math.round(stats?.leads.averageScore || 0)}/lead
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats?.alerts.critical || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.alerts.contacted || 0} contacted
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Automation Jobs</CardTitle>
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.jobs.completed || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.jobs.running || 0} running
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                onClick={() => runLeadGeneration('data_mining')} 
                disabled={isGenerating}
                className="h-20 flex-col space-y-2"
                variant="outline"
              >
                <Database className="h-6 w-6" />
                <span>Data Mining</span>
              </Button>

              <Button 
                onClick={() => runLeadGeneration('web_scraper')} 
                disabled={isGenerating}
                className="h-20 flex-col space-y-2"
                variant="outline"
              >
                <Radar className="h-6 w-6" />
                <span>Web Scraping</span>
              </Button>

              <Button 
                onClick={() => runComplianceCheck()} 
                disabled={isGenerating}
                className="h-20 flex-col space-y-2"
                variant="outline"
              >
                <CheckCircle className="h-6 w-6" />
                <span>Compliance Check</span>
              </Button>

              <Button 
                onClick={() => runLeadGeneration('full_pipeline')} 
                disabled={isGenerating}
                className="h-20 flex-col space-y-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Zap className="h-6 w-6" />
                <span>Full Pipeline</span>
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Label htmlFor="temperature-filter">Temperature Filter:</Label>
                <Select 
                  value={activeFilter} 
                  onValueChange={(value: any) => {
                    setActiveFilter(value);
                    loadLeads(value === 'all' ? undefined : value);
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="HOT">🔥 Hot</SelectItem>
                    <SelectItem value="WARM">🌡️ Warm</SelectItem>
                    <SelectItem value="COLD">❄️ Cold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => loadLeads(activeFilter === 'all' ? undefined : activeFilter)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Leads List */}
            <div className="grid gap-4">
              {filteredLeads.map((lead) => (
                <Card key={lead.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold">{lead.business_name}</h3>
                        <Badge className={getTemperatureColor(lead.temperature)}>
                          {lead.temperature}
                        </Badge>
                        <Badge className={getPriorityColor(lead.priority)}>
                          {lead.priority}
                        </Badge>
                        <span className="text-sm text-gray-500">Score: {lead.score}</span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {lead.distance.toFixed(1)} mi
                        </span>
                        <span className="flex items-center">
                          <Building2 className="h-4 w-4 mr-1" />
                          {lead.facility_type}
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          ${lead.estimated_value.toLocaleString()}
                        </span>
                        {lead.days_past_due && (
                          <span className="flex items-center text-red-600">
                            <Clock className="h-4 w-4 mr-1" />
                            {lead.days_past_due} days overdue
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-700">{lead.address}</p>
                      
                      {lead.contact_person && (
                        <p className="text-sm text-gray-600">
                          Contact: {lead.contact_person}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      {lead.phone && (
                        <Button size="sm" variant="outline">
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </Button>
                      )}
                      {lead.email && (
                        <Button size="sm" variant="outline">
                          <Mail className="h-4 w-4 mr-2" />
                          Email
                        </Button>
                      )}
                      <Button size="sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Compliance Alerts</h2>
              <Button onClick={() => runComplianceCheck()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Check Now
              </Button>
            </div>

            {alerts.map((alert) => (
              <Card key={alert.id} className={`p-6 ${alert.urgency === 'CRITICAL' ? 'border-red-500 bg-red-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold">{alert.business_name}</h3>
                      <Badge 
                        className={
                          alert.urgency === 'CRITICAL' 
                            ? 'bg-red-600 text-white' 
                            : alert.urgency === 'HIGH'
                            ? 'bg-orange-500 text-white'
                            : 'bg-yellow-500 text-black'
                        }
                      >
                        {alert.urgency}
                      </Badge>
                      {alert.contacted && (
                        <Badge variant="secondary">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Contacted
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-gray-700">{alert.address}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center text-red-600">
                        <Clock className="h-4 w-4 mr-1" />
                        {alert.days_past_due} days overdue
                      </span>
                      <span className="flex items-center">
                        <Building2 className="h-4 w-4 mr-1" />
                        {alert.device_count} devices
                      </span>
                      <span className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        ${alert.estimated_value.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {alert.phone && (
                      <Button size="sm" className="bg-red-600 hover:bg-red-700">
                        <Phone className="h-4 w-4 mr-2" />
                        Call Now
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Visit
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'automation' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Automation Status</h2>
              <div className="flex items-center space-x-2">
                <Button 
                  size="sm" 
                  variant={automationStatus === 'active' ? 'default' : 'outline'}
                  onClick={() => setAutomationStatus('active')}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </Button>
                <Button 
                  size="sm" 
                  variant={automationStatus === 'paused' ? 'default' : 'outline'}
                  onClick={() => setAutomationStatus('paused')}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              </div>
            </div>

            {/* Recent Jobs */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Automation Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium">{job.job_type}</span>
                          <Badge 
                            className={
                              job.status === 'completed' ? 'bg-green-500' :
                              job.status === 'running' ? 'bg-blue-500' :
                              job.status === 'failed' ? 'bg-red-500' :
                              'bg-gray-500'
                            }
                          >
                            {job.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {job.leads_found} leads found • {job.hot_leads} hot • 
                          ${job.total_estimated_value.toLocaleString()} value
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(job.created_at).toLocaleString()}
                        </div>
                      </div>
                      
                      {job.processing_time_ms && (
                        <div className="text-sm text-gray-500">
                          {(job.processing_time_ms / 1000).toFixed(1)}s
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}