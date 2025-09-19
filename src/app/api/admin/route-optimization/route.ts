import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { createClient } from '@supabase/supabase-js';
import { optimizeRoute, type Location, type RouteOptimizationParams } from '@/lib/route-optimization';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { startLocation, destinations, options = {} } = body;

    if (!startLocation || !destinations || !Array.isArray(destinations)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // Validate locations have required fields
    const validateLocation = (loc: any): loc is Location => {
      return loc && 
             typeof loc.id === 'string' && 
             typeof loc.address === 'string' && 
             typeof loc.latitude === 'number' && 
             typeof loc.longitude === 'number';
    };

    if (!validateLocation(startLocation)) {
      return NextResponse.json(
        { success: false, error: 'Invalid start location format' },
        { status: 400 }
      );
    }

    const validDestinations = destinations.filter(validateLocation);
    if (validDestinations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid destinations provided' },
        { status: 400 }
      );
    }

    // Prepare optimization parameters
    const params: RouteOptimizationParams = {
      startLocation,
      destinations: validDestinations,
      vehicleCapacity: options.vehicleCapacity || undefined,
      maxRouteTime: options.maxRouteTime || 480, // 8 hours default
      trafficConsideration: options.trafficConsideration ?? true,
      prioritizeTimeWindows: options.prioritizeTimeWindows ?? true
    };

    // Perform route optimization
    const result = await optimizeRoute(params);

    // Log the optimization request for analytics
    try {
      await supabase.from('audit_logs').insert({
        event_type: 'route_optimization',
        user_id: null, // Would be set from auth in a real implementation
        entity_type: 'route',
        entity_id: null,
        metadata: {
          locations_count: destinations.length,
          total_distance: result.totalDistance,
          total_time: result.totalTime,
          efficiency_score: result.routes[0]?.efficiency || 0,
          algorithm: result.metadata.algorithm,
          processing_time: result.metadata.processingTime
        },
        severity: 'low',
        success: true
      });
    } catch (logError) {
      console.error('Failed to log route optimization:', logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Route optimization API error:', error);
    
    // Log the error
    try {
      await supabase.from('audit_logs').insert({
        event_type: 'route_optimization_error',
        user_id: null,
        entity_type: 'route',
        entity_id: null,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        },
        severity: 'high',
        success: false,
        error_message: error instanceof Error ? error.message : 'Route optimization failed'
      });
    } catch (logError) {
      console.error('Failed to log route optimization error:', logError);
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Route optimization failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Fetch appointments for the specified date to suggest locations
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_date,
        customer:customers (
          id,
          first_name,
          last_name,
          address_line1,
          city,
          state,
          zip_code
        )
      `)
      .gte('scheduled_date', `${date}T00:00:00`)
      .lte('scheduled_date', `${date}T23:59:59`)
      .eq('status', 'scheduled')
      .order('scheduled_date', { ascending: true });

    if (error) {
      throw error;
    }

    // Convert appointments to suggested locations
    const suggestedLocations: Location[] = (appointments || []).map((appointment: any) => ({
      id: appointment.id,
      name: appointment.customer ? `${appointment.customer.first_name || ''} ${appointment.customer.last_name || ''}`.trim() || 'Unknown Customer' : 'Unknown Customer',
      address: `${appointment.customer?.address_line1 || ''} ${appointment.customer?.city || ''} ${appointment.customer?.state || ''} ${appointment.customer?.zip_code || ''}`.trim(),
      latitude: 47.2529 + (Math.random() - 0.5) * 0.1, // Mock coordinates - would use geocoding
      longitude: -122.4443 + (Math.random() - 0.5) * 0.1,
      priority: 'medium' as const,
      estimatedServiceTime: 60, // Default 1 hour
      timeWindow: {
        start: '08:00',
        end: '17:00'
      }
    }));

    return NextResponse.json({
      success: true,
      data: {
        date,
        suggestedLocations,
        count: suggestedLocations.length
      }
    });

  } catch (error) {
    console.error('Route suggestions API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch route suggestions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}