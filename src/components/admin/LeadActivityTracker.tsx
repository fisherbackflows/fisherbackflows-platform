'use client';

import { useState, useEffect } from 'react';
import { 
  Phone, 
  Mail, 
  Calendar, 
  User, 
  MessageSquare, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  FileText,
  Activity,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LeadActivity {
  id: string;
  lead_id: string;
  saas_client_id?: string;
  activity_type: 'call' | 'email' | 'meeting' | 'quote_sent' | 'follow_up' | 'conversion' | 'demo' | 'proposal';
  activity_title: string;
  activity_description: string;
  outcome: 'positive' | 'neutral' | 'negative' | 'needs_follow_up';
  next_action?: string;
  next_action_date?: string;
  contact_method: 'phone' | 'email' | 'in_person' | 'video_call' | 'text_message';
  contacted_by: string;
  duration_minutes?: number;
  estimated_value_impact?: number;
  created_at: string;
  updated_at: string;
}

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  email?: string;
  phone: string;
  status: string;
  estimated_value?: number;
}

interface ActivityFormData {
  activity_type: string;
  activity_title: string;
  activity_description: string;
  outcome: string;
  next_action: string;
  next_action_date: string;
  contact_method: string;
  duration_minutes: number;
  estimated_value_impact: number;
}

interface LeadActivityTrackerProps {
  leadId: string;
  lead: Lead;
  onActivityAdded?: () => void;
}

