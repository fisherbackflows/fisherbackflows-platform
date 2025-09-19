'use client';

import { useState, useEffect } from 'react';
import { TeamPortalNavigation } from '@/components/navigation/UnifiedNavigation';
import { Button } from '@/components/ui/button';
import { 
  CreditCard,
  Plus,
  Calendar,
  DollarSign,
  User,
  Settings,
  Play,
  Pause,
  StopCircle,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Eye,
  Edit
} from 'lucide-react';
import Link from 'next/link';

interface Subscription {
  id: string;
  customer_id: string;
  service_type: string;
  billing_cycle: string;
  status: string;
  amount_per_period: number;
  currency: string;
  current_period_end: string;
  next_billing_date: string;
  device_ids: string[];
  is_active: boolean;
  cancel_at_period_end: boolean;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
}

const statusConfig = {
  active: { label: 'Active', color: 'text-green-400 border-green-400', icon: CheckCircle },
  canceled: { label: 'Canceled', color: 'text-red-400 border-red-400', icon: StopCircle },
  paused: { label: 'Paused', color: 'text-yellow-400 border-yellow-400', icon: Pause },
  past_due: { label: 'Past Due', color: 'text-orange-400 border-orange-400', icon: AlertCircle },
  incomplete: { label: 'Incomplete', color: 'text-gray-400 border-gray-400', icon: Clock },
  cancel_at_period_end: { label: 'Ending Soon', color: 'text-orange-400 border-orange-400', icon: AlertCircle },
  trialing: { label: 'Trial', color: 'text-blue-400 border-blue-400', icon: Clock }
};

