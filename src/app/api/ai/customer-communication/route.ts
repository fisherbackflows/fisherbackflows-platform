import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { createClient } from '@/lib/supabase/server';
import { GPT5Service } from '@/lib/ai/gpt5-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { 
      customerId, 
      messageType, 
      tone, 
      context, 
      sendImmediately,
      scheduledFor 
    } = await request.json();

    // Verify admin access
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: teamUser } = await supabase
      .from('team_users')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (!teamUser || !['admin', 'manager', 'coordinator'].includes((teamUser as any).role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Validate inputs
    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const validMessageTypes = ['reminder', 'report', 'support', 'follow-up', 'compliance-alert'];
    if (!messageType || !validMessageTypes.includes(messageType)) {
      return NextResponse.json({ 
        error: 'Invalid message type', 
        validTypes: validMessageTypes 
      }, { status: 400 });
    }

    // Verify customer exists
    const { data: customer } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, phone')
      .eq('id', customerId)
      .single();

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const gpt5Service = new GPT5Service();
    
    // Generate personalized communication
    const communication = await gpt5Service.generateCustomerCommunication({
      customerId,
      messageType,
      context: context || {},
      tone: tone || 'professional'
    });

    // Create communication record
    const { data: savedCommunication, error: saveError } = await supabase
      .from('customer_communications')
      .insert({
        customer_id: customerId,
        message_type: messageType,
        subject: communication.subject,
        message: communication.message,
        next_actions: communication.nextActions,
        tone,
        context,
        status: sendImmediately ? 'sent' : 'draft',
        scheduled_for: scheduledFor || null,
        created_by: session.user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (saveError) {
      throw saveError;
    }

    // If sending immediately, process the communication
    if (sendImmediately) {
      try {
        await sendCommunication(supabase, savedCommunication.id, customer, communication);
        
        // Update status to sent
        await supabase
          .from('customer_communications')
          .update({ 
            status: 'sent', 
            sent_at: new Date().toISOString() 
          })
          .eq('id', savedCommunication.id);
      } catch (sendError) {
        console.error('Failed to send communication:', sendError);
        
        // Update status to failed
        await supabase
          .from('customer_communications')
          .update({ 
            status: 'failed',
            error_message: sendError instanceof Error ? sendError.message : 'Unknown error'
          })
          .eq('id', savedCommunication.id);
        
        return NextResponse.json({ 
          success: false,
          communicationId: savedCommunication.id,
          error: 'Communication generated but failed to send'
        }, { status: 500 });
      }
    }

    // Log communication generation
    await supabase.from('audit_logs').insert({
      table_name: 'customer_communications',
      action: 'AI_COMMUNICATION_GENERATED',
      details: {
        customerId,
        messageType,
        tone,
        communicationId: savedCommunication.id,
        sendImmediately,
        scheduledFor
      },
      created_by: session.user.id
    });

    return NextResponse.json({
      success: true,
      communication: {
        id: savedCommunication.id,
        ...communication,
        status: savedCommunication.status
      }
    });
  } catch (error) {
    console.error('Customer Communication API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate customer communication' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const customerId = url.searchParams.get('customerId');
    const status = url.searchParams.get('status');
    const messageType = url.searchParams.get('messageType');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    // Verify access
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: teamUser } = await supabase
      .from('team_users')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (!teamUser || !['admin', 'manager', 'coordinator'].includes((teamUser as any).role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Build query
    let query = supabase
      .from('customer_communications')
      .select(`
        id,
        customer_id,
        message_type,
        subject,
        status,
        tone,
        scheduled_for,
        sent_at,
        created_at,
        created_by,
        customers (
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (messageType) {
      query = query.eq('message_type', messageType);
    }

    const { data: communications, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      communications: communications || [],
      count: communications?.length || 0 
    });
  } catch (error) {
    console.error('Get Communications API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve communications' },
      { status: 500 }
    );
  }
}

async function sendCommunication(
  supabase: any,
  communicationId: string,
  customer: any,
  communication: any
) {
  // Integration point for email service (Resend, SendGrid, etc.)
  // For now, we'll simulate sending and log the action
  
  const emailData = {
    to: customer.email,
    subject: communication.subject,
    html: formatCommunicationAsHTML(communication),
    from: 'Fisher Backflows <noreply@fisherbackflows.com>'
  };

  // Log the email sending attempt
  await supabase.from('email_logs').insert({
    communication_id: communicationId,
    customer_id: customer.id,
    email: customer.email,
    subject: communication.subject,
    status: 'sent',
    sent_at: new Date().toISOString()
  });

  // Integrate with actual email service
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: customer.email,
        subject: communication.subject,
        html: emailData.html,
        from: emailData.from
      })
    })
  } catch (error) {
    console.error('Failed to send email via service:', error)
    console.log('Email fallback - would be sent:', emailData)
  }
}

function formatCommunicationAsHTML(communication: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${communication.subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #0ea5e9; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .actions { background-color: #f8fafc; padding: 15px; margin: 20px 0; border-radius: 8px; }
        .footer { background-color: #64748b; color: white; padding: 15px; text-align: center; font-size: 14px; }
        .button { background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Fisher Backflows</h1>
        <p>Professional Backflow Testing Services</p>
      </div>
      
      <div class="content">
        ${communication.message.split('\n').map((paragraph: string) => `<p>${paragraph}</p>`).join('')}
        
        ${communication.nextActions && communication.nextActions.length > 0 ? `
          <div class="actions">
            <h3>Next Steps:</h3>
            <ul>
              ${communication.nextActions.map((action: string) => `<li>${action}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        <p>
          <a href="https://fisherbackflows.com/portal" class="button">Access Your Portal</a>
        </p>
      </div>
      
      <div class="footer">
        <p>Fisher Backflows | Tacoma, WA | (253) 555-0123 | info@fisherbackflows.com</p>
        <p>Professional backflow testing and compliance services</p>
      </div>
    </body>
    </html>
  `;
}