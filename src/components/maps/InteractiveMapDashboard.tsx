'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  MapPin, 
  Navigation, 
  Clock, 
  User, 
  Truck,
  AlertTriangle,
  CheckCircle,
  Settings,
  Filter,
  RefreshCw,
  Maximize2,
  Minimize2,
  Phone,
  MessageCircle,
  Route,
  Activity,
  Zap,
  Eye
} from 'lucide-react'

interface Location {
  latitude: number
  longitude: number
  address: string
}

interface Appointment {
  id: string
  customerId: string
  customerName: string
  customerPhone: string
  location: Location
  scheduledTime: string
  estimatedDuration: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  technicianId: string
  serviceType: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
}

interface Technician {
  id: string
  name: string
  phone: string
  currentLocation: Location
  status: 'available' | 'on_route' | 'at_appointment' | 'unavailable'
  todayAppointments: Appointment[]
  efficiency: number
  lastUpdate: string
}

interface MapFilters {
  showAppointments: boolean
  showTechnicians: boolean
  showRoutes: boolean
  showTraffic: boolean
  appointmentStatus: string[]
  technicianStatus: string[]
  timeRange: string
}

interface InteractiveMapDashboardProps {
  className?: string
  initialCenter?: Location
  height?: string
  enableRealTimeTracking?: boolean
  showControls?: boolean
}

