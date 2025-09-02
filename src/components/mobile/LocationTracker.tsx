'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Navigation, Clock, Battery, Wifi, WifiOff, Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  heading?: number
  speed?: number
  timestamp: number
  address?: string
}

interface LocationTrackerProps {
  technicianId: string
  appointmentId?: string
  onLocationUpdate?: (location: LocationData) => void
  autoTrack?: boolean
  className?: string
}

export default function LocationTracker({
  technicianId,
  appointmentId,
  onLocationUpdate,
  autoTrack = false,
  className = ''
}: LocationTrackerProps) {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [battery, setBattery] = useState<number | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [accuracy, setAccuracy] = useState<'high' | 'medium' | 'low'>('medium')
  const [trackingHistory, setTrackingHistory] = useState<LocationData[]>([])
  
  const watchId = useRef<number | null>(null)
  const updateInterval = useRef<NodeJS.Timeout | null>(null)

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Monitor battery level
  useEffect(() => {
    const updateBattery = async () => {
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

    updateBattery()
  }, [])

  // Auto-start tracking if enabled
  useEffect(() => {
    if (autoTrack) {
      startTracking()
    }

    return () => {
      stopTracking()
    }
  }, [autoTrack])

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      return
    }

    const options: PositionOptions = {
      enableHighAccuracy: accuracy === 'high',
      timeout: accuracy === 'high' ? 15000 : 10000,
      maximumAge: accuracy === 'high' ? 0 : 30000
    }

    setIsTracking(true)
    setError(null)

    // Start watching position
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
          timestamp: Date.now()
        }

        setLocation(locationData)
        setTrackingHistory(prev => [...prev.slice(-50), locationData]) // Keep last 50 positions
        
        // Reverse geocode to get address
        reverseGeocode(locationData.latitude, locationData.longitude)
          .then(address => {
            const updatedLocation = { ...locationData, address }
            setLocation(updatedLocation)
            onLocationUpdate?.(updatedLocation)
          })

        // Send to backend if online
        if (isOnline) {
          sendLocationToBackend(locationData)
        } else {
          // Store offline for later sync
          storeLocationOffline(locationData)
        }
      },
      (error) => {
        setError(`Location error: ${error.message}`)
        console.error('Geolocation error:', error)
      },
      options
    )

    // Set up periodic updates every 30 seconds
    updateInterval.current = setInterval(() => {
      if (location && isOnline) {
        sendLocationToBackend(location)
      }
    }, 30000)
  }

  const stopTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }

    if (updateInterval.current) {
      clearInterval(updateInterval.current)
      updateInterval.current = null
    }

    setIsTracking(false)
  }

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      // Use a simple reverse geocoding service (you can replace with your preferred service)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      )
      const data = await response.json()
      return data.displayName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    } catch (error) {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    }
  }

  const sendLocationToBackend = async (locationData: LocationData) => {
    try {
      await fetch('/api/technicians/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          technicianId,
          appointmentId,
          ...locationData
        })
      })
    } catch (error) {
      console.error('Failed to send location:', error)
      storeLocationOffline(locationData)
    }
  }

  const storeLocationOffline = (locationData: LocationData) => {
    const key = `offline_locations_${technicianId}`
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    existing.push(locationData)
    localStorage.setItem(key, JSON.stringify(existing.slice(-100))) // Keep last 100
  }

  const syncOfflineLocations = async () => {
    const key = `offline_locations_${technicianId}`
    const offlineLocations = JSON.parse(localStorage.getItem(key) || '[]')
    
    if (offlineLocations.length === 0) return

    try {
      await fetch('/api/technicians/location/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          technicianId,
          locations: offlineLocations
        })
      })

      // Clear offline storage after successful sync
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Failed to sync offline locations:', error)
    }
  }

  // Sync offline locations when coming back online
  useEffect(() => {
    if (isOnline) {
      syncOfflineLocations()
    }
  }, [isOnline])

  const getAccuracyColor = () => {
    if (!location) return 'text-gray-400'
    if (location.accuracy < 10) return 'text-green-400'
    if (location.accuracy < 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getAccuracyText = () => {
    if (!location) return 'No signal'
    if (location.accuracy < 10) return 'Excellent'
    if (location.accuracy < 50) return 'Good'
    return 'Poor'
  }

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m`
    return `${(meters / 1000).toFixed(1)}km`
  }

  const getTraveledDistance = () => {
    if (trackingHistory.length < 2) return 0
    
    let total = 0
    for (let i = 1; i < trackingHistory.length; i++) {
      const prev = trackingHistory[i - 1]
      const curr = trackingHistory[i]
      
      // Haversine formula for distance calculation
      const R = 6371000 // Earth's radius in meters
      const dLat = (curr.latitude - prev.latitude) * Math.PI / 180
      const dLng = (curr.longitude - prev.longitude) * Math.PI / 180
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(prev.latitude * Math.PI / 180) * Math.cos(curr.latitude * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      total += R * c
    }
    
    return total
  }

  return (
    <div className={`bg-slate-900/50 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isTracking ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Location Tracking</h3>
            <p className="text-slate-400 text-sm">
              {isTracking ? 'Active tracking' : 'Tracking stopped'}
            </p>
          </div>
        </div>

        <Button
          onClick={isTracking ? stopTracking : startTracking}
          className={`px-4 py-2 rounded-lg font-medium ${
            isTracking
              ? 'bg-red-500/20 border border-red-400 text-red-300 hover:bg-red-500/30'
              : 'bg-green-500/20 border border-green-400 text-green-300 hover:bg-green-500/30'
          }`}
        >
          {isTracking ? 'Stop' : 'Start'} Tracking
        </Button>
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-4 h-4 text-green-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-400" />
          )}
          <span className={`text-sm ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {battery !== null && (
          <div className="flex items-center gap-2">
            <Battery className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-slate-300">{battery}%</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Compass className={`w-4 h-4 ${getAccuracyColor()}`} />
          <span className={`text-sm ${getAccuracyColor()}`}>
            {getAccuracyText()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-slate-300">
            {formatDistance(getTraveledDistance())}
          </span>
        </div>
      </div>

      {/* Current Location */}
      {location && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-xs mb-1">Current Location</p>
              <p className="text-white text-sm font-medium">
                {location.address || 'Loading address...'}
              </p>
              <p className="text-slate-400 text-xs">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Accuracy</p>
              <p className="text-white text-sm">
                ±{Math.round(location.accuracy)}m
              </p>
              {location.speed !== undefined && (
                <p className="text-slate-400 text-xs">
                  Speed: {Math.round((location.speed || 0) * 3.6)} km/h
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Accuracy Settings */}
      <div className="mb-4">
        <label className="text-slate-300 text-sm mb-2 block">Tracking Accuracy</label>
        <div className="flex gap-2">
          {['high', 'medium', 'low'].map((level) => (
            <button
              key={level}
              onClick={() => setAccuracy(level as any)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                accuracy === level
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-400'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-300'
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
        <p className="text-slate-500 text-xs mt-1">
          Higher accuracy uses more battery but provides better location data
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => {
            if (location) {
              window.open(`https://maps.google.com/?q=${location.latitude},${location.longitude}`)
            }
          }}
          disabled={!location}
          className="bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <MapPin className="w-4 h-4 mr-2" />
          View on Map
        </Button>
        
        <Button
          onClick={() => {
            if (location && appointmentId) {
              navigator.share?.({
                title: 'My Location',
                text: 'I am currently here:',
                url: `https://maps.google.com/?q=${location.latitude},${location.longitude}`
              })
            }
          }}
          disabled={!location || !navigator.share}
          className="bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <Navigation className="w-4 h-4 mr-2" />
          Share Location
        </Button>
      </div>
    </div>
  )
}