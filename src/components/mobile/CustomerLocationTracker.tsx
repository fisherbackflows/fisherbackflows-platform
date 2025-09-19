'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Clock, Navigation, Phone, MessageCircle, Truck, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TechnicianLocation {
  latitude: number
  longitude: number
  accuracy: number
  address: string
  lastUpdated: string
  technicianName?: string
  estimatedArrival?: string
  distanceFromCustomer?: number
}

interface CustomerLocationTrackerProps {
  appointmentId: string
  customerAddress: string
  customerLat?: number
  customerLng?: number
  technicianPhone?: string
  className?: string
}

export default function CustomerLocationTracker({
  appointmentId,
  customerAddress,
  customerLat,
  customerLng,
  technicianPhone,
  className = ''
}: CustomerLocationTrackerProps) {
  const [technicianLocation, setTechnicianLocation] = useState<TechnicianLocation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [estimatedArrival, setEstimatedArrival] = useState<string | null>(null)
  const [isTracking, setIsTracking] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected')

  const pollingInterval = useRef<NodeJS.Timeout | null>(null)
  const lastUpdate = useRef<number>(0)

  useEffect(() => {
    if (isTracking) {
      startTracking()
    } else {
      stopTracking()
    }

    return () => stopTracking()
  }, [isTracking, appointmentId])

  const startTracking = () => {
    setConnectionStatus('reconnecting')
    fetchTechnicianLocation()

    // Poll every 30 seconds for location updates
    pollingInterval.current = setInterval(() => {
      fetchTechnicianLocation()
    }, 30000)
  }

  const stopTracking = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current)
      pollingInterval.current = null
    }
    setConnectionStatus('disconnected')
  }

  const fetchTechnicianLocation = async () => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/technician-location`)
      const data = await response.json()

      if (response.ok && data.success) {
        const location = data.location
        setTechnicianLocation({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          address: location.address || 'Location updating...',
          lastUpdated: location.lastUpdated,
          technicianName: location.technicianName,
          distanceFromCustomer: location.distanceFromCustomer
        })

        // Calculate estimated arrival
        if (location.distanceFromCustomer && location.speed) {
          const etaMinutes = Math.round(location.distanceFromCustomer / (location.speed * 60))
          const eta = new Date(Date.now() + etaMinutes * 60000)
          setEstimatedArrival(eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
        }

        setError(null)
        setConnectionStatus('connected')
        lastUpdate.current = Date.now()
      } else {
        throw new Error(data.error || 'Failed to fetch location')
      }
    } catch (error) {
      console.error('Location tracking error:', error)
      setError(error instanceof Error ? error.message : 'Connection failed')
      setConnectionStatus('disconnected')
    } finally {
      setLoading(false)
    }
  }

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`
    } else {
      return `${(meters / 1000).toFixed(1)}km`
    }
  }

  const formatTimeAgo = (timestamp: string): string => {
    const now = Date.now()
    const then = new Date(timestamp).getTime()
    const diffMinutes = Math.floor((now - then) / 60000)

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes === 1) return '1 minute ago'
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours === 1) return '1 hour ago'
    return `${diffHours} hours ago`
  }

  const openInMaps = () => {
    if (!technicianLocation) return

    const { latitude, longitude } = technicianLocation
    const destination = `${latitude},${longitude}`
    
    // Try to open in Google Maps app first, fallback to web
    const googleMapsApp = `comgooglemaps://?daddr=${destination}`
    const googleMapsWeb = `https://maps.google.com/maps?daddr=${destination}`
    
    // Detect if on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    
    if (isMobile) {
      window.location.href = googleMapsApp
      // Fallback to web if app doesn't open
      setTimeout(() => {
        window.open(googleMapsWeb, '_blank')
      }, 2000)
    } else {
      window.open(googleMapsWeb, '_blank')
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400'
      case 'reconnecting': return 'text-yellow-400'
      case 'disconnected': return 'text-red-400'
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Live tracking active'
      case 'reconnecting': return 'Connecting...'
      case 'disconnected': return 'Connection lost'
    }
  }

  if (loading && !technicianLocation) {
    return (
      <div className={`bg-slate-900/50 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <span className="ml-3 text-slate-300">Loading technician location...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-slate-900/50 backdrop-blur-sm border border-blue-500/30 rounded-2xl ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-blue-500/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Truck className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Track Your Technician
              </h3>
              <p className={`text-sm ${getStatusColor()}`}>
                {getStatusText()}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setIsTracking(!isTracking)}
              size="sm"
              className={`px-3 py-1 text-sm ${
                isTracking
                  ? 'bg-red-500/20 border border-red-400 text-red-300 hover:bg-red-500/30'
                  : 'bg-green-500/20 border border-green-400 text-green-300 hover:bg-green-500/30'
              }`}
            >
              {isTracking ? 'Stop' : 'Start'} Tracking
            </Button>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' :
            connectionStatus === 'reconnecting' ? 'bg-yellow-400 animate-pulse' :
            'bg-red-400'
          }`}></div>
          <span className="text-slate-400">
            {technicianLocation ? formatTimeAgo(technicianLocation.lastUpdated) : 'No data'}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border-b border-red-500/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Location Info */}
      {technicianLocation ? (
        <div className="p-6 space-y-6">
          {/* Current Location */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span className="text-slate-300 text-sm font-medium">Current Location</span>
              </div>
              <span className="text-xs text-slate-400">
                ±{Math.round(technicianLocation.accuracy)}m accuracy
              </span>
            </div>
            
            <p className="text-white text-sm mb-2">
              {technicianLocation.address}
            </p>
            
            {technicianLocation.distanceFromCustomer && (
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>Distance: {formatDistance(technicianLocation.distanceFromCustomer)}</span>
                {estimatedArrival && (
                  <span>ETA: {estimatedArrival}</span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={openInMaps}
              className="bg-green-500/20 border border-green-400 text-green-300 hover:bg-green-500/30"
            >
              <Navigation className="w-4 h-4 mr-2" />
              View on Map
            </Button>
            
            {technicianPhone && (
              <Button
                onClick={() => window.open(`tel:${technicianPhone}`)}
                className="bg-blue-500/20 border border-blue-400 text-blue-300 hover:bg-blue-500/30"
              >
                <Phone className="w-4 h-4 mr-2" />
                Call Tech
              </Button>
            )}
          </div>

          {/* Estimated Arrival */}
          {estimatedArrival && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-green-400" />
                <span className="text-green-300 font-medium text-sm">Estimated Arrival</span>
              </div>
              <p className="text-white text-lg font-semibold">{estimatedArrival}</p>
              <p className="text-slate-400 text-xs mt-1">
                Based on current location and typical travel speed
              </p>
            </div>
          )}

          {/* Help Text */}
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h4 className="text-slate-300 text-sm font-medium mb-2">About Location Tracking</h4>
            <ul className="text-slate-400 text-xs space-y-1">
              <li>• Your technician's location updates every 30 seconds</li>
              <li>• Estimated arrival times are calculated in real-time</li>
              <li>• You can call your technician directly using the button above</li>
              <li>• Tracking stops automatically when your appointment is complete</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="p-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-slate-500" />
            </div>
            <h4 className="text-white font-medium mb-2">
              Technician Location Unavailable
            </h4>
            <p className="text-slate-400 text-sm mb-4">
              Your technician may not have location sharing enabled or may be between appointments.
            </p>
            {technicianPhone && (
              <Button
                onClick={() => window.open(`tel:${technicianPhone}`)}
                className="bg-blue-500/20 border border-blue-400 text-blue-300 hover:bg-blue-500/30"
              >
                <Phone className="w-4 h-4 mr-2" />
                Call Technician
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}