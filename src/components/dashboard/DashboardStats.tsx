'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Crown,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Minus,
  Zap
} from 'lucide-react';

interface DashboardStatsProps {
  companyId: string;
  userRole: string;
}

interface StatsData {
  teamStats: {
    totalEmployees: number;
    pendingInvitations: number;
    activeUsers: number;
    planLimit: number;
    planUsage: number;
  };
  activityStats: {
    testsThisMonth: number;
    testsLastMonth: number;
    pendingTests: number;
    completedToday: number;
  };
  performanceStats: {
    avgTestTime: number;
    successRate: number;
    customerSatisfaction: number;
  };
}

export default function DashboardStats({ companyId, userRole }: DashboardStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyId) {
      fetchStats();
    }
  }, [companyId]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/team/dashboard/stats?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-slate-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-slate-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color = 'blue',
    trend,
    progress
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
    trend?: 'up' | 'down' | 'neutral';
    progress?: number;
  }) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600 text-blue-600',
      green: 'from-green-500 to-green-600 text-green-600',
      yellow: 'from-yellow-500 to-yellow-600 text-yellow-600',
      purple: 'from-purple-500 to-purple-600 text-purple-600',
      red: 'from-red-500 to-red-600 text-red-600'
    };

    const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus;
    const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-slate-400';

    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg bg-gradient-to-r ${colors[color]} bg-opacity-10`}>
            <Icon className={`h-6 w-6 ${colors[color].split(' ')[2]}`} />
          </div>
          {trend && (
            <TrendIcon className={`h-4 w-4 ${trendColor}`} />
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-600">{title}</h3>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500">{subtitle}</p>
          )}

          {/* Progress Bar */}
          {progress !== undefined && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full bg-gradient-to-r ${colors[color]}`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const teamUsagePercent = Math.round((stats.teamStats.activeUsers / stats.teamStats.planLimit) * 100);
  const testsChange = stats.activityStats.testsThisMonth - stats.activityStats.testsLastMonth;
  const testsTrend = testsChange > 0 ? 'up' : testsChange < 0 ? 'down' : 'neutral';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Team Members */}
      <StatCard
        title="Team Members"
        value={`${stats.teamStats.activeUsers}/${stats.teamStats.planLimit}`}
        subtitle={`${stats.teamStats.pendingInvitations} pending invitations`}
        icon={Users}
        color="blue"
        progress={teamUsagePercent}
      />

      {/* Monthly Tests */}
      <StatCard
        title="Tests This Month"
        value={stats.activityStats.testsThisMonth}
        subtitle={`${Math.abs(testsChange)} vs last month`}
        icon={Calendar}
        color="green"
        trend={testsTrend}
      />

      {/* Pending Tests */}
      <StatCard
        title="Pending Tests"
        value={stats.activityStats.pendingTests}
        subtitle={`${stats.activityStats.completedToday} completed today`}
        icon={Clock}
        color="yellow"
      />

      {/* Success Rate */}
      <StatCard
        title="Success Rate"
        value={`${stats.performanceStats.successRate}%`}
        subtitle={`${stats.performanceStats.customerSatisfaction}% satisfaction`}
        icon={CheckCircle}
        color="purple"
        progress={stats.performanceStats.successRate}
      />
    </div>
  );
}