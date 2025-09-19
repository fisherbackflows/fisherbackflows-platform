'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
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
  CheckCircle,
  Download,
  Settings
} from 'lucide-react';

interface BrandingSettings {
  id?: string;
  companyId: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  companyName: string;
  portalTitle: string;
  portalDescription: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  footerText?: string;
  hideBackflowBuddyBranding: boolean;
}

const DEFAULT_SETTINGS: Partial<BrandingSettings> = {
  primaryColor: '#3B82F6',
  secondaryColor: '#06B6D4',
  accentColor: '#0284C7',
  backgroundColor: '#000000',
  portalTitle: 'Customer Portal',
  portalDescription: 'Manage your backflow testing services online',
  hideBackflowBuddyBranding: false
};

export default function BusinessBranding() {
  const [settings, setSettings] = useState<BrandingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchBrandingSettings();
  }, []);

  const fetchBrandingSettings = async () => {
    try {
      // Mock data - will be replaced with real API
      const mockSettings: BrandingSettings = {
        companyId: '1',
        companyName: 'Fisher Backflows',
        contactEmail: 'info@fisherbackflows.com',
        contactPhone: '(253) 555-0123',
        address: '123 Main St, Tacoma, WA 98401',
        ...DEFAULT_SETTINGS
      } as BrandingSettings;

      setSettings(mockSettings);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Mock API call - will be replaced with real API
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess('Branding settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof BrandingSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const resetToDefaults = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      ...DEFAULT_SETTINGS,
      companyName: settings.companyName,
      companyId: settings.companyId
    } as BrandingSettings);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-white/80">Loading branding settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-white/80 mb-4">Failed to load branding settings</p>
          <Button onClick={fetchBrandingSettings} className="glass-btn-primary hover:glow-blue text-white">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-grid opacity-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-blue-500/5" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/business">
                <Button variant="outline" className="border-blue-400 text-white/80">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center">
                  <Palette className="h-6 w-6 mr-3 text-blue-400" />
                  Brand Customization
                </h1>
                <p className="text-white/60">Customize how your customer portal looks and feels</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex bg-black/50 border border-white/20 rounded-lg p-1">
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={`px-3 py-2 rounded-md transition-colors ${
                    previewMode === 'desktop'
                      ? 'bg-blue-600 text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewMode('mobile')}
                  className={`px-3 py-2 rounded-md transition-colors ${
                    previewMode === 'mobile'
                      ? 'bg-blue-600 text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>

              <Button variant="outline" className="border-blue-400 text-white/80" onClick={resetToDefaults}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Defaults
              </Button>

              <Button variant="outline" className="border-blue-400 text-white/80">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="glass-btn-primary hover:glow-blue text-white"
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
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
          <div className="p-4 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
          <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              {success}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Settings Panel */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Globe className="h-5 w-5 mr-2 text-blue-400" />
                Company Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 mb-2 font-medium">Company Name</label>
                  <input
                    type="text"
                    value={settings.companyName}
                    onChange={(e) => updateSetting('companyName', e.target.value)}
                    className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/60 focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2 font-medium">Portal Title</label>
                  <input
                    type="text"
                    value={settings.portalTitle}
                    onChange={(e) => updateSetting('portalTitle', e.target.value)}
                    className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/60 focus:border-blue-400 focus:outline-none"
                    placeholder="Customer Portal"
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2 font-medium">Portal Description</label>
                  <textarea
                    value={settings.portalDescription}
                    onChange={(e) => updateSetting('portalDescription', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/60 focus:border-blue-400 focus:outline-none"
                    placeholder="Manage your backflow testing services online"
                  />
                </div>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Upload className="h-5 w-5 mr-2 text-blue-400" />
                Company Logo
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 mb-2 font-medium">Logo URL</label>
                  <input
                    type="url"
                    value={settings.logoUrl || ''}
                    onChange={(e) => updateSetting('logoUrl', e.target.value)}
                    className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/60 focus:border-blue-400 focus:outline-none"
                    placeholder="https://your-domain.com/logo.png"
                  />
                  <p className="text-blue-400 text-sm mt-1">
                    Recommended: 200x200px PNG with transparent background
                  </p>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Palette className="h-5 w-5 mr-2 text-blue-400" />
                Brand Colors
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 mb-2 font-medium">Primary Color</label>
                  <div className="flex space-x-2">
                    <input
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => updateSetting('primaryColor', e.target.value)}
                      className="w-12 h-10 rounded border border-white/20"
                    />
                    <input
                      type="text"
                      value={settings.primaryColor}
                      onChange={(e) => updateSetting('primaryColor', e.target.value)}
                      className="flex-1 px-3 py-2 bg-black/50 border border-white/20 rounded text-white text-sm focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 mb-2 font-medium">Secondary Color</label>
                  <div className="flex space-x-2">
                    <input
                      type="color"
                      value={settings.secondaryColor}
                      onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                      className="w-12 h-10 rounded border border-white/20"
                    />
                    <input
                      type="text"
                      value={settings.secondaryColor}
                      onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                      className="flex-1 px-3 py-2 bg-black/50 border border-white/20 rounded text-white text-sm focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 mb-2 font-medium">Accent Color</label>
                  <div className="flex space-x-2">
                    <input
                      type="color"
                      value={settings.accentColor}
                      onChange={(e) => updateSetting('accentColor', e.target.value)}
                      className="w-12 h-10 rounded border border-white/20"
                    />
                    <input
                      type="text"
                      value={settings.accentColor}
                      onChange={(e) => updateSetting('accentColor', e.target.value)}
                      className="flex-1 px-3 py-2 bg-black/50 border border-white/20 rounded text-white text-sm focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 mb-2 font-medium">Background</label>
                  <div className="flex space-x-2">
                    <input
                      type="color"
                      value={settings.backgroundColor}
                      onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                      className="w-12 h-10 rounded border border-white/20"
                    />
                    <input
                      type="text"
                      value={settings.backgroundColor}
                      onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                      className="flex-1 px-3 py-2 bg-black/50 border border-white/20 rounded text-white text-sm focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-blue-400" />
                Contact Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 mb-2 font-medium">Contact Email</label>
                  <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => updateSetting('contactEmail', e.target.value)}
                    className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/60 focus:border-blue-400 focus:outline-none"
                    placeholder="support@yourcompany.com"
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2 font-medium">Phone Number</label>
                  <input
                    type="tel"
                    value={settings.contactPhone || ''}
                    onChange={(e) => updateSetting('contactPhone', e.target.value)}
                    className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/60 focus:border-blue-400 focus:outline-none"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2 font-medium">Address</label>
                  <textarea
                    value={settings.address || ''}
                    onChange={(e) => updateSetting('address', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/60 focus:border-blue-400 focus:outline-none"
                    placeholder="123 Main St, City, State ZIP"
                  />
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
              <h3 className="text-xl font-semibold text-white mb-4">Advanced Options</h3>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.hideBackflowBuddyBranding}
                      onChange={(e) => updateSetting('hideBackflowBuddyBranding', e.target.checked)}
                      className="w-4 h-4 text-blue-400 bg-black/50 border-white/20 rounded focus:ring-blue-400"
                    />
                    <span className="text-white/80">Hide "Powered by Fisher Backflows" footer</span>
                  </label>
                  <p className="text-blue-400 text-sm mt-1 ml-7">
                    Available on Professional and Enterprise plans
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Eye className="h-5 w-5 mr-2 text-blue-400" />
                Live Preview
              </h3>

              {/* Preview Frame */}
              <div className={`${previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''}`}>
                <div
                  className="border-2 border-blue-400/20 rounded-lg overflow-hidden"
                  style={{
                    backgroundColor: settings.backgroundColor,
                    minHeight: previewMode === 'mobile' ? '600px' : '400px'
                  }}
                >
                  {/* Preview Header */}
                  <div className="border-b border-white/20 p-4" style={{ backgroundColor: settings.backgroundColor + 'CC' }}>
                    <div className="flex items-center space-x-3">
                      {settings.logoUrl ? (
                        <div className="relative w-8 h-8">
                          <Image
                            src={settings.logoUrl}
                            alt="Logo"
                            width={32}
                            height={32}
                            className="rounded"
                          />
                        </div>
                      ) : (
                        <div
                          className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: settings.primaryColor }}
                        >
                          {settings.companyName?.charAt(0) || 'C'}
                        </div>
                      )}
                      <div>
                        <div className="text-white font-semibold text-sm">
                          {settings.companyName}
                        </div>
                        <div className="text-white/70 text-xs">
                          {settings.portalTitle}
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
                      {settings.portalDescription}
                    </p>

                    {/* Sample Buttons */}
                    <div className="space-y-3">
                      <button
                        className="w-full py-2 px-4 rounded text-white font-medium text-sm"
                        style={{ backgroundColor: settings.primaryColor }}
                      >
                        Schedule Appointment
                      </button>
                      <button
                        className="w-full py-2 px-4 rounded text-white font-medium text-sm"
                        style={{ backgroundColor: settings.secondaryColor }}
                      >
                        View Reports
                      </button>
                      <button
                        className="w-full py-2 px-4 rounded border text-white font-medium text-sm"
                        style={{ borderColor: settings.accentColor, color: settings.accentColor }}
                      >
                        Pay Bill
                      </button>
                    </div>

                    {/* Sample Contact Info */}
                    {(settings.contactEmail || settings.contactPhone) && (
                      <div className="mt-6 pt-4 border-t border-white/20">
                        <div className="text-white/60 text-xs">
                          <p>Need help?</p>
                          {settings.contactPhone && (
                            <p className="mt-1">
                              Call: <span style={{ color: settings.primaryColor }}>{settings.contactPhone}</span>
                            </p>
                          )}
                          {settings.contactEmail && (
                            <p className="mt-1">
                              Email: <span style={{ color: settings.primaryColor }}>{settings.contactEmail}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Preview Footer */}
                  {!settings.hideBackflowBuddyBranding && (
                    <div className="border-t border-white/20 p-4 text-center">
                      <p className="text-white/40 text-xs">
                        Powered by <span style={{ color: settings.primaryColor }}>Fisher Backflows</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}