export default function InteractiveMapDashboard({
  className = '',
  initialCenter = { latitude: 32.7767, longitude: -96.7970, address: 'Dallas, TX' }, // Dallas center
  height = '600px',
  enableRealTimeTracking = true,
  showControls = true
}: InteractiveMapDashboardProps) {
  // State management
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null)
  const [mapCenter, setMapCenter] = useState(initialCenter)
  const [mapZoom, setMapZoom] = useState(10)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(true)
  
  // Filters and view options
  const [filters, setFilters] = useState<MapFilters>({
    showAppointments: true,
    showTechnicians: true,
    showRoutes: true,
    showTraffic: false,
    appointmentStatus: ['scheduled', 'in_progress'],
    technicianStatus: ['available', 'on_route', 'at_appointment'],
    timeRange: 'today'
  })

  // Real-time tracking
  const [trackingEnabled, setTrackingEnabled] = useState(enableRealTimeTracking)
  const updateIntervalRef = useRef<NodeJS.Timeout>()
  const mapRef = useRef<HTMLDivElement>(null)

  // Load initial data
  useEffect(() => {
    loadMapData()
    
    if (trackingEnabled) {
      startRealTimeTracking()
    }
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
    }
  }, [trackingEnabled])

  // Data loading functions
  const loadMapData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Simulate API calls - in production, these would be real API endpoints
      const [appointmentsData, techniciansData] = await Promise.all([
        loadAppointments(),
        loadTechnicians()
      ])
      
      setAppointments(appointmentsData)
      setTechnicians(techniciansData)
    } catch (error) {
      console.error('Error loading map data:', error)
    } finally {
      setIsLoading(false)
      setLastUpdate(new Date())
    }
  }, [])

  const loadAppointments = async (): Promise<Appointment[]> => {
    // Simulate appointment data
    return [
      {
        id: 'appt_001',
        customerId: 'cust_001',
        customerName: 'Dallas Medical Center',
        customerPhone: '(214) 555-0123',
        location: { 
          latitude: 32.7851, 
          longitude: -96.8067, 
          address: '1501 N Washington Ave, Dallas, TX 75204' 
        },
        scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        estimatedDuration: 90,
        status: 'scheduled',
        technicianId: 'tech_001',
        serviceType: 'Annual Test',
        priority: 'high'
      },
      {
        id: 'appt_002',
        customerId: 'cust_002',
        customerName: 'Richardson Office Complex',
        customerPhone: '(972) 555-0456',
        location: { 
          latitude: 32.9484, 
          longitude: -96.7297, 
          address: '411 W Arapaho Rd, Richardson, TX 75080' 
        },
        scheduledTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        estimatedDuration: 60,
        status: 'scheduled',
        technicianId: 'tech_001',
        serviceType: 'Repair & Retest',
        priority: 'normal'
      },
      {
        id: 'appt_003',
        customerId: 'cust_003',
        customerName: 'Plano Business Park',
        customerPhone: '(469) 555-0789',
        location: { 
          latitude: 33.0198, 
          longitude: -96.6989, 
          address: '5700 W Plano Pkwy, Plano, TX 75093' 
        },
        scheduledTime: new Date().toISOString(),
        estimatedDuration: 75,
        status: 'in_progress',
        technicianId: 'tech_002',
        serviceType: 'Installation',
        priority: 'urgent'
      }
    ]
  }

  const loadTechnicians = async (): Promise<Technician[]> => {
    // Simulate technician data
    return [
      {
        id: 'tech_001',
        name: 'Mike Rodriguez',
        phone: '(214) 555-0001',
        currentLocation: { 
          latitude: 32.7767, 
          longitude: -96.7970, 
          address: 'Central Dallas' 
        },
        status: 'available',
        todayAppointments: [],
        efficiency: 0.92,
        lastUpdate: new Date().toISOString()
      },
      {
        id: 'tech_002',
        name: 'Sarah Johnson',
        phone: '(214) 555-0002',
        currentLocation: { 
          latitude: 33.0198, 
          longitude: -96.6989, 
          address: 'Plano Business Park' 
        },
        status: 'at_appointment',
        todayAppointments: [],
        efficiency: 0.88,
        lastUpdate: new Date().toISOString()
      }
    ]
  }

  // Real-time tracking
  const startRealTimeTracking = useCallback(() => {
    updateIntervalRef.current = setInterval(() => {
      updateRealTimeData()
    }, 30000) // Update every 30 seconds
  }, [])

  const updateRealTimeData = useCallback(async () => {
    try {
      // Update technician locations
      const updatedTechnicians = technicians.map(tech => {
        // Simulate small location movements
        const lat = tech.currentLocation.latitude + (Math.random() - 0.5) * 0.001
        const lng = tech.currentLocation.longitude + (Math.random() - 0.5) * 0.001
        
        return {
          ...tech,
          currentLocation: {
            ...tech.currentLocation,
            latitude: lat,
            longitude: lng
          },
          lastUpdate: new Date().toISOString()
        }
      })
      
      setTechnicians(updatedTechnicians)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error updating real-time data:', error)
    }
  }, [technicians])

  // Filter functions
  const filteredAppointments = appointments.filter(appointment => {
    if (!filters.showAppointments) return false
    if (!filters.appointmentStatus.includes(appointment.status)) return false
    return true
  })

  const filteredTechnicians = technicians.filter(technician => {
    if (!filters.showTechnicians) return false
    if (!filters.technicianStatus.includes(technician.status)) return false
    return true
  })

  // Event handlers
  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setSelectedTechnician(null)
    setMapCenter(appointment.location)
    setMapZoom(15)
  }

  const handleTechnicianClick = (technician: Technician) => {
    setSelectedTechnician(technician)
    setSelectedAppointment(null)
    setMapCenter(technician.currentLocation)
    setMapZoom(15)
  }

  const handleFilterChange = (newFilters: Partial<MapFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const refreshData = () => {
    loadMapData()
  }

  // Helper functions
  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-500',
      in_progress: 'bg-yellow-500',
      completed: 'bg-green-500',
      cancelled: 'bg-red-500',
      available: 'bg-green-500',
      on_route: 'bg-blue-500',
      at_appointment: 'bg-yellow-500',
      unavailable: 'bg-gray-500'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-400'
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'border-green-400',
      normal: 'border-blue-400',
      high: 'border-yellow-400',
      urgent: 'border-red-400'
    }
    return colors[priority as keyof typeof colors] || 'border-gray-400'
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : ''} ${className}`}>
      <div 
        className={`bg-black/30 backdrop-blur-md border border-blue-500/30 rounded-xl overflow-hidden`}
        style={{ height: isFullscreen ? '100vh' : height }}
      >
        {/* Header */}
        {showControls && (
          <div className="bg-black/40 border-b border-blue-500/30 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-400" />
                Interactive Map Dashboard
              </h3>
              
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Activity className={`w-4 h-4 ${trackingEnabled ? 'text-green-400 animate-pulse' : 'text-gray-500'}`} />
                Real-time: {trackingEnabled ? 'ON' : 'OFF'}
              </div>
              
              <div className="text-sm text-gray-400">
                Last update: {formatTime(lastUpdate.toISOString())}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Tracking Toggle */}
              <button
                onClick={() => setTrackingEnabled(!trackingEnabled)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  trackingEnabled 
                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                    : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                }`}
                title="Toggle real-time tracking"
              >
                <Zap className="w-4 h-4" />
              </button>

              {/* Refresh */}
              <button
                onClick={refreshData}
                disabled={isLoading}
                className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors duration-200 disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors duration-200"
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        <div className="flex h-full">
          {/* Map Container */}
          <div className="flex-1 relative bg-gray-900">
            {/* Simulated Map */}
            <div 
              ref={mapRef}
              className="w-full h-full relative overflow-hidden"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                  radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
                  radial-gradient(circle at 40% 80%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)
                `,
                backgroundColor: '#111827'
              }}
            >
              {/* Grid lines to simulate map */}
              <div className="absolute inset-0 opacity-20">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={`v-${i}`}
                    className="absolute h-full border-l border-gray-600/30"
                    style={{ left: `${(i * 5)}%` }}
                  />
                ))}
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={`h-${i}`}
                    className="absolute w-full border-t border-gray-600/30"
                    style={{ top: `${(i * 8.33)}%` }}
                  />
                ))}
              </div>

              {/* Map Markers */}
              {filteredAppointments.map((appointment, index) => (
                <div
                  key={appointment.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{
                    left: `${25 + (index * 20)}%`,
                    top: `${30 + (index * 15)}%`
                  }}
                  onClick={() => handleAppointmentClick(appointment)}
                >
                  <div className={`w-8 h-8 rounded-full border-2 ${getPriorityColor(appointment.priority)} ${getStatusColor(appointment.status)} flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200`}>
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  
                  {/* Appointment info popup */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black/90 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                    <div className="font-semibold">{appointment.customerName}</div>
                    <div className="text-gray-400">{formatTime(appointment.scheduledTime)}</div>
                  </div>
                </div>
              ))}

              {/* Technician Markers */}
              {filteredTechnicians.map((technician, index) => (
                <div
                  key={technician.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{
                    left: `${60 + (index * 15)}%`,
                    top: `${40 + (index * 20)}%`
                  }}
                  onClick={() => handleTechnicianClick(technician)}
                >
                  <div className={`w-10 h-10 rounded-full border-2 border-white ${getStatusColor(technician.status)} flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200`}>
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  
                  {/* Real-time pulse for tracking */}
                  {trackingEnabled && (
                    <div className="absolute inset-0 rounded-full bg-blue-400/30 animate-ping" />
                  )}
                  
                  {/* Technician info popup */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black/90 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                    <div className="font-semibold">{technician.name}</div>
                    <div className="text-gray-400 capitalize">{technician.status.replace('_', ' ')}</div>
                    <div className="text-green-400">{Math.round(technician.efficiency * 100)}% efficiency</div>
                  </div>
                </div>
              ))}

              {/* Route Lines */}
              {filters.showRoutes && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <defs>
                    <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="rgb(139, 92, 246)" stopOpacity="0.6" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 25% 30% Q 40% 20% 45% 55% Q 50% 70% 65% 60%"
                    stroke="url(#routeGradient)"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="5,5"
                    className="animate-pulse"
                  />
                </svg>
              )}

              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="bg-black/80 rounded-lg p-4 flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                    <span className="text-white">Loading map data...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          {showControls && (
            <div className="w-80 bg-black/40 border-l border-blue-500/30 flex flex-col">
              {/* Filters */}
              <div className="p-4 border-b border-blue-500/30">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-blue-400" />
                  Map Filters
                </h4>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.showAppointments}
                      onChange={(e) => handleFilterChange({ showAppointments: e.target.checked })}
                      className="rounded border-gray-600 bg-gray-700 text-blue-500"
                    />
                    <span className="text-sm text-gray-300">Show Appointments</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.showTechnicians}
                      onChange={(e) => handleFilterChange({ showTechnicians: e.target.checked })}
                      className="rounded border-gray-600 bg-gray-700 text-blue-500"
                    />
                    <span className="text-sm text-gray-300">Show Technicians</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.showRoutes}
                      onChange={(e) => handleFilterChange({ showRoutes: e.target.checked })}
                      className="rounded border-gray-600 bg-gray-700 text-blue-500"
                    />
                    <span className="text-sm text-gray-300">Show Routes</span>
                  </label>
                </div>
              </div>

              {/* Selected Item Details */}
              <div className="flex-1 overflow-y-auto">
                {selectedAppointment && (
                  <div className="p-4 border-b border-blue-500/30">
                    <h4 className="text-sm font-semibold text-white mb-3">Appointment Details</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-400">Customer:</span>
                        <span className="text-white ml-2">{selectedAppointment.customerName}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Time:</span>
                        <span className="text-white ml-2">{formatTime(selectedAppointment.scheduledTime)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Service:</span>
                        <span className="text-white ml-2">{selectedAppointment.serviceType}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Priority:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${getPriorityColor(selectedAppointment.priority)}`}>
                          {selectedAppointment.priority.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs text-white ${getStatusColor(selectedAppointment.status)}`}>
                          {selectedAppointment.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="pt-3 flex gap-2">
                        <button className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-2 rounded-lg text-xs transition-colors duration-200 flex items-center justify-center gap-2">
                          <Phone className="w-3 h-3" />
                          Call
                        </button>
                        <button className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-2 rounded-lg text-xs transition-colors duration-200 flex items-center justify-center gap-2">
                          <Navigation className="w-3 h-3" />
                          Navigate
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedTechnician && (
                  <div className="p-4 border-b border-blue-500/30">
                    <h4 className="text-sm font-semibold text-white mb-3">Technician Details</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-400">Name:</span>
                        <span className="text-white ml-2">{selectedTechnician.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs text-white ${getStatusColor(selectedTechnician.status)}`}>
                          {selectedTechnician.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Efficiency:</span>
                        <span className="text-green-400 ml-2">{Math.round(selectedTechnician.efficiency * 100)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Last Update:</span>
                        <span className="text-white ml-2">{formatTime(selectedTechnician.lastUpdate)}</span>
                      </div>
                      
                      <div className="pt-3 flex gap-2">
                        <button className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-2 rounded-lg text-xs transition-colors duration-200 flex items-center justify-center gap-2">
                          <Phone className="w-3 h-3" />
                          Call
                        </button>
                        <button className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-2 rounded-lg text-xs transition-colors duration-200 flex items-center justify-center gap-2">
                          <MessageCircle className="w-3 h-3" />
                          Message
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="p-4">
                  <h4 className="text-sm font-semibold text-white mb-3">Live Statistics</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Active Appointments:</span>
                      <span className="text-blue-400">{filteredAppointments.filter(a => a.status === 'in_progress').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Available Technicians:</span>
                      <span className="text-green-400">{filteredTechnicians.filter(t => t.status === 'available').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Completed Today:</span>
                      <span className="text-green-400">{appointments.filter(a => a.status === 'completed').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Average Efficiency:</span>
                      <span className="text-blue-400">{Math.round(technicians.reduce((sum, t) => sum + t.efficiency, 0) / technicians.length * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}