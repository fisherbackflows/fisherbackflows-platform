'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  User, 
  MapPin, 
  Calendar,
  CreditCard,
  Bell,
  Sparkles
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType<{ onNext: () => void; onSkip?: () => void }>;
}

interface OnboardingWizardProps {
  onComplete: () => void;
  userType: 'customer' | 'team';
}

export default function OnboardingWizard({ onComplete, userType }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const customerSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Fisher Backflows',
      description: 'Let\'s get you set up with your account',
      icon: Sparkles,
      component: WelcomeStep
    },
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Add your contact information',
      icon: User,
      component: ProfileStep
    },
    {
      id: 'property',
      title: 'Add Your Property',
      description: 'Tell us about your backflow devices',
      icon: MapPin,
      component: PropertyStep
    },
    {
      id: 'schedule',
      title: 'Schedule Your First Test',
      description: 'Book your annual backflow testing',
      icon: Calendar,
      component: ScheduleStep
    },
    {
      id: 'payment',
      title: 'Set Up Payment Method',
      description: 'Add a payment method for easy billing',
      icon: CreditCard,
      component: PaymentStep
    },
    {
      id: 'notifications',
      title: 'Notification Preferences',
      description: 'Choose how you\'d like to be notified',
      icon: Bell,
      component: NotificationStep
    }
  ];

  const teamSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to the Team Portal',
      description: 'Let\'s get you familiar with the platform',
      icon: Sparkles,
      component: TeamWelcomeStep
    },
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Set up your technician profile',
      icon: User,
      component: TeamProfileStep
    },
    {
      id: 'tools',
      title: 'Platform Overview',
      description: 'Learn about key features and tools',
      icon: Calendar,
      component: PlatformOverviewStep
    }
  ];

  const steps = userType === 'customer' ? customerSteps : teamSteps;
  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (!completedSteps.includes(currentStepData.id)) {
      setCompletedSteps([...completedSteps, currentStepData.id]);
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-black flex">
      {/* Sidebar with steps */}
      <div className="w-80 glass border-r border-white/10 p-6">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-2">
            {userType === 'customer' ? 'Account Setup' : 'Team Onboarding'}
          </h2>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-blue-700 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-white/60 text-sm mt-2">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = index === currentStep;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                  isCurrent 
                    ? 'bg-blue-700/20 border border-blue-500/30' 
                    : isCompleted
                    ? 'bg-green-700/10'
                    : 'bg-white/5'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  isCompleted 
                    ? 'bg-green-700 text-white'
                    : isCurrent
                    ? 'bg-blue-700 text-white'
                    : 'bg-white/10 text-white/60'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${
                    isCurrent ? 'text-white' : isCompleted ? 'text-green-400' : 'text-white/60'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-white/40 text-sm">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-8">
          <div className="max-w-2xl mx-auto">
            {/* Current step component */}
            <currentStepData.component onNext={handleNext} onSkip={handleSkip} />
          </div>
        </div>

        {/* Navigation */}
        <div className="border-t border-white/10 p-6">
          <div className="max-w-2xl mx-auto flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>

            <div className="flex space-x-3">
              {currentStep < steps.length - 1 && (
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="text-white/60 hover:text-white"
                >
                  Skip
                </Button>
              )}
              
              <Button
                onClick={handleNext}
                className="flex items-center space-x-2 bg-blue-700 hover:bg-blue-700"
              >
                <span>{currentStep === steps.length - 1 ? 'Get Started' : 'Continue'}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Individual step components
function WelcomeStep({ onNext }: { onNext: () => void; onSkip?: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="mb-8">
        <Sparkles className="h-16 w-16 text-blue-400 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-white mb-4">
          Welcome to Fisher Backflows!
        </h1>
        <p className="text-white/80 text-lg max-w-lg mx-auto">
          We're excited to help you manage your backflow testing needs. Let's get your account set up in just a few simple steps.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="glass-light p-6 rounded-xl">
          <Calendar className="h-8 w-8 text-blue-400 mx-auto mb-3" />
          <h3 className="font-semibold text-white mb-2">Easy Scheduling</h3>
          <p className="text-white/60 text-sm">Book appointments online 24/7</p>
        </div>
        <div className="glass-light p-6 rounded-xl">
          <CreditCard className="h-8 w-8 text-green-400 mx-auto mb-3" />
          <h3 className="font-semibold text-white mb-2">Secure Payments</h3>
          <p className="text-white/60 text-sm">Pay invoices safely online</p>
        </div>
        <div className="glass-light p-6 rounded-xl">
          <Bell className="h-8 w-8 text-orange-400 mx-auto mb-3" />
          <h3 className="font-semibold text-white mb-2">Stay Informed</h3>
          <p className="text-white/60 text-sm">Automatic reminders and updates</p>
        </div>
      </div>

      <Button onClick={onNext} size="lg" className="bg-blue-700 hover:bg-blue-700">
        Let's Get Started
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}

function ProfileStep({ onNext }: { onNext: () => void; onSkip?: () => void }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    preferredContact: 'email'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isValid = formData.firstName && formData.lastName && formData.phone;

  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <User className="h-12 w-12 text-blue-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Complete Your Profile</h2>
        <p className="text-white/70">
          Help us personalize your experience and stay in touch
        </p>
      </div>

      <div className="glass p-6 rounded-xl max-w-md mx-auto">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                First Name *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Last Name *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="(555) 123-4567"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Preferred Contact Method
            </label>
            <select
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.preferredContact}
              onChange={(e) => handleInputChange('preferredContact', e.target.value)}
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="text">Text Message</option>
            </select>
          </div>
        </div>

        <Button 
          onClick={onNext} 
          disabled={!isValid}
          className="w-full mt-6 bg-blue-700 hover:bg-blue-700 disabled:opacity-50"
        >
          Save Profile Information
        </Button>
      </div>
    </div>
  );
}

function PropertyStep({ onNext }: { onNext: () => void; onSkip?: () => void }) {
  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <MapPin className="h-12 w-12 text-blue-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Add Your Property</h2>
        <p className="text-white/70">
          Tell us about your property and backflow devices
        </p>
      </div>

      <div className="glass p-6 rounded-xl max-w-md mx-auto">
        <div className="space-y-4">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Property Address
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="123 Main Street"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                City
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Tacoma"
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                ZIP Code
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="98401"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Property Type
            </label>
            <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>Residential</option>
              <option>Commercial</option>
              <option>Industrial</option>
              <option>Mixed Use</option>
            </select>
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Do you know if you have backflow prevention devices?
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="radio" name="hasDevices" className="mr-2" />
                <span className="text-white/80">Yes, I have devices</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="hasDevices" className="mr-2" />
                <span className="text-white/80">Not sure</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="hasDevices" className="mr-2" />
                <span className="text-white/80">No devices</span>
              </label>
            </div>
          </div>
        </div>

        <Button onClick={onNext} className="w-full mt-6 bg-blue-700 hover:bg-blue-700">
          Continue
        </Button>
      </div>
    </div>
  );
}

