'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
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
  Filter,
  Search,
  FileText,
  Zap,
  Settings,
  Download
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'automated_sequence';
  status: 'draft' | 'active' | 'paused' | 'completed';
  targetAudience: string;
  subject?: string;
  messagePreview: string;
  scheduledDate?: string;
  createdAt: string;
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    replies: number;
    conversions: number;
  };
  performance: {
    openRate: number;
    clickRate: number;
    conversionRate: number;
    responseRate: number;
  };
}

interface MarketingStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalContacts: number;
  avgOpenRate: number;
  avgClickRate: number;
  totalConversions: number;
  revenueAttributed: number;
  emailListGrowth: number;
}

interface Template {
  id: string;
  name: string;
  type: 'email' | 'sms';
  category: string;
  description: string;
  preview: string;
}

export default function BusinessMarketing() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [stats, setStats] = useState<MarketingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('campaigns');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMarketingData();
  }, []);

  const fetchMarketingData = async () => {
    try {
      // Mock data - will be replaced with real API
      const mockCampaigns: Campaign[] = [
        {
          id: '1',
          name: 'Annual Test Reminder Campaign',
          type: 'email',
          status: 'active',
          targetAudience: 'Customers with tests due in 30 days',
          subject: 'Your Annual Backflow Test is Coming Due',
          messagePreview: 'Hi {name}, your backflow test is scheduled for renewal...',
          scheduledDate: '2025-01-15T09:00:00Z',
          createdAt: '2025-01-10T10:30:00Z',
          stats: {
            sent: 45,
            delivered: 43,
            opened: 28,
            clicked: 12,
            replies: 5,
            conversions: 3
          },
          performance: {
            openRate: 65.1,
            clickRate: 27.9,
            conversionRate: 25.0,
            responseRate: 11.6
          }
        },
        {
          id: '2',
          name: 'New Customer Welcome Sequence',
          type: 'automated_sequence',
          status: 'active',
          targetAudience: 'New customers (first 30 days)',
          messagePreview: 'Welcome to Fisher Backflows! Here\'s what to expect...',
          createdAt: '2025-01-05T14:20:00Z',
          stats: {
            sent: 23,
            delivered: 23,
            opened: 21,
            clicked: 15,
            replies: 8,
            conversions: 6
          },
          performance: {
            openRate: 91.3,
            clickRate: 71.4,
            conversionRate: 40.0,
            responseRate: 34.8
          }
        },
        {
          id: '3',
          name: 'Overdue Test Urgent Notice',
          type: 'sms',
          status: 'completed',
          targetAudience: 'Customers with overdue tests',
          messagePreview: 'URGENT: Your backflow test is now overdue. Schedule today...',
          scheduledDate: '2025-01-08T08:00:00Z',
          createdAt: '2025-01-07T16:45:00Z',
          stats: {
            sent: 12,
            delivered: 12,
            opened: 12,
            clicked: 8,
            replies: 6,
            conversions: 5
          },
          performance: {
            openRate: 100.0,
            clickRate: 66.7,
            conversionRate: 62.5,
            responseRate: 50.0
          }
        }
      ];

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
      ];

      const mockStats: MarketingStats = {
        totalCampaigns: 3,
        activeCampaigns: 2,
        totalContacts: 247,
        avgOpenRate: 85.5,
        avgClickRate: 55.3,
        totalConversions: 14,
        revenueAttributed: 4200,
        emailListGrowth: 12.5
      };

      setCampaigns(mockCampaigns);
      setTemplates(mockTemplates);
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to fetch marketing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'border-gray-400 bg-gray-500/20 text-gray-200';
      case 'active': return 'border-emerald-400 bg-emerald-500/20 text-emerald-200';
      case 'paused': return 'border-amber-400 bg-amber-500/20 text-amber-200';
      case 'completed': return 'border-blue-400 bg-blue-500/20 text-blue-200';
      default: return 'border-gray-400 bg-gray-500/20 text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit className="h-4 w-4" />;
      case 'active': return <Play className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getCampaignIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-5 w-5" />;
      case 'sms': return <MessageSquare className="h-5 w-5" />;
      case 'automated_sequence': return <Zap className="h-5 w-5" />;
      default: return <Send className="h-5 w-5" />;
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    const matchesSearch = !searchTerm ||
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.targetAudience.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-white/80">Loading marketing campaigns...</p>
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
                  <Mail className="h-6 w-6 mr-3 text-blue-400" />
                  Marketing Automation
                </h1>
                <p className="text-white/60">Customer engagement and campaigns</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline" className="border-blue-400 text-white/80">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button className="glass-btn-primary hover:glow-blue text-white">
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 relative z-10">

        {/* Marketing Performance Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm font-medium">Revenue Attributed</p>
                  <p className="text-3xl font-bold text-white">${stats.revenueAttributed.toLocaleString()}</p>
                  <p className="text-emerald-400 text-sm mt-1">From {stats.totalConversions} conversions</p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-400" />
              </div>
            </div>

            <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm font-medium">Avg Open Rate</p>
                  <p className="text-3xl font-bold text-white">{stats.avgOpenRate.toFixed(1)}%</p>
                  <p className="text-blue-400 text-sm mt-1">Above industry avg (21%)</p>
                </div>
                <Eye className="h-8 w-8 text-blue-400" />
              </div>
            </div>

            <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm font-medium">Click Rate</p>
                  <p className="text-3xl font-bold text-white">{stats.avgClickRate.toFixed(1)}%</p>
                  <p className="text-purple-400 text-sm mt-1">High engagement</p>
                </div>
                <MousePointer className="h-8 w-8 text-purple-400" />
              </div>
            </div>

            <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm font-medium">List Growth</p>
                  <p className="text-3xl font-bold text-white">+{stats.emailListGrowth.toFixed(1)}%</p>
                  <p className="text-amber-400 text-sm mt-1">{stats.totalContacts} total contacts</p>
                </div>
                <Users className="h-8 w-8 text-amber-400" />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="glass border border-blue-400 rounded-xl p-4 glow-blue-sm mb-8">
          <div className="flex space-x-2">
            {[
              { id: 'campaigns', label: 'Campaigns', icon: Send },
              { id: 'templates', label: 'Templates', icon: FileText },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'contacts', label: 'Contacts', icon: Users }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all font-medium ${
                  activeTab === id
                    ? 'bg-blue-600 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            {/* Campaign Filters */}
            <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                  <input
                    type="text"
                    placeholder="Search campaigns..."
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
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="flex items-center text-white/80">
                  <Send className="h-5 w-5 text-blue-400 mr-2" />
                  <span className="text-sm">Total: {filteredCampaigns.length} campaigns</span>
                </div>
              </div>
            </div>

            {/* Campaigns List */}
            <div className="space-y-4">
              {filteredCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm hover:bg-white/10 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-blue-400/20 rounded-lg text-blue-400">
                          {getCampaignIcon(campaign.type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white">{campaign.name}</h3>
                          <p className="text-white/60 text-sm">{campaign.targetAudience}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(campaign.status)}`}>
                            {getStatusIcon(campaign.status)}
                            <span className="capitalize">{campaign.status}</span>
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium border border-blue-400 bg-blue-500/20 text-blue-200 capitalize">
                            {campaign.type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Preview */}
                      <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                        {campaign.subject && (
                          <p className="text-white font-medium text-sm mb-1">Subject: {campaign.subject}</p>
                        )}
                        <p className="text-white/80 text-sm">{campaign.messagePreview}</p>
                      </div>

                      {/* Performance Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-3 bg-blue-400/10 border border-blue-400/20 rounded-lg">
                          <p className="text-lg font-bold text-blue-400">{campaign.stats.sent}</p>
                          <p className="text-white/60 text-xs">Sent</p>
                        </div>
                        <div className="text-center p-3 bg-emerald-400/10 border border-emerald-400/20 rounded-lg">
                          <p className="text-lg font-bold text-emerald-400">{campaign.performance.openRate.toFixed(1)}%</p>
                          <p className="text-white/60 text-xs">Open Rate</p>
                        </div>
                        <div className="text-center p-3 bg-purple-400/10 border border-purple-400/20 rounded-lg">
                          <p className="text-lg font-bold text-purple-400">{campaign.performance.clickRate.toFixed(1)}%</p>
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
                            <Calendar className="h-4 w-4 text-blue-400" />
                            <span>Created: {new Date(campaign.createdAt).toLocaleDateString()}</span>
                          </div>
                          {campaign.scheduledDate && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4 text-amber-400" />
                              <span>Scheduled: {new Date(campaign.scheduledDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" className="border-blue-400 text-white/80">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="border-blue-400 text-white/80">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="border-blue-400 text-white/80">
                            <Copy className="h-4 w-4" />
                          </Button>
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
              <div key={template.id} className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm hover:bg-white/10 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-400/20 rounded-lg text-blue-400">
                      {template.type === 'email' ? <Mail className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{template.name}</h3>
                      <p className="text-blue-400 text-sm">{template.category}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium border border-blue-400 bg-blue-500/20 text-blue-200 capitalize">
                    {template.type}
                  </span>
                </div>

                <p className="text-white/80 text-sm mb-4">{template.description}</p>

                <div className="p-3 bg-white/5 rounded-lg mb-4 border border-white/10">
                  <p className="text-white/70 text-sm italic">{template.preview}</p>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" className="flex-1 border-blue-400 text-white/80">
                    Use Template
                  </Button>
                  <Button variant="outline" size="sm" className="border-blue-400 text-white/80">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Placeholder for other tabs */}
        {(activeTab === 'analytics' || activeTab === 'contacts') && (
          <div className="text-center py-16">
            <div className="glass border border-blue-400 rounded-xl p-8 max-w-md mx-auto glow-blue-sm">
              <Settings className="h-16 w-16 text-blue-400/50 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                {activeTab === 'analytics' ? 'Advanced Analytics' : 'Contact Management'}
              </h3>
              <p className="text-white/80 mb-4">
                {activeTab === 'analytics'
                  ? 'Detailed campaign performance analytics and insights.'
                  : 'Comprehensive contact list management and segmentation.'
                }
              </p>
              <Button className="glass-btn-primary hover:glow-blue text-white">
                Coming Soon
              </Button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}