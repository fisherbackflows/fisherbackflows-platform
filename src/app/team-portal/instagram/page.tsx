'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StandardHeader from '@/components/ui/StandardHeader';
import Logo from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Instagram,
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  Share,
  Calendar,
  Camera,
  Target,
  DollarSign,
  BarChart3,
  Image as ImageIcon,
  Video,
  Clock,
  Eye,
  UserPlus,
  Megaphone,
  Palette,
  FileText,
  Settings,
  Plus
} from 'lucide-react';

interface InstagramMetrics {
  followers: number;
  following: number;
  posts: number;
  engagement_rate: number;
  reach: number;
  impressions: number;
  profile_visits: number;
  website_clicks: number;
}

interface ContentPost {
  id: string;
  type: 'image' | 'video' | 'carousel' | 'story';
  caption: string;
  scheduled_date: string;
  status: 'draft' | 'scheduled' | 'published';
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  };
}

interface AdCampaign {
  id: string;
  name: string;
  objective: string;
  budget: number;
  spend: number;
  reach: number;
  clicks: number;
  conversions: number;
  status: 'active' | 'paused' | 'completed';
  start_date: string;
  end_date: string;
}

export default function InstagramDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'branding' | 'advertising' | 'content' | 'analytics'>('overview');
  const [metrics, setMetrics] = useState<InstagramMetrics>({
    followers: 2847,
    following: 156,
    posts: 89,
    engagement_rate: 4.2,
    reach: 12456,
    impressions: 18789,
    profile_visits: 234,
    website_clicks: 67
  });
  
  const [upcomingPosts, setUpcomingPosts] = useState<ContentPost[]>([
    {
      id: '1',
      type: 'image',
      caption: 'Annual backflow testing keeps your water supply safe! 💧 Schedule your test today.',
      scheduled_date: '2025-08-28T10:00:00',
      status: 'scheduled'
    },
    {
      id: '2',
      type: 'video',
      caption: 'Watch how our certified technicians perform backflow testing. Professional service guaranteed! #BackflowPrevention',
      scheduled_date: '2025-08-30T14:30:00',
      status: 'scheduled'
    }
  ]);

  const [activeCampaigns, setActiveCampaigns] = useState<AdCampaign[]>([
    {
      id: '1',
      name: 'Annual Testing Reminder',
      objective: 'Lead Generation',
      budget: 500,
      spend: 127.43,
      reach: 8934,
      clicks: 234,
      conversions: 12,
      status: 'active',
      start_date: '2025-08-20',
      end_date: '2025-09-20'
    },
    {
      id: '2',
      name: 'New Customer Acquisition',
      objective: 'Conversions',
      budget: 750,
      spend: 298.67,
      reach: 15678,
      clicks: 456,
      conversions: 23,
      status: 'active',
      start_date: '2025-08-15',
      end_date: '2025-09-15'
    }
  ]);

  const router = useRouter();

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/team/auth/me');
        if (!response.ok) {
          router.push('/team-portal');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/team-portal');
      }
    };
    checkAuth();
  }, [router]);

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Account Overview */}
      <div className="glass rounded-2xl p-6 glow-blue-sm">
        <div className="flex items-center mb-4">
          <Instagram className="h-6 w-6 text-pink-500 mr-3" />
          <h3 className="text-xl font-bold">@fisherbackflows</h3>
          <span className="ml-2 px-2 py-1 bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/20 border border-green-500/30 rounded-full text-xs text-green-400">
            Verified Business
          </span>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="text-center p-3 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 rounded-2xl">
            <div className="text-xl sm:text-2xl font-bold text-blue-400">{metrics.followers.toLocaleString()}</div>
            <div className="text-xs sm:text-sm text-white/60">Followers</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/10 rounded-2xl">
            <div className="text-xl sm:text-2xl font-bold text-green-400">{metrics.engagement_rate}%</div>
            <div className="text-xs sm:text-sm text-white/60">Engagement</div>
          </div>
          <div className="text-center p-3 bg-purple-600/10 rounded-2xl">
            <div className="text-xl sm:text-2xl font-bold text-purple-400">{metrics.reach.toLocaleString()}</div>
            <div className="text-xs sm:text-sm text-white/60">Weekly Reach</div>
          </div>
          <div className="text-center p-3 bg-orange-600/10 rounded-2xl">
            <div className="text-xl sm:text-2xl font-bold text-orange-400">{metrics.website_clicks}</div>
            <div className="text-xs sm:text-sm text-white/60">Website Clicks</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Button 
          className="glass p-4 sm:p-6 h-auto flex flex-col items-center gap-2 sm:gap-3 hover:glow-blue-sm transition-all"
          onClick={() => setActiveTab('content')}
        >
          <Camera className="h-6 sm:h-8 w-6 sm:w-8 text-blue-400" />
          <span className="text-sm sm:text-base">Create Post</span>
        </Button>
        <Button 
          className="glass p-4 sm:p-6 h-auto flex flex-col items-center gap-2 sm:gap-3 hover:glow-green-sm transition-all"
          onClick={() => setActiveTab('advertising')}
        >
          <Target className="h-6 sm:h-8 w-6 sm:w-8 text-green-400" />
          <span className="text-sm sm:text-base">New Campaign</span>
        </Button>
        <Button 
          className="glass p-4 sm:p-6 h-auto flex flex-col items-center gap-2 sm:gap-3 hover:glow-purple-sm transition-all"
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 className="h-6 sm:h-8 w-6 sm:w-8 text-purple-400" />
          <span className="text-sm sm:text-base">View Analytics</span>
        </Button>
      </div>

      {/* Recent Performance */}
      <div className="glass rounded-2xl p-6 glow-blue-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 text-green-400 mr-2" />
          Recent Performance (Last 7 Days)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <h4 className="font-medium mb-3 text-sm sm:text-base">Content Performance</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/80">Average Likes</span>
                <span className="text-green-400 font-medium">+23%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/80">Comments</span>
                <span className="text-green-400 font-medium">+18%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/80">Story Views</span>
                <span className="text-green-400 font-medium">+31%</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-3 text-sm sm:text-base">Business Metrics</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/80">Profile Visits</span>
                <span className="text-blue-400 font-medium">{metrics.profile_visits}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/80">Website Clicks</span>
                <span className="text-blue-400 font-medium">{metrics.website_clicks}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/80">Contact Button</span>
                <span className="text-blue-400 font-medium">34</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBranding = () => (
    <div className="space-y-6">
      {/* Brand Guidelines */}
      <div className="glass rounded-2xl p-6 glow-blue-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Palette className="h-5 w-5 text-blue-400 mr-2" />
          Brand Guidelines
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Visual Identity</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-black/30 backdrop-blur-lg/50 rounded-2xl">
                <span>Primary Logo</span>
                <Button size="sm" variant="outline">Update</Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-black/30 backdrop-blur-lg/50 rounded-2xl">
                <span>Color Palette</span>
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl"></div>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl"></div>
                  <div className="w-6 h-6 rounded-full bg-black/30 backdrop-blur-lg"></div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-black/30 backdrop-blur-lg/50 rounded-2xl">
                <span>Typography</span>
                <span className="text-sm text-white/60">Geist Sans</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-3">Content Templates</h4>
            <div className="space-y-3">
              <div className="p-3 bg-black/30 backdrop-blur-lg/50 rounded-2xl">
                <div className="flex justify-between items-center mb-2">
                  <span>Service Showcase</span>
                  <Button size="sm" variant="ghost">Edit</Button>
                </div>
                <p className="text-sm text-white/60">Template for highlighting backflow testing services</p>
              </div>
              <div className="p-3 bg-black/30 backdrop-blur-lg/50 rounded-2xl">
                <div className="flex justify-between items-center mb-2">
                  <span>Educational Posts</span>
                  <Button size="sm" variant="ghost">Edit</Button>
                </div>
                <p className="text-sm text-white/60">Educational content about water safety</p>
              </div>
              <div className="p-3 bg-black/30 backdrop-blur-lg/50 rounded-2xl">
                <div className="flex justify-between items-center mb-2">
                  <span>Customer Testimonials</span>
                  <Button size="sm" variant="ghost">Edit</Button>
                </div>
                <p className="text-sm text-white/60">Showcase customer reviews and success stories</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Pillars */}
      <div className="glass rounded-2xl p-6 glow-blue-sm">
        <h3 className="text-lg font-semibold mb-4">Content Pillars</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 border border-blue-500/30 rounded-2xl">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-blue-400 mb-1 sm:mb-2">35%</div>
              <div className="text-xs sm:text-sm font-medium">Educational</div>
              <div className="text-xs text-white/60 mt-1">Water safety tips</div>
            </div>
          </div>
          <div className="p-3 sm:p-4 bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/20 border border-green-500/30 rounded-2xl">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-400 mb-1 sm:mb-2">25%</div>
              <div className="text-xs sm:text-sm font-medium">Services</div>
              <div className="text-xs text-white/60 mt-1">Testing process</div>
            </div>
          </div>
          <div className="p-3 sm:p-4 bg-purple-600/20 border border-purple-500/30 rounded-2xl">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-purple-400 mb-1 sm:mb-2">25%</div>
              <div className="text-xs sm:text-sm font-medium">Social Proof</div>
              <div className="text-xs text-white/60 mt-1">Reviews & testimonials</div>
            </div>
          </div>
          <div className="p-3 sm:p-4 bg-orange-600/20 border border-orange-500/30 rounded-2xl">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-orange-400 mb-1 sm:mb-2">15%</div>
              <div className="text-xs sm:text-sm font-medium">Behind Scenes</div>
              <div className="text-xs text-white/60 mt-1">Team & company</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdvertising = () => (
    <div className="space-y-6">
      {/* Active Campaigns */}
      <div className="glass rounded-2xl p-6 glow-blue-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Target className="h-5 w-5 text-green-400 mr-2" />
            Active Campaigns
          </h3>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
        
        <div className="space-y-4">
          {activeCampaigns.map((campaign) => (
            <div key={campaign.id} className="p-4 bg-black/30 backdrop-blur-lg/50 rounded-2xl">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium">{campaign.name}</h4>
                  <p className="text-sm text-white/60">{campaign.objective}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  campaign.status === 'active' ? 'bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/20 border border-green-500/30 text-green-400' :
                  campaign.status === 'paused' ? 'bg-yellow-600/20 border border-yellow-500/30 text-yellow-400' :
                  'bg-black/30 backdrop-blur-lg/20 border border-blue-500/50/30 text-white/80'
                }`}>
                  {campaign.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <div className="text-white/60">Budget</div>
                  <div className="font-medium">${campaign.budget}</div>
                </div>
                <div>
                  <div className="text-white/60">Spent</div>
                  <div className="font-medium">${campaign.spend}</div>
                </div>
                <div>
                  <div className="text-white/60">Reach</div>
                  <div className="font-medium">{campaign.reach.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-white/60">Clicks</div>
                  <div className="font-medium">{campaign.clicks}</div>
                </div>
                <div>
                  <div className="text-white/60">Conversions</div>
                  <div className="font-medium text-green-400">{campaign.conversions}</div>
                </div>
              </div>
              
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline">Edit</Button>
                <Button size="sm" variant="ghost">View Details</Button>
                <Button size="sm" variant="ghost" className="text-red-400">Pause</Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ad Performance */}
      <div className="glass rounded-2xl p-6 glow-blue-sm">
        <h3 className="text-lg font-semibold mb-4">Campaign Performance Overview</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="text-center p-3 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 rounded-2xl">
            <div className="text-xl sm:text-2xl font-bold text-blue-400">$426</div>
            <div className="text-xs sm:text-sm text-white/60">Total Spend</div>
            <div className="text-xs text-green-400 mt-1">↑ 12% vs last month</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/10 rounded-2xl">
            <div className="text-xl sm:text-2xl font-bold text-green-400">24,612</div>
            <div className="text-xs sm:text-sm text-white/60">Total Reach</div>
            <div className="text-xs text-green-400 mt-1">↑ 28% vs last month</div>
          </div>
          <div className="text-center p-3 bg-purple-600/10 rounded-2xl">
            <div className="text-xl sm:text-2xl font-bold text-purple-400">690</div>
            <div className="text-xs sm:text-sm text-white/60">Total Clicks</div>
            <div className="text-xs text-green-400 mt-1">↑ 19% vs last month</div>
          </div>
          <div className="text-center p-3 bg-orange-600/10 rounded-2xl">
            <div className="text-xl sm:text-2xl font-bold text-orange-400">35</div>
            <div className="text-xs sm:text-sm text-white/60">Conversions</div>
            <div className="text-xs text-green-400 mt-1">↑ 42% vs last month</div>
          </div>
        </div>
      </div>

      {/* Audience Insights */}
      <div className="glass rounded-2xl p-6 glow-blue-sm">
        <h3 className="text-lg font-semibold mb-4">Target Audience Insights</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Demographics</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>25-34 years</span>
                <span className="text-blue-400">32%</span>
              </div>
              <div className="flex justify-between">
                <span>35-44 years</span>
                <span className="text-blue-400">28%</span>
              </div>
              <div className="flex justify-between">
                <span>45-54 years</span>
                <span className="text-blue-400">25%</span>
              </div>
              <div className="flex justify-between">
                <span>55+ years</span>
                <span className="text-blue-400">15%</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-3">Interests</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Home Improvement</span>
                <span className="text-green-400">High</span>
              </div>
              <div className="flex justify-between">
                <span>Property Management</span>
                <span className="text-green-400">High</span>
              </div>
              <div className="flex justify-between">
                <span>Real Estate</span>
                <span className="text-yellow-400">Medium</span>
              </div>
              <div className="flex justify-between">
                <span>Small Business</span>
                <span className="text-yellow-400">Medium</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => (
    <div className="space-y-6">
      {/* Content Calendar */}
      <div className="glass rounded-2xl p-6 glow-blue-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Calendar className="h-5 w-5 text-blue-400 mr-2" />
            Upcoming Posts
          </h3>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Post
          </Button>
        </div>
        
        <div className="space-y-4">
          {upcomingPosts.map((post) => (
            <div key={post.id} className="p-4 bg-black/30 backdrop-blur-lg/50 rounded-2xl">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  {post.type === 'image' && <ImageIcon className="h-5 w-5 text-blue-400" />}
                  {post.type === 'video' && <Video className="h-5 w-5 text-red-400" />}
                  {post.type === 'carousel' && <ImageIcon className="h-5 w-5 text-purple-400" />}
                  <div>
                    <div className="font-medium capitalize">{post.type} Post</div>
                    <div className="text-sm text-white/60">
                      {new Date(post.scheduled_date).toLocaleString()}
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  post.status === 'scheduled' ? 'bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 border border-blue-500/30 text-blue-400' :
                  post.status === 'draft' ? 'bg-yellow-600/20 border border-yellow-500/30 text-yellow-400' :
                  'bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/20 border border-green-500/30 text-green-400'
                }`}>
                  {post.status}
                </span>
              </div>
              
              <p className="text-sm mb-3">{post.caption}</p>
              
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Edit</Button>
                <Button size="sm" variant="ghost">Preview</Button>
                <Button size="sm" variant="ghost">Reschedule</Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Ideas */}
      <div className="glass rounded-2xl p-6 glow-blue-sm">
        <h3 className="text-lg font-semibold mb-4">Content Ideas & Templates</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 border border-blue-500/20 rounded-2xl">
            <h4 className="font-medium mb-2">Educational Series</h4>
            <p className="text-sm text-white/60 mb-3">Weekly water safety tips and backflow prevention education</p>
            <Button size="sm" variant="outline">Use Template</Button>
          </div>
          <div className="p-4 bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/10 border border-green-500/20 rounded-2xl">
            <h4 className="font-medium mb-2">Before/After</h4>
            <p className="text-sm text-white/60 mb-3">Show device installations and repairs</p>
            <Button size="sm" variant="outline">Use Template</Button>
          </div>
          <div className="p-4 bg-purple-600/10 border border-purple-500/20 rounded-2xl">
            <h4 className="font-medium mb-2">Team Spotlight</h4>
            <p className="text-sm text-white/60 mb-3">Highlight certified technicians and expertise</p>
            <Button size="sm" variant="outline">Use Template</Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="glass rounded-2xl p-6 glow-blue-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 text-purple-400 mr-2" />
          Performance Analytics
        </h3>
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{metrics.impressions.toLocaleString()}</div>
            <div className="text-sm text-white/60">Impressions</div>
            <div className="text-xs text-green-400 mt-1">↑ 15% vs last week</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{metrics.reach.toLocaleString()}</div>
            <div className="text-sm text-white/60">Reach</div>
            <div className="text-xs text-green-400 mt-1">↑ 22% vs last week</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{metrics.engagement_rate}%</div>
            <div className="text-sm text-white/60">Engagement Rate</div>
            <div className="text-xs text-green-400 mt-1">↑ 8% vs last week</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">+{(metrics.followers * 0.02).toFixed(0)}</div>
            <div className="text-sm text-white/60">New Followers</div>
            <div className="text-xs text-green-400 mt-1">↑ 31% vs last week</div>
          </div>
        </div>
        
        <div className="h-64 bg-black/30 backdrop-blur-lg/50 rounded-2xl flex items-center justify-center">
          <p className="text-white/60">Interactive Analytics Chart</p>
        </div>
      </div>

      {/* Best Performing Content */}
      <div className="glass rounded-2xl p-6 glow-blue-sm">
        <h3 className="text-lg font-semibold mb-4">Best Performing Content</h3>
        <div className="space-y-4">
          <div className="p-4 bg-black/30 backdrop-blur-lg/50 rounded-2xl">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                <ImageIcon className="h-5 w-5 text-blue-400" />
                <div>
                  <div className="font-medium">Annual Testing Reminder</div>
                  <div className="text-sm text-white/60">Posted 3 days ago</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-green-400">4.8% engagement</div>
                <div className="text-xs text-white/60">Above average</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-400" />
                <span>234</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-blue-400" />
                <span>18</span>
              </div>
              <div className="flex items-center gap-2">
                <Share className="h-4 w-4 text-green-400" />
                <span>12</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-purple-400" />
                <span>1.2k</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audience Growth */}
      <div className="glass rounded-2xl p-6 glow-blue-sm">
        <h3 className="text-lg font-semibold mb-4">Audience Growth</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Follower Growth (30 days)</h4>
            <div className="text-2xl font-bold text-green-400 mb-2">+{(metrics.followers * 0.08).toFixed(0)}</div>
            <div className="text-sm text-white/60">New followers this month</div>
            <div className="h-32 bg-black/30 backdrop-blur-lg/50 rounded-2xl mt-3 flex items-center justify-center">
              <p className="text-white/60">Growth Chart</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-3">Top Locations</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Pierce County, WA</span>
                <span className="text-blue-400">45%</span>
              </div>
              <div className="flex justify-between">
                <span>Tacoma, WA</span>
                <span className="text-blue-400">28%</span>
              </div>
              <div className="flex justify-between">
                <span>Seattle, WA</span>
                <span className="text-blue-400">15%</span>
              </div>
              <div className="flex justify-between">
                <span>Other</span>
                <span className="text-blue-400">12%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid opacity-20" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600/80/5 via-transparent to-blue-500/80/5" />
      
      <StandardHeader variant="portal">
        <div className="flex justify-between items-center">
          <Logo width={200} height={160} priority />
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/team-portal/dashboard')}
              className="btn-glass px-4 py-2 rounded-2xl hover-glow flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </StandardHeader>

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <Instagram className="h-8 w-8 text-pink-500 mr-3" />
              Instagram Marketing Dashboard
            </h1>
            <p className="text-white/60">
              Manage branding, advertising, and content strategy for Fisher Backflows
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-6">
            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'branding', label: 'Branding', icon: Palette },
                { id: 'advertising', label: 'Advertising', icon: Target },
                { id: 'content', label: 'Content', icon: Camera },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp }
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 whitespace-nowrap flex-shrink-0 min-w-fit px-3 py-2 text-sm ${
                    activeTab === tab.id ? 'bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl text-white' : 'text-white/80 hover:text-white'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.slice(0, 3)}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'branding' && renderBranding()}
          {activeTab === 'advertising' && renderAdvertising()}
          {activeTab === 'content' && renderContent()}
          {activeTab === 'analytics' && renderAnalytics()}
        </div>
      </div>
    </div>
  );
}