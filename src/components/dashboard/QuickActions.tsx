'use client';

import Link from 'next/link';
import {
  UserPlus,
  Calendar,
  FileText,
  CreditCard,
  Users,
  Settings,
  Mail,
  Download,
  Plus,
  Clock,
  BarChart3,
  Palette,
  Building2
} from 'lucide-react';

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: any;
  color: string;
  badge?: string;
  requiresRole?: string[];
}

interface QuickActionsProps {
  userRole: string;
  pendingInvitations?: number;
  upcomingAppointments?: number;
}

export default function QuickActions({
  userRole,
  pendingInvitations = 0,
  upcomingAppointments = 0
}: QuickActionsProps) {

  const allActions: QuickAction[] = [
    {
      title: 'Invite Employee',
      description: 'Add a new team member to your company',
      href: '/team-portal/admin/employees',
      icon: UserPlus,
      color: 'from-blue-500 to-blue-600',
      requiresRole: ['company_admin', 'manager']
    },
    {
      title: 'Schedule Test',
      description: 'Book a new backflow testing appointment',
      href: '/team-portal/schedule/new',
      icon: Calendar,
      color: 'from-green-500 to-green-600',
      badge: upcomingAppointments > 0 ? `${upcomingAppointments} upcoming` : undefined
    },
    {
      title: 'Add Customer',
      description: 'Register a new customer in the system',
      href: '/team-portal/customers/new',
      icon: Building2,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'View Reports',
      description: 'Access test reports and compliance documents',
      href: '/team-portal/test-report',
      icon: FileText,
      color: 'from-amber-500 to-amber-600'
    },
    {
      title: 'Manage Billing',
      description: 'Create invoices and track payments',
      href: '/team-portal/invoices',
      icon: CreditCard,
      color: 'from-emerald-500 to-emerald-600',
      requiresRole: ['company_admin', 'billing_admin', 'manager']
    },
    {
      title: 'Team Settings',
      description: 'Configure company preferences and settings',
      href: '/team-portal/settings',
      icon: Settings,
      color: 'from-slate-500 to-slate-600'
    },
    {
      title: 'Company Branding',
      description: 'Customize your company\'s appearance',
      href: '/team-portal/admin/branding',
      icon: Palette,
      color: 'from-pink-500 to-pink-600',
      requiresRole: ['company_admin']
    },
    {
      title: 'Analytics',
      description: 'View performance metrics and insights',
      href: '/team-portal/analytics',
      icon: BarChart3,
      color: 'from-indigo-500 to-indigo-600',
      requiresRole: ['company_admin', 'manager']
    }
  ];

  // Filter actions based on user role
  const availableActions = allActions.filter(action => {
    if (!action.requiresRole) return true;
    return action.requiresRole.includes(userRole.toLowerCase().replace(' ', '_'));
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {availableActions.map((action) => {
        const Icon = action.icon;

        return (
          <Link
            key={action.title}
            href={action.href}
            className="group relative overflow-hidden"
          >
            <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${action.color} shadow-sm`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 group-hover:text-slate-700">
                      {action.title}
                    </h3>
                    {action.badge && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    {action.description}
                  </p>
                </div>
              </div>

              {/* Hover gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-r ${action.color} opacity-0 group-hover:opacity-5 transition-opacity duration-200 rounded-xl`}></div>
            </div>
          </Link>
        );
      })}

      {/* Special alerts/notifications */}
      {pendingInvitations > 0 && userRole === 'Company Admin' && (
        <Link
          href="/team-portal/admin/employees"
          className="group relative overflow-hidden md:col-span-2"
        >
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Mail className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900">
                  {pendingInvitations} Pending Invitation{pendingInvitations !== 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-yellow-700">
                  Team members are waiting to join your company
                </p>
              </div>
              <div className="text-yellow-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}