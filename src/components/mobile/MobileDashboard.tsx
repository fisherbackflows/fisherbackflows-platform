'use client'

import { useState, useEffect } from 'react'
import { Calendar, MapPin, Bell, User, Settings, Menu, X, Wifi, WifiOff, Battery } from 'lucide-react'
import { Button } from '@/components/ui/button'
import LocationTracker from './LocationTracker'
import CustomerLocationTracker from './CustomerLocationTracker'
import MobileNotificationCenter from './MobileNotificationCenter'
import MobileSwipeActions, { SwipeActionPresets } from './MobileSwipeActions'
import MobilePullToRefresh from './MobilePullToRefresh'

interface MobileDashboardProps {
  userType: 'customer' | 'technician' | 'admin'
  userId: string
  userName?: string
  className?: string
}

interface DashboardData {
  todayAppointments: any[]
  notifications: any[]
  locationData: any
  stats: {
    upcoming: number
    completed: number
    total: number
  }
}

export default function MobileDashboard({
  userType,
  userId,
  userName,
  className = ''
}: MobileDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [menuOpen, setMenuOpen] = useState(false)
  const [battery, setBattery] = useState<number | null>(null)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'schedule' | 'location'>('overview')

  useEffect(() => {
    fetchDashboardData()
    setupConnectivityMonitoring()
    setupBatteryMonitoring()
  }, [userId])

  const setupConnectivityMonitoring = () => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }

  const setupBatteryMonitoring = async () => {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery()
        setBattery(Math.round(battery.level * 100))
        
        battery.addEventListener('levelchange', () => {
          setBattery(Math.round(battery.level * 100))
        })
      } catch (error) {
        console.log('Battery API not supported')
      }
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/mobile/dashboard?userId=${userId}&userType=${userType}`)
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      // Load cached data if available
      loadCachedData()
    } finally {
      setLoading(false)
    }
  }

  const loadCachedData = () => {
    try {
      const cached = localStorage.getItem(`dashboard_${userId}`)
      if (cached) {
        setData(JSON.parse(cached))
      }
    } catch (error) {
      console.error('Failed to load cached data:', error)
    }
  }

  const cacheData = (data: DashboardData) => {
    try {
      localStorage.setItem(`dashboard_${userId}`, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to cache data:', error)
    }
  }

  const handleRefresh = async () => {
    await fetchDashboardData()
    if (data) {
      cacheData(data)
    }
  }

  const getBatteryColor = () => {
    if (battery === null) return 'text-slate-400'
    if (battery < 20) return 'text-red-400'
    if (battery < 50) return 'text-yellow-400'
    return 'text-green-400'
  }

  const renderAppointmentCard = (appointment: any) => {
    const swipeActions = []
    
    if (userType === 'technician') {
      if (appointment.customerPhone) {
        swipeActions.push(SwipeActionPresets.call(appointment.customerPhone))
      }
      if (appointment.address) {
        swipeActions.push(SwipeActionPresets.navigate(appointment.address))
      }
      if (appointment.status === 'scheduled') {
        swipeActions.push(SwipeActionPresets.complete(() => {
          // Handle completion
          console.log('Complete appointment:', appointment.id)
        }))
      }
    } else if (userType === 'customer') {
      if (appointment.technicianPhone) {
        swipeActions.push(SwipeActionPresets.call(appointment.technicianPhone))
      }
      if (appointment.status === 'scheduled') {
        swipeActions.push(SwipeActionPresets.reschedule(() => {
          // Handle reschedule
          console.log('Reschedule appointment:', appointment.id)
        }))
      }
    }

    return (
      <MobileSwipeActions
        key={appointment.id}
        actions={swipeActions}
        onSwipe={(action) => console.log('Swiped:', action.label)}
      >
        <div className="bg-slate-800/50 border border-blue-500/30 rounded-2xl p-4 mb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="text-white font-medium">{appointment.time}</span>
            </div>
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              appointment.status === 'confirmed' ? 'bg-green-500/20 text-green-300' :
              appointment.status === 'scheduled' ? 'bg-blue-500/20 text-blue-300' :
              'bg-yellow-500/20 text-yellow-300'
            }`}>
              {appointment.status}
            </div>
          </div>
          
          <h3 className="text-white font-medium mb-1">
            {userType === 'technician' ? appointment.customerName : appointment.technicianName || 'Fisher Backflows'}
          </h3>
          
          <div className="flex items-start gap-2 text-slate-300 text-sm">
            <MapPin className="w-3 h-3 mt-1 flex-shrink-0" />
            <span>{appointment.address}</span>
          </div>
          
          {appointment.notes && (
            <p className="text-slate-400 text-xs mt-2">{appointment.notes}</p>
          )}
          
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
            <span>Swipe for actions</span>
            <div className="flex gap-1">
              {swipeActions.slice(0, 2).map((action, i) => (
                <div key={i} className={`w-1 h-1 rounded-full ${action.color.includes('green') ? 'bg-green-400' : 'bg-blue-400'}`} />
              ))}
            </div>
          </div>
        </div>
      </MobileSwipeActions>
    )
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-black ${className}`}>
      {/* Mobile Header */}
      <header className="bg-slate-900/50 backdrop-blur-sm border-b border-blue-500/30 sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Menu & Title */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setMenuOpen(!menuOpen)}
                size="sm"
                className="bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 p-2"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              <div>
                <h1 className="text-lg font-bold text-white">Fisher Backflows</h1>
                <p className="text-xs text-slate-400 capitalize">{userType} Dashboard</p>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-2">
              {/* Battery */}
              {battery !== null && (
                <div className={`flex items-center gap-1 text-xs ${getBatteryColor()}`}>
                  <Battery className="w-3 h-3" />
                  <span>{battery}%</span>
                </div>
              )}

              {/* Network */}
              <div className={`flex items-center gap-1 text-xs ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              </div>

              {/* Notifications */}
              <MobileNotificationCenter
                userId={userId}
                userType={userType}
              />
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex mt-3 bg-slate-800/50 rounded-lg p-1">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'schedule', label: 'Schedule' },
              { id: 'location', label: 'Location' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                  selectedTab === tab.id
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <MobilePullToRefresh onRefresh={handleRefresh} className="flex-1">
        <div className="p-4">
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              {data && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-800/50 border border-blue-500/30 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-blue-400">{data.stats.upcoming}</div>
                    <div className="text-xs text-slate-400">Upcoming</div>
                  </div>
                  <div className="bg-slate-800/50 border border-green-500/30 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-green-400">{data.stats.completed}</div>
                    <div className="text-xs text-slate-400">Completed</div>
                  </div>
                  <div className="bg-slate-800/50 border border-purple-500/30 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-purple-400">{data.stats.total}</div>
                    <div className="text-xs text-slate-400">Total</div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button className="bg-blue-500/20 border border-blue-400 text-blue-300 hover:bg-blue-500/30 py-3">
                  <Calendar className="w-4 h-4 mr-2" />
                  {userType === 'customer' ? 'Book Test' : 'View Schedule'}
                </Button>
                <Button className="bg-green-500/20 border border-green-400 text-green-300 hover:bg-green-500/30 py-3">
                  <User className="w-4 h-4 mr-2" />
                  {userType === 'customer' ? 'My Account' : 'Customers'}
                </Button>
              </div>
            </div>
          )}

          {selectedTab === 'schedule' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Today's Schedule</h2>
              {data?.todayAppointments?.length > 0 ? (
                data.todayAppointments.map(renderAppointmentCard)
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400">No appointments today</p>
                </div>
              )}
            </div>
          )}

          {selectedTab === 'location' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Location Services</h2>
              {userType === 'technician' ? (
                <LocationTracker
                  technicianId={userId}
                  autoTrack={true}
                />
              ) : (
                <div className="space-y-4">
                  <p className="text-slate-400 text-sm">
                    Track your technician's location during scheduled appointments
                  </p>
                  {data?.todayAppointments?.length > 0 && (
                    <CustomerLocationTracker
                      appointmentId={data.todayAppointments[0].id}
                      customerAddress={data.todayAppointments[0].address}
                      technicianPhone={data.todayAppointments[0].technicianPhone}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </MobilePullToRefresh>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50">
          <div className="bg-slate-900 w-80 h-full p-6 border-r border-blue-500/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Menu</h2>
              <Button
                onClick={() => setMenuOpen(false)}
                size="sm"
                className="bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 p-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <nav className="space-y-3">
              <Button className="w-full justify-start bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700">
                <Calendar className="w-4 h-4 mr-3" />
                Schedule
              </Button>
              <Button className="w-full justify-start bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700">
                <User className="w-4 h-4 mr-3" />
                Profile
              </Button>
              <Button className="w-full justify-start bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700">
                <Settings className="w-4 h-4 mr-3" />
                Settings
              </Button>
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}