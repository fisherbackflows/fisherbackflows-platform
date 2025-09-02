'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, BellOff, X, Clock, MapPin, DollarSign, CheckCircle, AlertTriangle, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MobileNotification {
  id: string
  type: 'appointment' | 'payment' | 'location' | 'system' | 'emergency'
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
  actionLabel?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  expires?: string
  data?: Record<string, any>
}

interface MobileNotificationCenterProps {
  userId: string
  userType: 'customer' | 'technician' | 'admin'
  className?: string
}

export default function MobileNotificationCenter({
  userId,
  userType,
  className = ''
}: MobileNotificationCenterProps) {
  const [notifications, setNotifications] = useState<MobileNotification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  const notificationSound = useRef<HTMLAudioElement | null>(null)
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)
  const offlineQueue = useRef<MobileNotification[]>([])

  useEffect(() => {
    initializeNotifications()
    setupOfflineHandling()
    
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
    }
  }, [userId])

  useEffect(() => {
    // Update unread count
    setUnreadCount(notifications.filter(n => !n.read).length)
  }, [notifications])

  const initializeNotifications = async () => {
    // Check if notifications are supported and get permission
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationsEnabled(permission === 'granted')
    }

    // Load cached notifications from localStorage
    loadCachedNotifications()

    // Fetch latest notifications
    await fetchNotifications()

    // Start polling for new notifications
    startPolling()

    setLoading(false)
  }

  const setupOfflineHandling = () => {
    const handleOnline = () => {
      setIsOnline(true)
      syncOfflineNotifications()
      startPolling()
    }

    const handleOffline = () => {
      setIsOnline(false)
      stopPolling()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }

  const loadCachedNotifications = () => {
    try {
      const cached = localStorage.getItem(`notifications_${userId}`)
      if (cached) {
        const cachedNotifications = JSON.parse(cached)
        setNotifications(cachedNotifications)
      }
    } catch (error) {
      console.error('Failed to load cached notifications:', error)
    }
  }

  const cacheNotifications = (notifications: MobileNotification[]) => {
    try {
      localStorage.setItem(`notifications_${userId}`, JSON.stringify(notifications.slice(0, 50)))
    } catch (error) {
      console.error('Failed to cache notifications:', error)
    }
  }

  const fetchNotifications = async () => {
    if (!isOnline) return

    try {
      const response = await fetch(`/api/notifications/mobile?userId=${userId}&userType=${userType}`)
      const data = await response.json()

      if (data.success) {
        const newNotifications = data.notifications
        setNotifications(newNotifications)
        cacheNotifications(newNotifications)

        // Check for new notifications and show system notifications
        const existingIds = notifications.map(n => n.id)
        const reallyNewNotifications = newNotifications.filter((n: MobileNotification) => 
          !existingIds.includes(n.id)
        )

        reallyNewNotifications.forEach((notification: MobileNotification) => {
          showSystemNotification(notification)
          playNotificationSound(notification.priority)
        })
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  const startPolling = () => {
    if (pollingInterval.current) return

    pollingInterval.current = setInterval(() => {
      if (isOnline) {
        fetchNotifications()
      }
    }, 30000) // Poll every 30 seconds
  }

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current)
      pollingInterval.current = null
    }
  }

  const showSystemNotification = (notification: MobileNotification) => {
    if (!notificationsEnabled || !('Notification' in window)) return

    // Don't show system notification if app is in foreground and panel is open
    if (document.visibilityState === 'visible' && isOpen) return

    const systemNotification = new Notification(notification.title, {
      body: notification.message,
      icon: getNotificationIcon(notification.type),
      badge: '/icons/icon-96x96.svg',
      tag: notification.id,
      requireInteraction: notification.priority === 'urgent',
      data: notification.data
    })

    systemNotification.onclick = () => {
      window.focus()
      if (notification.actionUrl) {
        window.location.href = notification.actionUrl
      } else {
        setIsOpen(true)
      }
      systemNotification.close()
    }

    // Auto-close after 8 seconds for non-urgent notifications
    if (notification.priority !== 'urgent') {
      setTimeout(() => systemNotification.close(), 8000)
    }
  }

  const playNotificationSound = (priority: string) => {
    // Different sounds for different priorities
    const soundFile = priority === 'urgent' ? '/sounds/urgent.mp3' : '/sounds/notification.mp3'
    
    if (!notificationSound.current) {
      notificationSound.current = new Audio(soundFile)
      notificationSound.current.volume = 0.3
    }

    notificationSound.current.src = soundFile
    notificationSound.current.play().catch(() => {
      // Ignore autoplay restrictions
    })
  }

  const syncOfflineNotifications = async () => {
    if (offlineQueue.current.length === 0) return

    try {
      await fetch('/api/notifications/mobile/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          notifications: offlineQueue.current
        })
      })

      offlineQueue.current = []
    } catch (error) {
      console.error('Failed to sync offline notifications:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    // Update locally immediately
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )

    // Cache the update
    const updatedNotifications = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    )
    cacheNotifications(updatedNotifications)

    // Send to server when online
    if (isOnline) {
      try {
        await fetch(`/api/notifications/mobile/${notificationId}/read`, {
          method: 'PUT'
        })
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
      }
    } else {
      // Queue for offline sync
      offlineQueue.current.push({
        id: `read_${notificationId}`,
        type: 'system',
        title: 'Mark Read',
        message: '',
        timestamp: new Date().toISOString(),
        read: true,
        priority: 'low',
        data: { action: 'mark_read', notificationId }
      })
    }
  }

  const dismissNotification = async (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))

    if (isOnline) {
      try {
        await fetch(`/api/notifications/mobile/${notificationId}`, {
          method: 'DELETE'
        })
      } catch (error) {
        console.error('Failed to dismiss notification:', error)
      }
    }
  }

  const clearAllNotifications = () => {
    setNotifications([])
    cacheNotifications([])
    
    if (isOnline) {
      fetch(`/api/notifications/mobile/clear?userId=${userId}`, {
        method: 'POST'
      }).catch(error => {
        console.error('Failed to clear notifications on server:', error)
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment': return Clock
      case 'payment': return DollarSign
      case 'location': return MapPin
      case 'emergency': return AlertTriangle
      default: return Bell
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-400 bg-red-500/10'
      case 'high': return 'border-orange-400 bg-orange-500/10'
      case 'normal': return 'border-blue-400 bg-blue-500/10'
      case 'low': return 'border-slate-400 bg-slate-500/10'
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000)

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="relative bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 p-2"
      >
        {notificationsEnabled ? (
          <Bell className="w-5 h-5" />
        ) : (
          <BellOff className="w-5 h-5" />
        )}
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}

        {/* Online/Offline Indicator */}
        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-800 ${
          isOnline ? 'bg-green-400' : 'bg-red-400'
        }`} />
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 max-w-[90vw] bg-slate-900/95 backdrop-blur-sm border border-blue-500/30 rounded-2xl shadow-2xl z-50">
          {/* Header */}
          <div className="p-4 border-b border-blue-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Notifications</h3>
                <div className="flex items-center gap-1">
                  {isOnline ? (
                    <Wifi className="w-4 h-4 text-green-400" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-xs ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                    {isOnline ? 'Live' : 'Offline'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {notifications.length > 0 && (
                  <Button
                    onClick={clearAllNotifications}
                    size="sm"
                    className="text-xs bg-slate-800 border border-slate-600 text-slate-400 hover:bg-slate-700"
                  >
                    Clear All
                  </Button>
                )}
                <Button
                  onClick={() => setIsOpen(false)}
                  size="sm"
                  className="bg-slate-800 border border-slate-600 text-slate-400 hover:bg-slate-700 p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto"></div>
                <p className="text-slate-400 text-sm mt-2">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-slate-400">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {notifications.map((notification) => {
                  const IconComponent = getNotificationIcon(notification.type)
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-slate-800/50 transition-colors ${
                        !notification.read ? 'bg-blue-500/5' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex gap-3">
                        <div className={`p-2 rounded-lg border ${getPriorityColor(notification.priority)}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`font-medium ${!notification.read ? 'text-white' : 'text-slate-300'}`}>
                              {notification.title}
                            </h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                dismissNotification(notification.id)
                              }}
                              className="text-slate-500 hover:text-slate-300"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <p className="text-slate-400 text-sm mt-1">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-slate-500">
                              {formatTime(notification.timestamp)}
                            </span>
                            
                            {notification.actionUrl && (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.location.href = notification.actionUrl!
                                }}
                                size="sm"
                                className="text-xs bg-blue-500/20 border border-blue-400 text-blue-300 hover:bg-blue-500/30"
                              >
                                {notification.actionLabel || 'View'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-700 bg-slate-800/50">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{notifications.length} total notifications</span>
              <div className="flex items-center gap-2">
                {!isOnline && (
                  <span className="text-yellow-400">Offline mode</span>
                )}
                {!notificationsEnabled && (
                  <span className="text-orange-400">Push disabled</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}