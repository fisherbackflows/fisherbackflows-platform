'use client'

import Link from 'next/link'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { 
  CheckCircle, 
  Code, 
  Users, 
  BarChart3, 
  Shield,
  CreditCard,
  Building,
  Mail,
  User,
  Loader2,
  AlertCircle
} from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Plan {
  id: string
  name: string
  price: number
  description: string
  features: string[]
  limits: {
    customers: number
    api_calls: number
  }
  popular?: boolean
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 99,
    description: 'Perfect for small backflow testing companies',
    features: [
      'Customer Management API',
      'Basic Scheduling',
      'Standard Support',
      'Email Support'
    ],
    limits: {
      customers: 500,
      api_calls: 10000
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 299,
    description: 'Best for growing businesses',
    features: [
      'Everything in Starter',
      'Advanced Scheduling & Routing',
      'Compliance Automation',
      'Priority Support',
      'Phone Support'
    ],
    limits: {
      customers: 2000,
      api_calls: 50000
    },
    popular: true
  }
]

function SignupForm() {
  const stripe = useStripe()
  const elements = useElements()
  const searchParams = useSearchParams()
  
  const [selectedPlan, setSelectedPlan] = useState<string>(searchParams.get('plan') || 'professional')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    company_name: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    website: '',
    how_did_you_hear: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const validateStep1 = () => {
    const required = ['company_name', 'first_name', 'last_name', 'email']
    return required.every(field => formData[field as keyof typeof formData].trim() !== '')
  }

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError('')

    try {
      // Create payment method
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error('Card element not found')

      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: `${formData.first_name} ${formData.last_name}`,
          email: formData.email
        }
      })

      if (pmError) {
        throw new Error(pmError.message)
      }

      // Create subscription
      const response = await fetch('/api/tester-portal/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          plan: selectedPlan,
          payment_method_id: paymentMethod.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed')
      }

      // Handle 3D Secure if needed
      if (data.client_secret) {
        const { error: confirmError } = await stripe.confirmCardPayment(data.client_secret)
        if (confirmError) {
          throw new Error(confirmError.message)
        }
      }

      setSuccess(true)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white/5 backdrop-blur-sm border border-green-400/30 rounded-xl p-8">
            <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4">Welcome to Tester Portal!</h1>
            <p className="text-green-300 mb-6">
              Your account has been created successfully. You're now on a 14-day free trial.
            </p>
            <div className="space-y-3">
              <Link href="/tester-portal/dashboard"
                className="block w-full px-6 py-3 glass-btn-primary glow-blue text-white rounded-lg font-semibold hover:glow-blue transition-all"
              >
                Go to Dashboard
              </Link>
              <Link href="/tester-portal/docs"
                className="block w-full px-6 py-3 bg-white/10 border border-white/30 text-white rounded-lg font-semibold hover:bg-white/20 transition-all"
              >
                View API Documentation
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-blue-400/20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Code className="h-8 w-8 text-blue-300" />
              <div>
                <h1 className="text-2xl font-bold text-white">Tester Portal API</h1>
                <p className="text-blue-300">Get Started</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/tester-portal"
                className="text-blue-300 hover:text-white transition-colors"
              >
                Back to Home
              </Link>
              <Link href="/tester-portal/docs"
                className="text-blue-300 hover:text-white transition-colors"
              >
                Documentation
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 1 ? 'glass-btn-primary glow-blue text-white' : 'bg-white/20 text-blue-300'
            }`}>
              1
            </div>
            <div className={`w-12 h-0.5 ${step >= 2 ? 'glass-btn-primary glow-blue' : 'bg-white/20'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 2 ? 'glass-btn-primary glow-blue text-white' : 'bg-white/20 text-blue-300'
            }`}>
              2
            </div>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-8">
            {/* Plan Selection */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Choose Your Plan</h2>
              <p className="text-white/80">Start with a 14-day free trial. No credit card required for trial.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-8">
              {plans.map((plan) => (
                <div 
                  key={plan.id}
                  className={`relative bg-white/5 backdrop-blur-sm border rounded-xl p-6 cursor-pointer transition-all ${
                    selectedPlan === plan.id 
                      ? 'border-blue-400 ring-2 ring-cyan-400/50' 
                      : 'border-blue-400/20 hover:border-blue-400/40'
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="glass-btn-primary glow-blue text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="text-4xl font-bold text-blue-300 mb-2">
                      ${plan.price}<span className="text-lg text-blue-300">/mo</span>
                    </div>
                    <p className="text-white/80">{plan.description}</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="text-sm text-blue-300">
                      <strong>Includes:</strong>
                    </div>
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-white/80">
                        <CheckCircle className="h-4 w-4 mr-3 text-green-400 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-blue-400/20 pt-4">
                    <div className="text-sm text-blue-300 space-y-1">
                      <div>Up to {plan.limits.customers.toLocaleString()} customers</div>
                      <div>{plan.limits.api_calls.toLocaleString()} API calls/month</div>
                    </div>
                  </div>

                  {selectedPlan === plan.id && (
                    <div className="absolute top-4 right-4">
                      <div className="w-6 h-6 glass-btn-primary glow-blue rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Company Information Form */}
            <div className="glass border border-blue-400 glow-blue-sm rounded-xl p-8 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-white mb-6">Company Information</h3>
              
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Company Name *
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
                      <input
                        type="text"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-blue-400/30 rounded-lg text-white placeholder-cyan-300 focus:outline-none focus:border-blue-400"
                        placeholder="Your Company Name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-blue-400/30 rounded-lg text-white placeholder-cyan-300 focus:outline-none focus:border-blue-400"
                      placeholder="https://yourcompany.com"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      First Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-blue-400/30 rounded-lg text-white placeholder-cyan-300 focus:outline-none focus:border-blue-400"
                        placeholder="John"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-blue-400/30 rounded-lg text-white placeholder-cyan-300 focus:outline-none focus:border-blue-400"
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-blue-400/30 rounded-lg text-white placeholder-cyan-300 focus:outline-none focus:border-blue-400"
                        placeholder="john@company.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-blue-400/30 rounded-lg text-white placeholder-cyan-300 focus:outline-none focus:border-blue-400"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    How did you hear about us?
                  </label>
                  <select
                    name="how_did_you_hear"
                    value={formData.how_did_you_hear}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-blue-400/30 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="">Select an option</option>
                    <option value="google">Google Search</option>
                    <option value="referral">Referral</option>
                    <option value="social">Social Media</option>
                    <option value="industry_event">Industry Event</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!validateStep1()}
                  className="w-full glass-btn-primary glow-blue text-white py-3 rounded-lg font-semibold hover:glow-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Payment
                </button>
              </form>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Payment Information</h2>
              <p className="text-white/80">
                Start your 14-day free trial. You won't be charged until the trial ends.
              </p>
            </div>

            <div className="glass border border-blue-400 glow-blue-sm rounded-xl p-8">
              {/* Selected Plan Summary */}
              <div className="mb-8 p-4 glass-btn-primary glow-blue/20 border border-blue-400/30 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-lg font-semibold text-white">
                      {plans.find(p => p.id === selectedPlan)?.name} Plan
                    </h4>
                    <p className="text-blue-300">14-day free trial, then ${plans.find(p => p.id === selectedPlan)?.price}/month</p>
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    className="text-blue-300 hover:text-blue-300 text-sm underline"
                  >
                    Change Plan
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Payment Method
                  </label>
                  <div className="p-4 bg-white/10 border border-blue-400/30 rounded-lg">
                    <CardElement
                      options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: '#ffffff',
                            '::placeholder': {
                              color: '#a3f3ff',
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4 flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-blue-300 text-sm">
                    Your payment information is secure and encrypted. You can cancel anytime during your trial.
                  </p>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-white/10 text-white py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={!stripe || loading}
                    className="flex-1 glass-btn-primary glow-blue text-white py-3 rounded-lg font-semibold hover:glow-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Start Free Trial'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function BackflowBuddySignup() {
  return (
    <Elements stripe={stripePromise}>
      <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><div className="text-lg">Loading...</div></div>}>
        <SignupForm />
      </Suspense>
    </Elements>
  )
}