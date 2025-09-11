'use client'

import { useState, useEffect } from 'react'
import { CompanyBranding, BrandingTheme, createThemeFromBranding, generateThemeCSS } from '@/lib/company-branding'

interface UseBrandingResult {
  branding: CompanyBranding | null
  theme: BrandingTheme | null
  isLoading: boolean
  error: string | null
}

// Hook for getting company branding by company ID
export function useCompanyBranding(companyId: string | null): UseBrandingResult {
  const [branding, setBranding] = useState<CompanyBranding | null>(null)
  const [theme, setTheme] = useState<BrandingTheme | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!companyId) {
      setBranding(null)
      setTheme(null)
      return
    }

    setIsLoading(true)
    setError(null)

    fetch(`/api/companies/${companyId}/branding`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch branding: ${res.status}`)
        }
        return res.json()
      })
      .then(data => {
        setBranding(data)
        if (data) {
          const brandingTheme = createThemeFromBranding(data)
          setTheme(brandingTheme)
          
          // Inject theme CSS into document
          injectThemeCSS(brandingTheme)
        }
      })
      .catch(err => {
        console.error('Error loading company branding:', err)
        setError(err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [companyId])

  return { branding, theme, isLoading, error }
}

// Hook for getting branding by company slug (for subdomains)
export function useCompanyBrandingBySlug(slug: string | null): UseBrandingResult {
  const [branding, setBranding] = useState<CompanyBranding | null>(null)
  const [theme, setTheme] = useState<BrandingTheme | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) {
      setBranding(null)
      setTheme(null)
      return
    }

    setIsLoading(true)
    setError(null)

    fetch(`/api/companies/by-slug/${slug}/branding`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch branding: ${res.status}`)
        }
        return res.json()
      })
      .then(data => {
        setBranding(data)
        if (data) {
          const brandingTheme = createThemeFromBranding(data)
          setTheme(brandingTheme)
          
          // Inject theme CSS into document
          injectThemeCSS(brandingTheme)
        }
      })
      .catch(err => {
        console.error('Error loading company branding:', err)
        setError(err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [slug])

  return { branding, theme, isLoading, error }
}

// Hook for customer portal branding
export function useCustomerPortalBranding(): UseBrandingResult {
  const [branding, setBranding] = useState<CompanyBranding | null>(null)
  const [theme, setTheme] = useState<BrandingTheme | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    setError(null)

    // Try to get branding from URL slug first (subdomain or path)
    const hostname = window.location.hostname
    const subdomain = hostname.split('.')[0]
    const pathSlug = window.location.pathname.split('/')[2] // /portal/[slug]/...

    let slug: string | null = null
    
    // Check if we're on a subdomain (not localhost or main domain)
    if (subdomain && subdomain !== 'localhost' && subdomain !== 'backflowbuddy' && !hostname.includes('vercel')) {
      slug = subdomain
    } else if (pathSlug && pathSlug.length > 0) {
      slug = pathSlug
    }

    if (!slug) {
      // No specific company slug, use default Backflow Buddy branding
      setIsLoading(false)
      return
    }

    fetch(`/api/companies/by-slug/${slug}/branding`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch branding: ${res.status}`)
        }
        return res.json()
      })
      .then(data => {
        setBranding(data)
        if (data) {
          const brandingTheme = createThemeFromBranding(data)
          setTheme(brandingTheme)
          
          // Inject theme CSS and update page title
          injectThemeCSS(brandingTheme)
          updatePageBranding(data)
        }
      })
      .catch(err => {
        console.error('Error loading customer portal branding:', err)
        setError(err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  return { branding, theme, isLoading, error }
}

// Inject theme CSS into document head
function injectThemeCSS(theme: BrandingTheme) {
  const styleId = 'company-branding-theme'
  
  // Remove existing style if present
  const existingStyle = document.getElementById(styleId)
  if (existingStyle) {
    existingStyle.remove()
  }

  // Create new style element
  const style = document.createElement('style')
  style.id = styleId
  style.textContent = generateThemeCSS(theme)
  document.head.appendChild(style)
}

// Update page branding (title, favicon, etc.)
function updatePageBranding(branding: CompanyBranding) {
  // Update page title
  if (branding.portal_title && branding.company_name) {
    document.title = `${branding.portal_title} - ${branding.company_name}`
  }

  // Update meta description
  if (branding.portal_description) {
    let metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.name = 'description'
      document.head.appendChild(metaDescription)
    }
    metaDescription.content = branding.portal_description
  }

  // Update favicon if custom logo is provided
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

export { CompanyBranding, BrandingTheme }