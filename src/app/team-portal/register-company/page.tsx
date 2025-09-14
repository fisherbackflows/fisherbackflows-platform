'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TeamPortalNavigation } from '@/components/navigation/UnifiedNavigation';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  Shield,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  Lock
} from 'lucide-react';
import Link from 'next/link';

interface CompanyRegistrationData {
  // Company basics
  name: string;
  businessType: string;
  email: string;
  phone: string;
  website: string;

  // Address
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;

  // Business details
  yearsInBusiness: string;
  numberOfEmployees: string;
  businessLicense: string;
  serviceArea: string;
  timeZone: string;

  // Admin user
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  adminPasswordConfirm: string;

  // Plan selection
  planType: 'starter' | 'professional' | 'enterprise';
}

interface ValidationErrors {
  [key: string]: string;
}

export default function CompanyRegistrationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const [formData, setFormData] = useState<CompanyRegistrationData>({
    // Company basics
    name: '',
    businessType: 'testing_service',
    email: '',
    phone: '',
    website: '',

    // Address
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',

    // Business details
    yearsInBusiness: '',
    numberOfEmployees: '',
    businessLicense: '',
    serviceArea: '',
    timeZone: '',

    // Admin user
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',

    // Plan selection
    planType: 'professional'
  });

  const businessTypes = [
    { value: 'testing_service', label: 'Backflow Testing Service' },
    { value: 'plumbing', label: 'Plumbing Company' },
    { value: 'hvac', label: 'HVAC Company' },
    { value: 'municipal', label: 'Municipal Water Department' },
    { value: 'contractor', label: 'General Contractor' },
    { value: 'other', label: 'Other' }
  ];

  const employeeCounts = [
    { value: '1-5', label: '1-5 employees' },
    { value: '6-10', label: '6-10 employees' },
    { value: '11-25', label: '11-25 employees' },
    { value: '26-50', label: '26-50 employees' },
    { value: '51-100', label: '51-100 employees' },
    { value: '100+', label: '100+ employees' }
  ];

  const timeZones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' }
  ];

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '$29',
      period: '/month',
      description: 'Perfect for small teams getting started',
      maxUsers: 3,
      features: [
        'Up to 3 team members',
        'Basic scheduling',
        'Test report generation',
        'Customer management',
        'Email support'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '$79',
      period: '/month',
      description: 'Ideal for growing businesses',
      maxUsers: 15,
      features: [
        'Up to 15 team members',
        'Advanced scheduling',
        'Automated reports',
        'Customer portal',
        'GPS tracking',
        'Priority support',
        'Custom branding'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$199',
      period: '/month',
      description: 'For large organizations',
      maxUsers: 100,
      features: [
        'Unlimited team members',
        'Multi-location support',
        'Advanced analytics',
        'API access',
        'White-label options',
        '24/7 phone support',
        'Custom integrations'
      ]
    }
  ];

  // Function to format phone number as user types
  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const phoneNumber = value.replace(/\D/g, '');

    // Format based on length
    if (phoneNumber.length === 0) return '';
    if (phoneNumber.length <= 3) return `(${phoneNumber}`;
    if (phoneNumber.length <= 6) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  // Function to suggest plan based on employee count
  const suggestPlanBasedOnEmployees = (employeeCount: string) => {
    switch (employeeCount) {
      case '1-5':
        return 'starter';
      case '6-10':
      case '11-25':
        return 'professional';
      case '26-50':
      case '51-100':
      case '100+':
        return 'enterprise';
      default:
        return 'professional'; // Default fallback
    }
  };

  const updateFormData = (field: keyof CompanyRegistrationData, value: string) => {
    let processedValue = value;

    // Format phone numbers as user types
    if (field === 'phone') {
      processedValue = formatPhoneNumber(value);
    }

    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));

    // Auto-select plan based on employee count
    if (field === 'numberOfEmployees' && value) {
      const suggestedPlan = suggestPlanBasedOnEmployees(value);
      setFormData(prev => ({
        ...prev,
        [field]: processedValue,
        planType: suggestedPlan as any
      }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: ValidationErrors = {};

    switch (step) {
      case 1: // Company Information
        if (!formData.name.trim()) newErrors.name = 'Company name is required';
        if (!formData.email.trim()) newErrors.email = 'Company email is required';
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Invalid email format';
        }
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        break;

      case 2: // Address
        if (!formData.addressLine1.trim()) newErrors.addressLine1 = 'Address is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.state.trim()) newErrors.state = 'State is required';
        if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
        break;

      case 3: // Admin User
        if (!formData.adminFirstName.trim()) newErrors.adminFirstName = 'First name is required';
        if (!formData.adminLastName.trim()) newErrors.adminLastName = 'Last name is required';
        if (!formData.adminEmail.trim()) newErrors.adminEmail = 'Admin email is required';
        if (formData.adminEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
          newErrors.adminEmail = 'Invalid email format';
        }
        if (!formData.adminPassword.trim()) newErrors.adminPassword = 'Password is required';
        if (formData.adminPassword.length < 12) newErrors.adminPassword = 'Password must be at least 12 characters';
        if (formData.adminPassword !== formData.adminPasswordConfirm) {
          newErrors.adminPasswordConfirm = 'Passwords do not match';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setLoading(true);

    try {
      const response = await fetch('/api/team/company/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // Registration successful
        setCurrentStep(5); // Success step
      } else {
        setErrors({ submit: data.error || 'Registration failed' });
      }

    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="p-4 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl inline-block mb-6">
                <Building2 className="h-12 w-12 text-blue-300" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Company Information</h2>
              <p className="text-white/90">Tell us about your business</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl bg-white/10 border glass text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm transition-all duration-200 ${
                    errors.name ? 'border-red-400' : 'border-blue-400'
                  }`}
                  placeholder=""
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Business Type
                </label>
                <select
                  value={formData.businessType}
                  onChange={(e) => updateFormData('businessType', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-blue-400 glass text-white focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm transition-all duration-200"
                >
                  {businessTypes.map(type => (
                    <option key={type.value} value={type.value} className="bg-slate-900 text-white">{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Company Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl bg-white/10 border glass text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm transition-all duration-200 ${
                    errors.email ? 'border-red-400' : 'border-blue-400'
                  }`}
                  placeholder=""
                />
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  maxLength={14}
                  className={`w-full px-4 py-3 rounded-xl bg-white/10 border glass text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm transition-all duration-200 ${
                    errors.phone ? 'border-red-400' : 'border-blue-400'
                  }`}
                  placeholder=""
                />
                {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => updateFormData('website', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-blue-400 glass text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm transition-all duration-200"
                  placeholder=""
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Years in Business
                </label>
                <input
                  type="text"
                  value={formData.yearsInBusiness}
                  onChange={(e) => updateFormData('yearsInBusiness', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-blue-400 glass text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm transition-all duration-200"
                  placeholder=""
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Number of Employees
                </label>
                <select
                  value={formData.numberOfEmployees}
                  onChange={(e) => updateFormData('numberOfEmployees', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-blue-400 glass text-white focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm transition-all duration-200"
                >
                  <option value="" className="bg-slate-900 text-white">Select employee count</option>
                  {employeeCounts.map(count => (
                    <option key={count.value} value={count.value} className="bg-slate-900 text-white">{count.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Time Zone
                </label>
                <select
                  value={formData.timeZone}
                  onChange={(e) => updateFormData('timeZone', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-blue-400 glass text-white focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm transition-all duration-200"
                >
                  <option value="" className="bg-slate-900 text-white">Select time zone</option>
                  {timeZones.map(tz => (
                    <option key={tz.value} value={tz.value} className="bg-slate-900 text-white">{tz.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Business License #
                </label>
                <input
                  type="text"
                  value={formData.businessLicense}
                  onChange={(e) => updateFormData('businessLicense', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-blue-400 glass text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm transition-all duration-200"
                  placeholder=""
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Primary Service Area
                </label>
                <input
                  type="text"
                  value={formData.serviceArea}
                  onChange={(e) => updateFormData('serviceArea', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-blue-400 glass text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm transition-all duration-200"
                  placeholder=""
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="p-4 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl inline-block mb-6">
                <MapPin className="h-12 w-12 text-blue-300" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Business Address</h2>
              <p className="text-white/90">Where is your business located?</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  value={formData.addressLine1}
                  onChange={(e) => updateFormData('addressLine1', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl bg-white/10 border glass text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm transition-all duration-200 ${
                    errors.addressLine1 ? 'border-red-400' : 'border-blue-400'
                  }`}
                  placeholder=""
                />
                {errors.addressLine1 && <p className="text-red-400 text-sm mt-1">{errors.addressLine1}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Apartment, suite, etc.
                </label>
                <input
                  type="text"
                  value={formData.addressLine2}
                  onChange={(e) => updateFormData('addressLine2', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-blue-400 glass text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm transition-all duration-200"
                  placeholder=""
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl bg-white/10 border glass text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm transition-all duration-200 ${
                      errors.city ? 'border-red-400' : 'border-blue-400'
                    }`}
                    placeholder=""
                  />
                  {errors.city && <p className="text-red-400 text-sm mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => updateFormData('state', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl bg-white/10 border glass text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm transition-all duration-200 ${
                      errors.state ? 'border-red-400' : 'border-blue-400'
                    }`}
                    placeholder=""
                  />
                  {errors.state && <p className="text-red-400 text-sm mt-1">{errors.state}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => updateFormData('zipCode', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl bg-white/10 border glass text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm transition-all duration-200 ${
                      errors.zipCode ? 'border-red-400' : 'border-blue-400'
                    }`}
                    placeholder=""
                  />
                  {errors.zipCode && <p className="text-red-400 text-sm mt-1">{errors.zipCode}</p>}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="p-4 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl inline-block mb-6">
                <Shield className="h-12 w-12 text-blue-300" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Admin Account</h2>
              <p className="text-white/90">Create your administrator account</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.adminFirstName}
                  onChange={(e) => updateFormData('adminFirstName', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl bg-white/10 border glass text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm transition-all duration-200 ${
                    errors.adminFirstName ? 'border-red-400' : 'border-blue-400'
                  }`}
                  placeholder=""
                />
                {errors.adminFirstName && <p className="text-red-400 text-sm mt-1">{errors.adminFirstName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.adminLastName}
                  onChange={(e) => updateFormData('adminLastName', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl bg-white/10 border glass text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm transition-all duration-200 ${
                    errors.adminLastName ? 'border-red-400' : 'border-blue-400'
                  }`}
                  placeholder=""
                />
                {errors.adminLastName && <p className="text-red-400 text-sm mt-1">{errors.adminLastName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Admin Email *
              </label>
              <input
                type="email"
                value={formData.adminEmail}
                onChange={(e) => updateFormData('adminEmail', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl bg-white/10 border glass text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm transition-all duration-200 ${
                  errors.adminEmail ? 'border-red-400' : 'border-blue-400'
                }`}
                placeholder=""
              />
              {errors.adminEmail && <p className="text-red-400 text-sm mt-1">{errors.adminEmail}</p>}
              <p className="text-sm text-white/60 mt-1">This will be your login email</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Password *
              </label>
              <input
                type="password"
                value={formData.adminPassword}
                onChange={(e) => updateFormData('adminPassword', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl bg-white/10 border glass text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm transition-all duration-200 ${
                  errors.adminPassword ? 'border-red-400' : 'border-blue-400'
                }`}
                placeholder=""
              />
              {errors.adminPassword && <p className="text-red-400 text-sm mt-1">{errors.adminPassword}</p>}
              <p className="text-sm text-white/60 mt-1">Must be at least 12 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                value={formData.adminPasswordConfirm}
                onChange={(e) => updateFormData('adminPasswordConfirm', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl bg-white/10 border glass text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm transition-all duration-200 ${
                  errors.adminPasswordConfirm ? 'border-red-400' : 'border-blue-400'
                }`}
                placeholder=""
              />
              {errors.adminPasswordConfirm && <p className="text-red-400 text-sm mt-1">{errors.adminPasswordConfirm}</p>}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="p-4 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl inline-block mb-6">
                <FileText className="h-12 w-12 text-blue-300" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Choose Your Plan</h2>
              <p className="text-white/90">Select the plan that fits your business needs</p>
              {formData.numberOfEmployees && (
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-400/50 rounded-xl glass">
                  <p className="text-blue-300 text-sm">
                    ✨ We've suggested the <span className="font-semibold capitalize">{formData.planType}</span> plan based on your team size ({formData.numberOfEmployees} employees)
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative glass border-2 rounded-2xl p-6 cursor-pointer transition-all glow-blue-sm ${
                    formData.planType === plan.id
                      ? 'border-blue-400 ring-2 ring-blue-400/50 glow-blue'
                      : 'border-blue-400/50 hover:border-blue-300'
                  } ${plan.popular ? 'ring-2 ring-blue-400/30' : ''}`}
                  onClick={() => updateFormData('planType', plan.id as any)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-blue-300">{plan.price}</span>
                      <span className="text-white/60">{plan.period}</span>
                    </div>
                    <p className="text-white/80 text-sm">{plan.description}</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                      <span className="font-medium text-white">Up to {plan.maxUsers} users</span>
                    </div>
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-white/80">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-center">
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      formData.planType === plan.id
                        ? 'border-blue-400 bg-blue-500'
                        : 'border-blue-400'
                    }`}>
                      {formData.planType === plan.id && (
                        <CheckCircle className="w-5 h-5 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-500/10 border border-blue-400/50 rounded-xl p-4 glass">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-300">
                  <p className="font-medium mb-1">14-day free trial included</p>
                  <p>Start with any plan and get full access for 14 days. No credit card required to begin.</p>
                </div>
              </div>
            </div>

            {errors.submit && (
              <div className="bg-red-500/10 border border-red-400/50 rounded-xl p-4 glass">
                <p className="text-red-400 text-sm">{errors.submit}</p>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6">
            <div className="p-6 bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl rounded-2xl inline-block mb-6">
              <CheckCircle className="h-20 w-20 text-green-300 mx-auto" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">Welcome to Fisher Backflows!</h2>
              <p className="text-xl text-white/90 mb-6">
                Your company account has been created successfully.
              </p>
              <div className="bg-green-500/10 border border-green-400/50 rounded-xl p-6 mb-6 glass">
                <h3 className="font-semibold text-green-300 mb-2">What's Next?</h3>
                <ul className="text-left space-y-2 text-green-200">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                    Check your email for account verification
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                    Set up your company settings
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                    Invite your team members
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                    Start managing your customers and appointments
                  </li>
                </ul>
              </div>
            </div>

            <Button
              onClick={() => router.push('/team-portal/login')}
              className="glass-btn-primary hover:glow-blue text-white px-8 py-3 rounded-2xl font-medium inline-flex items-center glow-blue-sm"
            >
              Sign In to Your Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <TeamPortalNavigation userInfo={{ name: '', email: '' }} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  currentStep >= step
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-white/60 border border-blue-400/50'
                }`}>
                  {currentStep > step ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    step
                  )}
                </div>
                {step < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    currentStep > step ? 'bg-blue-500' : 'bg-white/20'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-2 text-sm">
            <span className={currentStep >= 1 ? 'text-blue-300 font-medium' : 'text-white/60'}>
              Company Info
            </span>
            <span className={currentStep >= 2 ? 'text-blue-300 font-medium' : 'text-white/60'}>
              Address
            </span>
            <span className={currentStep >= 3 ? 'text-blue-300 font-medium' : 'text-white/60'}>
              Admin Account
            </span>
            <span className={currentStep >= 4 ? 'text-blue-300 font-medium' : 'text-white/60'}>
              Plan Selection
            </span>
          </div>
        </div>

        {/* Form Content */}
        <div className="glass rounded-2xl border border-blue-400 p-8 glow-blue-sm">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        {currentStep < 5 && (
          <div className="flex justify-between mt-8">
            <div>
              {currentStep > 1 && (
                <Button
                  onClick={handlePreviousStep}
                  className="glass hover:glass text-white/80 px-6 py-2 rounded-2xl border border-blue-400/50"
                >
                  Previous
                </Button>
              )}
            </div>

            <div className="flex space-x-4">
              <Link href="/team-portal/login">
                <Button className="glass hover:glass text-white/80 px-6 py-2 rounded-2xl">
                  Already have an account? Sign In
                </Button>
              </Link>

              {currentStep < 4 ? (
                <Button
                  onClick={handleNextStep}
                  className="glass-btn-primary hover:glow-blue text-white px-6 py-2 rounded-2xl glow-blue-sm"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="glass-btn-primary hover:glow-blue text-white px-8 py-3 rounded-2xl glow-blue-sm disabled:opacity-50"
                >
                  {loading ? 'Creating Account...' : 'Create Company Account'}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}