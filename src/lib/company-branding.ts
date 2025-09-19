import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface CompanyBranding {
  id: string
  company_id: string
  logo_url?: string
  primary_color: string
  secondary_color: string
  accent_color: string
  background_color: string
  company_name: string
  domain?: string
  custom_css?: string
  portal_title: string
  portal_description: string
  contact_email: string
  contact_phone?: string
  address?: string
  footer_text?: string
  hide_backflow_buddy_branding: boolean
  created_at: string
  updated_at: string
}

export interface BrandingTheme {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
  textMuted: string
  border: string
  glass: string
}

export const DEFAULT_BRANDING: Partial<CompanyBranding> = {
  primary_color: '#0ea5e9', // Cyan-500
  secondary_color: '#06b6d4', // Cyan-600  
  accent_color: '#0284c7', // Sky-600
  background_color: '#0f172a', // Slate-900
  portal_title: 'Customer Portal',
  portal_description: 'Manage your backflow testing services online',
  hide_backflow_buddy_branding: false
}

// Get company branding by company ID
export async function getCompanyBranding(companyId: string): Promise<CompanyBranding | null> {
  try {
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name, slug')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      return null
    }

    const { data: branding, error } = await supabase
      .from('company_branding')
      .select('*')
      .eq('company_id', companyId)
      .single()

    if (error || !branding) {
      // Return default branding with company info
      return {
        id: '',
        company_id: companyId,
        company_name: company.name,
        ...DEFAULT_BRANDING
      } as CompanyBranding
    }

    return branding
  } catch (error) {
    console.error('Error fetching company branding:', error)
    return null
  }
}

// Get company branding by slug (for subdomain routing)
export async function getCompanyBrandingBySlug(slug: string): Promise<CompanyBranding | null> {
  try {
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('slug', slug)
      .single()

    if (companyError || !company) {
      return null
    }

    return await getCompanyBranding(company.id)
  } catch (error) {
    console.error('Error fetching company branding by slug:', error)
    return null
  }
}

// Convert branding colors to CSS theme
export function createThemeFromBranding(branding: CompanyBranding): BrandingTheme {
  return {
    primary: branding.primary_color,
    secondary: branding.secondary_color,
    accent: branding.accent_color,
    background: branding.background_color,
    text: '#ffffff',
    textMuted: '#ffffff80', // 50% opacity
    border: branding.primary_color + '40', // 25% opacity
    glass: 'rgba(255, 255, 255, 0.1)'
  }
}

// Generate CSS custom properties for theming
export function generateThemeCSS(theme: BrandingTheme): string {
  return `
    :root {
      --color-primary: ${theme.primary};
      --color-secondary: ${theme.secondary};
      --color-accent: ${theme.accent};
      --color-background: ${theme.background};
      --color-text: ${theme.text};
      --color-text-muted: ${theme.textMuted};
      --color-border: ${theme.border};
      --color-glass: ${theme.glass};
    }
    
    .custom-primary { color: var(--color-primary); }
    .custom-bg-primary { background-color: var(--color-primary); }
    .custom-border-primary { border-color: var(--color-primary); }
    .custom-secondary { color: var(--color-secondary); }
    .custom-bg-secondary { background-color: var(--color-secondary); }
    .custom-accent { color: var(--color-accent); }
    .custom-bg-accent { background-color: var(--color-accent); }
    .custom-bg { background-color: var(--color-background); }
    .custom-text { color: var(--color-text); }
    .custom-text-muted { color: var(--color-text-muted); }
    .custom-border { border-color: var(--color-border); }
    .custom-glass { background: var(--color-glass); backdrop-filter: blur(10px); }
    
    .custom-gradient {
      background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    }
    
    .custom-glass-border {
      border: 1px solid var(--color-border);
      background: var(--color-glass);
      backdrop-filter: blur(10px);
    }
  `
}

// Update company branding
export async function updateCompanyBranding(
  companyId: string, 
  branding: Partial<CompanyBranding>
): Promise<CompanyBranding | null> {
  try {
    const { data, error } = await supabase
      .from('company_branding')
      .upsert({
        company_id: companyId,
        ...branding,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'company_id'
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error updating company branding:', error)
    return null
  }
}

// Get customer's company branding (for portal access)
export async function getCustomerCompanyBranding(customerId: string): Promise<CompanyBranding | null> {
  try {
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('company_id')
      .eq('id', customerId)
      .single()

    if (customerError || !customer) {
      return null
    }

    return await getCompanyBranding(customer.company_id)
  } catch (error) {
    console.error('Error fetching customer company branding:', error)
    return null
  }
}