const serviceTypeLabels = {
  annual_testing: 'Annual Testing',
  quarterly_testing: 'Quarterly Testing',  
  repair_maintenance: 'Repair & Maintenance',
  custom: 'Custom Service'
};

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/billing/subscriptions');
      const result = await response.json();

      if (response.ok && result.success) {
        setSubscriptions(result.subscriptions || []);
      } else {
        setError(result.error || 'Failed to load subscriptions');
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionAction = async (subscriptionId: string, action: 'pause' | 'resume' | 'cancel' | 'cancel_immediate') => {
    setActionLoading(subscriptionId);
    setError(null);

    try {
      const endpoint = `/api/billing/subscriptions/${subscriptionId}${action === 'cancel_immediate' ? '?immediate=true' : ''}`;
      
      let method = 'PUT';
      let body: any = {};
      
      if (action === 'cancel' || action === 'cancel_immediate') {
        method = 'DELETE';
        body = undefined;
      } else if (action === 'pause') {
        body = { pause: true };
      } else if (action === 'resume') {
        body = { resume: true };
      }

      const response = await fetch(endpoint, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Refresh subscriptions to show updated status
        await loadSubscriptions();
        
        // Show success message briefly
        setTimeout(() => {
          alert(result.message);
        }, 100);
      } else {
        setError(result.error || `Failed to ${action} subscription`);
      }
    } catch (error) {
      console.error(`Error ${action} subscription:`, error);
      setError('Network error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return sub.is_active && sub.status === 'active';
    if (filterStatus === 'paused') return sub.status === 'paused';
    if (filterStatus === 'canceled') return sub.status === 'canceled' || !sub.is_active;
    return sub.status === filterStatus;
  });

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
      {/* Navigation Bar */}
      <div className="glass border-b border-blue-400 glow-blue-sm mb-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/team-portal/dashboard">
            <Button variant="ghost" className="text-blue-300 hover:text-white" onClick={() => window.history.back()}>
              ← Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
        <div className="glass rounded-2xl p-8 border border-blue-400 glow-blue-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-white mt-4 text-center">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <TeamPortalNavigation userInfo={{ name: 'Team Member', email: '' }} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Billing Subscriptions</h1>
            <p className="text-gray-400">Manage recurring billing for customers</p>
          </div>
          <Button asChild className="glass rounded-xl border border-blue-400 text-white hover:border-blue-300">
            <Link href="/team-portal/billing/subscriptions/create">
              <Plus className="h-5 w-5 mr-2" />
              New Subscription
            </Link>
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="glass rounded-xl p-4 border border-red-400 glow-red-sm mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'active', 'paused', 'canceled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterStatus === status
                  ? 'glass border border-blue-400 text-white'
                  : 'text-gray-400 hover:text-white hover:glass'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ml-2 text-xs">
                ({status === 'all' ? subscriptions.length : subscriptions.filter(s => 
                  status === 'active' ? s.is_active && s.status === 'active' :
                  status === 'paused' ? s.status === 'paused' :
                  status === 'canceled' ? s.status === 'canceled' || !s.is_active :
                  s.status === status
                ).length})
              </span>
            </button>
          ))}
        </div>

        {/* Subscriptions List */}
        <div className="space-y-4">
          {filteredSubscriptions.length > 0 ? (
            filteredSubscriptions.map((subscription) => {
              const StatusIcon = statusConfig[subscription.status as keyof typeof statusConfig]?.icon || CheckCircle;
              const statusClass = statusConfig[subscription.status as keyof typeof statusConfig]?.color || 'text-gray-400 border-gray-400';
              
              return (
                <div key={subscription.id} className="glass rounded-2xl p-6 border border-blue-400 glow-blue-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Customer Info */}
                      <div className="flex items-center gap-3 mb-3">
                        <User className="h-5 w-5 text-blue-400" />
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {subscription.customer.first_name} {subscription.customer.last_name}
                          </h3>
                          <p className="text-gray-400 text-sm">{subscription.customer.email}</p>
                        </div>
                      </div>

                      {/* Service Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="glass rounded-xl p-3 border border-gray-600">
                          <div className="flex items-center gap-2 mb-1">
                            <Settings className="h-4 w-4 text-blue-400" />
                            <span className="text-sm text-gray-400">Service</span>
                          </div>
                          <p className="text-white font-medium">
                            {serviceTypeLabels[subscription.service_type as keyof typeof serviceTypeLabels] || subscription.service_type}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {subscription.device_ids.length} device{subscription.device_ids.length !== 1 ? 's' : ''}
                          </p>
                        </div>

                        <div className="glass rounded-xl p-3 border border-gray-600">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="h-4 w-4 text-green-400" />
                            <span className="text-sm text-gray-400">Billing</span>
                          </div>
                          <p className="text-white font-medium">
                            {formatAmount(subscription.amount_per_period, subscription.currency)}
                          </p>
                          <p className="text-gray-400 text-sm capitalize">
                            per {subscription.billing_cycle.replace('ly', '')}
                          </p>
                        </div>

                        <div className="glass rounded-xl p-3 border border-gray-600">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="h-4 w-4 text-purple-400" />
                            <span className="text-sm text-gray-400">Next Billing</span>
                          </div>
                          <p className="text-white font-medium">
                            {formatDate(subscription.next_billing_date)}
                          </p>
                          {subscription.cancel_at_period_end && (
                            <p className="text-orange-400 text-sm">Will cancel</p>
                          )}
                        </div>
                      </div>

                      {/* Status */}
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${statusClass} glass`}>
                        <StatusIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {statusConfig[subscription.status as keyof typeof statusConfig]?.label || subscription.status}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="text-white border-gray-600 hover:border-blue-400"
                      >
                        <Link href={`/team-portal/billing/subscriptions/${subscription.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>

                      {subscription.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSubscriptionAction(subscription.id, 'pause')}
                          disabled={actionLoading === subscription.id}
                          className="text-yellow-400 border-yellow-400 hover:bg-yellow-400/10"
                        >
                          {actionLoading === subscription.id ? (
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Pause className="h-4 w-4 mr-1" />
                          )}
                          Pause
                        </Button>
                      )}

                      {subscription.status === 'paused' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSubscriptionAction(subscription.id, 'resume')}
                          disabled={actionLoading === subscription.id}
                          className="text-green-400 border-green-400 hover:bg-green-400/10"
                        >
                          {actionLoading === subscription.id ? (
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4 mr-1" />
                          )}
                          Resume
                        </Button>
                      )}

                      {subscription.is_active && !subscription.cancel_at_period_end && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSubscriptionAction(subscription.id, 'cancel')}
                          disabled={actionLoading === subscription.id}
                          className="text-red-400 border-red-400 hover:bg-red-400/10"
                        >
                          {actionLoading === subscription.id ? (
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <StopCircle className="h-4 w-4 mr-1" />
                          )}
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="glass rounded-2xl p-8 text-center border border-blue-400 glow-blue-sm">
              <CreditCard className="h-12 w-12 text-white/80 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white/80 mb-2">No subscriptions found</h3>
              <p className="text-white/80 mb-4">
                {filterStatus === 'all' 
                  ? 'No recurring billing subscriptions have been created yet.'
                  : `No ${filterStatus} subscriptions found.`
                }
              </p>
              <Button asChild>
                <Link href="/team-portal/billing/subscriptions/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Subscription
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}