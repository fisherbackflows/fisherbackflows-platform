import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    const service_area = searchParams.get('service_area')

    // Create client that respects RLS
    const supabase = createRouteHandlerClient(request)

    // Get companies with their branding information
    const query = supabase
      .from('companies')
      .select(`
        id,
        name,
        slug,
        created_at,
        company_branding (
          logo_url,
          primary_color,
          secondary_color,
          company_name,
          portal_title,
          portal_description,
          contact_email,
          contact_phone,
          address,
          service_areas
        )
      `)
      .eq('is_active', true)

    // Filter by service area if provided
    if (service_area) {
      query.contains('company_branding.service_areas', [service_area])
    }

    const { data: companies, error } = await query

    if (error) {
      console.error('Error fetching companies:', error)
      return NextResponse.json(
        { error: 'Failed to fetch companies' },
        { status: 500 }
      )
    }

    // Transform data for directory display
    const directoryData = companies.map(company => ({
      id: company.id,
      name: company.company_branding?.company_name || company.name,
      slug: company.slug,
      description: company.company_branding?.portal_description || 'Professional backflow testing services',
      logo_url: company.company_branding?.logo_url,
      primary_color: company.company_branding?.primary_color || '#0ea5e9',
      contact_email: company.company_branding?.contact_email,
      contact_phone: company.company_branding?.contact_phone,
      address: company.company_branding?.address,
      service_areas: company.company_branding?.service_areas || [],
      portal_url: `/portal/company/${company.slug}`
    }))

    return NextResponse.json({
      success: true,
      data: directoryData,
      total: directoryData.length
    })

  } catch (error) {
    console.error('Directory API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}