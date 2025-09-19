'use client'

import { useEffect, useState } from 'react'
import { Bell, BellRing, Settings, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationManager } from '@/lib/notifications'

interface NotificationManagerComponentProps {
  className?: string
}

export function NotificationManagerComponent({ className = '' }: NotificationManagerComponentProps) {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notificationManager, setNotificationManager] = useState<NotificationManager | null>(null)

  useEffect(() => {
    // Check if notifications are supported
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
    setIsSupported(supported)
    setPermission(Notification?.permission || 'default')

    if (supported) {
      const manager = NotificationManager.getInstance()
      setNotificationManager(manager)

      // Check if already subscribed
      checkSubscriptionStatus()
    }
  }, [])

  const checkSubscriptionStatus = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        setIsSubscribed(!!subscription)
      }
    } catch (error) {
      console.error('Error checking subscription status:', error)
    }
  }

  const handleEnableNotifications = async () => {
    if (!notificationManager) return

    setLoading(true)
    try {
      const success = await notificationManager.initialize()
      if (success) {
        setPermission('granted')
        setIsSubscribed(true)
        
        // Show test notification
        await notificationManager.showLocalNotification({
          title: '🎉 Notifications Enabled!',
          body: 'You\'ll now receive real-time updates about tests, payments, and important alerts.',
          icon: '/icons/icon-192.png',
          tag: 'welcome'
        })
      } else {
        console.warn('Failed to enable notifications')
      }
    } catch (error) {
      console.error('Error enabling notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDisableNotifications = async () => {
    if (!notificationManager) return

    setLoading(true)
    try {
      const success = await notificationManager.unsubscribe()
      if (success) {
        setIsSubscribed(false)
      }
    } catch (error) {
      console.error('Error disabling notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendTestNotification = async () => {
    if (!notificationManager) return

    try {
      await notificationManager.showLocalNotification({
        title: '🧪 Test Notification',
        body: 'This is a test notification to verify everything is working correctly.',
        icon: '/icons/icon-192.png',
        tag: 'test-notification',
        actions: [
          { action: 'acknowledge', title: 'Got it!' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      })
    } catch (error) {
      console.error('Error sending test notification:', error)
    }
  }

  if (!isSupported) {
    return (
      <div className={`flex items-center space-x-2 text-yellow-400 ${className}`}>
        <Bell className="h-4 w-4" />
        <span className="text-sm">Notifications not supported</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Notification Status Indicator */}
      <div className="flex items-center space-x-2">
        {isSubscribed ? (
          <BellRing className="h-5 w-5 text-green-400" />
        ) : (
          <Bell className="h-5 w-5 text-gray-800" />
        )}
        <span className="text-sm text-white/80">
          {isSubscribed ? 'Notifications ON' : 'Notifications OFF'}
        </span>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center space-x-2">
        {!isSubscribed ? (
          <Button
            onClick={handleEnableNotifications}
            disabled={loading || permission === 'denied'}
            className="btn-glass px-3 py-1 text-sm rounded-lg"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
            ) : (
              <Check className="h-3 w-3 mr-1" />
            )}
            Enable
          </Button>
        ) : (
          <>
            <Button
              onClick={sendTestNotification}
              className="btn-glass px-3 py-1 text-sm rounded-lg"
            >
              <Bell className="h-3 w-3 mr-1" />
              Test
            </Button>
            <Button
              onClick={handleDisableNotifications}
              disabled={loading}
              className="btn-glass px-3 py-1 text-sm rounded-lg text-red-400 hover:text-red-300"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
              ) : (
                <X className="h-3 w-3 mr-1" />
              )}
              Disable
            </Button>
          </>
        )}
      </div>

      {permission === 'denied' && (
        <div className="text-xs text-red-400 max-w-48">
          Notifications blocked. Enable in browser settings.
        </div>
      )}
    </div>
  )
}