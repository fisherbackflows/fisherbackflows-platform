'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Clock, MapPin, Phone, Plus, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface UserPermissions {
  isOwner: boolean
  subscriptions: string[]
  userInfo: any
}

interface Appointment {
  id: string
  customerId: string
  customerName: string
  customerPhone: string
  address: string
  city: string
  date: string
  time: string
  duration: number
  type: 'test' | 'repair' | 'installation' | 'consultation'
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'
  notes: string
  deviceCount: number
  estimatedCost: number
  priority: 'low' | 'medium' | 'high'
}

const appointmentTypes = {
  test: { label: 'Test', color: 'bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 border border-blue-400 text-blue-300', icon: '🔍' },
  repair: { label: 'Repair', color: 'bg-gradient-to-r from-orange-600/80 to-orange-500/80 backdrop-blur-xl/20 border border-orange-400 text-orange-300', icon: '🔧' },
  installation: { label: 'Install', color: 'bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/20 border border-green-400 text-green-300', icon: '⚙️' },
  consultation: { label: 'Consult', color: 'bg-gradient-to-r from-purple-600/80 to-purple-500/80 backdrop-blur-xl/20 border border-purple-400 text-purple-300', icon: '💬' }
}

const statusConfig = {
  scheduled: { label: 'Scheduled', color: 'bg-slate-100 text-slate-800 border-slate-200' },
  confirmed: { label: 'Confirmed', color: 'bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 border border-blue-400 text-blue-300' },
  'in-progress': { label: 'In Progress', color: 'bg-gradient-to-r from-yellow-600/80 to-yellow-500/80 backdrop-blur-xl/20 border border-yellow-400 text-yellow-300' },
  completed: { label: 'Completed', color: 'bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/20 border border-green-400 text-green-300' },
  cancelled: { label: 'Cancelled', color: 'bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl/20 border border-red-400 text-red-300' },
  'no-show': { label: 'No Show', color: 'bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl/20 border border-red-400 text-red-300' }
}

