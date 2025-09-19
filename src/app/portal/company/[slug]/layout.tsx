'use client'

import { useParams } from 'next/navigation'
import { useCompanyBrandingBySlug } from '@/hooks/useCompanyBranding'

export default function CompanyPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const slug = params.slug as string
  const { branding, isLoading } = useCompanyBrandingBySlug(slug)

  // Update page metadata when branding loads
  if (branding && typeof window !== 'undefined') {
    // Update page title
    document.title = `${branding.portal_title} - ${branding.company_name}`
    
    // Update favicon if custom logo exists
    if (branding.logo_url) {
      let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
      if (!favicon) {
        favicon = document.createElement('link')
        favicon.rel = 'icon'
        document.head.appendChild(favicon)
      }
      favicon.href = branding.logo_url
    }
  }

  return (
    <>
      {children}
    </>
  )
}