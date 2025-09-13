'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  Users,
  MapPin,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Eye,
  Edit,
  MoreVertical,
  Phone
} from 'lucide-react'

interface Appointment {
  id: string
  customer_name: string
  customer_id: string
  device_info: string
  scheduled_date: string
  scheduled_time: string
  service_type: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'high' | 'medium' | 'low'
  location: string
  phone: string
  estimated_duration: number
  notes?: string
}

export default function TesterPortalSchedulePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('today')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchAppointments()
  }, [])

  useEffect(() => {
    filterAppointments()
  }, [searchTerm, statusFilter, dateFilter, selectedDate, appointments])

  const fetchAppointments = async () => {
    try {
      // Mock data - will be replaced with real API
      const mockAppointments: Appointment[] = [
        {
          id: '1',
          customer_name: 'ABC Manufacturing',
          customer_id: '1',
          device_info: 'Febco 860 - 3/4" Double Check',
          scheduled_date: '2025-01-13',
          scheduled_time: '09:00',
          service_type: 'Annual Test',
          status: 'scheduled',
          priority: 'high',
          location: 'Main Building - Basement',
          phone: '(555) 123-4567',
          estimated_duration: 60,
          notes: 'Customer prefers morning appointments'
        },
        {
          id: '2',
          customer_name: 'Green Valley School',
          customer_id: '2',
          device_info: 'Watts 909 - 1" RPZ',
          scheduled_date: '2025-01-13',
          scheduled_time: '14:30',
          service_type: 'Repair Service',
          status: 'scheduled',
          priority: 'high',
          location: 'Cafeteria Kitchen',
          phone: '(555) 987-6543',
          estimated_duration: 90,
          notes: 'Device failed last test - needs repair'
        },
        {
          id: '3',
          customer_name: 'Metro Apartments',
          customer_id: '3',
          device_info: 'Zurn Wilkins 350XL - 2" Double Check',
          scheduled_date: '2025-01-14',
          scheduled_time: '10:00',
          service_type: 'Annual Test',
          status: 'scheduled',
          priority: 'medium',
          location: 'Building A - Mechanical Room',
          phone: '(555) 456-7890',
          estimated_duration: 60
        },
        {
          id: '4',
          customer_name: 'Downtown Plaza',
          customer_id: '4',
          device_info: 'Apollo 4A-206 - 1.5" RPZ',
          scheduled_date: '2025-01-12',
          scheduled_time: '11:00',
          service_type: 'Annual Test',
          status: 'completed',
          priority: 'low',
          location: 'Main Building - Basement',
          phone: '(555) 234-5678',
          estimated_duration: 75,
          notes: 'Test completed - device passed'
        }
      ]

      setAppointments(mockAppointments)
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAppointments = () => {
    let filtered = appointments

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(appointment =>
        appointment.customer_name.toLowerCase().includes(term) ||
        appointment.device_info.toLowerCase().includes(term) ||
        appointment.location.toLowerCase().includes(term) ||
        appointment.phone.includes(term)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === statusFilter)
    }

    // Date filtering
    if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0]
      filtered = filtered.filter(appointment => appointment.scheduled_date === today)
    } else if (dateFilter === 'week') {
      const today = new Date()
      const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(appointment => {
        const appointmentDate = new Date(appointment.scheduled_date)
        return appointmentDate >= today && appointmentDate <= weekEnd
      })
    } else if (dateFilter === 'custom' && selectedDate) {
      filtered = filtered.filter(appointment => appointment.scheduled_date === selectedDate)
    }

    // Sort by date and time
    filtered.sort((a, b) => {
      const dateTimeA = new Date(`${a.scheduled_date}T${a.scheduled_time}`)
      const dateTimeB = new Date(`${b.scheduled_date}T${b.scheduled_time}`)
      return dateTimeA.getTime() - dateTimeB.getTime()
    })

    setFilteredAppointments(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-blue-400 bg-blue-400/20'
      case 'in_progress': return 'text-yellow-400 bg-yellow-400/20'
      case 'completed': return 'text-green-400 bg-green-400/20'
      case 'cancelled': return 'text-red-400 bg-red-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-400/20'
      case 'medium': return 'text-yellow-400 bg-yellow-400/20'
      case 'low': return 'text-green-400 bg-green-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4" />
      case 'in_progress': return <AlertTriangle className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'cancelled': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-white/80">Loading schedule...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900">
      {/* Header */}
      <header className="border-b border-cyan-400/20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/tester-portal/dashboard/crm" className="text-cyan-400 hover:text-white">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div className="flex items-center space-x-3">
                <Calendar className="h-8 w-8 text-cyan-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Schedule Management</h1>
                  <p className="text-cyan-400">{filteredAppointments.length} appointments</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/tester-portal/schedule/new"
                className="bg-cyan-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-cyan-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Appointment</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="mb-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-cyan-400/20">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cyan-400" />
              <input
                type="text"
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-cyan-400/30 rounded-lg text-white placeholder-cyan-300 focus:outline-none focus:border-cyan-400"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cyan-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="all" className="bg-slate-800">All Status</option>
                <option value="scheduled" className="bg-slate-800">Scheduled</option>
                <option value="in_progress" className="bg-slate-800">In Progress</option>
                <option value="completed" className="bg-slate-800">Completed</option>
                <option value="cancelled" className="bg-slate-800">Cancelled</option>
              </select>
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cyan-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="today" className="bg-slate-800">Today</option>
                <option value="week" className="bg-slate-800">This Week</option>
                <option value="all" className="bg-slate-800">All Dates</option>
                <option value="custom" className="bg-slate-800">Custom Date</option>
              </select>
            </div>

            {dateFilter === 'custom' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
              />
            )}

            {dateFilter !== 'custom' && (
              <div className="flex items-center text-white/80">
                <Calendar className="h-5 w-5 text-cyan-400 mr-2" />
                <span className="text-sm">Total: {filteredAppointments.length} appointments</span>
              </div>
            )}
          </div>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => (
            <div 
              key={appointment.id}
              className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6 hover:bg-white/15 transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {getStatusIcon(appointment.status)}
                        <span className="capitalize">{appointment.status.replace('_', ' ')}</span>
                      </div>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(appointment.priority)}`}>
                        <span className="capitalize">{appointment.priority}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{appointment.customer_name}</h3>
                        <p className="text-cyan-300 text-sm">{appointment.service_type}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center text-white/80 text-sm">
                          <Calendar className="h-4 w-4 mr-2 flex-shrink-0 text-cyan-400" />
                          <span>{new Date(appointment.scheduled_date).toLocaleDateString()} at {formatTime(appointment.scheduled_time)}</span>
                        </div>
                        <div className="flex items-center text-white/80 text-sm">
                          <Clock className="h-4 w-4 mr-2 flex-shrink-0 text-cyan-400" />
                          <span>{appointment.estimated_duration} minutes estimated</span>
                        </div>
                        <div className="flex items-center text-white/80 text-sm">
                          <Phone className="h-4 w-4 mr-2 flex-shrink-0 text-cyan-400" />
                          <span>{appointment.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Device</p>
                        <p className="text-white text-sm">{appointment.device_info}</p>
                      </div>

                      <div>
                        <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Location</p>
                        <div className="flex items-center text-white/80 text-sm">
                          <MapPin className="h-4 w-4 mr-2 flex-shrink-0 text-cyan-400" />
                          <span>{appointment.location}</span>
                        </div>
                      </div>

                      {appointment.notes && (
                        <div>
                          <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Notes</p>
                          <p className="text-white/80 text-sm">{appointment.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <Link
                    href={`/tester-portal/customers/${appointment.customer_id}`}
                    className="p-2 bg-cyan-600/20 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-600/30 hover:text-white rounded-lg transition-all"
                    title="View Customer"
                  >
                    <Users className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/tester-portal/schedule/${appointment.id}`}
                    className="p-2 bg-blue-600/20 border border-blue-400/30 text-blue-300 hover:bg-blue-600/30 hover:text-white rounded-lg transition-all"
                    title="View Appointment"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/tester-portal/schedule/${appointment.id}/edit`}
                    className="p-2 bg-purple-600/20 border border-purple-400/30 text-purple-300 hover:bg-purple-600/30 hover:text-white rounded-lg transition-all"
                    title="Edit Appointment"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <MoreVertical className="h-4 w-4 text-white/60" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredAppointments.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-md mx-auto">
              <Calendar className="h-16 w-16 text-cyan-400/50 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Appointments Found</h3>
              <p className="text-white/80 mb-4">
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'No appointments have been scheduled yet.'
                }
              </p>
              <Link
                href="/tester-portal/schedule/new"
                className="inline-flex items-center px-4 py-2 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Schedule Appointment
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}