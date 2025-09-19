import { NextRequest, NextResponse } from 'next/server'
import { getCompanyBrandingBySlug } from '@/lib/company-branding'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const branding = await getCompanyBrandingBySlug(params.slug)
    
    if (!branding) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    return NextResponse.json(branding)
  } catch (error: any) {
    console.error('Error fetching company branding by slug:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch company branding' },
      { status: 500 }
    )
  }
}