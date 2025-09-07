'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  Building2, 
  Phone, 
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Edit,
  Save,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Star,
  UserPlus,
  MessageSquare,
  History,
  Target,
  TrendingUp,
  Activity
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

interface ActivityLog {
  id: string;
  action: string;
  details: string;
  created_at: string;
  user: string;
}

export default function LeadProfilePage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});

  useEffect(() => {
    if (leadId) {
      loadLead();
      loadActivityLog();
    }
  }, [leadId]);

  const loadLead = async () => {
    try {
      const response = await fetch(`/api/business-admin/leads/${leadId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.lead) {
          const formattedLead: Lead = {
            id: data.lead.id,
            first_name: data.lead.first_name || '',
            last_name: data.lead.last_name || '',
            company_name: data.lead.company_name || '',
            email: data.lead.email || '',
            phone: data.lead.phone || '',
            address_line1: data.lead.address || '',
            city: data.lead.city || '',
            state: data.lead.state || '',
            zip_code: data.lead.zip_code || '',
            source: data.lead.source || 'Unknown',
            status: data.lead.status || 'new',
            estimated_value: parseFloat(data.lead.estimated_value) || 0,
            notes: data.lead.message || data.lead.notes || '',
            assigned_to: data.lead.assigned_to || 'Unassigned',
            contacted_date: data.lead.contacted_date,
            qualified_date: data.lead.qualified_date,
            converted_date: data.lead.converted_date,
            converted_customer_id: data.lead.converted_customer_id,
            created_at: data.lead.created_at,
            updated_at: data.lead.updated_at || data.lead.created_at
          };
          setLead(formattedLead);
          setEditForm(formattedLead);
        } else {
          throw new Error('Lead not found');
        }
      } else {
        throw new Error('Failed to fetch lead');
      }
    } catch (error) {
      console.error('Error loading lead:', error);
      router.push('/business-admin/leads');
    } finally {
      setLoading(false);
    }
  };

  const loadActivityLog = async () => {
    try {
      const response = await fetch(`/api/business-admin/leads/${leadId}/activity`);
      if (response.ok) {
        const data = await response.json();
        setActivityLog(data.activities || []);
      }
    } catch (error) {
      console.error('Error loading activity log:', error);
    }
  };

  const handleSave = async () => {
    if (!lead || !editForm) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/business-admin/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLead({ ...lead, ...editForm });
          setEditing(false);
          loadActivityLog(); // Refresh activity log
        } else {
          throw new Error(data.error || 'Failed to update lead');
        }
      } else {
        throw new Error('Failed to update lead');
      }
    } catch (error) {
      console.error('Error saving lead:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!lead) return;
    
    const updatedLead = { ...editForm, status: newStatus as Lead['status'] };
    
    // Set date fields based on status
    const now = new Date().toISOString();
    if (newStatus === 'contacted' && !lead.contacted_date) {
      updatedLead.contacted_date = now;
    }
    if (newStatus === 'qualified' && !lead.qualified_date) {
      updatedLead.qualified_date = now;
    }
    if (newStatus === 'converted' && !lead.converted_date) {
      updatedLead.converted_date = now;
    }
    
    setEditForm(updatedLead);
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
    return <Icon className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-white/80">Loading lead profile...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Lead Not Found</h1>
          <p className="text-white/70 mb-4">The requested lead could not be found.</p>
          <Link href="/business-admin/leads">
            <Button className="glass-btn-primary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leads
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="absolute inset-0 glass pointer-events-none"></div>
      
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-blue-400/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/business-admin/leads">
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Leads
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {lead.first_name} {lead.last_name}
                </h1>
                <p className="text-sm text-white/60">Lead Profile & Management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {editing ? (
                <>
                  <Button 
                    onClick={() => setEditing(false)} 
                    variant="outline" 
                    size="sm"
                    className="glass border-gray-400/50"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    size="sm"
                    className="glass-btn-primary"
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => setEditing(true)} 
                  size="sm"
                  className="glass-btn-primary"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="glass border-blue-400/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/90">First Name</Label>
                    {editing ? (
                      <Input
                        value={editForm.first_name}
                        onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                        className="glass border-blue-400/50 text-white"
                      />
                    ) : (
                      <p className="text-white font-medium">{lead.first_name}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white/90">Last Name</Label>
                    {editing ? (
                      <Input
                        value={editForm.last_name}
                        onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                        className="glass border-blue-400/50 text-white"
                      />
                    ) : (
                      <p className="text-white font-medium">{lead.last_name}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white/90">Company</Label>
                    {editing ? (
                      <Input
                        value={editForm.company_name || ''}
                        onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                        className="glass border-blue-400/50 text-white"
                        placeholder="Company name"
                      />
                    ) : (
                      <p className="text-white/80">{lead.company_name || 'Not specified'}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white/90">Email</Label>
                    {editing ? (
                      <Input
                        type="email"
                        value={editForm.email || ''}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="glass border-blue-400/50 text-white"
                        placeholder="email@example.com"
                      />
                    ) : (
                      <p className="text-white/80">{lead.email || 'Not provided'}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white/90">Phone</Label>
                    {editing ? (
                      <Input
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="glass border-blue-400/50 text-white"
                        placeholder="(555) 123-4567"
                      />
                    ) : (
                      <p className="text-white font-medium">{lead.phone}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white/90">Source</Label>
                    {editing ? (
                      <Select value={editForm.source} onValueChange={(value) => setEditForm({ ...editForm, source: value })}>
                        <SelectTrigger className="glass border-blue-400/50 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="referral">Referral</SelectItem>
                          <SelectItem value="phone">Phone Call</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="social">Social Media</SelectItem>
                          <SelectItem value="advertising">Advertising</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-white/80">{lead.source}</p>
                    )}
                  </div>
                </div>
                
                {/* Address */}
                <div className="space-y-2">
                  <Label className="text-white/90">Address</Label>
                  {editing ? (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-6">
                        <Input
                          value={editForm.address_line1 || ''}
                          onChange={(e) => setEditForm({ ...editForm, address_line1: e.target.value })}
                          className="glass border-blue-400/50 text-white"
                          placeholder="Street address"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <Input
                          value={editForm.city || ''}
                          onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                          className="glass border-blue-400/50 text-white"
                          placeholder="City"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Input
                          value={editForm.state || ''}
                          onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                          className="glass border-blue-400/50 text-white"
                          placeholder="State"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <Input
                          value={editForm.zip_code || ''}
                          onChange={(e) => setEditForm({ ...editForm, zip_code: e.target.value })}
                          className="glass border-blue-400/50 text-white"
                          placeholder="ZIP"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-white/80">
                      {[lead.address_line1, lead.city, lead.state, lead.zip_code].filter(Boolean).join(', ') || 'Not provided'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lead Management */}
            <Card className="glass border-blue-400/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Lead Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/90">Status</Label>
                    {editing ? (
                      <Select value={editForm.status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="glass border-blue-400/50 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="converted">Converted</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={`${getStatusColor(lead.status)} text-sm border inline-flex items-center`}>
                        {getStatusIcon(lead.status)}
                        <span className="ml-2 capitalize">{lead.status}</span>
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white/90">Estimated Value</Label>
                    {editing ? (
                      <Input
                        type="number"
                        value={editForm.estimated_value || 0}
                        onChange={(e) => setEditForm({ ...editForm, estimated_value: parseFloat(e.target.value) || 0 })}
                        className="glass border-blue-400/50 text-white"
                        placeholder="0"
                      />
                    ) : (
                      <p className="text-white font-semibold text-lg">
                        ${(lead.estimated_value || 0).toLocaleString()}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white/90">Assigned To</Label>
                    {editing ? (
                      <Select value={editForm.assigned_to} onValueChange={(value) => setEditForm({ ...editForm, assigned_to: value })}>
                        <SelectTrigger className="glass border-blue-400/50 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Unassigned">Unassigned</SelectItem>
                          <SelectItem value="John Fisher">John Fisher</SelectItem>
                          <SelectItem value="Team Lead">Team Lead</SelectItem>
                          <SelectItem value="Sales Rep">Sales Rep</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-white/80">{lead.assigned_to}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white/90">Notes</Label>
                  {editing ? (
                    <Textarea
                      value={editForm.notes || ''}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      className="glass border-blue-400/50 text-white resize-none"
                      rows={4}
                      placeholder="Add notes about this lead..."
                    />
                  ) : (
                    <p className="text-white/80 whitespace-pre-wrap">
                      {lead.notes || 'No notes added'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Timeline */}
            <Card className="glass border-blue-400/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <div>
                      <p className="text-white text-sm font-medium">Created</p>
                      <p className="text-white/60 text-xs">{new Date(lead.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {lead.contacted_date && (
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <div>
                        <p className="text-white text-sm font-medium">First Contact</p>
                        <p className="text-white/60 text-xs">{new Date(lead.contacted_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                  
                  {lead.qualified_date && (
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <div>
                        <p className="text-white text-sm font-medium">Qualified</p>
                        <p className="text-white/60 text-xs">{new Date(lead.qualified_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                  
                  {lead.converted_date && (
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <div>
                        <p className="text-white text-sm font-medium">Converted</p>
                        <p className="text-white/60 text-xs">{new Date(lead.converted_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="glass border-blue-400/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full glass border-blue-400/50 text-white hover:bg-blue-500/20"
                  onClick={() => window.open(`tel:${lead.phone}`)}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Lead
                </Button>
                
                {lead.email && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full glass border-blue-400/50 text-white hover:bg-blue-500/20"
                    onClick={() => window.open(`mailto:${lead.email}`)}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                )}
                
                {lead.status === 'converted' && lead.converted_customer_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full glass border-green-400/50 text-green-300 hover:bg-green-500/20"
                    onClick={() => router.push(`/team-portal/customers/${lead.converted_customer_id}`)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    View Customer
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Activity Log */}
            <Card className="glass border-blue-400/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <History className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activityLog.length > 0 ? (
                  <div className="space-y-3">
                    {activityLog.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="text-sm">
                        <p className="text-white/80">{activity.action}</p>
                        <p className="text-white/60 text-xs">{activity.details}</p>
                        <p className="text-white/40 text-xs">{new Date(activity.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/60 text-sm">No activity recorded yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}