export default function SchedulePage() {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day')
  const [statusFilter, setStatusFilter] = useState<string>('active')

  useEffect(() => {
    fetchPermissions()
  }, [])

  useEffect(() => {
    if (permissions && hasAccess('scheduling')) {
      loadAppointments()
    }
  }, [permissions, selectedDate])

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/tester-portal/permissions')
      if (response.ok) {
        const data = await response.json()
        setPermissions(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAppointments = async () => {
    try {
      const response = await fetch('/api/tester-portal/schedule')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.appointments) {
          setAppointments(data.appointments)
        }
      }
    } catch (error) {
      console.error('Failed to load appointments:', error)
    }
  }

  const hasAccess = (feature: string) => {
    if (!permissions) return false
    return permissions.isOwner || permissions.subscriptions.includes(feature)
  }

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return appointments.filter(apt => {
      const matchesDate = apt.date === dateStr
      const matchesFilter = statusFilter === 'all' || 
        (statusFilter === 'active' && ['scheduled', 'confirmed', 'in-progress'].includes(apt.status)) ||
        apt.status === statusFilter
      
      return matchesDate && matchesFilter
    }).sort((a, b) => a.time.localeCompare(b.time))
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    if (viewMode === 'day') {
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1))
    } else if (viewMode === 'week') {
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7))
    } else {
      newDate.setMonth(selectedDate.getMonth() + (direction === 'next' ? 1 : -1))
    }
    setSelectedDate(newDate)
  }

  const getDateTitle = () => {
    const today = new Date()
    const isToday = selectedDate.toDateString() === today.toDateString()
    
    if (viewMode === 'day') {
      return isToday ? 'Today' : selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      })
    }
    
    return selectedDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    })
  }

  const updateAppointmentStatus = async (appointmentId: string, newStatus: Appointment['status']) => {
    try {
      const response = await fetch(`/api/tester-portal/schedule/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        setAppointments(prev => prev.map(apt => 
          apt.id === appointmentId ? { ...apt, status: newStatus } : apt
        ))
      }
    } catch (error) {
      console.error('Failed to update appointment status:', error)
    }
  }

  if (!hasAccess('scheduling') && !permissions?.isOwner) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
            <Calendar className="h-8 w-8 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Schedule Management</h2>
          <p className="text-white/80 mb-6">
            This feature requires a scheduling subscription to manage appointments and view your schedule.
          </p>
          <div className="space-y-3">
            <Link
              href="/tester-portal/upgrade"
              className="block glass-btn-primary glow-blue text-white px-6 py-3 rounded-lg font-semibold hover:glow-blue transition-all"
            >
              Upgrade to Access
            </Link>
            <Link
              href="/tester-portal/dashboard"
              className="block text-blue-300 hover:text-white transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-4 text-white/80">Loading schedule...</p>
        </div>
      </div>
    )
  }

  const dayAppointments = getAppointmentsForDate(selectedDate)

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-blue-400/20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <Calendar className="h-8 w-8 text-blue-300 mr-3" />
                Schedule Management
                {permissions?.isOwner && (
                  <span className="ml-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    OWNER ACCESS
                  </span>
                )}
              </h1>
              <p className="text-white/80 mt-2">Manage appointments and scheduling</p>
            </div>
            <Link
              href="/tester-portal/schedule/new"
              className="glass-btn-primary glow-blue text-white px-6 py-3 rounded-lg font-semibold hover:glow-blue transition-all"
            >
              <Plus className="h-5 w-5 inline mr-2" />
              New Appointment
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Navigation */}
        <div className="bg-black/40 backdrop-blur-sm border border-blue-400/20 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 bg-blue-500/20 border border-blue-400 glow-blue-sm hover:glow-blue/30 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-blue-300" />
              </button>
              <div className="text-xl font-bold text-white min-w-[200px] text-center">
                {getDateTitle()}
              </div>
              <button
                onClick={() => navigateDate('next')}
                className="p-2 bg-blue-500/20 border border-blue-400 glow-blue-sm hover:glow-blue/30 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-blue-300" />
              </button>
              <button
                onClick={() => setSelectedDate(new Date())}
                className="px-4 py-2 glass-btn-primary glow-blue text-white rounded-lg font-semibold hover:glow-blue transition-all"
              >
                Today
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-black/40 backdrop-blur-sm border border-blue-400/20 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Filter Appointments</h3>
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'active', label: 'Active', count: appointments.filter(a => ['scheduled', 'confirmed', 'in-progress'].includes(a.status)).length },
              { key: 'all', label: 'All', count: appointments.length },
              { key: 'scheduled', label: 'Scheduled', count: appointments.filter(a => a.status === 'scheduled').length },
              { key: 'confirmed', label: 'Confirmed', count: appointments.filter(a => a.status === 'confirmed').length },
              { key: 'completed', label: 'Completed', count: appointments.filter(a => a.status === 'completed').length }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setStatusFilter(filter.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === filter.key
                    ? 'glass-btn-primary glow-blue text-white'
                    : 'bg-blue-500/20 border border-blue-400 glow-blue-sm text-blue-300 hover:glow-blue/30'
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>

        {/* Appointments List */}
        <div className="space-y-6">
          {dayAppointments.length > 0 ? (
            dayAppointments.map((appointment) => (
              <div key={appointment.id} className="bg-black/40 backdrop-blur-sm border border-blue-400/20 rounded-xl p-6 hover:bg-black/50 transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="glass-btn-primary glow-blue rounded-xl px-4 py-3 text-center">
                      <div className="text-white font-bold text-xl">
                        {formatTime(appointment.time)}
                      </div>
                      <div className="text-white/80 text-sm">
                        {formatDuration(appointment.duration)}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold ${appointmentTypes[appointment.type].color}`}>
                        <span className="mr-2">{appointmentTypes[appointment.type].icon}</span>
                        {appointmentTypes[appointment.type].label}
                      </span>
                      <span className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold ${statusConfig[appointment.status].color}`}>
                        {statusConfig[appointment.status].label}
                      </span>
                      {appointment.priority === 'high' && (
                        <span className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-red-600/80 to-red-500/80 border border-red-400 text-red-300">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          High Priority
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-400">
                      ${appointment.estimatedCost}
                    </div>
                    <div className="text-sm text-blue-300">
                      Estimated
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-white text-2xl mb-3">
                      {appointment.customerName}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <MapPin className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{appointment.address}</p>
                          <p className="text-white/80 text-sm">{appointment.city}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <Phone className="h-5 w-5 text-green-400" />
                        </div>
                        <div>
                          <a href={`tel:${appointment.customerPhone}`} className="font-semibold text-white hover:text-blue-300 transition-colors">
                            {appointment.customerPhone}
                          </a>
                          <p className="text-white/80 text-sm">Customer Phone</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-black/20 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {appointment.deviceCount}
                      </div>
                      <div className="text-sm text-blue-300">
                        Device{appointment.deviceCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="h-8 w-px bg-cyan-400/20"></div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-white">
                        {formatDuration(appointment.duration)}
                      </div>
                      <div className="text-sm text-blue-300">
                        Duration
                      </div>
                    </div>
                  </div>

                  {appointment.notes && (
                    <div className="bg-amber-500/20 border border-amber-400/30 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-amber-400 mb-2">Special Notes:</h4>
                      <p className="text-amber-200 text-sm">{appointment.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-blue-400/20">
                    <div className="flex flex-wrap gap-2">
                      {appointment.status === 'scheduled' && (
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all"
                        >
                          <CheckCircle className="h-4 w-4 inline mr-2" />
                          Confirm
                        </button>
                      )}
                      {appointment.status === 'confirmed' && (
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'in-progress')}
                          className="glass-btn-primary glow-blue text-white px-4 py-2 rounded-xl font-semibold transition-all"
                        >
                          <Clock className="h-4 w-4 inline mr-2" />
                          Start Service
                        </button>
                      )}
                      {appointment.status === 'in-progress' && (
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all"
                        >
                          <CheckCircle className="h-4 w-4 inline mr-2" />
                          Complete
                        </button>
                      )}
                    </div>
                    
                    <div className="flex gap-2 sm:ml-auto">
                      <a
                        href={`tel:${appointment.customerPhone}`}
                        className="bg-blue-500/20 border border-blue-400 glow-blue-sm text-blue-300 px-4 py-2 rounded-lg font-semibold hover:glow-blue/30 transition-all"
                      >
                        <Phone className="h-4 w-4 inline mr-2" />
                        Call
                      </a>
                      <Link
                        href={`/tester-portal/reports?customer=${appointment.customerId}`}
                        className="bg-purple-500/20 text-purple-400 px-4 py-2 rounded-lg font-semibold hover:bg-purple-500/30 transition-all"
                      >
                        <Edit className="h-4 w-4 inline mr-2" />
                        Start Test
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-black/40 backdrop-blur-sm border border-blue-400/20 rounded-xl p-12 text-center">
              <Calendar className="h-16 w-16 text-blue-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">
                No appointments found
              </h3>
              <p className="text-white/80 text-lg mb-6">
                {statusFilter === 'all' ? 'No appointments scheduled' : `No ${statusFilter} appointments`} for {getDateTitle().toLowerCase()}
              </p>
              <Link
                href="/tester-portal/schedule/new"
                className="glass-btn-primary glow-blue text-white px-8 py-3 rounded-lg font-semibold hover:glow-blue transition-all"
              >
                <Plus className="h-5 w-5 inline mr-2" />
                Schedule New Appointment
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}