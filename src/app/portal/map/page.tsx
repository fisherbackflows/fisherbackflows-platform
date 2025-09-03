'use client'

import { useState, useEffect } from 'react'
import { 
  MapPin, 
  Activity,
  TrendingUp,
  Users,
  Clock,
  Route,
  Zap,
  AlertCircle,
  CheckCircle2,
  Navigation2,
  Settings,
  Filter
} from 'lucide-react'
import { UnifiedLayout } from '@/components/ui/UnifiedLayout'
import InteractiveMapDashboard from '@/components/maps/InteractiveMapDashboard'

interface MapMetrics {
  activeAppointments: number
  availableTechnicians: number
  completedToday: number
  averageEfficiency: number
  totalDistance: number
  estimatedSavings: number
}

interface RealtimeUpdate {
  timestamp: string
  type: 'appointment' | 'technician' | 'route' | 'alert'
  message: string
  data: any
}

export default function MapPage() {
  const [metrics, setMetrics] = useState<MapMetrics>({
    activeAppointments: 0,
    availableTechnicians: 0,
    completedToday: 0,
    averageEfficiency: 0,
    totalDistance: 0,
    estimatedSavings: 0
  })
  
  const [realtimeUpdates, setRealtimeUpdates] = useState<RealtimeUpdate[]>([])
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(true)
  const [selectedView, setSelectedView] = useState<'standard' | 'satellite' | 'hybrid'>('standard')
  const [showAdvancedControls, setShowAdvancedControls] = useState(false)

  // Load initial metrics
  useEffect(() => {
    loadMapMetrics()
    
    // Set up real-time updates simulation
    const updateInterval = setInterval(() => {
      if (isTrackingEnabled) {
        generateRealtimeUpdate()
        updateMetrics()
      }
    }, 15000) // Update every 15 seconds

    return () => clearInterval(updateInterval)
  }, [isTrackingEnabled])

  const loadMapMetrics = async () => {
    // Simulate API call to load map metrics
    setMetrics({
      activeAppointments: 3,
      availableTechnicians: 2,
      completedToday: 8,
      averageEfficiency: 89,
      totalDistance: 127.5,
      estimatedSavings: 1240
    })
  }

  const updateMetrics = () => {
    setMetrics(prev => ({
      ...prev,
      activeAppointments: Math.max(0, prev.activeAppointments + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0)),
      averageEfficiency: Math.min(100, Math.max(70, prev.averageEfficiency + (Math.random() - 0.5) * 2)),
      totalDistance: prev.totalDistance + Math.random() * 5,
      estimatedSavings: prev.estimatedSavings + Math.random() * 50
    }))
  }

  const generateRealtimeUpdate = () => {
    const updates = [
      {
        timestamp: new Date().toISOString(),
        type: 'technician' as const,
        message: 'Mike Rodriguez completed appointment at Dallas Medical Center',
        data: { technicianId: 'tech_001', appointmentId: 'appt_001' }
      },
      {
        timestamp: new Date().toISOString(),
        type: 'route' as const,
        message: 'Optimized route saved 15 minutes travel time',
        data: { routeId: 'route_001', timeSaved: 15 }
      },
      {
        timestamp: new Date().toISOString(),
        type: 'appointment' as const,
        message: 'New urgent appointment scheduled for Richardson',
        data: { appointmentId: 'appt_004', priority: 'urgent' }
      },
      {
        timestamp: new Date().toISOString(),
        type: 'alert' as const,
        message: 'Traffic delay detected on I-35, rerouting Sarah Johnson',
        data: { technicianId: 'tech_002', delay: '8 minutes' }
      }
    ]

    const randomUpdate = updates[Math.floor(Math.random() * updates.length)]
    
    setRealtimeUpdates(prev => {
      const newUpdates = [randomUpdate, ...prev].slice(0, 10) // Keep only last 10 updates
      return newUpdates
    })
  }

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <Clock className="w-4 h-4 text-blue-400" />
      case 'technician': return <Users className="w-4 h-4 text-green-400" />
      case 'route': return <Route className="w-4 h-4 text-purple-400" />
      case 'alert': return <AlertCircle className="w-4 h-4 text-yellow-400" />
      default: return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <UnifiedLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="bg-black/30 backdrop-blur-md border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <MapPin className="w-8 h-8 text-blue-400" />
                  Interactive Map Dashboard
                </h1>
                <p className="text-gray-300 mt-2">
                  Real-time technician tracking and appointment management with AI-powered route optimization
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Real-time Status */}
                <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-lg border border-green-500/30">
                  <div className={`w-2 h-2 rounded-full ${isTrackingEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                  <span className="text-sm text-white">
                    {isTrackingEnabled ? 'Live Tracking' : 'Tracking Disabled'}
                  </span>
                </div>

                {/* Advanced Controls Toggle */}
                <button
                  onClick={() => setShowAdvancedControls(!showAdvancedControls)}
                  className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 transition-all duration-200"
                  title="Toggle advanced controls"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Real-time Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-black/40 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Activity className="w-8 h-8 text-blue-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">{metrics.activeAppointments}</div>
                    <div className="text-xs text-gray-400">Active Now</div>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-green-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">{metrics.availableTechnicians}</div>
                    <div className="text-xs text-gray-400">Available</div>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 border border-purple-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-purple-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">{metrics.completedToday}</div>
                    <div className="text-xs text-gray-400">Completed</div>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-yellow-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">{Math.round(metrics.averageEfficiency)}%</div>
                    <div className="text-xs text-gray-400">Efficiency</div>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 border border-orange-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Route className="w-8 h-8 text-orange-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">{metrics.totalDistance.toFixed(1)}</div>
                    <div className="text-xs text-gray-400">Miles Today</div>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 border border-emerald-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Zap className="w-8 h-8 text-emerald-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">${Math.round(metrics.estimatedSavings)}</div>
                    <div className="text-xs text-gray-400">Saved Today</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Controls Panel */}
          {showAdvancedControls && (
            <div className="bg-black/30 backdrop-blur-md border border-blue-500/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                Advanced Map Controls
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* View Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Map View</label>
                  <select
                    value={selectedView}
                    onChange={(e) => setSelectedView(e.target.value as any)}
                    className="w-full bg-black/40 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="standard">Standard View</option>
                    <option value="satellite">Satellite View</option>
                    <option value="hybrid">Hybrid View</option>
                  </select>
                </div>

                {/* Tracking Settings */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Real-time Tracking</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isTrackingEnabled}
                        onChange={(e) => setIsTrackingEnabled(e.target.checked)}
                        className="rounded border-gray-600 bg-gray-700 text-blue-500"
                      />
                      <span className="text-sm text-gray-300">Enable Live Updates</span>
                    </label>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Quick Actions</label>
                  <div className="flex gap-2">
                    <button className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 text-sm transition-all duration-200">
                      Center Map
                    </button>
                    <button className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-400 text-sm transition-all duration-200">
                      Optimize Routes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Map */}
            <div className="lg:col-span-3">
              <InteractiveMapDashboard
                height="800px"
                enableRealTimeTracking={isTrackingEnabled}
                showControls={true}
                className="h-full"
              />
            </div>

            {/* Real-time Updates Sidebar */}
            <div className="space-y-6">
              {/* Live Updates Feed */}
              <div className="bg-black/30 backdrop-blur-md border border-blue-500/30 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  Live Updates
                </h3>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {realtimeUpdates.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No recent updates</p>
                      {!isTrackingEnabled && (
                        <p className="text-xs mt-1">Enable live tracking to see updates</p>
                      )}
                    </div>
                  ) : (
                    realtimeUpdates.map((update, index) => (
                      <div
                        key={index}
                        className="bg-black/40 border border-gray-600/30 rounded-lg p-3 hover:border-blue-500/30 transition-all duration-200"
                      >
                        <div className="flex items-start gap-3">
                          {getUpdateIcon(update.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white mb-1">{update.message}</p>
                            <p className="text-xs text-gray-400">{formatTime(update.timestamp)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Route Optimization */}
              <div className="bg-black/30 backdrop-blur-md border border-purple-500/30 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Route className="w-5 h-5 text-purple-400" />
                  AI Route Optimizer
                </h3>
                
                <div className="space-y-3">
                  <div className="bg-black/40 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-300">Today's Optimization</span>
                      <span className="text-green-400 text-sm font-semibold">+23% efficiency</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-center">
                      <div className="text-white font-semibold">45min</div>
                      <div className="text-gray-400">Time Saved</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-semibold">28mi</div>
                      <div className="text-gray-400">Miles Saved</div>
                    </div>
                  </div>
                  
                  <button className="w-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg py-2 text-purple-400 text-sm transition-all duration-200">
                    Run Optimization
                  </button>
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="bg-black/30 backdrop-blur-md border border-green-500/30 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Navigation2 className="w-5 h-5 text-green-400" />
                  Quick Navigation
                </h3>
                
                <div className="space-y-2">
                  <button className="w-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg py-2 text-green-400 text-sm transition-all duration-200 flex items-center justify-center gap-2">
                    <MapPin className="w-4 h-4" />
                    View All Technicians
                  </button>
                  
                  <button className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg py-2 text-blue-400 text-sm transition-all duration-200 flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4" />
                    Today's Appointments
                  </button>
                  
                  <button className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-lg py-2 text-yellow-400 text-sm transition-all duration-200 flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Active Alerts
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UnifiedLayout>
  )
}