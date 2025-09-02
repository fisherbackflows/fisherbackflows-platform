import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, supabaseAdmin } from '@/lib/supabase';
import { sendEmail, emailTemplates } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Verify this is an authorized cron job or admin request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'be9489d8bc62cc3d4ffaf1534132884d';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseAdmin || createRouteHandlerClient(request);
    
    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];
    
    // Find appointments scheduled for tomorrow
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        customer:customers(first_name, last_name, email, phone)
      `)
      .eq('scheduled_date', tomorrowDate)
      .eq('status', 'scheduled');
    
    if (error) {
      console.error('Error fetching appointments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      );
    }
    
    if (!appointments || appointments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No appointments found for tomorrow',
        date: tomorrowDate,
        remindersSent: 0
      });
    }
    
    let remindersSent = 0;
    const failedReminders = [];
    
    // Send reminders for each appointment
    for (const appointment of appointments) {
      if (!appointment.customer?.email) {
        failedReminders.push({
          appointmentId: appointment.id,
          reason: 'No customer email'
        });
        continue;
      }
      
      const customerName = `${appointment.customer.first_name} ${appointment.customer.last_name}`;
      const customerEmail = appointment.customer.email;
      const formattedDate = new Date(appointment.scheduled_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      try {
        const emailTemplate = emailTemplates.testReminder(customerName, formattedDate);
        
        await sendEmail({
          to: customerEmail,
          subject: emailTemplate.subject,
          html: emailTemplate.html
        });
        
        remindersSent++;
        console.log(`✅ Reminder sent to ${customerEmail} for appointment ${appointment.id}`);
        
        // Optional: Update appointment to mark reminder sent
        await supabase
          .from('appointments')
          .update({ reminder_sent: true })
          .eq('id', appointment.id);
        
      } catch (emailError) {
        console.error(`⚠️ Failed to send reminder to ${customerEmail}:`, emailError);
        failedReminders.push({
          appointmentId: appointment.id,
          customerEmail,
          reason: 'Email send failed'
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Sent ${remindersSent} reminders for ${tomorrowDate}`,
      date: tomorrowDate,
      totalAppointments: appointments.length,
      remindersSent,
      failedReminders
    });
    
  } catch (error) {
    console.error('Send reminders API error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

// Manual trigger endpoint for testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  
  if (secret !== (process.env.CRON_SECRET || 'be9489d8bc62cc3d4ffaf1534132884d')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Forward to POST method
  return POST(request);
}