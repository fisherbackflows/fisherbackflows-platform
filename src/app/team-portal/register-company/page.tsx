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
  AlertCircle
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
  licenseNumber: string;
  certificationLevel: string;

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
    licenseNumber: '',
    certificationLevel: 'basic',

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
    { value: 'municipal', label: 'Municipal Water Department' },
    { value: 'contractor', label: 'General Contractor' },
    { value: 'other', label: 'Other' }
  ];

  const certificationLevels = [
    { value: 'basic', label: 'Basic Certification' },
    { value: 'advanced', label: 'Advanced Certification' },
    { value: 'master', label: 'Master Certification' }
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

  const updateFormData = (field: keyof CompanyRegistrationData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

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
              <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Company Information</h2>
              <p className="text-slate-600">Tell us about your business</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-slate-300'
                  }`}
                  placeholder="Acme Backflow Testing"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Business Type
                </label>
                <select
                  value={formData.businessType}
                  onChange={(e) => updateFormData('businessType', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {businessTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Company Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? 'border-red-300' : 'border-slate-300'
                  }`}
                  placeholder="contact@acmebackflow.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.phone ? 'border-red-300' : 'border-slate-300'
                  }`}
                  placeholder="(555) 123-4567"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => updateFormData('website', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://acmebackflow.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  License Number
                </label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => updateFormData('licenseNumber', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="BT-12345"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Certification Level
              </label>
              <select
                value={formData.certificationLevel}
                onChange={(e) => updateFormData('certificationLevel', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {certificationLevels.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <MapPin className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Business Address</h2>
              <p className="text-slate-600">Where is your business located?</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  value={formData.addressLine1}
                  onChange={(e) => updateFormData('addressLine1', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.addressLine1 ? 'border-red-300' : 'border-slate-300'
                  }`}
                  placeholder="123 Main Street"
                />
                {errors.addressLine1 && <p className="text-red-500 text-sm mt-1">{errors.addressLine1}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Apartment, suite, etc.
                </label>
                <input
                  type="text"
                  value={formData.addressLine2}
                  onChange={(e) => updateFormData('addressLine2', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Suite 100"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.city ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder="Tacoma"
                  />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => updateFormData('state', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.state ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder="WA"
                  />
                  {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => updateFormData('zipCode', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.zipCode ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder="98401"
                  />
                  {errors.zipCode && <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Admin Account</h2>
              <p className="text-slate-600">Create your administrator account</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.adminFirstName}
                  onChange={(e) => updateFormData('adminFirstName', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.adminFirstName ? 'border-red-300' : 'border-slate-300'
                  }`}
                  placeholder="John"
                />
                {errors.adminFirstName && <p className="text-red-500 text-sm mt-1">{errors.adminFirstName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.adminLastName}
                  onChange={(e) => updateFormData('adminLastName', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.adminLastName ? 'border-red-300' : 'border-slate-300'
                  }`}
                  placeholder="Smith"
                />
                {errors.adminLastName && <p className="text-red-500 text-sm mt-1">{errors.adminLastName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Admin Email *
              </label>
              <input
                type="email"
                value={formData.adminEmail}
                onChange={(e) => updateFormData('adminEmail', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.adminEmail ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="admin@acmebackflow.com"
              />
              {errors.adminEmail && <p className="text-red-500 text-sm mt-1">{errors.adminEmail}</p>}
              <p className="text-sm text-slate-500 mt-1">This will be your login email</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                value={formData.adminPassword}
                onChange={(e) => updateFormData('adminPassword', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.adminPassword ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="Enter secure password"
              />
              {errors.adminPassword && <p className="text-red-500 text-sm mt-1">{errors.adminPassword}</p>}
              <p className="text-sm text-slate-500 mt-1">Must be at least 12 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                value={formData.adminPasswordConfirm}
                onChange={(e) => updateFormData('adminPasswordConfirm', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.adminPasswordConfirm ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="Confirm password"
              />
              {errors.adminPasswordConfirm && <p className="text-red-500 text-sm mt-1">{errors.adminPasswordConfirm}</p>}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Choose Your Plan</h2>
              <p className="text-slate-600">Select the plan that fits your business needs</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative bg-white border-2 rounded-2xl p-6 cursor-pointer transition-all ${
                    formData.planType === plan.id
                      ? 'border-blue-500 ring-2 ring-blue-100'
                      : 'border-slate-200 hover:border-blue-300'
                  } ${plan.popular ? 'ring-2 ring-blue-100' : ''}`}
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
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-blue-600">{plan.price}</span>
                      <span className="text-slate-500">{plan.period}</span>
                    </div>
                    <p className="text-slate-600 text-sm">{plan.description}</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span className="font-medium">Up to {plan.maxUsers} users</span>
                    </div>
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-slate-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-center">
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      formData.planType === plan.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-slate-300'
                    }`}>
                      {formData.planType === plan.id && (
                        <CheckCircle className="w-5 h-5 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">14-day free trial included</p>
                  <p>Start with any plan and get full access for 14 days. No credit card required to begin.</p>
                </div>
              </div>
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{errors.submit}</p>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Welcome to Fisher Backflows!</h2>
              <p className="text-xl text-slate-600 mb-6">
                Your company account has been created successfully.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-green-800 mb-2">What's Next?</h3>
                <ul className="text-left space-y-2 text-green-700">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Check your email for account verification
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Set up your company settings
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Invite your team members
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Start managing your customers and appointments
                  </li>
                </ul>
              </div>
            </div>

            <Button
              onClick={() => router.push('/team-portal/login')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium inline-flex items-center"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
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
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {currentStep > step ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    step
                  )}
                </div>
                {step < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    currentStep > step ? 'bg-blue-500' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-2 text-sm">
            <span className={currentStep >= 1 ? 'text-blue-600 font-medium' : 'text-slate-500'}>
              Company Info
            </span>
            <span className={currentStep >= 2 ? 'text-blue-600 font-medium' : 'text-slate-500'}>
              Address
            </span>
            <span className={currentStep >= 3 ? 'text-blue-600 font-medium' : 'text-slate-500'}>
              Admin Account
            </span>
            <span className={currentStep >= 4 ? 'text-blue-600 font-medium' : 'text-slate-500'}>
              Plan Selection
            </span>
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        {currentStep < 5 && (
          <div className="flex justify-between mt-8">
            <div>
              {currentStep > 1 && (
                <Button
                  onClick={handlePreviousStep}
                  variant="outline"
                  className="px-6 py-2"
                >
                  Previous
                </Button>
              )}
            </div>

            <div className="flex space-x-4">
              <Link href="/team-portal/login">
                <Button variant="ghost" className="px-6 py-2">
                  Already have an account? Sign In
                </Button>
              </Link>

              {currentStep < 4 ? (
                <Button
                  onClick={handleNextStep}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3"
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