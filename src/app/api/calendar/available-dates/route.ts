import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// You'll need to set these environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const CALENDAR_ID = 'fisherbackflows@gmail.com';

export async function GET(request: NextRequest) {
  try {
    // Cross-reference multiple booking sources
    const allBookingSources = await Promise.all([
      getGoogleCalendarBusyTimes(),
      getPortalBookings(),
      getExternalBookings() // Phone bookings, other systems
    ]);

    const [googleBusy, portalBookings, externalBookings] = allBookingSources;
    
    // Combine all busy times from different sources
    const allBusyTimes = [
      ...googleBusy,
      ...portalBookings,
      ...externalBookings
    ];

    const timeMin = new Date();
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 30);

    const availableDates = calculateAvailableDates(allBusyTimes, timeMin, timeMax);
    
    return NextResponse.json({
      success: true,
      availableDates,
      sources: {
        googleCalendar: googleBusy.length,
        portalBookings: portalBookings.length,
        externalBookings: externalBookings.length,
        totalConflicts: allBusyTimes.length
      }
    });

    // Uncomment below when you have Google Calendar credentials set up
    /*
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
      throw new Error('Google Calendar credentials not configured');
    }

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      refresh_token: GOOGLE_REFRESH_TOKEN
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get the next 30 days
    const timeMin = new Date();
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 30);

    // Get busy times (existing appointments)
    const busyResponse = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: [{ id: CALENDAR_ID }]
      }
    });

    const busyTimes = busyResponse.data.calendars?.[CALENDAR_ID]?.busy || [];
    const availableDates = calculateAvailableDates(busyTimes, timeMin, timeMax);

    return NextResponse.json({
      success: true,
      availableDates
    });
    */

  } catch (error) {
    console.error('Error fetching calendar availability:', error);
    
    // Return mock data on error so the app still works
    const mockAvailableDates = generateAvailableDates();
    
    return NextResponse.json({
      success: true,
      availableDates: mockAvailableDates,
      note: 'Using mock data - Google Calendar not configured'
    });
  }
}

// Get busy times from Google Calendar
async function getGoogleCalendarBusyTimes(): Promise<Array<{ start: string; end: string; source: string }>> {
  try {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
      return []; // Return empty if not configured
    }

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      refresh_token: GOOGLE_REFRESH_TOKEN
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const timeMin = new Date();
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 30);

    const busyResponse = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: [{ id: CALENDAR_ID }]
      }
    });

    const busyTimes = busyResponse.data.calendars?.[CALENDAR_ID]?.busy || [];
    
    return busyTimes.map(busy => ({
      start: busy.start!,
      end: busy.end!,
      source: 'Google Calendar'
    }));

  } catch (error) {
    console.error('Error fetching Google Calendar:', error);
    return [];
  }
}

// Get busy times from portal bookings (database/localStorage)
async function getPortalBookings(): Promise<Array<{ start: string; end: string; source: string }>> {
  try {
    // Mock portal bookings - replace with actual database query
    const mockPortalBookings = [
      {
        date: '2025-01-20',
        time: '10:00 AM',
        duration: 60, // minutes
        customerName: 'John Smith',
        status: 'confirmed'
      },
      {
        date: '2025-01-22',
        time: '2:00 PM', 
        duration: 60,
        customerName: 'Jane Doe',
        status: 'scheduled'
      }
    ];

    return mockPortalBookings
      .filter(booking => booking.status === 'confirmed' || booking.status === 'scheduled')
      .map(booking => {
        const [time, period] = booking.time.split(' ');
        const [hour, minute] = time.split(':');
        let hour24 = parseInt(hour);
        
        if (period === 'PM' && hour24 !== 12) hour24 += 12;
        if (period === 'AM' && hour24 === 12) hour24 = 0;

        const start = new Date(booking.date);
        start.setHours(hour24, parseInt(minute), 0, 0);
        
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + booking.duration);

        return {
          start: start.toISOString(),
          end: end.toISOString(),
          source: 'Portal Booking'
        };
      });

  } catch (error) {
    console.error('Error fetching portal bookings:', error);
    return [];
  }
}

