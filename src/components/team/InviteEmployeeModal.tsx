'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  X,
  Mail,
  User,
  Shield,
  Send,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface InviteEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  maxUsers: number;
  currentUsers: number;
}

interface InvitationForm {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export default function InviteEmployeeModal({
  isOpen,
  onClose,
  onSuccess,
  maxUsers,
  currentUsers
}: InviteEmployeeModalProps) {
  const [formData, setFormData] = useState<InvitationForm>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'tester'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const roles = [
    {
      value: 'tester',
      label: 'Tester',
      description: 'Field technician for backflow testing',
      permissions: ['Complete tests', 'View schedule', 'Update reports']
    },
    {
      value: 'scheduler',
      label: 'Scheduler',
      description: 'Appointment and route management',
      permissions: ['Manage appointments', 'Create schedules', 'Route optimization']
    },
    {
      value: 'manager',
      label: 'Manager',
      description: 'Team management and oversight',
      permissions: ['Manage team', 'View all reports', 'Schedule assignments', 'Customer management']
    },
    {
      value: 'billing_admin',
      label: 'Billing Admin',
      description: 'Billing and payment management',
      permissions: ['Process payments', 'Generate invoices', 'Manage billing', 'Financial reports']
    },
    {
      value: 'company_admin',
      label: 'Company Admin',
      description: 'Full company management access',
      permissions: ['All permissions', 'User management', 'Company settings', 'Billing management']
    }
  ];

  const updateFormData = (field: keyof InvitationForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.role) {
      newErrors.role = 'Role selection is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Check user limit
    if (currentUsers >= maxUsers) {
      setErrors({ submit: 'User limit reached for your plan. Upgrade to add more team members.' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/team/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          role: formData.role
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      } else {
        setErrors({ submit: data.error || 'Failed to send invitation' });
      }

    } catch (error) {
      console.error('Invitation error:', error);
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        role: 'tester'
      });
      setErrors({});
      setSuccess(false);
      onClose();
    }
  };

  const selectedRole = roles.find(role => role.value === formData.role);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Invite Team Member</h2>
              <p className="text-slate-600 text-sm">Send an invitation to join your company</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {success ? (
          /* Success State */
          <div className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Invitation Sent!</h3>
            <p className="text-slate-600 mb-4">
              An email invitation has been sent to {formData.email}
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
              <p className="text-green-800 text-sm">
                <strong>What happens next?</strong>
              </p>
              <ul className="text-green-700 text-sm mt-2 space-y-1">
                <li>• {formData.firstName} will receive an email with instructions</li>
                <li>• They have 7 days to accept the invitation</li>
                <li>• Once accepted, they'll have access to their role-specific features</li>
              </ul>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* User Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Employee Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.firstName ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder="John"
                    disabled={loading}
                  />
                  {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => updateFormData('lastName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.lastName ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder="Smith"
                    disabled={loading}
                  />
                  {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? 'border-red-300' : 'border-slate-300'
                  }`}
                  placeholder="john.smith@company.com"
                  disabled={loading}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Role & Permissions
              </h3>

              <div className="space-y-3">
                {roles.map((role) => (
                  <div
                    key={role.value}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      formData.role === role.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                    onClick={() => updateFormData('role', role.value)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="role"
                            value={role.value}
                            checked={formData.role === role.value}
                            onChange={(e) => updateFormData('role', e.target.value)}
                            className="mr-3 text-blue-600"
                            disabled={loading}
                          />
                          <div>
                            <h4 className="font-semibold text-slate-900">{role.label}</h4>
                            <p className="text-slate-600 text-sm">{role.description}</p>
                          </div>
                        </div>
                        <div className="mt-2 ml-6">
                          <div className="flex flex-wrap gap-2">
                            {role.permissions.map((permission, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700"
                              >
                                {permission}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {errors.role && <p className="text-red-500 text-sm">{errors.role}</p>}
            </div>

            {/* User Limit Warning */}
            {currentUsers >= maxUsers * 0.8 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-yellow-800 font-medium">
                      {currentUsers >= maxUsers
                        ? 'User limit reached'
                        : `Approaching user limit (${currentUsers}/${maxUsers})`
                      }
                    </p>
                    <p className="text-yellow-700 mt-1">
                      {currentUsers >= maxUsers
                        ? 'Upgrade your plan to add more team members.'
                        : 'Consider upgrading your plan if you need to add more team members.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || currentUsers >= maxUsers}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending Invitation...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Send className="h-4 w-4 mr-2" />
                    Send Invitation
                  </div>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}