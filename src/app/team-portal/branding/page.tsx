'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  Palette, 
  Upload, 
  Eye, 
  Save, 
  RefreshCw, 
  ArrowLeft,
  Monitor,
  Smartphone,
  Globe,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

interface BrandingSettings {
  id?: string
  company_id: string
  logo_url?: string
  primary_color: string
  secondary_color: string
  accent_color: string
  background_color: string
  company_name: string
  portal_title: string
  portal_description: string
  contact_email: string
  contact_phone?: string
  address?: string
  footer_text?: string
  hide_backflow_buddy_branding: boolean
}

const DEFAULT_SETTINGS: Partial<BrandingSettings> = {
  primary_color: '#0ea5e9',
  secondary_color: '#06b6d4',
  accent_color: '#0284c7',
  background_color: '#0f172a',
  portal_title: 'Customer Portal',
  portal_description: 'Manage your backflow testing services online',
  hide_backflow_buddy_branding: false
}

export default function BrandingSettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<BrandingSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [companyId, setCompanyId] = useState<string | null>(null)

  useEffect(() => {
    fetchBrandingSettings()
  }, [])

  const fetchBrandingSettings = async () => {
    try {
      // Get company info first
      const companyResponse = await fetch('/api/team/company')
      if (!companyResponse.ok) {
        throw new Error('Failed to fetch company info')
      }
      const company = await companyResponse.json()
      setCompanyId(company.id)

      // Get branding settings
      const response = await fetch(`/api/companies/${company.id}/branding`)
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      } else {
        // Use defaults for new branding
        setSettings({
          company_id: company.id,
          company_name: company.name,
          contact_email: '',
          ...DEFAULT_SETTINGS
        } as BrandingSettings)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings || !companyId) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/companies/${companyId}/branding`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save branding settings')
      }

      setSuccess('Branding settings saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof BrandingSettings, value: any) => {
    if (!settings) return
    setSettings({ ...settings, [key]: value })
  }

  const resetToDefaults = () => {
    if (!settings) return
    setSettings({
      ...settings,
      ...DEFAULT_SETTINGS,
      company_name: settings.company_name,
      company_id: settings.company_id
    } as BrandingSettings)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-white/80">Loading branding settings...</p>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p>Failed to load branding settings</p>
          <button
            onClick={fetchBrandingSettings}
            className="mt-4 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-cyan-400/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/team-portal/settings"
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Brand Customization</h1>
                <p className="text-cyan-300 text-sm">Customize how your customer portal looks</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={`px-3 py-2 rounded-md transition-colors ${
                    previewMode === 'desktop'
                      ? 'bg-cyan-500 text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewMode('mobile')}
                  className={`px-3 py-2 rounded-md transition-colors ${
                    previewMode === 'mobile'
                      ? 'bg-cyan-500 text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={resetToDefaults}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Reset to Defaults
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications */}
      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        </div>
      )}
      
      {success && (
        <div className="mx-4 mt-4 p-4 bg-green-500/20 border border-green-500/50 text-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            {success}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Settings Panel */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-cyan-400/30">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Globe className="h-5 w-5 mr-2 text-cyan-400" />
                Company Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={settings.company_name}
                    onChange={(e) => updateSetting('company_name', e.target.value)}
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 mb-2">Portal Title</label>
                  <input
                    type="text"
                    value={settings.portal_title}
                    onChange={(e) => updateSetting('portal_title', e.target.value)}
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-cyan-400"
                    placeholder="Customer Portal"
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2">Portal Description</label>
                  <textarea
                    value={settings.portal_description}
                    onChange={(e) => updateSetting('portal_description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-cyan-400"
                    placeholder="Manage your backflow testing services online"
                  />
                </div>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-cyan-400/30">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Upload className="h-5 w-5 mr-2 text-cyan-400" />
                Company Logo
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 mb-2">Logo URL</label>
                  <input
                    type="url"
                    value={settings.logo_url || ''}
                    onChange={(e) => updateSetting('logo_url', e.target.value)}
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-cyan-400"
                    placeholder="https://your-domain.com/logo.png"
                  />
                  <p className="text-white/60 text-sm mt-1">
                    Recommended: 200x200px PNG with transparent background
                  </p>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-cyan-400/30">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Palette className="h-5 w-5 mr-2 text-cyan-400" />
                Brand Colors
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 mb-2">Primary Color</label>
                  <div className="flex space-x-2">
                    <input
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) => updateSetting('primary_color', e.target.value)}
                      className="w-12 h-10 rounded border border-white/30"
                    />
                    <input
                      type="text"
                      value={settings.primary_color}
                      onChange={(e) => updateSetting('primary_color', e.target.value)}
                      className="flex-1 px-3 py-2 bg-white/20 border border-white/30 rounded text-white text-sm focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 mb-2">Secondary Color</label>
                  <div className="flex space-x-2">
                    <input
                      type="color"
                      value={settings.secondary_color}
                      onChange={(e) => updateSetting('secondary_color', e.target.value)}
                      className="w-12 h-10 rounded border border-white/30"
                    />
                    <input
                      type="text"
                      value={settings.secondary_color}
                      onChange={(e) => updateSetting('secondary_color', e.target.value)}
                      className="flex-1 px-3 py-2 bg-white/20 border border-white/30 rounded text-white text-sm focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 mb-2">Accent Color</label>
                  <div className="flex space-x-2">
                    <input
                      type="color"
                      value={settings.accent_color}
                      onChange={(e) => updateSetting('accent_color', e.target.value)}
                      className="w-12 h-10 rounded border border-white/30"
                    />
                    <input
                      type="text"
                      value={settings.accent_color}
                      onChange={(e) => updateSetting('accent_color', e.target.value)}
                      className="flex-1 px-3 py-2 bg-white/20 border border-white/30 rounded text-white text-sm focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 mb-2">Background</label>
                  <div className="flex space-x-2">
                    <input
                      type="color"
                      value={settings.background_color}
                      onChange={(e) => updateSetting('background_color', e.target.value)}
                      className="w-12 h-10 rounded border border-white/30"
                    />
                    <input
                      type="text"
                      value={settings.background_color}
                      onChange={(e) => updateSetting('background_color', e.target.value)}
                      className="flex-1 px-3 py-2 bg-white/20 border border-white/30 rounded text-white text-sm focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-cyan-400/30">
              <h3 className="text-xl font-semibold text-white mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 mb-2">Contact Email</label>
                  <input
                    type="email"
                    value={settings.contact_email}
                    onChange={(e) => updateSetting('contact_email', e.target.value)}
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-cyan-400"
                    placeholder="support@yourcompany.com"
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={settings.contact_phone || ''}
                    onChange={(e) => updateSetting('contact_phone', e.target.value)}
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-cyan-400"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-cyan-400/30">
              <h3 className="text-xl font-semibold text-white mb-4">Advanced Options</h3>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.hide_backflow_buddy_branding}
                      onChange={(e) => updateSetting('hide_backflow_buddy_branding', e.target.checked)}
                      className="w-4 h-4 text-cyan-500 bg-white/20 border-white/30 rounded focus:ring-cyan-400"
                    />
                    <span className="text-white/80">Hide "Powered by Backflow Buddy" footer</span>
                  </label>
                  <p className="text-white/60 text-sm mt-1 ml-7">
                    Available on Professional and Enterprise plans
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-cyan-400/30">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Eye className="h-5 w-5 mr-2 text-cyan-400" />
                Live Preview
              </h3>
              
              {/* Preview Frame */}
              <div className={`${previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''}`}>
                <div 
                  className="border-2 border-white/20 rounded-lg overflow-hidden"
                  style={{ 
                    backgroundColor: settings.background_color,
                    minHeight: previewMode === 'mobile' ? '600px' : '400px'
                  }}
                >
                  {/* Preview Header */}
                  <div className="border-b border-white/20 p-4" style={{ backgroundColor: settings.background_color + 'CC' }}>
                    <div className="flex items-center space-x-3">
                      {settings.logo_url ? (
                        <div className="relative w-8 h-8">
                          <Image
                            src={settings.logo_url}
                            alt="Logo"
                            width={32}
                            height={32}
                            className="rounded"
                          />
                        </div>
                      ) : (
                        <div 
                          className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: settings.primary_color }}
                        >
                          {settings.company_name?.charAt(0) || 'C'}
                        </div>
                      )}
                      <div>
                        <div className="text-white font-semibold text-sm">
                          {settings.company_name}
                        </div>
                        <div className="text-white/70 text-xs">
                          {settings.portal_title}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preview Content */}
                  <div className="p-6">
                    <h2 className="text-white text-lg font-semibold mb-2">
                      Welcome to Your Portal
                    </h2>
                    <p className="text-white/80 text-sm mb-4">
                      {settings.portal_description}
                    </p>
                    
                    {/* Sample Buttons */}
                    <div className="space-y-3">
                      <button 
                        className="w-full py-2 px-4 rounded text-white font-medium text-sm"
                        style={{ backgroundColor: settings.primary_color }}
                      >
                        Schedule Appointment
                      </button>
                      <button 
                        className="w-full py-2 px-4 rounded text-white font-medium text-sm"
                        style={{ backgroundColor: settings.secondary_color }}
                      >
                        View Reports
                      </button>
                      <button 
                        className="w-full py-2 px-4 rounded border text-white font-medium text-sm"
                        style={{ borderColor: settings.accent_color, color: settings.accent_color }}
                      >
                        Pay Bill
                      </button>
                    </div>

                    {/* Sample Contact Info */}
                    {(settings.contact_email || settings.contact_phone) && (
                      <div className="mt-6 pt-4 border-t border-white/20">
                        <div className="text-white/60 text-xs">
                          <p>Need help?</p>
                          {settings.contact_phone && (
                            <p className="mt-1">
                              Call: <span style={{ color: settings.primary_color }}>{settings.contact_phone}</span>
                            </p>
                          )}
                          {settings.contact_email && (
                            <p className="mt-1">
                              Email: <span style={{ color: settings.primary_color }}>{settings.contact_email}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Preview Footer */}
                  {!settings.hide_backflow_buddy_branding && (
                    <div className="border-t border-white/20 p-4 text-center">
                      <p className="text-white/40 text-xs">
                        Powered by <span style={{ color: settings.primary_color }}>Backflow Buddy</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}