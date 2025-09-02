// Service Worker for Fisher Backflows Push Notifications
const CACHE_NAME = 'fisher-backflows-v1'
const urlsToCache = [
  '/',
  '/field/dashboard',
  '/admin/dashboard',
  '/portal/dashboard',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/offline.html'
]

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell')
        return cache.addAll(urlsToCache)
      })
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  // API requests - network first, cache fallback
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful API responses
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseClone))
          }
          return response
        })
        .catch(() => {
          // Return cached response if network fails
          return caches.match(event.request)
        })
    )
    return
  }

  // Static resources - cache first, network fallback
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response
        }

        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            const responseToCache = response.clone()
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache)
              })

            return response
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html')
            }
          })
      })
  )
})

// Push event - handle incoming push notifications
self.addEventListener('push', event => {
  console.log('Push event received:', event)

  if (!event.data) {
    console.log('Push event has no data')
    return
  }

  try {
    const payload = event.data.json()
    console.log('Push payload:', payload)

    const notificationOptions = {
      body: payload.body || 'Fisher Backflows notification',
      icon: payload.icon || '/icons/icon-192.png',
      badge: payload.badge || '/icons/badge-72.png',
      image: payload.image,
      tag: payload.tag || 'fisher-backflows',
      renotify: true,
      requireInteraction: payload.requireInteraction || false,
      data: {
        ...payload.data,
        timestamp: Date.now(),
        url: payload.url || '/'
      },
      actions: payload.actions || [
        {
          action: 'view',
          title: 'View Details',
          icon: '/icons/view.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/close.png'
        }
      ],
      vibrate: [200, 100, 200], // Vibration pattern for mobile
      silent: payload.silent || false
    }

    event.waitUntil(
      self.registration.showNotification(
        payload.title || 'Fisher Backflows',
        notificationOptions
      ).then(() => {
        console.log('Notification displayed successfully')
        
        // Track notification display
        if (payload.trackingId) {
          fetch('/api/notifications/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              trackingId: payload.trackingId,
              action: 'displayed',
              timestamp: Date.now()
            })
          }).catch(console.error)
        }
      })
    )

  } catch (error) {
    console.error('Error processing push event:', error)
    
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('Fisher Backflows', {
        body: 'New notification received',
        icon: '/icons/icon-192.png',
        tag: 'fallback'
      })
    )
  }
})

// Notification click event - handle user interaction
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event.notification.tag, event.action)
  
  event.notification.close()

  const notification = event.notification
  const action = event.action
  const data = notification.data || {}

  // Track notification click
  if (data.trackingId) {
    fetch('/api/notifications/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trackingId: data.trackingId,
        action: action || 'clicked',
        timestamp: Date.now()
      })
    }).catch(console.error)
  }

  // Handle specific actions
  let targetUrl = '/'
  
  switch (action) {
    case 'view-report':
      targetUrl = `/reports/${data.reportId || ''}`
      break
    case 'view-payment':
      targetUrl = `/payments/${data.paymentId || ''}`
      break
    case 'view-schedule':
      targetUrl = '/field/dashboard'
      break
    case 'view-dashboard':
      targetUrl = '/admin/dashboard'
      break
    case 'contact-customer':
      targetUrl = `/customers/${data.customerId || ''}`
      break
    case 'send-reminder':
      // Handle reminder action via API
      fetch('/api/customers/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: data.customerId })
      }).catch(console.error)
      return
    case 'dismiss':
      // Just close, no navigation
      return
    default:
      targetUrl = data.url || '/'
  }

  // Open/focus the target URL
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Try to focus existing window with target URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i]
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus()
          }
        }
        
        // If no existing window, open new one
        if (clients.openWindow) {
          return clients.openWindow(targetUrl)
        }
      })
      .catch(error => {
        console.error('Error handling notification click:', error)
      })
  )
})

// Notification close event - track dismissals
self.addEventListener('notificationclose', event => {
  console.log('Notification closed:', event.notification.tag)
  
  const data = event.notification.data || {}
  
  // Track notification dismissal
  if (data.trackingId) {
    fetch('/api/notifications/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trackingId: data.trackingId,
        action: 'dismissed',
        timestamp: Date.now()
      })
    }).catch(console.error)
  }
})

// Background sync - handle offline actions when connection restored
self.addEventListener('sync', event => {
  console.log('Background sync triggered:', event.tag)
  
  if (event.tag === 'background-sync-test-reports') {
    event.waitUntil(syncTestReports())
  }
  
  if (event.tag === 'background-sync-notifications') {
    event.waitUntil(syncPendingNotifications())
  }
})

// Helper functions
async function syncTestReports() {
  try {
    console.log('Syncing pending test reports...')
    
    const response = await fetch('/api/sync/test-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('Test reports sync completed:', result)
      
      // Show success notification
      self.registration.showNotification('Sync Complete', {
        body: `${result.synced || 0} test reports synced successfully`,
        icon: '/icons/sync.png',
        tag: 'sync-complete'
      })
    }
  } catch (error) {
    console.error('Error syncing test reports:', error)
  }
}

async function syncPendingNotifications() {
  try {
    console.log('Syncing pending notifications...')
    
    const response = await fetch('/api/sync/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (response.ok) {
      console.log('Notifications sync completed')
    }
  } catch (error) {
    console.error('Error syncing notifications:', error)
  }
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'daily-reports') {
    event.waitUntil(generateDailyReports())
  }
})

async function generateDailyReports() {
  try {
    await fetch('/api/reports/daily-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    console.log('Daily reports generated')
  } catch (error) {
    console.error('Error generating daily reports:', error)
  }
}