export default function LeadActivityTracker({ leadId, lead, onActivityAdded }: LeadActivityTrackerProps) {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<ActivityFormData>({
    activity_type: 'call',
    activity_title: '',
    activity_description: '',
    outcome: 'neutral',
    next_action: '',
    next_action_date: '',
    contact_method: 'phone',
    duration_minutes: 0,
    estimated_value_impact: 0
  });

  // Mock data - in production this would come from your API
  const mockActivities: LeadActivity[] = [
    {
      id: '1',
      lead_id: leadId,
      activity_type: 'call',
      activity_title: 'Initial Contact Call',
      activity_description: 'Reached out to discuss backflow testing needs. Spoke with decision maker about their 3 commercial properties.',
      outcome: 'positive',
      next_action: 'Send detailed service proposal',
      next_action_date: '2024-01-28T10:00:00Z',
      contact_method: 'phone',
      contacted_by: 'Fisher Admin',
      duration_minutes: 15,
      estimated_value_impact: 200,
      created_at: '2024-01-25T14:30:00Z',
      updated_at: '2024-01-25T14:30:00Z'
    },
    {
      id: '2',
      lead_id: leadId,
      activity_type: 'email',
      activity_title: 'Service Proposal Sent',
      activity_description: 'Sent comprehensive proposal including annual testing package for all 3 properties. Included pricing breakdown and service timeline.',
      outcome: 'neutral',
      next_action: 'Follow up call to discuss proposal',
      next_action_date: '2024-01-30T14:00:00Z',
      contact_method: 'email',
      contacted_by: 'Fisher Admin',
      estimated_value_impact: 0,
      created_at: '2024-01-26T09:15:00Z',
      updated_at: '2024-01-26T09:15:00Z'
    },
    {
      id: '3',
      lead_id: leadId,
      activity_type: 'follow_up',
      activity_title: 'Proposal Follow-up',
      activity_description: 'Called to discuss the proposal. Client had questions about timing and pricing. Clarified service details and offered flexible scheduling.',
      outcome: 'positive',
      next_action: 'Schedule site visit for next week',
      next_action_date: '2024-02-02T11:00:00Z',
      contact_method: 'phone',
      contacted_by: 'Fisher Admin',
      duration_minutes: 12,
      estimated_value_impact: 150,
      created_at: '2024-01-27T16:20:00Z',
      updated_at: '2024-01-27T16:20:00Z'
    }
  ];

  useEffect(() => {
    // Simulate loading activities from API
    setTimeout(() => {
      setActivities(mockActivities);
      setLoading(false);
    }, 500);
  }, [leadId]);

  const handleSubmitActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newActivity: LeadActivity = {
      id: `activity_${Date.now()}`,
      lead_id: leadId,
      activity_type: formData.activity_type as any,
      activity_title: formData.activity_title,
      activity_description: formData.activity_description,
      outcome: formData.outcome as any,
      next_action: formData.next_action || undefined,
      next_action_date: formData.next_action_date || undefined,
      contact_method: formData.contact_method as any,
      contacted_by: 'Fisher Admin', // In production, get from session
      duration_minutes: formData.duration_minutes || undefined,
      estimated_value_impact: formData.estimated_value_impact || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add to activities list (in production, this would be an API call)
    setActivities([newActivity, ...activities]);
    
    // Reset form
    setFormData({
      activity_type: 'call',
      activity_title: '',
      activity_description: '',
      outcome: 'neutral',
      next_action: '',
      next_action_date: '',
      contact_method: 'phone',
      duration_minutes: 0,
      estimated_value_impact: 0
    });
    
    setShowAddForm(false);
    
    if (onActivityAdded) {
      onActivityAdded();
    }
  };

  const getActivityIcon = (type: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      'call': <Phone className="h-4 w-4" />,
      'email': <Mail className="h-4 w-4" />,
      'meeting': <User className="h-4 w-4" />,
      'quote_sent': <DollarSign className="h-4 w-4" />,
      'follow_up': <Clock className="h-4 w-4" />,
      'conversion': <CheckCircle className="h-4 w-4" />,
      'demo': <ExternalLink className="h-4 w-4" />,
      'proposal': <FileText className="h-4 w-4" />
    };
    return icons[type] || <Activity className="h-4 w-4" />;
  };

  const getOutcomeColor = (outcome: string) => {
    const colors: { [key: string]: string } = {
      'positive': 'bg-green-500/20 text-green-300 border-green-400',
      'neutral': 'bg-blue-500/20 text-blue-300 border-blue-400',
      'negative': 'bg-red-500/20 text-red-300 border-red-400',
      'needs_follow_up': 'bg-orange-500/20 text-orange-300 border-orange-400'
    };
    return colors[outcome] || 'bg-gray-500/20 text-gray-300 border-gray-400';
  };

  const getContactMethodIcon = (method: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      'phone': <Phone className="h-3 w-3" />,
      'email': <Mail className="h-3 w-3" />,
      'in_person': <User className="h-3 w-3" />,
      'video_call': <ExternalLink className="h-3 w-3" />,
      'text_message': <MessageSquare className="h-3 w-3" />
    };
    return icons[method] || <Activity className="h-3 w-3" />;
  };

  const totalEstimatedImpact = activities.reduce((sum, activity) => sum + (activity.estimated_value_impact || 0), 0);
  const totalDuration = activities.reduce((sum, activity) => sum + (activity.duration_minutes || 0), 0);
  const positiveActivities = activities.filter(a => a.outcome === 'positive').length;
  const pendingActions = activities.filter(a => a.next_action && a.next_action_date && new Date(a.next_action_date) > new Date()).length;

  if (loading) {
    return (
      <Card className="glass border-blue-400/30">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white/70">Loading activity history...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lead Header */}
      <Card className="glass border-blue-400/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-xl">
                {lead.first_name} {lead.last_name}
              </CardTitle>
              <CardDescription className="text-white/70">
                {lead.company_name && `${lead.company_name} • `}
                {lead.phone} {lead.email && ` • ${lead.email}`}
              </CardDescription>
            </div>
            <Badge className={`border text-sm px-3 py-1`}>
              {lead.status}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Activity Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass border-green-400/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-300">{positiveActivities}</div>
            <p className="text-white/70 text-sm">Positive Interactions</p>
          </CardContent>
        </Card>
        
        <Card className="glass border-blue-400/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-300">{activities.length}</div>
            <p className="text-white/70 text-sm">Total Activities</p>
          </CardContent>
        </Card>
        
        <Card className="glass border-purple-400/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-300">{Math.round(totalDuration / 60)}h</div>
            <p className="text-white/70 text-sm">Time Invested</p>
          </CardContent>
        </Card>
        
        <Card className="glass border-orange-400/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-300">{pendingActions}</div>
            <p className="text-white/70 text-sm">Pending Actions</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Activity Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Activity Timeline</h3>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="glass-btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Log Activity
        </Button>
      </div>

      {/* Add Activity Form */}
      {showAddForm && (
        <Card className="glass border-blue-400/30">
          <CardHeader>
            <CardTitle className="text-white">Log New Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitActivity} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="activity_type" className="text-white/90">Activity Type</Label>
                  <Select value={formData.activity_type} onValueChange={(value) => setFormData({...formData, activity_type: value})}>
                    <SelectTrigger className="glass border-blue-400/50">
                      <SelectValue placeholder="Select activity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Phone Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="demo">Demo/Presentation</SelectItem>
                      <SelectItem value="proposal">Proposal Sent</SelectItem>
                      <SelectItem value="quote_sent">Quote Sent</SelectItem>
                      <SelectItem value="follow_up">Follow Up</SelectItem>
                      <SelectItem value="conversion">Conversion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_method" className="text-white/90">Contact Method</Label>
                  <Select value={formData.contact_method} onValueChange={(value) => setFormData({...formData, contact_method: value})}>
                    <SelectTrigger className="glass border-blue-400/50">
                      <SelectValue placeholder="Select contact method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">Phone Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="in_person">In Person</SelectItem>
                      <SelectItem value="video_call">Video Call</SelectItem>
                      <SelectItem value="text_message">Text Message</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activity_title" className="text-white/90">Activity Title</Label>
                <Input
                  id="activity_title"
                  value={formData.activity_title}
                  onChange={(e) => setFormData({...formData, activity_title: e.target.value})}
                  placeholder="Brief title for this activity"
                  required
                  className="glass border-blue-400/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="activity_description" className="text-white/90">Description</Label>
                <Textarea
                  id="activity_description"
                  value={formData.activity_description}
                  onChange={(e) => setFormData({...formData, activity_description: e.target.value})}
                  placeholder="Detailed description of what was discussed, outcomes, concerns, etc."
                  required
                  className="glass border-blue-400/50"
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="outcome" className="text-white/90">Outcome</Label>
                  <Select value={formData.outcome} onValueChange={(value) => setFormData({...formData, outcome: value})}>
                    <SelectTrigger className="glass border-blue-400/50">
                      <SelectValue placeholder="Select outcome" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positive">Positive</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="negative">Negative</SelectItem>
                      <SelectItem value="needs_follow_up">Needs Follow-up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration_minutes" className="text-white/90">Duration (minutes)</Label>
                  <Input
                    id="duration_minutes"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value) || 0})}
                    placeholder="0"
                    className="glass border-blue-400/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimated_value_impact" className="text-white/90">Value Impact ($)</Label>
                  <Input
                    id="estimated_value_impact"
                    type="number"
                    value={formData.estimated_value_impact}
                    onChange={(e) => setFormData({...formData, estimated_value_impact: parseInt(e.target.value) || 0})}
                    placeholder="0"
                    className="glass border-blue-400/50"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="next_action" className="text-white/90">Next Action (optional)</Label>
                  <Input
                    id="next_action"
                    value={formData.next_action}
                    onChange={(e) => setFormData({...formData, next_action: e.target.value})}
                    placeholder="What needs to be done next?"
                    className="glass border-blue-400/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="next_action_date" className="text-white/90">Next Action Date (optional)</Label>
                  <Input
                    id="next_action_date"
                    type="datetime-local"
                    value={formData.next_action_date}
                    onChange={(e) => setFormData({...formData, next_action_date: e.target.value})}
                    className="glass border-blue-400/50"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <Button type="submit" className="glass-btn-primary">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Activity
                </Button>
                <Button type="button" onClick={() => setShowAddForm(false)} variant="outline" className="glass border-red-400/50">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Activities Timeline */}
      <div className="space-y-4">
        {activities.length === 0 ? (
          <Card className="glass border-blue-400/30">
            <CardContent className="p-8 text-center">
              <Activity className="h-12 w-12 text-white/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Activities Yet</h3>
              <p className="text-white/70">Start tracking your interactions with this lead to build a comprehensive history.</p>
            </CardContent>
          </Card>
        ) : (
          activities.map((activity) => (
            <Card key={activity.id} className="glass border-blue-400/30 hover:bg-white/5 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-full ${getOutcomeColor(activity.outcome)} border`}>
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-white">{activity.activity_title}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge className={`${getOutcomeColor(activity.outcome)} border text-xs`}>
                          {activity.outcome.replace('_', ' ')}
                        </Badge>
                        <span className="text-white/50 text-sm">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-white/80 leading-relaxed">{activity.activity_description}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-white/60">
                      <div className="flex items-center space-x-1">
                        {getContactMethodIcon(activity.contact_method)}
                        <span className="capitalize">{activity.contact_method.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{activity.contacted_by}</span>
                      </div>
                      {activity.duration_minutes && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{activity.duration_minutes} min</span>
                        </div>
                      )}
                      {activity.estimated_value_impact && activity.estimated_value_impact !== 0 && (
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-3 w-3" />
                          <span className={activity.estimated_value_impact > 0 ? 'text-green-400' : 'text-red-400'}>
                            {activity.estimated_value_impact > 0 ? '+' : ''}${activity.estimated_value_impact}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {activity.next_action && (
                      <div className="bg-orange-500/10 border border-orange-400/30 rounded-lg p-3 mt-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <AlertTriangle className="h-4 w-4 text-orange-400" />
                          <span className="font-medium text-orange-300">Next Action Required</span>
                        </div>
                        <p className="text-white/80 text-sm">{activity.next_action}</p>
                        {activity.next_action_date && (
                          <p className="text-orange-300 text-xs mt-1">
                            Due: {new Date(activity.next_action_date).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Activity Summary */}
      {activities.length > 0 && totalEstimatedImpact !== 0 && (
        <Card className="glass border-emerald-400/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-white">Total Value Impact</h4>
                <p className="text-white/70 text-sm">Estimated impact from all activities</p>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${totalEstimatedImpact >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalEstimatedImpact >= 0 ? '+' : ''}${totalEstimatedImpact.toLocaleString()}
                </div>
                <p className="text-white/50 text-sm">
                  {totalDuration > 0 && `${Math.round(totalDuration / 60)}h ${totalDuration % 60}m invested`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}