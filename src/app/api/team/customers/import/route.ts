import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs';
import { createClient } from '@supabase/supabase-js'
import { getTeamSession } from '@/lib/team-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Get team session to identify company
    const session = await getTeamSession(request)
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the company_id for this team member
    const { data: teamUser, error: teamError } = await supabase
      .from('team_users')
      .select('company_id, role')
      .eq('id', session.userId)
      .single()

    if (teamError || !teamUser) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    // Check if user has permission to import customers
    if (!['admin', 'owner', 'manager'].includes(teamUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { customers } = await request.json()

    if (!customers || !Array.isArray(customers)) {
      return NextResponse.json({ error: 'Invalid customer data' }, { status: 400 })
    }

    // Check company limits
    const { data: company } = await supabase
      .from('companies')
      .select('features')
      .eq('id', teamUser.company_id)
      .single()

    const maxCustomers = company?.features?.max_customers || 100

    // Check current customer count
    const { count: currentCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', teamUser.company_id)

    if ((currentCount || 0) + customers.length > maxCustomers) {
      return NextResponse.json({ 
        error: `Import would exceed customer limit (${maxCustomers}). Please upgrade your plan.` 
      }, { status: 400 })
    }

    // Process customers in batches
    const results = {
      total: customers.length,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    }

    const batchSize = 50
    for (let i = 0; i < customers.length; i += batchSize) {
      const batch = customers.slice(i, i + batchSize)
      
      // Prepare customer records with company_id
      const customerRecords = batch.map(customer => ({
        company_id: teamUser.company_id,
        email: customer.email.toLowerCase(),
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone: customer.phone || null,
        company_name: customer.company_name || null,
        address: customer.address || null,
        city: customer.city || null,
        state: customer.state || null,
        zip: customer.zip || null,
        property_type: customer.property_type || 'residential',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      // Insert batch with upsert to handle duplicates
      const { data, error } = await supabase
        .from('customers')
        .upsert(customerRecords, {
          onConflict: 'company_id,email',
          ignoreDuplicates: false
        })
        .select()

      if (error) {
        results.failed += batch.length
        results.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
      } else {
        results.successful += data?.length || 0
        results.failed += batch.length - (data?.length || 0)
      }
    }

    // Update company usage metrics
    await supabase
      .from('company_usage')
      .upsert({
        company_id: teamUser.company_id,
        month: new Date().toISOString().slice(0, 7) + '-01',
        customers_count: (currentCount || 0) + results.successful,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'company_id,month'
      })

    // Log the import activity
    await supabase
      .from('audit_logs')
      .insert({
        user_id: session.userId,
        user_type: 'team',
        action: 'customer_import',
        resource_type: 'customers',
        resource_id: teamUser.company_id,
        details: {
          total: results.total,
          successful: results.successful,
          failed: results.failed
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent')
      })

    return NextResponse.json(results)
  } catch (error: any) {
    console.error('Customer import error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to import customers' },
      { status: 500 }
    )
  }
}