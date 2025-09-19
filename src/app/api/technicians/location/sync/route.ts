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

    const { technicianId, locations } = await request.json()

    if (!technicianId || !Array.isArray(locations) || locations.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: technicianId and locations array required' },
        { status: 400 }
      )
    }

    // Prepare batch insert data
    const locationData = locations.map(location => ({
      technician_id: technicianId,
      appointment_id: location.appointmentId || null,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      heading: location.heading || null,
      speed: location.speed || null,
      address: location.address || null,
      recorded_at: new Date(location.timestamp).toISOString(),
      created_at: new Date().toISOString(),
      synced_offline: true // Mark as synced from offline storage
    }))

    // Batch insert all locations
    const { data, error } = await supabase
      .from('technician_locations')
      .insert(locationData)

    if (error) {
      console.error('Batch location sync error:', error)
      return NextResponse.json(
        { error: 'Failed to sync locations', details: error.message },
        { status: 500 }
      )
    }

    // Update current location with the most recent one
    const mostRecent = locations.reduce((latest, current) => 
      current.timestamp > latest.timestamp ? current : latest
    )

    await supabase
      .from('technician_current_location')
      .upsert({
        technician_id: technicianId,
        latitude: mostRecent.latitude,
        longitude: mostRecent.longitude,
        accuracy: mostRecent.accuracy,
        heading: mostRecent.heading || null,
        speed: mostRecent.speed || null,
        address: mostRecent.address || null,
        last_updated: new Date(mostRecent.timestamp).toISOString()
      })

    // Calculate sync statistics
    const syncStats = {
      totalSynced: locations.length,
      timeRange: {
        start: new Date(Math.min(...locations.map(l => l.timestamp))).toISOString(),
        end: new Date(Math.max(...locations.map(l => l.timestamp))).toISOString()
      },
      dataPoints: locations.length,
      averageAccuracy: Math.round(
        locations.reduce((sum, loc) => sum + (loc.accuracy || 0), 0) / locations.length
      )
    }

    // Log successful sync for audit
    console.log(`✅ Location sync successful for technician ${technicianId}:`, syncStats)

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${locations.length} location points`,
      data: {
        synced: locations.length,
        stats: syncStats
      }
    })

  } catch (error) {
    console.error('Location sync API error:', error)
    return NextResponse.json(
      { error: 'Internal server error during sync' },
      { status: 500 }
    )
  }
}