import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient(request)
    const { id: appointmentId } = await params

    // Verify authentication (customer or team member)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get appointment details and verify access
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        id,
        customer_id,
        technician_id,
        customer_can_track,
        status,
        appointment_date,
        customers (
          id,
          email,
          name,
          address,
          latitude,
          longitude
        )
      `)
      .eq('id', appointmentId)
      .single()

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to view location
    const userEmail = user.email
    const isCustomer = appointment.customers?.email === userEmail
    const isTeamMember = await supabase
      .from('team_users')
      .select('id')
      .eq('email', userEmail)
      .single()

    // Customers can only track if explicitly enabled and it's their appointment
    if (isCustomer && !appointment.customer_can_track) {
      return NextResponse.json(
        { error: 'Location tracking not enabled for this appointment' },
        { status: 403 }
      )
    }

    // Non-team members can only view their own appointments
    if (!isTeamMember.data && !isCustomer) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Only track active appointments
    const validStatuses = ['confirmed', 'in_progress', 'traveling', 'on_site']
    if (!validStatuses.includes(appointment.status)) {
      return NextResponse.json({
        success: false,
        message: 'Location tracking not available for this appointment status',
        status: appointment.status
      })
    }

    // Get current technician location
    const { data: currentLocation, error: locationError } = await supabase
      .from('technician_current_location')
      .select('*')
      .eq('technician_id', appointment.technician_id)
      .eq('is_active', true)
      .single()

    if (locationError || !currentLocation) {
      return NextResponse.json({
        success: false,
        message: 'Technician location not available',
        error: 'Location data not found or technician not actively tracking'
      })
    }

    // Calculate distance from customer if customer coordinates available
    let distanceFromCustomer = null
    let estimatedTravelTime = null

    if (appointment.customers?.latitude && appointment.customers?.longitude) {
      const customerLat = parseFloat(appointment.customers.latitude)
      const customerLng = parseFloat(appointment.customers.longitude)
      const techLat = parseFloat(currentLocation.latitude)
      const techLng = parseFloat(currentLocation.longitude)

      // Calculate distance using Haversine formula
      distanceFromCustomer = calculateDistance(customerLat, customerLng, techLat, techLng)
      
      // Estimate travel time (assuming average speed of 50 km/h in urban areas)
      const averageSpeedKmh = 50
      estimatedTravelTime = Math.round((distanceFromCustomer / 1000) / averageSpeedKmh * 60) // minutes
    }

    // Get technician details
    const { data: technician } = await supabase
      .from('team_users')
      .select('name, phone')
      .eq('id', appointment.technician_id)
      .single()

    // Prepare location response
    const locationData = {
      latitude: parseFloat(currentLocation.latitude),
      longitude: parseFloat(currentLocation.longitude),
      accuracy: currentLocation.accuracy,
      address: currentLocation.address,
      lastUpdated: currentLocation.last_updated,
      technicianName: technician?.name,
      technicianPhone: technician?.phone,
      distanceFromCustomer,
      estimatedTravelTime,
      batteryLevel: currentLocation.battery_level,
      speed: currentLocation.speed,
      heading: currentLocation.heading
    }

    // Update appointment with latest location info
    await supabase
      .from('appointments')
      .update({
        technician_latitude: currentLocation.latitude,
        technician_longitude: currentLocation.longitude,
        technician_last_location: currentLocation.last_updated,
        travel_distance_km: distanceFromCustomer ? Math.round(distanceFromCustomer / 100) / 10 : null,
        estimated_arrival: estimatedTravelTime ? 
          new Date(Date.now() + estimatedTravelTime * 60000).toISOString() : null
      })
      .eq('id', appointmentId)

    return NextResponse.json({
      success: true,
      location: locationData,
      appointment: {
        id: appointment.id,
        status: appointment.status,
        customerCanTrack: appointment.customer_can_track,
        appointmentDate: appointment.appointment_date
      }
    })

  } catch (error) {
    console.error('Technician location API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient(request)
    const { id: appointmentId } = await params

    // Verify team member authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: teamMember } = await supabase
      .from('team_users')
      .select('role')
      .eq('email', user.email)
      .single()

    if (!teamMember || !['admin', 'manager', 'technician'].includes(teamMember.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { customerCanTrack } = await request.json()

    // Update tracking permission
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        customer_can_track: customerCanTrack,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: `Location tracking ${customerCanTrack ? 'enabled' : 'disabled'} for appointment`
    })

  } catch (error) {
    console.error('Update tracking permission error:', error)
    return NextResponse.json(
      { error: 'Failed to update tracking permission' },
      { status: 500 }
    )
  }
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}