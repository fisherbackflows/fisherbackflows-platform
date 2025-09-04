import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request)
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const userType = searchParams.get('userType')

    if (!userId || !userType) {
      return NextResponse.json(
        { error: 'userId and userType parameters required' },
        { status: 400 }
      )
    }

    const today = new Date().toISOString().split('T')[0]
    const dashboardData: any = {
      todayAppointments: [],
      notifications: [],
      locationData: null,
      stats: {
        upcoming: 0,
        completed: 0,
        total: 0
      }
    }

    if (userType === 'customer') {
      // Get customer's appointments
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          notes,
          address,
          technician_latitude,
          technician_longitude,
          customer_can_track,
          team_users (
            name,
            phone
          )
        `)
        .eq('customer_id', userId)
        .gte('appointment_date', today)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })

      if (!appointmentsError && appointments) {
        // Today's appointments
        dashboardData.todayAppointments = appointments
          .filter(apt => apt.appointment_date === today)
          .map(apt => ({
            id: apt.id,
            time: apt.appointment_time,
            status: apt.status,
            address: apt.address,
            notes: apt.notes,
            technicianName: apt.team_users?.name,
            technicianPhone: apt.team_users?.phone,
            canTrack: apt.customer_can_track,
            technicianLat: apt.technician_latitude,
            technicianLng: apt.technician_longitude
          }))

        // Stats
        dashboardData.stats = {
          upcoming: appointments.filter(apt => ['scheduled', 'confirmed'].includes(apt.status)).length,
          completed: appointments.filter(apt => apt.status === 'completed').length,
          total: appointments.length
        }
      }

      // Get customer notifications
      const { data: notifications } = await supabase
        .from('customer_notifications')
        .select('*')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      dashboardData.notifications = notifications || []

    } else if (userType === 'technician') {
      // Get technician's appointments
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          notes,
          address,
          customers (
            name,
            phone,
            email
          )
        `)
        .eq('technician_id', userId)
        .gte('appointment_date', today)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })

      if (!appointmentsError && appointments) {
        // Today's appointments
        dashboardData.todayAppointments = appointments
          .filter(apt => apt.appointment_date === today)
          .map(apt => ({
            id: apt.id,
            time: apt.appointment_time,
            status: apt.status,
            address: apt.address,
            notes: apt.notes,
            customerName: apt.customers?.name,
            customerPhone: apt.customers?.phone,
            customerEmail: apt.customers?.email
          }))

        // Stats
        dashboardData.stats = {
          upcoming: appointments.filter(apt => ['scheduled', 'confirmed'].includes(apt.status)).length,
          completed: appointments.filter(apt => apt.status === 'completed').length,
          total: appointments.length
        }
      }

      // Get technician's current location
      const { data: currentLocation } = await supabase
        .from('technician_current_location')
        .select('*')
        .eq('technician_id', userId)
        .eq('is_active', true)
        .single()

      dashboardData.locationData = currentLocation

      // Get technician notifications
      const { data: notifications } = await supabase
        .from('technician_notifications')
        .select('*')
        .eq('technician_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      dashboardData.notifications = notifications || []

    } else if (userType === 'admin') {
      // Get admin overview data
      const { data: allAppointments } = await supabase
        .from('appointments')
        .select('id, status, appointment_date')
        .gte('appointment_date', today)

      if (allAppointments) {
        const todayAppointments = allAppointments.filter(apt => apt.appointment_date === today)
        
        dashboardData.stats = {
          upcoming: allAppointments.filter(apt => ['scheduled', 'confirmed'].includes(apt.status)).length,
          completed: allAppointments.filter(apt => apt.status === 'completed').length,
          total: allAppointments.length
        }

        // Get detailed today appointments for admin
        const { data: detailedAppointments } = await supabase
          .from('appointments')
          .select(`
            id,
            appointment_time,
            status,
            address,
            customers (name, phone),
            team_users (name, phone)
          `)
          .eq('appointment_date', today)
          .order('appointment_time', { ascending: true })

        dashboardData.todayAppointments = detailedAppointments?.map(apt => ({
          id: apt.id,
          time: apt.appointment_time,
          status: apt.status,
          address: apt.address,
          customerName: apt.customers?.name,
          customerPhone: apt.customers?.phone,
          technicianName: apt.team_users?.name,
          technicianPhone: apt.team_users?.phone
        })) || []
      }

      // Get system notifications
      const { data: notifications } = await supabase
        .from('admin_notifications')
        .select('*')
        .eq('admin_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      dashboardData.notifications = notifications || []
    }

    // Add contextual insights based on data
    dashboardData.insights = generateInsights(dashboardData, userType)

    return NextResponse.json({
      success: true,
      data: dashboardData,
      generated_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Mobile dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}

function generateInsights(data: any, userType: string) {
  const insights: any = {
    tips: [],
    alerts: [],
    opportunities: []
  }

  if (userType === 'customer') {
    if (data.todayAppointments.length > 0) {
      const nextAppointment = data.todayAppointments[0]
      const appointmentTime = new Date(`${new Date().toISOString().split('T')[0]}T${nextAppointment.time}`)
      const hoursUntil = Math.round((appointmentTime.getTime() - Date.now()) / (1000 * 60 * 60))
      
      if (hoursUntil <= 2 && hoursUntil > 0) {
        insights.alerts.push(`Your technician will arrive in approximately ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}`)
      }
      
      if (nextAppointment.canTrack) {
        insights.tips.push('You can track your technician\'s real-time location in the Location tab')
      }
    }

    if (data.stats.upcoming === 0) {
      insights.opportunities.push('Schedule your annual backflow test to stay compliant')
    }

  } else if (userType === 'technician') {
    if (data.todayAppointments.length > 0) {
      insights.tips.push(`You have ${data.todayAppointments.length} appointment${data.todayAppointments.length > 1 ? 's' : ''} today`)
      
      if (data.todayAppointments.length > 2) {
        insights.opportunities.push('Consider optimizing your route to save time and fuel')
      }
    }

    if (data.locationData) {
      const lastUpdate = new Date(data.locationData.last_updated)
      const minutesAgo = Math.round((Date.now() - lastUpdate.getTime()) / 60000)
      
      if (minutesAgo > 30) {
        insights.alerts.push('Location tracking may be outdated - ensure GPS is enabled')
      }
    } else {
      insights.tips.push('Enable location tracking to help customers track your arrival')
    }

  } else if (userType === 'admin') {
    if (data.stats.upcoming > 10) {
      insights.opportunities.push('High appointment volume today - consider route optimization')
    }

    const completionRate = data.stats.total > 0 ? (data.stats.completed / data.stats.total) * 100 : 0
    if (completionRate < 80) {
      insights.alerts.push(`Appointment completion rate is ${Math.round(completionRate)}% - review scheduling`)
    }
  }

  return insights
}