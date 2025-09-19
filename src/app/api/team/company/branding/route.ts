import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

    const { data: settings, error } = await supabase
      .from('company_settings')
      .select('logo_url, primary_color, secondary_color, company_tagline, show_branding')
      .eq('company_id', companyId)
      .single();

    if (error) {
      console.error('Error fetching branding settings:', error);
      return NextResponse.json({ error: 'Failed to fetch branding settings' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      settings: {
        logoUrl: settings?.logo_url || '',
        primaryColor: settings?.primary_color || '#0ea5e9',
        secondaryColor: settings?.secondary_color || '#1e293b',
        companyTagline: settings?.company_tagline || '',
        showBranding: settings?.show_branding ?? true
      }
    });

  } catch (error) {
    console.error('Branding settings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, logoUrl, primaryColor, secondaryColor, companyTagline, showBranding } = body;

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

    // Validate hex colors
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (primaryColor && !hexColorRegex.test(primaryColor)) {
      return NextResponse.json({ error: 'Invalid primary color format' }, { status: 400 });
    }
    if (secondaryColor && !hexColorRegex.test(secondaryColor)) {
      return NextResponse.json({ error: 'Invalid secondary color format' }, { status: 400 });
    }

    // Update or create company settings
    const { data, error } = await supabase
      .from('company_settings')
      .upsert({
        company_id: companyId,
        logo_url: logoUrl || null,
        primary_color: primaryColor || '#0ea5e9',
        secondary_color: secondaryColor || '#1e293b',
        company_tagline: companyTagline || null,
        show_branding: showBranding ?? true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'company_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving branding settings:', error);
      return NextResponse.json({ error: 'Failed to save branding settings' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Branding settings saved successfully',
      settings: {
        logoUrl: data.logo_url,
        primaryColor: data.primary_color,
        secondaryColor: data.secondary_color,
        companyTagline: data.company_tagline,
        showBranding: data.show_branding
      }
    });

  } catch (error) {
    console.error('Branding settings PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}