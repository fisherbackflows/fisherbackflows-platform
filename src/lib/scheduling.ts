/**
 * Smart Scheduling & Route Optimization - Fisher Backflows
 * Automatically schedule tests and optimize technician routes
 */

import { supabaseAdmin } from './supabase';
import { logger } from './logger';
import { sendEmail, emailTemplates } from './email';

interface Location {
  address: string;
  lat?: number;
  lng?: number;
}

interface ScheduleSlot {
  date: string;
  startTime: string;
  endTime: string;
  technicianId: string;
  isAvailable: boolean;
}

interface RouteStop {
  appointmentId: string;
  customerId: string;
  customerName: string;
  address: string;
  deviceType: string;
  estimatedDuration: number;
  priority: number;
  lat?: number;
  lng?: number;
}

export class SchedulingEngine {
  
  /**
   * Auto-schedule upcoming tests based on due dates and technician availability
   */
  async autoScheduleTests(): Promise<{ scheduled: number; errors: number }> {
    if (!supabaseAdmin) return { scheduled: 0, errors: 0 };

    let scheduled = 0;
    let errors = 0;

    try {
      // Get devices needing tests in next 60 days without appointments
      const { data: devicesNeedingTests } = await supabaseAdmin
        .from('devices')
        .select(`
          *,
          customer:customers(*),
          appointments!left(id, status)
        `)
        .lt('next_test_date', new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .eq('status', 'active');

      if (!devicesNeedingTests?.length) return { scheduled, errors };

      // Filter out devices that already have active appointments
      const devicesNeedingScheduling = devicesNeedingTests.filter(device => {
        const appointments = (device as any).appointments || [];
        return !appointments.some((apt: any) => 
          ['scheduled', 'confirmed', 'in_progress'].includes(apt.status)
        );
      });

      // Get available technicians
      const { data: technicians } = await supabaseAdmin
        .from('team_users')
        .select('*')
        .eq('role', 'tester')
        .eq('is_active', true);

      if (!technicians?.length) {
        logger.warn('No active technicians available for scheduling');
        return { scheduled, errors };
      }

      // Schedule each device
      for (const device of devicesNeedingScheduling) {
        try {
          const customer = (device as any).customer;
          const preferredDate = device.next_test_date;
          
          // Find best technician and time slot
          const assignment = await this.findBestScheduleSlot(
            preferredDate,
            customer.address,
            device.type,
            technicians
          );

          if (assignment) {
            // Create appointment
            const { data: appointment, error } = await supabaseAdmin
              .from('appointments')
              .insert({
                customer_id: customer.id,
                device_id: device.id,
                technician_id: assignment.technicianId,
                scheduled_date: assignment.date,
                scheduled_time: assignment.startTime,
                window_start: assignment.startTime,
                window_end: assignment.endTime,
                status: 'scheduled'
              })
              .select()
              .single();

            if (!error && appointment) {
              scheduled++;
              
              // Send confirmation email
              const template = emailTemplates.testReminder(customer.name, assignment.date);
              await sendEmail({
                to: customer.email,
                subject: `Test Scheduled - ${assignment.date}`,
                html: template.html
              });

              logger.info('Auto-scheduled appointment', {
                customerId: customer.id,
                deviceId: device.id,
                date: assignment.date,
                technicianId: assignment.technicianId
              });
            }
          }
        } catch (error) {
          errors++;
          logger.error('Failed to schedule device', error);
        }
      }

      return { scheduled, errors };
    } catch (error) {
      logger.error('Auto-scheduling failed', error);
      return { scheduled, errors };
    }
  }

  /**
   * Find the best available schedule slot for a test
   */
  private async findBestScheduleSlot(
    preferredDate: string,
    customerAddress: string,
    deviceType: string,
    technicians: any[]
  ): Promise<ScheduleSlot | null> {
    
    const testDuration = this.getTestDuration(deviceType);
    const preferredDateTime = new Date(preferredDate);
    
    // Check dates starting from preferred date, then +1, +2, etc.
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const checkDate = new Date(preferredDateTime);
      checkDate.setDate(checkDate.getDate() + dayOffset);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      // Skip weekends (assuming M-F operation)
      if (checkDate.getDay() === 0 || checkDate.getDay() === 6) continue;
      
      for (const tech of technicians) {
        const availableSlot = await this.findAvailableSlot(
          tech.id,
          dateStr,
          testDuration,
          customerAddress
        );
        
        if (availableSlot) {
          return {
            date: dateStr,
            startTime: availableSlot.startTime,
            endTime: availableSlot.endTime,
            technicianId: tech.id,
            isAvailable: true
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Find available time slot for a technician on a specific date
   */
  private async findAvailableSlot(
    technicianId: string,
    date: string,
    durationMinutes: number,
    customerAddress: string
  ): Promise<{ startTime: string; endTime: string } | null> {
    
    if (!supabaseAdmin) return null;

    // Get existing appointments for this technician on this date
    const { data: existingAppointments } = await supabaseAdmin
      .from('appointments')
      .select('scheduled_time, window_start, window_end')
      .eq('technician_id', technicianId)
      .eq('scheduled_date', date)
      .not('status', 'eq', 'cancelled')
      .order('scheduled_time');

    // Working hours: 8 AM to 5 PM
    const workStart = 8 * 60; // 8:00 AM in minutes
    const workEnd = 17 * 60;   // 5:00 PM in minutes
    const slotDuration = durationMinutes + 30; // Include travel time
    
    let currentTime = workStart;
    
    for (const appointment of existingAppointments || []) {
      const aptStart = this.timeToMinutes(appointment.window_start || appointment.scheduled_time);
      const aptEnd = this.timeToMinutes(appointment.window_end || appointment.scheduled_time) + 45; // Assume 45min default
      
      // Check if we can fit a slot before this appointment
      if (currentTime + slotDuration <= aptStart) {
        return {
          startTime: this.minutesToTime(currentTime),
          endTime: this.minutesToTime(currentTime + durationMinutes)
        };
      }
      
      // Move past this appointment
      currentTime = Math.max(currentTime, aptEnd);
    }
    
    // Check if we can fit a slot at the end of the day
    if (currentTime + slotDuration <= workEnd) {
      return {
        startTime: this.minutesToTime(currentTime),
        endTime: this.minutesToTime(currentTime + durationMinutes)
      };
    }
    
    return null;
  }

  /**
   * Optimize daily routes for all technicians
   */
  async optimizeDailyRoutes(date: string): Promise<{ optimized: number; errors: number }> {
    if (!supabaseAdmin) return { optimized: 0, errors: 0 };

    let optimized = 0;
    let errors = 0;

    try {
      // Get all scheduled appointments for the date
      const { data: appointments } = await supabaseAdmin
        .from('appointments')
        .select(`
          *,
          customer:customers(*),
          device:devices(*),
          technician:team_users(*)
        `)
        .eq('scheduled_date', date)
        .in('status', ['scheduled', 'confirmed']);

      if (!appointments?.length) return { optimized, errors };

      // Group by technician
      const technicianGroups = appointments.reduce((groups: any, apt) => {
        const techId = apt.technician_id;
        if (!groups[techId]) groups[techId] = [];
        groups[techId].push(apt);
        return groups;
      }, {});

      // Optimize each technician's route
      for (const [techId, techAppointments] of Object.entries(technicianGroups)) {
        try {
          const optimizedRoute = await this.optimizeRoute(techAppointments as any[]);
          
          // Update appointment times based on optimized route
          for (let i = 0; i < optimizedRoute.length; i++) {
            const apt = optimizedRoute[i];
            const newTime = this.calculateOptimalTime(8, i, apt.estimatedDuration); // Start at 8 AM
            
            await supabaseAdmin
              .from('appointments')
              .update({
                scheduled_time: newTime,
                window_start: newTime,
                window_end: this.addMinutes(newTime, apt.estimatedDuration)
              })
              .eq('id', apt.appointmentId);
          }
          
          optimized++;
        } catch (error) {
          errors++;
          logger.error('Route optimization failed for technician', error);
        }
      }

      return { optimized, errors };
    } catch (error) {
      logger.error('Daily route optimization failed', error);
      return { optimized, errors };
    }
  }

  /**
   * Simple route optimization using nearest-neighbor algorithm
   * In production, would integrate with Google Maps API for real distances
   */
  private async optimizeRoute(appointments: any[]): Promise<RouteStop[]> {
    if (appointments.length <= 1) return appointments;

    const stops: RouteStop[] = appointments.map(apt => ({
      appointmentId: apt.id,
      customerId: apt.customer.id,
      customerName: apt.customer.name,
      address: apt.customer.address,
      deviceType: apt.device.type,
      estimatedDuration: this.getTestDuration(apt.device.type),
      priority: apt.device.next_test_date < new Date().toISOString() ? 2 : 1,
      lat: 0, // Would geocode in production
      lng: 0
    }));

    // Simple optimization: sort by priority first, then by address
    // In production, would use actual distance calculations
    return stops.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return a.address.localeCompare(b.address);
    });
  }

  // Utility functions
  private getTestDuration(deviceType: string): number {
    const durations: Record<string, number> = {
      'RP': 45,
      'DC': 60,
      'PVB': 30,
      'SVB': 45,
      'DAA': 90
    };
    return durations[deviceType] || 45;
  }

  private timeToMinutes(time: string): number {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private addMinutes(time: string, minutes: number): string {
    return this.minutesToTime(this.timeToMinutes(time) + minutes);
  }

  private calculateOptimalTime(startHour: number, index: number, duration: number): string {
    const startTime = startHour * 60 + (index * (duration + 30)); // 30 min travel between stops
    return this.minutesToTime(startTime);
  }
}

// Export singleton instance
export const schedulingEngine = new SchedulingEngine();