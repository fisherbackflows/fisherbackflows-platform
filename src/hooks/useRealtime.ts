import { useEffect, useRef } from 'react'
import { 
  subscribeToAppointments, 
  subscribeToTestReports, 
  subscribeToInvoices,
  subscribeToPayments,
  RealtimeSubscription 
} from '@/lib/realtime'

// Hook for appointment real-time updates
export function useAppointmentUpdates(
  callback: (appointment: any, event: 'INSERT' | 'UPDATE' | 'DELETE') => void,
  filters?: { customerId?: string; technicianId?: string; date?: string }
) {
  const subscriptionRef = useRef<RealtimeSubscription | null>(null)

  useEffect(() => {
    subscriptionRef.current = subscribeToAppointments(callback, filters)

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [callback, filters?.customerId, filters?.technicianId, filters?.date])

  return {
    isConnected: !!subscriptionRef.current,
    unsubscribe: () => subscriptionRef.current?.unsubscribe()
  }
}

// Hook for test report real-time updates
export function useTestReportUpdates(
  callback: (testReport: any, event: 'INSERT' | 'UPDATE' | 'DELETE') => void,
  customerId?: string
) {
  const subscriptionRef = useRef<RealtimeSubscription | null>(null)

  useEffect(() => {
    subscriptionRef.current = subscribeToTestReports(callback, customerId)

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [callback, customerId])

  return {
    isConnected: !!subscriptionRef.current,
    unsubscribe: () => subscriptionRef.current?.unsubscribe()
  }
}

// Hook for invoice real-time updates
export function useInvoiceUpdates(
  callback: (invoice: any, event: 'INSERT' | 'UPDATE' | 'DELETE') => void,
  customerId?: string
) {
  const subscriptionRef = useRef<RealtimeSubscription | null>(null)

  useEffect(() => {
    subscriptionRef.current = subscribeToInvoices(callback, customerId)

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [callback, customerId])

  return {
    isConnected: !!subscriptionRef.current,
    unsubscribe: () => subscriptionRef.current?.unsubscribe()
  }
}

// Hook for payment real-time updates
export function usePaymentUpdates(
  callback: (payment: any, event: 'INSERT' | 'UPDATE' | 'DELETE') => void,
  customerId?: string
) {
  const subscriptionRef = useRef<RealtimeSubscription | null>(null)

  useEffect(() => {
    subscriptionRef.current = subscribeToPayments(callback, customerId)

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [callback, customerId])

  return {
    isConnected: !!subscriptionRef.current,
    unsubscribe: () => subscriptionRef.current?.unsubscribe()
  }
}

// Combined hook for customer portal (appointments + invoices + payments)
export function useCustomerUpdates(
  customerId: string,
  callbacks: {
    onAppointmentUpdate?: (appointment: any, event: 'INSERT' | 'UPDATE' | 'DELETE') => void
    onInvoiceUpdate?: (invoice: any, event: 'INSERT' | 'UPDATE' | 'DELETE') => void
    onPaymentUpdate?: (payment: any, event: 'INSERT' | 'UPDATE' | 'DELETE') => void
    onTestReportUpdate?: (testReport: any, event: 'INSERT' | 'UPDATE' | 'DELETE') => void
  }
) {
  const appointmentSub = useAppointmentUpdates(
    callbacks.onAppointmentUpdate || (() => {}), 
    { customerId }
  )
  
  const invoiceSub = useInvoiceUpdates(
    callbacks.onInvoiceUpdate || (() => {}), 
    customerId
  )
  
  const paymentSub = usePaymentUpdates(
    callbacks.onPaymentUpdate || (() => {}), 
    customerId
  )
  
  const testReportSub = useTestReportUpdates(
    callbacks.onTestReportUpdate || (() => {}), 
    customerId
  )

  return {
    connections: {
      appointments: appointmentSub.isConnected,
      invoices: invoiceSub.isConnected,
      payments: paymentSub.isConnected,
      testReports: testReportSub.isConnected
    },
    unsubscribeAll: () => {
      appointmentSub.unsubscribe()
      invoiceSub.unsubscribe()
      paymentSub.unsubscribe()
      testReportSub.unsubscribe()
    }
  }
}

// Hook for field tech updates (today's appointments)
export function useFieldTechUpdates(
  technicianName: string,
  callbacks: {
    onAppointmentUpdate?: (appointment: any, event: 'INSERT' | 'UPDATE' | 'DELETE') => void
    onTestReportUpdate?: (testReport: any, event: 'INSERT' | 'UPDATE' | 'DELETE') => void
  }
) {
  const today = new Date().toISOString().split('T')[0]
  
  const appointmentSub = useAppointmentUpdates(
    callbacks.onAppointmentUpdate || (() => {}), 
    { date: today }
  )
  
  const testReportSub = useTestReportUpdates(
    callbacks.onTestReportUpdate || (() => {})
  )

  return {
    connections: {
      appointments: appointmentSub.isConnected,
      testReports: testReportSub.isConnected
    },
    unsubscribeAll: () => {
      appointmentSub.unsubscribe()
      testReportSub.unsubscribe()
    }
  }
}