function ScheduleStep({ onNext, onSkip }: { onNext: () => void; onSkip?: () => void }) {
  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <Calendar className="h-12 w-12 text-blue-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Schedule Your First Test</h2>
        <p className="text-white/70">
          Ready to book your annual backflow test? We'll take care of everything.
        </p>
      </div>

      <div className="max-w-lg mx-auto">
        <div className="glass p-6 rounded-xl mb-6">
          <h3 className="font-semibold text-white mb-4">What happens next:</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-700 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-medium">1</span>
              </div>
              <p className="text-white/80 text-sm">We'll contact you to schedule at your convenience</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-700 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-medium">2</span>
              </div>
              <p className="text-white/80 text-sm">Our certified technician will visit your property</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-700 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-medium">3</span>
              </div>
              <p className="text-white/80 text-sm">You'll receive your official test report within 24 hours</p>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button onClick={onSkip} variant="outline" className="flex-1">
            Schedule Later
          </Button>
          <Button onClick={onNext} className="flex-1 bg-blue-700 hover:bg-blue-700">
            Schedule Now
          </Button>
        </div>
      </div>
    </div>
  );
}

function PaymentStep({ onNext, onSkip }: { onNext: () => void; onSkip?: () => void }) {
  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <CreditCard className="h-12 w-12 text-green-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Set Up Payment Method</h2>
        <p className="text-white/70">
          Add a payment method for easy and secure billing
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <div className="glass p-6 rounded-xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/80">Annual Test Fee:</span>
            <span className="text-white font-semibold">$175.00</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/80">Tax (WA State):</span>
            <span className="text-white font-semibold">$17.94</span>
          </div>
          <div className="border-t border-white/20 pt-4 flex items-center justify-between">
            <span className="text-white font-semibold">Total:</span>
            <span className="text-white font-bold text-lg">$192.94</span>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="glass-light p-4 rounded-lg border border-green-500/30 bg-green-700/10">
            <div className="flex items-center">
              <input type="radio" name="payment" className="mr-3" defaultChecked />
              <div className="flex-1">
                <p className="text-white font-medium">💳 Credit/Debit Card</p>
                <p className="text-white/60 text-sm">Secure payment via Stripe</p>
              </div>
            </div>
          </div>
          
          <div className="glass-light p-4 rounded-lg">
            <div className="flex items-center">
              <input type="radio" name="payment" className="mr-3" />
              <div className="flex-1">
                <p className="text-white font-medium">🏦 Bank Transfer</p>
                <p className="text-white/60 text-sm">Pay via ACH transfer</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button onClick={onSkip} variant="outline" className="flex-1">
            Add Later
          </Button>
          <Button onClick={onNext} className="flex-1 bg-green-700 hover:bg-green-700">
            Add Payment Method
          </Button>
        </div>
      </div>
    </div>
  );
}

