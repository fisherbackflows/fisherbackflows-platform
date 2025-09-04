import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createRouteHandlerClient(request)
    const notificationId = id

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date().toISOString()

    // Try to update in all notification tables (since we don't know the type)
    const updatePromises = [
      supabase
        .from('customer_notifications')
        .update({ read_at: now })
        .eq('id', notificationId)
        .select(),
      
      supabase
        .from('technician_notifications')
        .update({ read_at: now })
        .eq('id', notificationId)
        .select(),
      
      supabase
        .from('admin_notifications')
        .update({ read_at: now })
        .eq('id', notificationId)
        .select()
    ]

    const results = await Promise.allSettled(updatePromises)
    let updated = false

    // Check if any update was successful
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.data && result.value.data.length > 0) {
        updated = true
        break
      }
    }

    if (!updated) {
      return NextResponse.json(
        { error: 'Notification not found or already read' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read'
    })

  } catch (error) {
    console.error('Mark notification as read error:', error)
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}