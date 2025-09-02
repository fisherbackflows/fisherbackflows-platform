import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request)
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      technicianId,
      appointmentId,
      latitude,
      longitude,
      accuracy,
      heading,
      speed,
      timestamp,
      address
    } = await request.json()

    // Validate required fields
    if (!technicianId || !latitude || !longitude) {
      return NextResponse.json(
        { error: 'Missing required fields: technicianId, latitude, longitude' },
        { status: 400 }
      )
    }

    // Store location in database
    const { data, error } = await supabase
      .from('technician_locations')
      .insert({
        technician_id: technicianId,
        appointment_id: appointmentId,
        latitude,
        longitude,
        accuracy,
        heading,
        speed,
        address,
        recorded_at: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to store location' },
        { status: 500 }
      )
    }

    // Update current technician position (for real-time tracking)
    await supabase
      .from('technician_current_location')
      .upsert({
        technician_id: technicianId,
        latitude,
        longitude,
        accuracy,
        heading,
        speed,
        address,
        last_updated: new Date().toISOString()
      })

    // If there's an appointment ID, update the appointment with location
    if (appointmentId) {
      await supabase
        .from('appointments')
        .update({
          technician_latitude: latitude,
          technician_longitude: longitude,
          technician_last_location: new Date().toISOString()
        })
        .eq('id', appointmentId)
    }

    // Send real-time update to customers if they're tracking
    // This would integrate with your WebSocket/realtime system
    if (appointmentId) {
      // Publish location update for real-time subscribers
      const channel = supabase.channel(`appointment-${appointmentId}`)
      channel.send({
        type: 'broadcast',
        event: 'technician_location',
        payload: {
          appointmentId,
          technicianId,
          latitude,
          longitude,
          accuracy,
          address,
          timestamp: new Date().toISOString()
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Location updated successfully',
      data: { latitude, longitude, timestamp: new Date().toISOString() }
    })

  } catch (error) {
    console.error('Location API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request)
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const technicianId = searchParams.get('technicianId')
    const appointmentId = searchParams.get('appointmentId')
    const hours = parseInt(searchParams.get('hours') || '24')

    if (!technicianId) {
      return NextResponse.json(
        { error: 'technicianId parameter required' },
        { status: 400 }
      )
    }

    // Get location history
    let query = supabase
      .from('technician_locations')
      .select('*')
      .eq('technician_id', technicianId)
      .gte('recorded_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('recorded_at', { ascending: false })

    if (appointmentId) {
      query = query.eq('appointment_id', appointmentId)
    }

    const { data: locations, error } = await query.limit(100)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch location history' },
        { status: 500 }
      )
    }

    // Get current location
    const { data: currentLocation } = await supabase
      .from('technician_current_location')
      .select('*')
      .eq('technician_id', technicianId)
      .single()

    // Calculate total distance traveled
    let totalDistance = 0
    if (locations.length > 1) {
      for (let i = 1; i < locations.length; i++) {
        const prev = locations[i]
        const curr = locations[i - 1]
        totalDistance += calculateDistance(
          prev.latitude,
          prev.longitude,
          curr.latitude,
          curr.longitude
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        current: currentLocation,
        history: locations,
        stats: {
          totalDistance: Math.round(totalDistance),
          totalPoints: locations.length,
          timeRange: hours,
          averageAccuracy: locations.length > 0 
            ? Math.round(locations.reduce((sum, loc) => sum + (loc.accuracy || 0), 0) / locations.length)
            : 0
        }
      }
    })

  } catch (error) {
    console.error('Location GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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