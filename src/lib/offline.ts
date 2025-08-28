// Offline storage and synchronization for field app
interface OfflineData {
  appointments: any[]
  testReports: any[]
  pendingSync: {
    testReports: any[]
    statusUpdates: any[]
  }
  lastSync: string
}

const OFFLINE_STORAGE_KEY = 'fisher_backflows_offline'
const SYNC_RETRY_INTERVAL = 30000 // 30 seconds

// Initialize offline storage
export function initOfflineStorage(): OfflineData {
  const stored = localStorage.getItem(OFFLINE_STORAGE_KEY)
  
  const defaultData: OfflineData = {
    appointments: [],
    testReports: [],
    pendingSync: {
      testReports: [],
      statusUpdates: []
    },
    lastSync: new Date().toISOString()
  }

  if (stored) {
    try {
      return { ...defaultData, ...JSON.parse(stored) }
    } catch (error) {
      console.error('Error parsing offline storage:', error)
      return defaultData
    }
  }

  return defaultData
}

// Save data to offline storage
export function saveOfflineData(data: Partial<OfflineData>) {
  try {
    const current = getOfflineData()
    const updated = { ...current, ...data, lastSync: new Date().toISOString() }
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (error) {
    console.error('Error saving offline data:', error)
    return null
  }
}

// Get offline data
export function getOfflineData(): OfflineData {
  return initOfflineStorage()
}

// Store appointment data for offline access
export function cacheAppointments(appointments: any[]) {
  return saveOfflineData({ appointments })
}

// Store test report locally when offline
export function storeTestReportOffline(testReport: any) {
  const data = getOfflineData()
  
  // Add to pending sync queue
  data.pendingSync.testReports.push({
    ...testReport,
    id: `offline_${Date.now()}_${Math.random().toString(36)}`,
    createdOffline: true,
    timestamp: new Date().toISOString()
  })

  // Also add to local test reports for immediate UI update
  data.testReports.push(testReport)

  return saveOfflineData(data)
}

// Store appointment status update when offline
export function storeStatusUpdateOffline(appointmentId: string, status: string) {
  const data = getOfflineData()
  
  data.pendingSync.statusUpdates.push({
    appointmentId,
    status,
    timestamp: new Date().toISOString()
  })

  // Update local appointment status
  data.appointments = data.appointments.map(apt => 
    apt.id === appointmentId ? { ...apt, status } : apt
  )

  return saveOfflineData(data)
}

// Check if we're online
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

// Sync pending data when connection restored
export async function syncPendingData(): Promise<{ success: boolean; synced: number; errors: number }> {
  if (!isOnline()) {
    return { success: false, synced: 0, errors: 0 }
  }

  const data = getOfflineData()
  let synced = 0
  let errors = 0

  try {
    // Sync test reports
    for (const testReport of data.pendingSync.testReports) {
      try {
        const response = await fetch('/api/test-reports/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...testReport,
            syncedFromOffline: true
          })
        })

        if (response.ok) {
          synced++
          console.log('✅ Synced test report:', testReport.id)
        } else {
          errors++
          console.error('❌ Failed to sync test report:', testReport.id)
        }
      } catch (error) {
        errors++
        console.error('❌ Error syncing test report:', error)
      }
    }

    // Sync status updates
    for (const update of data.pendingSync.statusUpdates) {
      try {
        const response = await fetch(`/api/appointments/${update.appointmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: update.status,
            syncedFromOffline: true
          })
        })

        if (response.ok) {
          synced++
          console.log('✅ Synced status update:', update.appointmentId)
        } else {
          errors++
          console.error('❌ Failed to sync status update:', update.appointmentId)
        }
      } catch (error) {
        errors++
        console.error('❌ Error syncing status update:', error)
      }
    }

    // Clear successfully synced data
    if (synced > 0) {
      saveOfflineData({
        pendingSync: {
          testReports: errors > 0 ? data.pendingSync.testReports.slice(-errors) : [],
          statusUpdates: errors > 0 ? data.pendingSync.statusUpdates.slice(-errors) : []
        }
      })
    }

    return { success: errors === 0, synced, errors }

  } catch (error) {
    console.error('Error during sync:', error)
    return { success: false, synced, errors: errors + 1 }
  }
}

// Get pending sync count
export function getPendingSyncCount(): number {
  const data = getOfflineData()
  return data.pendingSync.testReports.length + data.pendingSync.statusUpdates.length
}

// Clear all offline data
export function clearOfflineData() {
  localStorage.removeItem(OFFLINE_STORAGE_KEY)
}

// Auto-sync when connection restored
let syncInterval: NodeJS.Timeout | null = null

export function startAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval)
  }

  // Check for pending sync every 30 seconds
  syncInterval = setInterval(async () => {
    if (isOnline() && getPendingSyncCount() > 0) {
      console.log('🔄 Auto-syncing pending data...')
      const result = await syncPendingData()
      
      if (result.success) {
        console.log(`✅ Auto-sync completed: ${result.synced} items synced`)
      } else {
        console.log(`⚠️ Auto-sync partial: ${result.synced} synced, ${result.errors} errors`)
      }
    }
  }, SYNC_RETRY_INTERVAL)
}

export function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
  }
}

// Listen for online/offline events
export function setupOfflineDetection(
  onOnline?: () => void,
  onOffline?: () => void
) {
  if (typeof window === 'undefined') return

  const handleOnline = () => {
    console.log('📶 Connection restored - starting auto-sync')
    startAutoSync()
    onOnline?.()
  }

  const handleOffline = () => {
    console.log('📵 Connection lost - offline mode activated')
    stopAutoSync()
    onOffline?.()
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Start auto-sync if online
  if (isOnline()) {
    startAutoSync()
  }

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    stopAutoSync()
  }
}

// Hook for offline functionality
export function useOfflineMode() {
  if (typeof window === 'undefined') {
    return {
      isOnline: true,
      pendingSync: 0,
      sync: async () => ({ success: true, synced: 0, errors: 0 }),
      storeTestReport: () => null,
      storeStatusUpdate: () => null
    }
  }

  return {
    isOnline: isOnline(),
    pendingSync: getPendingSyncCount(),
    sync: syncPendingData,
    storeTestReport: storeTestReportOffline,
    storeStatusUpdate: storeStatusUpdateOffline,
    cacheAppointments,
    getOfflineData,
    clearData: clearOfflineData
  }
}