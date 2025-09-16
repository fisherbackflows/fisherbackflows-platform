import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { createRouteHandlerClient } from '@/lib/supabase';

interface ConflictResolution {
  appointmentId: string;
  action: 'reschedule' | 'shorten' | 'notify' | 'cancel';
  newDate?: string;
  newTime?: string;
  newDuration?: number;
  reason: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conflicts, resolutions }: { 
      conflicts: string[], 
      resolutions: ConflictResolution[] 
    } = body;
    
    if (!conflicts || !resolutions) {
      return NextResponse.json(
        { error: 'Conflicts and resolutions are required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient(request);
    
    const resolvedConflicts = [];
    const failedResolutions = [];

    // Process each conflict resolution
    for (const resolution of resolutions) {
      try {
        const { data: appointment, error: fetchError } = await supabase
          .from('appointments')
          .select('*')
          .eq('id', resolution.appointmentId)
          .single();

        if (fetchError) {
          failedResolutions.push({
            appointmentId: resolution.appointmentId,
            error: 'Appointment not found',
            resolution
          });
          continue;
        }

        switch (resolution.action) {
          case 'reschedule':
            if (resolution.newDate && resolution.newTime) {
              // Check if new slot is available
              const { data: conflictCheck } = await supabase
                .from('appointments')
                .select('id')
                .eq('scheduled_date', resolution.newDate)
                .eq('scheduled_time_start', resolution.newTime)
                .neq('status', 'cancelled')
                .neq('id', resolution.appointmentId);

              if (conflictCheck && conflictCheck.length > 0) {
                failedResolutions.push({
                  appointmentId: resolution.appointmentId,
                  error: 'New time slot is not available',
                  resolution
                });
                continue;
              }

              // Update appointment
              const { error: updateError } = await supabase
                .from('appointments')
                .update({
                  scheduled_date: resolution.newDate,
                  scheduled_time_start: resolution.newTime,
                  special_instructions: `${appointment.special_instructions || ''}\nRescheduled: ${resolution.reason}`.trim(),
                  updated_at: new Date().toISOString()
                })
                .eq('id', resolution.appointmentId);

              if (updateError) {
                failedResolutions.push({
                  appointmentId: resolution.appointmentId,
                  error: updateError.message,
                  resolution
                });
              } else {
                resolvedConflicts.push({
                  appointmentId: resolution.appointmentId,
                  action: 'rescheduled',
                  oldDate: appointment.scheduled_date,
                  oldTime: appointment.scheduled_time_start,
                  newDate: resolution.newDate,
                  newTime: resolution.newTime,
                  reason: resolution.reason
                });
              }
            }
            break;

          case 'shorten':
            if (resolution.newDuration) {
              const { error: updateError } = await supabase
                .from('appointments')
                .update({
                  estimated_duration: resolution.newDuration,
                  special_instructions: `${appointment.special_instructions || ''}\nDuration shortened: ${resolution.reason}`.trim(),
                  updated_at: new Date().toISOString()
                })
                .eq('id', resolution.appointmentId);

              if (updateError) {
                failedResolutions.push({
                  appointmentId: resolution.appointmentId,
                  error: updateError.message,
                  resolution
                });
              } else {
                resolvedConflicts.push({
                  appointmentId: resolution.appointmentId,
                  action: 'shortened',
                  oldDuration: appointment.estimated_duration,
                  newDuration: resolution.newDuration,
                  reason: resolution.reason
                });
              }
            }
            break;

          case 'notify':
            // Add conflict notification to appointment
            const { error: notifyError } = await supabase
              .from('appointments')
              .update({
                special_instructions: `${appointment.special_instructions || ''}\nCONFLICT NOTICE: ${resolution.reason}`.trim(),
                updated_at: new Date().toISOString()
              })
              .eq('id', resolution.appointmentId);

            if (notifyError) {
              failedResolutions.push({
                appointmentId: resolution.appointmentId,
                error: notifyError.message,
                resolution
              });
            } else {
              resolvedConflicts.push({
                appointmentId: resolution.appointmentId,
                action: 'notified',
                reason: resolution.reason
              });
            }
            break;

          case 'cancel':
            const { error: cancelError } = await supabase
              .from('appointments')
              .update({
                status: 'cancelled',
                special_instructions: `${appointment.special_instructions || ''}\nCancelled due to conflict: ${resolution.reason}`.trim(),
                updated_at: new Date().toISOString()
              })
              .eq('id', resolution.appointmentId);

            if (cancelError) {
              failedResolutions.push({
                appointmentId: resolution.appointmentId,
                error: cancelError.message,
                resolution
              });
            } else {
              resolvedConflicts.push({
                appointmentId: resolution.appointmentId,
                action: 'cancelled',
                reason: resolution.reason
              });
            }
            break;

          default:
            failedResolutions.push({
              appointmentId: resolution.appointmentId,
              error: 'Unknown resolution action',
              resolution
            });
        }
      } catch (error) {
        console.error(`Error resolving conflict for appointment ${resolution.appointmentId}:`, error);
        failedResolutions.push({
          appointmentId: resolution.appointmentId,
          error: 'Processing error',
          resolution
        });
      }
    }

    // Log conflict resolution activity
    try {
      await supabase
        .from('audit_logs')
        .insert({
          action: 'conflict_resolution',
          resource_type: 'appointments',
          details: {
            totalConflicts: conflicts.length,
            resolved: resolvedConflicts.length,
            failed: failedResolutions.length,
            resolutions: resolvedConflicts
          }
        });
    } catch (logError) {
      console.warn('Failed to log conflict resolution activity:', logError);
    }

    const allResolved = failedResolutions.length === 0;
    const partialSuccess = resolvedConflicts.length > 0 && failedResolutions.length > 0;

    return NextResponse.json({
      success: allResolved,
      partialSuccess,
      resolved: resolvedConflicts,
      failed: failedResolutions,
      summary: {
        total: resolutions.length,
        resolved: resolvedConflicts.length,
        failed: failedResolutions.length,
        successRate: (resolvedConflicts.length / resolutions.length) * 100
      },
      message: allResolved 
        ? `Successfully resolved all ${resolvedConflicts.length} conflicts`
        : partialSuccess
        ? `Resolved ${resolvedConflicts.length} of ${resolutions.length} conflicts`
        : 'Failed to resolve conflicts'
    });
    
  } catch (error) {
    console.error('Conflict resolution API error:', error);
    return NextResponse.json({ 
      error: 'Server error during conflict resolution' 
    }, { status: 500 });
  }
}

// GET endpoint to detect conflicts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const appointmentId = searchParams.get('exclude'); // Exclude specific appointment from conflict check
    
    const supabase = createRouteHandlerClient(request);
    
    // Get appointments for conflict analysis
    let query = supabase
      .from('appointments')
      .select(`
        id,
        customer_id,
        scheduled_date,
        scheduled_time_start,
        estimated_duration,
        status,
        customers:customer_id(
          first_name,
          last_name,
          company_name,
          phone,
          street_address,
          city
        )
      `)
      .neq('status', 'cancelled');

    if (date) {
      query = query.eq('scheduled_date', date);
    } else {
      // Check next 7 days if no date specified
      const today = new Date();
      const weekFromNow = new Date();
      weekFromNow.setDate(today.getDate() + 7);
      
      query = query
        .gte('scheduled_date', today.toISOString().split('T')[0])
        .lte('scheduled_date', weekFromNow.toISOString().split('T')[0]);
    }

    if (appointmentId) {
      query = query.neq('id', appointmentId);
    }

    const { data: appointments, error } = await query;

    if (error) {
      console.error('Error fetching appointments for conflict check:', error);
      return NextResponse.json({ error: 'Failed to check conflicts' }, { status: 500 });
    }

    // Analyze for conflicts
    const conflicts = [];
    const sortedAppointments = appointments?.sort((a, b) => {
      const dateCompare = a.scheduled_date.localeCompare(b.scheduled_date);
      if (dateCompare !== 0) return dateCompare;
      return a.scheduled_time_start.localeCompare(b.scheduled_time_start);
    }) || [];

    for (let i = 0; i < sortedAppointments.length - 1; i++) {
      const current = sortedAppointments[i];
      const next = sortedAppointments[i + 1];

      // Only check same-date conflicts
      if (current.scheduled_date === next.scheduled_date) {
        const currentStart = current.scheduled_time_start;
        const currentDuration = current.estimated_duration || 60;
        const nextStart = next.scheduled_time_start;

        // Calculate end time for current appointment
        const [currentHour, currentMinute] = currentStart.substring(0, 5).split(':').map(Number);
        const currentStartMinutes = currentHour * 60 + currentMinute;
        const currentEndMinutes = currentStartMinutes + currentDuration;

        // Calculate start time for next appointment
        const [nextHour, nextMinute] = nextStart.substring(0, 5).split(':').map(Number);
        const nextStartMinutes = nextHour * 60 + nextMinute;

        // Check for overlap (with 15-minute travel buffer)
        if (currentEndMinutes + 15 > nextStartMinutes) {
          conflicts.push({
            type: 'overlap',
            severity: currentEndMinutes > nextStartMinutes ? 'high' : 'medium',
            appointments: [
              {
                id: current.id,
                customerName: current.customers?.company_name || `${current.customers?.first_name} ${current.customers?.last_name}`,
                time: currentStart,
                duration: currentDuration,
                address: current.customers?.street_address
              },
              {
                id: next.id,
                customerName: next.customers?.company_name || `${next.customers?.first_name} ${next.customers?.last_name}`,
                time: nextStart,
                duration: next.estimated_duration || 60,
                address: next.customers?.street_address
              }
            ],
            overlapMinutes: currentEndMinutes - nextStartMinutes,
            suggestedActions: [
              'Reschedule second appointment',
              'Shorten first appointment',
              'Add travel time buffer'
            ]
          });
        }
      }
    }

    // Check for over-capacity days (more than 8 appointments)
    const dateGroups = sortedAppointments.reduce((acc, apt) => {
      const date = apt.scheduled_date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(apt);
      return acc;
    }, {} as Record<string, any[]>);

    Object.entries(dateGroups).forEach(([date, dayAppointments]) => {
      if (dayAppointments.length > 8) {
        conflicts.push({
          type: 'overcapacity',
          severity: 'high',
          date,
          appointmentCount: dayAppointments.length,
          maxCapacity: 8,
          suggestedActions: [
            'Reschedule excess appointments',
            'Extend business hours',
            'Add additional technician'
          ]
        });
      }
    });

    return NextResponse.json({
      success: true,
      conflicts,
      summary: {
        totalConflicts: conflicts.length,
        highSeverity: conflicts.filter(c => c.severity === 'high').length,
        mediumSeverity: conflicts.filter(c => c.severity === 'medium').length,
        appointmentsAffected: conflicts.reduce((acc, c) => 
          acc + (c.appointments?.length || c.appointmentCount || 0), 0
        )
      },
      recommendations: conflicts.length > 0 ? [
        'Review high-severity conflicts first',
        'Consider implementing buffer time between appointments',
        'Use bulk rescheduling tools for efficiency'
      ] : [
        'No scheduling conflicts detected',
        'Current schedule is optimized'
      ]
    });
    
  } catch (error) {
    console.error('Conflict detection API error:', error);
    return NextResponse.json({ 
      error: 'Server error during conflict detection' 
    }, { status: 500 });
  }
}