function NotificationStep({ onNext }: { onNext: () => void; onSkip?: () => void }) {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    reminders: true,
    marketing: false
  });

  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <Bell className="h-12 w-12 text-orange-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Notification Preferences</h2>
        <p className="text-white/70">
          Choose how you'd like to receive updates and reminders
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <div className="glass p-6 rounded-xl mb-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">📧 Email Notifications</p>
                <p className="text-white/60 text-sm">Test reminders, invoices, reports</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifications.email}
                onChange={(e) => setNotifications(prev => ({ ...prev, email: e.target.checked }))}
                className="w-5 h-5"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">💬 SMS Notifications</p>
                <p className="text-white/60 text-sm">Urgent updates and confirmations</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifications.sms}
                onChange={(e) => setNotifications(prev => ({ ...prev, sms: e.target.checked }))}
                className="w-5 h-5"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">⏰ Test Reminders</p>
                <p className="text-white/60 text-sm">Annual test due date reminders</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifications.reminders}
                onChange={(e) => setNotifications(prev => ({ ...prev, reminders: e.target.checked }))}
                className="w-5 h-5"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">📢 Tips & Updates</p>
                <p className="text-white/60 text-sm">Helpful tips and feature updates</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifications.marketing}
                onChange={(e) => setNotifications(prev => ({ ...prev, marketing: e.target.checked }))}
                className="w-5 h-5"
              />
            </div>
          </div>
        </div>

        <Button onClick={onNext} className="w-full bg-blue-700 hover:bg-blue-700">
          Complete Setup
        </Button>
      </div>
    </div>
  );
}

// Team onboarding steps
function TeamWelcomeStep({ onNext }: { onNext: () => void; onSkip?: () => void }) {
  return (
    <div className="text-center py-12">
      <Sparkles className="h-16 w-16 text-blue-400 mx-auto mb-4" />
      <h1 className="text-3xl font-bold text-white mb-4">
        Welcome to Fisher Backflows Team Portal
      </h1>
      <p className="text-white/80 text-lg max-w-lg mx-auto mb-8">
        Everything you need to manage customers, schedule tests, and track your work.
      </p>
      
      <Button onClick={onNext} size="lg" className="bg-blue-700 hover:bg-blue-700">
        Let's Get Started
      </Button>
    </div>
  );
}

function TeamProfileStep({ onNext }: { onNext: () => void; onSkip?: () => void }) {
  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <User className="h-12 w-12 text-blue-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Set Up Your Profile</h2>
        <p className="text-white/70">Complete your technician profile</p>
      </div>
      
      <div className="max-w-md mx-auto">
        <div className="glass p-6 rounded-xl">
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Certification Number"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
            />
            <input 
              type="text" 
              placeholder="Service Area"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
            />
          </div>
          <Button onClick={onNext} className="w-full mt-6 bg-blue-700 hover:bg-blue-700">
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}

function PlatformOverviewStep({ onNext }: { onNext: () => void; onSkip?: () => void }) {
  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <Calendar className="h-12 w-12 text-blue-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Platform Overview</h2>
        <p className="text-white/70">Key features you'll use every day</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
        <div className="glass-light p-4 rounded-xl">
          <Calendar className="h-8 w-8 text-blue-400 mb-3" />
          <h3 className="font-semibold text-white mb-2">Schedule Management</h3>
          <p className="text-white/60 text-sm">View and manage your daily appointments</p>
        </div>
        <div className="glass-light p-4 rounded-xl">
          <User className="h-8 w-8 text-green-400 mb-3" />
          <h3 className="font-semibold text-white mb-2">Customer Database</h3>
          <p className="text-white/60 text-sm">Access customer information and history</p>
        </div>
      </div>

      <div className="text-center">
        <Button onClick={onNext} className="bg-blue-700 hover:bg-blue-700">
          Start Using the Platform
        </Button>
      </div>
    </div>
  );
}