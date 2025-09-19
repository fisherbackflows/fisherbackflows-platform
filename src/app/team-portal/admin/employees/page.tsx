'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TeamPortalNavigation } from '@/components/navigation/UnifiedNavigation';
import { Button } from '@/components/ui/button';
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  Shield,
  MoreVertical,
  Edit3,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import InviteEmployeeModal from '@/components/team/InviteEmployeeModal';

interface TeamUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
  license_number?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  invited_at?: string;
  invitation_accepted_at?: string;
}

interface UserInvitation {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  invited_by: string;
  created_at: string;
  expires_at: string;
}

interface CompanyInfo {
  id: string;
  name: string;
  plan_type: string;
  max_users: number;
}

export default function EmployeesManagementPage() {
  const router = useRouter();
  const [user, setUser] = useState<TeamUser | null>(null);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [employees, setEmployees] = useState<TeamUser[]>([]);
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showInviteModal, setShowInviteModal] = useState(false);

  const roles = [
    { value: 'company_admin', label: 'Company Admin', description: 'Full company management access' },
    { value: 'manager', label: 'Manager', description: 'Team management and scheduling' },
    { value: 'tester', label: 'Tester', description: 'Field technician for backflow testing' },
    { value: 'scheduler', label: 'Scheduler', description: 'Appointment and route management' },
    { value: 'billing_admin', label: 'Billing Admin', description: 'Billing and payment management' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Check authentication and get current user
      const authResponse = await fetch('/api/team/auth/me');
      if (!authResponse.ok) {
        router.push('/team-portal/login');
        return;
      }

      const authData = await authResponse.json();

      // Check if user is company admin
      if (authData.user.role !== 'company_admin') {
        router.push('/team-portal/dashboard');
        return;
      }

      setUser(authData.user);

      // Load company information
      const companyResponse = await fetch('/api/team/company/info');
      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        setCompany(companyData);
      }

      // Load employees
      const employeesResponse = await fetch('/api/team/employees');
      if (employeesResponse.ok) {
        const employeesData = await employeesResponse.json();
        setEmployees(employeesData.employees || []);
      }

      // Load invitations
      const invitationsResponse = await fetch('/api/team/invitations');
      if (invitationsResponse.ok) {
        const invitationsData = await invitationsResponse.json();
        setInvitations(invitationsData.invitations || []);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    try {
      const response = await fetch(`/api/team/employees/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: false })
      });

      if (response.ok) {
        loadData(); // Refresh data
      }
    } catch (error) {
      console.error('Error deactivating user:', error);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/team/invitations/${invitationId}/resend`, {
        method: 'POST'
      });

      if (response.ok) {
        loadData(); // Refresh data
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;

    try {
      const response = await fetch(`/api/team/invitations/${invitationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadData(); // Refresh data
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error);
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = `${employee.first_name} ${employee.last_name} ${employee.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || employee.role === roleFilter;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && employee.is_active) ||
      (statusFilter === 'inactive' && !employee.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredInvitations = invitations.filter(invitation => {
    const matchesSearch = `${invitation.first_name || ''} ${invitation.last_name || ''} ${invitation.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || invitation.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleLabel = (role: string) => {
    const roleInfo = roles.find(r => r.value === role);
    return roleInfo?.label || role;
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'company_admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'manager': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'tester': return 'bg-green-100 text-green-800 border-green-200';
      case 'scheduler': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'billing_admin': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 border border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </span>;
      case 'accepted':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 border border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Accepted
        </span>;
      case 'expired':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 border border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Expired
        </span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-800 border border-slate-200">
          <XCircle className="w-3 h-3 mr-1" />
          Cancelled
        </span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <TeamPortalNavigation userInfo={{ name: 'Loading...', email: '' }} />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'company_admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <TeamPortalNavigation userInfo={{ name: 'Access Denied', email: '' }} />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600">You need company admin privileges to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <TeamPortalNavigation userInfo={{
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: 'Company Admin'
      }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Employee Management</h1>
              <p className="text-slate-600">Manage your team members and invitations</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-slate-600">
              {employees.length} of {company?.max_users} users
            </div>
            <Button
              onClick={() => setShowInviteModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg inline-flex items-center"
              disabled={employees.length >= (company?.max_users || 0)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Employee
            </Button>
          </div>
        </div>

        {/* Company Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Employees</p>
                <p className="text-2xl font-bold text-slate-900">{employees.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{employees.filter(e => e.is_active).length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Pending Invites</p>
                <p className="text-2xl font-bold text-yellow-600">{invitations.filter(i => i.status === 'pending').length}</p>
              </div>
              <Mail className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Available Slots</p>
                <p className="text-2xl font-bold text-blue-600">{(company?.max_users || 0) - employees.length}</p>
              </div>
              <UserPlus className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search employees and invitations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Roles</option>
                {roles.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Employees Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Team Members</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Employee</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Role</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Contact</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Last Login</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">
                            {employee.first_name} {employee.last_name}
                          </div>
                          <div className="text-sm text-slate-500">{employee.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getRoleBadgeClass(employee.role)}`}>
                        <Shield className="w-3 h-3 mr-1" />
                        {getRoleLabel(employee.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="space-y-1">
                        {employee.phone && (
                          <div className="flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {employee.phone}
                          </div>
                        )}
                        {employee.license_number && (
                          <div className="text-xs text-slate-500">
                            License: {employee.license_number}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {employee.is_active ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 border border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 border border-red-200">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {employee.last_login ?
                        new Date(employee.last_login).toLocaleDateString() :
                        'Never'
                      }
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit3 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        {employee.is_active && employee.id !== user.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeactivateUser(employee.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredEmployees.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No employees found</h3>
                <p className="text-slate-500 mb-4">
                  {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                    ? 'No employees match your current filters.'
                    : 'Start by inviting team members to join your company.'
                  }
                </p>
                {!searchTerm && roleFilter === 'all' && statusFilter === 'all' && (
                  <Button
                    onClick={() => setShowInviteModal(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Your First Employee
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Pending Invitations</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Invitee</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Role</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Invited</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Expires</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredInvitations.map((invitation) => (
                    <tr key={invitation.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">
                          {invitation.first_name && invitation.last_name
                            ? `${invitation.first_name} ${invitation.last_name}`
                            : invitation.email
                          }
                        </div>
                        <div className="text-sm text-slate-500">{invitation.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getRoleBadgeClass(invitation.role)}`}>
                          <Shield className="w-3 h-3 mr-1" />
                          {getRoleLabel(invitation.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(invitation.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(invitation.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(invitation.expires_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {invitation.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResendInvitation(invitation.id)}
                              >
                                <Mail className="h-4 w-4 mr-1" />
                                Resend
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelInvitation(invitation.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Invite Employee Modal */}
        <InviteEmployeeModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onSuccess={loadData}
          maxUsers={company?.max_users || 0}
          currentUsers={employees.length}
        />
      </div>
    </div>
  );
}