// Get external bookings (phone calls, other booking systems)
async function getExternalBookings(): Promise<Array<{ start: string; end: string; source: string }>> {
  try {
    // Mock external bookings - replace with actual external system integration
    // This could be from:
    // - Phone call bookings you manually enter
    // - Other booking platforms (Calendly, etc.)
    // - Partner referrals
    // - Emergency appointments
    
    const mockExternalBookings = [
      {
        date: '2025-01-21',
        startTime: '9:00 AM',
        endTime: '10:00 AM',
        source: 'Phone Booking',
        notes: 'Emergency repair - called directly'
      },
      {
        date: '2025-01-23',
        startTime: '11:00 AM', 
        endTime: '12:00 PM',
        source: 'Calendly',
        notes: 'Booked through website form'
      }
    ];

    return mockExternalBookings.map(booking => {
      const parseTime = (timeStr: string, date: string) => {
        const [time, period] = timeStr.split(' ');
        const [hour, minute] = time.split(':');
        let hour24 = parseInt(hour);
        
        if (period === 'PM' && hour24 !== 12) hour24 += 12;
        if (period === 'AM' && hour24 === 12) hour24 = 0;

        const dateTime = new Date(date);
        dateTime.setHours(hour24, parseInt(minute || '0'), 0, 0);
        return dateTime;
      };

      return {
        start: parseTime(booking.startTime, booking.date).toISOString(),
        end: parseTime(booking.endTime, booking.date).toISOString(),
        source: booking.source
      };
    });

  } catch (error) {
    console.error('Error fetching external bookings:', error);
    return [];
  }
}

// Generate mock available dates (business days, 7AM-6PM, excluding weekends)
function generateAvailableDates() {
  const availableDates: Array<{
    date: string;
    dayOfWeek: string;
    availableSlots: Array<{
      time: string;
      period: 'morning' | 'afternoon';
    }>;
  }> = [];

  const today = new Date();
  
  // Generate next 21 business days
  for (let i = 1; i <= 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Skip weekends
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    // Skip if we already have enough dates
    if (availableDates.length >= 21) break;

    const dateString = date.toISOString().split('T')[0];
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Generate available time slots (morning and afternoon)
    const slots = [];
    
    // Morning slots: 7AM, 8AM, 9AM, 10AM, 11AM
    for (let hour = 7; hour <= 11; hour++) {
      const time = `${hour}:00 AM`;
      slots.push({
        time,
        period: 'morning' as const
      });
    }
    
    // Afternoon slots: 1PM, 2PM, 3PM, 4PM, 5PM
    for (let hour = 13; hour <= 17; hour++) {
      const time = `${hour - 12}:00 PM`;
      slots.push({
        time,
        period: 'afternoon' as const
      });
    }
    
    availableDates.push({
      date: dateString,
      dayOfWeek: dayName,
      availableSlots: slots
    });
  }
  
  return availableDates;
}

// Calculate available dates based on busy times from all sources
function calculateAvailableDates(
  busyTimes: Array<{ start: string; end: string; source: string }>,
  timeMin: Date,
  timeMax: Date
) {
  const availableDates = [];
  const currentDate = new Date(timeMin);
  
  while (currentDate <= timeMax) {
    // Skip weekends
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const dateString = currentDate.toISOString().split('T')[0];
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      // Check each potential time slot
      const slots = [];
      
      // Business hours: 7AM-6PM
      for (let hour = 7; hour <= 17; hour++) {
        const slotStart = new Date(currentDate);
        slotStart.setHours(hour, 0, 0, 0);
        
        const slotEnd = new Date(currentDate);
        slotEnd.setHours(hour + 1, 0, 0, 0);
        
        // Check if this slot conflicts with any busy time
        const isAvailable = !busyTimes.some(busy => {
          const busyStart = new Date(busy.start);
          const busyEnd = new Date(busy.end);
          
          return (slotStart < busyEnd && slotEnd > busyStart);
        });
        
        if (isAvailable) {
          const time = hour <= 12 
            ? `${hour}:00 ${hour === 12 ? 'PM' : 'AM'}`
            : `${hour - 12}:00 PM`;
            
          slots.push({
            time,
            period: hour < 12 ? 'morning' : 'afternoon'
          });
        }
      }
      
      if (slots.length > 0) {
        availableDates.push({
          date: dateString,
          dayOfWeek: dayName,
          availableSlots: slots
        });
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return availableDates;
}