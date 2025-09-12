'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import BrandedPortalLayout from '@/components/portal/BrandedPortalLayout'
import { useCompanyBrandingBySlug } from '@/hooks/useCompanyBranding'
import { 
  Calendar,
  FileText,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Mail
} from 'lucide-react'

interface CustomerData {
  id: string
  name: string
  email: string
  next_test_date?: string
  status: string
}

interface DashboardData {
  customer: CustomerData | null
  upcomingAppointments: Array<{
    id: string
    scheduled_date: string
    time_slot: string
    service_type: string
    status: string
  }>
  recentReports: Array<{
    id: string
    test_date: string
    result: string
    device_location: string
  }>
  pendingInvoices: Array<{
    id: string
    amount: number
    due_date: string
    description: string
  }>
}

export default function CompanyDashboardPage() {
  const params = useParams()
  const slug = params.slug as string
  const { branding } = useCompanyBrandingBySlug(slug)
  
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    customer: null,
    upcomingAppointments: [],
    recentReports: [],
    pendingInvoices: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [slug])

  const fetchDashboardData = async () => {
    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('customerToken')
      if (!token) {
        throw new Error('Authentication required')
      }
      
      const response = await fetch(`/api/portal/company/${slug}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          // Clear invalid token and redirect to login
          localStorage.removeItem('customerToken')
          window.location.href = `/portal/company/${slug}`
          return
        }
        throw new Error('Failed to fetch dashboard data')
      }
      
      const data = await response.json()
      setDashboardData(data)
    } catch (err: any) {
      setError(err.message)
      // If authentication error, redirect to login
      if (err.message.includes('Authentication') || err.message.includes('token')) {
        localStorage.removeItem('customerToken')
        window.location.href = `/portal/company/${slug}`
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <BrandedPortalLayout showNavigation={false}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
            <p className="mt-4 text-white/80">Loading your dashboard...</p>
          </div>
        </div>
      </BrandedPortalLayout>
    )
  }

  return (
    <BrandedPortalLayout currentPath="/dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold custom-text mb-2">
            Welcome{dashboardData.customer ? `, ${dashboardData.customer.name.split(' ')[0]}` : ''}!
          </h1>
          <p className="custom-text-muted">
            Manage your backflow testing services with {branding?.company_name || 'your service provider'}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Next Test Date */}
          <div className="custom-glass-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: (branding?.primary_color || '#0ea5e9') + '20' }}
              >
                <Calendar className="h-6 w-6" style={{ color: branding?.primary_color || '#0ea5e9' }} />
              </div>
              {dashboardData.customer?.next_test_date && (
                <span className="text-sm custom-text-muted">
                  {new Date(dashboardData.customer.next_test_date) > new Date() ? 'Upcoming' : 'Overdue'}
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold custom-text mb-1">Next Test Due</h3>
            {dashboardData.customer?.next_test_date ? (
              <p className="text-2xl font-bold" style={{ color: branding?.primary_color || '#0ea5e9' }}>
                {new Date(dashboardData.customer.next_test_date).toLocaleDateString()}
              </p>
            ) : (
              <p className="custom-text-muted">No test scheduled</p>
            )}
          </div>

          {/* Appointments */}
          <div className="custom-glass-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: (branding?.secondary_color || '#06b6d4') + '20' }}
              >
                <Clock className="h-6 w-6" style={{ color: branding?.secondary_color || '#06b6d4' }} />
              </div>
            </div>
            <h3 className="text-lg font-semibold custom-text mb-1">Upcoming Appointments</h3>
            <p className="text-2xl font-bold" style={{ color: branding?.secondary_color || '#06b6d4' }}>
              {dashboardData.upcomingAppointments.length}
            </p>
          </div>

          {/* Pending Invoices */}
          <div className="custom-glass-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: (branding?.accent_color || '#0284c7') + '20' }}
              >
                <CreditCard className="h-6 w-6" style={{ color: branding?.accent_color || '#0284c7' }} />
              </div>
              {dashboardData.pendingInvoices.length > 0 && (
                <AlertCircle className="h-5 w-5 text-orange-400" />
              )}
            </div>
            <h3 className="text-lg font-semibold custom-text mb-1">Pending Invoices</h3>
            <p className="text-2xl font-bold" style={{ color: branding?.accent_color || '#0284c7' }}>
              ${dashboardData.pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upcoming Appointments */}
          <div className="custom-glass-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold custom-text flex items-center">
                <Calendar className="h-5 w-5 mr-2" style={{ color: branding?.primary_color || '#0ea5e9' }} />
                Upcoming Appointments
              </h2>
              <button 
                className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                style={{ 
                  backgroundColor: (branding?.primary_color || '#0ea5e9') + '20',
                  color: branding?.primary_color || '#0ea5e9'
                }}
              >
                Schedule New
              </button>
            </div>
            
            {dashboardData.upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="custom-glass p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium custom-text">{appointment.service_type}</div>
                      <div className="text-sm px-2 py-1 rounded" style={{ 
                        backgroundColor: appointment.status === 'confirmed' 
                          ? (branding?.primary_color || '#0ea5e9') + '20' 
                          : '#fbbf2420',
                        color: appointment.status === 'confirmed' 
                          ? branding?.primary_color || '#0ea5e9' 
                          : '#fbbf24'
                      }}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </div>
                    </div>
                    <div className="flex items-center custom-text-muted text-sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(appointment.scheduled_date).toLocaleDateString()} at {appointment.time_slot}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 custom-text-muted mx-auto mb-4" />
                <p className="custom-text-muted mb-4">No upcoming appointments</p>
                <button 
                  className="px-6 py-2 rounded-lg font-semibold text-white transition-colors"
                  style={{ backgroundColor: branding?.primary_color || '#0ea5e9' }}
                >
                  Schedule Your First Test
                </button>
              </div>
            )}
          </div>

          {/* Recent Test Reports */}
          <div className="custom-glass-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold custom-text flex items-center">
                <FileText className="h-5 w-5 mr-2" style={{ color: branding?.secondary_color || '#06b6d4' }} />
                Recent Test Reports
              </h2>
              <button 
                className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                style={{ 
                  backgroundColor: (branding?.secondary_color || '#06b6d4') + '20',
                  color: branding?.secondary_color || '#06b6d4'
                }}
              >
                View All
              </button>
            </div>
            
            {dashboardData.recentReports.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recentReports.map((report) => (
                  <div key={report.id} className="custom-glass p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium custom-text">{report.device_location}</div>
                      <div className="flex items-center">
                        {report.result === 'Passed' ? (
                          <CheckCircle className="h-4 w-4 text-green-400 mr-1" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-400 mr-1" />
                        )}
                        <span className={`text-sm ${
                          report.result === 'Passed' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {report.result}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center custom-text-muted text-sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      Tested on {new Date(report.test_date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 custom-text-muted mx-auto mb-4" />
                <p className="custom-text-muted">No test reports available</p>
                <p className="custom-text-muted text-sm mt-2">
                  Reports will appear here after your first test
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pending Invoices */}
        {dashboardData.pendingInvoices.length > 0 && (
          <div className="mt-8 custom-glass-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold custom-text flex items-center">
                <CreditCard className="h-5 w-5 mr-2" style={{ color: branding?.accent_color || '#0284c7' }} />
                Pending Invoices
              </h2>
              <button 
                className="text-sm font-medium px-4 py-2 rounded-lg text-white transition-colors"
                style={{ backgroundColor: branding?.accent_color || '#0284c7' }}
              >
                Pay All
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {dashboardData.pendingInvoices.map((invoice) => (
                <div key={invoice.id} className="custom-glass p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium custom-text">{invoice.description}</div>
                    <div className="text-lg font-bold" style={{ color: branding?.accent_color || '#0284c7' }}>
                      ${invoice.amount.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="custom-text-muted text-sm">
                      Due: {new Date(invoice.due_date).toLocaleDateString()}
                    </div>
                    <button 
                      className="text-sm px-3 py-1 rounded font-medium text-white"
                      style={{ backgroundColor: branding?.accent_color || '#0284c7' }}
                    >
                      Pay Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Information */}
        {(branding?.contact_phone || branding?.contact_email) && (
          <div className="mt-8 custom-glass-border rounded-xl p-6">
            <h2 className="text-xl font-semibold custom-text mb-4">Need Help?</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {branding.contact_phone && (
                <a 
                  href={`tel:${branding.contact_phone.replace(/\D/g, '')}`}
                  className="flex items-center p-4 custom-glass rounded-lg hover:scale-105 transition-all"
                >
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center mr-4"
                    style={{ backgroundColor: (branding.primary_color || '#0ea5e9') + '20' }}
                  >
                    <Phone className="h-6 w-6" style={{ color: branding.primary_color || '#0ea5e9' }} />
                  </div>
                  <div>
                    <div className="font-medium custom-text">Call Us</div>
                    <div className="custom-text-muted text-sm">{branding.contact_phone}</div>
                  </div>
                </a>
              )}
              
              {branding.contact_email && (
                <a 
                  href={`mailto:${branding.contact_email}`}
                  className="flex items-center p-4 custom-glass rounded-lg hover:scale-105 transition-all"
                >
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center mr-4"
                    style={{ backgroundColor: (branding.secondary_color || '#06b6d4') + '20' }}
                  >
                    <Mail className="h-6 w-6" style={{ color: branding.secondary_color || '#06b6d4' }} />
                  </div>
                  <div>
                    <div className="font-medium custom-text">Email Us</div>
                    <div className="custom-text-muted text-sm">{branding.contact_email}</div>
                  </div>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </BrandedPortalLayout>
  )
}