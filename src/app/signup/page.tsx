'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-client'

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$99/month',
    yearlyPrice: '$990/year',
    features: [
      'Up to 5 team members',
      'Up to 100 customers',
      'Up to 500 devices',
      'Unlimited test reports',
      'Email support',
      '14-day free trial'
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$299/month',
    yearlyPrice: '$2,990/year',
    popular: true,
    features: [
      'Up to 20 team members',
      'Up to 1,000 customers',
      'Up to 5,000 devices',
      'Unlimited test reports',
      'Priority support',
      'API access',
      'Advanced analytics',
      '14-day free trial'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$799/month',
    yearlyPrice: '$7,990/year',
    features: [
      'Unlimited team members',
      'Unlimited customers',
      'Unlimited devices',
      'Unlimited test reports',
      'Dedicated support',
      'API access',
      'White label options',
      'Custom integrations',
      '14-day free trial'
    ]
  }
]

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState('professional')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    companyName: '',
    companySlug: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: ''
  })

  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    setFormData({ ...formData, companyName: name, companySlug: slug })
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            company_name: formData.companyName
          }
        }
      })

      if (authError) throw authError

      // 2. Create company record
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: formData.companyName,
          slug: formData.companySlug,
          owner_id: authData.user?.id,
          subscription_plan: selectedPlan,
          subscription_status: 'trialing'
        })
        .select()
        .single()

      if (companyError) throw companyError

      // 3. Create team_user record for owner
      const { error: teamError } = await supabase
        .from('team_users')
        .insert({
          auth_user_id: authData.user?.id,
          company_id: company.id,
          role: 'owner',
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone
        })

      if (teamError) throw teamError

      // Redirect to team portal
      router.push('/team-portal')
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome to Tester Portal</h1>
          <p className="text-xl text-blue-300">The Complete Backflow Testing Management Platform</p>
        </div>

        {step === 1 ? (
          /* Step 1: Choose Plan */
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Choose Your Plan</h2>
              <div className="inline-flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-lg p-1">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-2 rounded-md transition-all ${
                    billingCycle === 'monthly' 
                      ? 'glass-btn-primary glow-blue text-white' 
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-4 py-2 rounded-md transition-all ${
                    billingCycle === 'yearly' 
                      ? 'glass-btn-primary glow-blue text-white' 
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Yearly (Save 17%)
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative bg-white/10 backdrop-blur-md rounded-xl p-6 cursor-pointer transition-all hover:scale-105 ${
                    selectedPlan === plan.id 
                      ? 'ring-2 ring-cyan-400 bg-white/20' 
                      : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-blue-400 to-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-3xl font-bold text-blue-300 mb-4">
                    {billingCycle === 'monthly' ? plan.price : plan.yearlyPrice}
                  </p>
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start text-white/80">
                        <svg className="w-5 h-5 text-blue-300 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={() => setStep(2)}
                className="glass-btn-primary glow-blue text-white px-8 py-3 rounded-lg font-semibold hover:glow-blue transition-all"
              >
                Continue with {plans.find(p => p.id === selectedPlan)?.name} Plan
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Company Information */
          <div className="max-w-md mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Create Your Company Account</h2>
              
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-white/80 mb-2">Company Name</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={handleCompanyNameChange}
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                    placeholder="ABC Backflow Testing"
                  />
                  {formData.companySlug && (
                    <p className="text-sm text-blue-300 mt-1">
                      Your URL: tester-portal.com/{formData.companySlug}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/80 mb-2">First Name</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 mb-2">Last Name</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                    placeholder="admin@company.com"
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2">Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 px-6 py-3 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 glass-btn-primary glow-blue text-white px-6 py-3 rounded-lg font-semibold hover:glow-blue transition-all disabled:opacity-50"
                  >
                    {loading ? 'Creating Account...' : 'Start Free Trial'}
                  </button>
                </div>
              </form>

              <p className="text-center text-white/60 text-sm mt-6">
                Already have an account?{' '}
                <Link href="/team-portal/login" className="text-blue-300 hover:text-white/80">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}