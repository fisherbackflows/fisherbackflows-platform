'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  UserPlus,
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Users,
  Mail,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface ActivityItem {
  id: string;
  type: 'employee_joined' | 'invitation_sent' | 'test_completed' | 'appointment_scheduled' | 'payment_received' | 'report_generated';
  title: string;
  description: string;
  timestamp: string;
  icon: any;
  color: string;
  link?: string;
}

interface RecentActivityProps {
  companyId: string;
  limit?: number;
}

export default function RecentActivity({ companyId, limit = 10 }: RecentActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyId) {
      fetchRecentActivity();
    }
  }, [companyId]);

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch(`/api/team/dashboard/activity?companyId=${companyId}&limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities);
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
      // Use mock data as fallback
      setActivities(getMockActivity());
    } finally {
      setLoading(false);
    }
  };

  const getMockActivity = (): ActivityItem[] => {
    const now = new Date();
    return [
      {
        id: '1',
        type: 'employee_joined',
        title: 'New Team Member',
        description: 'Sarah Johnson joined as a Tester',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        icon: UserPlus,
        color: 'text-green-500',
        link: '/team-portal/admin/employees'
      },
      {
        id: '2',
        type: 'test_completed',
        title: 'Test Completed',
        description: 'Backflow test at Downtown Plaza completed successfully',
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        icon: CheckCircle,
        color: 'text-blue-500'
      },
      {
        id: '3',
        type: 'appointment_scheduled',
        title: 'Appointment Scheduled',
        description: 'New test scheduled for Riverside Mall - Tomorrow 2:00 PM',
        timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        icon: Calendar,
        color: 'text-purple-500',
        link: '/team-portal/schedule'
      },
      {
        id: '4',
        type: 'invitation_sent',
        title: 'Invitation Sent',
        description: 'Invitation sent to mike.test@email.com for Tester role',
        timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
        icon: Mail,
        color: 'text-yellow-500'
      },
      {
        id: '5',
        type: 'payment_received',
        title: 'Payment Received',
        description: '$450 payment received for City Center testing',
        timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
        icon: CreditCard,
        color: 'text-emerald-500',
        link: '/team-portal/invoices'
      },
      {
        id: '6',
        type: 'report_generated',
        title: 'Report Generated',
        description: 'Monthly compliance report ready for download',
        timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        icon: FileText,
        color: 'text-indigo-500'
      }
    ];
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMs = now.getTime() - time.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes} min ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return `${diffInDays}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 animate-pulse">
            <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
            <div className="h-3 bg-slate-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = activity.icon;
        const content = (
          <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
            <div className={`p-2 bg-slate-100 rounded-lg ${activity.color.replace('text', 'bg')}/10`}>
              <Icon className={`h-5 w-5 ${activity.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-slate-900 text-sm">{activity.title}</h4>
              <p className="text-slate-600 text-xs truncate">{activity.description}</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500">{formatTimeAgo(activity.timestamp)}</span>
              {activity.link && (
                <ArrowRight className="h-3 w-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
              )}
            </div>
          </div>
        );

        return activity.link ? (
          <Link key={activity.id} href={activity.link}>
            {content}
          </Link>
        ) : (
          <div key={activity.id}>
            {content}
          </div>
        );
      })}

      {activities.length === 0 && (
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No recent activity</p>
          <p className="text-slate-400 text-sm">Activity will appear here as your team works</p>
        </div>
      )}
    </div>
  );
}