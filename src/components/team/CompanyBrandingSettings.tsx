'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Upload,
  Palette,
  Eye,
  Save,
  Image as ImageIcon,
  X,
  Check
} from 'lucide-react';

interface BrandingSettings {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  companyTagline: string;
  showBranding: boolean;
}

interface CompanyBrandingSettingsProps {
  companyId: string;
  currentSettings?: BrandingSettings;
  onSave: (settings: BrandingSettings) => Promise<void>;
}

export default function CompanyBrandingSettings({
  companyId,
  currentSettings,
  onSave
}: CompanyBrandingSettingsProps) {
  const [settings, setSettings] = useState<BrandingSettings>({
    logoUrl: currentSettings?.logoUrl || '',
    primaryColor: currentSettings?.primaryColor || '#0ea5e9',
    secondaryColor: currentSettings?.secondaryColor || '#1e293b',
    companyTagline: currentSettings?.companyTagline || '',
    showBranding: currentSettings?.showBranding ?? true
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // For demo, we'll use a data URL. In production, upload to storage service
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSettings(prev => ({ ...prev, logoUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save branding settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const ColorPreview = ({ color, label }: { color: string; label: string }) => (
    <div className="flex items-center space-x-3">
      <div
        className="w-8 h-8 rounded-lg border-2 border-white shadow-sm"
        style={{ backgroundColor: color }}
      />
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </div>
  );

  const BrandPreview = () => (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Live Preview</h3>

      {/* Mock header with branding */}
      <div
        className="rounded-lg p-4 mb-4"
        style={{
          backgroundColor: settings.primaryColor + '10',
          borderLeft: `4px solid ${settings.primaryColor}`
        }}
      >
        <div className="flex items-center space-x-3">
          {settings.logoUrl && (
            <img
              src={settings.logoUrl}
              alt="Company Logo"
              className="w-10 h-10 rounded-lg object-cover"
            />
          )}
          <div>
            <h4 style={{ color: settings.primaryColor }} className="font-bold">
              Your Company Portal
            </h4>
            {settings.companyTagline && (
              <p className="text-sm text-slate-600">{settings.companyTagline}</p>
            )}
          </div>
        </div>
      </div>

      {/* Mock navigation */}
      <div className="flex space-x-4 mb-4">
        {['Dashboard', 'Employees', 'Settings'].map((item, index) => (
          <button
            key={item}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              index === 0
                ? 'text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            style={index === 0 ? { backgroundColor: settings.primaryColor } : {}}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="text-xs text-slate-500">
        This is how your branding will appear to your team members
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Company Branding</h2>
          <p className="text-slate-600">Customize your company's appearance in the portal</p>
        </div>
        <Button
          onClick={() => setPreviewMode(!previewMode)}
          variant="outline"
          className="flex items-center"
        >
          <Eye className="h-4 w-4 mr-2" />
          {previewMode ? 'Hide Preview' : 'Show Preview'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <div className="space-y-6">
          {/* Logo Upload */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <ImageIcon className="h-5 w-5 mr-2" />
              Company Logo
            </h3>

            <div className="space-y-4">
              {settings.logoUrl ? (
                <div className="relative inline-block">
                  <img
                    src={settings.logoUrl}
                    alt="Company Logo"
                    className="w-20 h-20 rounded-lg object-cover border border-slate-200"
                  />
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, logoUrl: '' }))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
                >
                  <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600 font-medium">Click to upload logo</p>
                  <p className="text-slate-400 text-sm">PNG, JPG up to 2MB</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Color Customization */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <Palette className="h-5 w-5 mr-2" />
              Color Theme
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-12 h-12 rounded-lg border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="px-3 py-2 border border-slate-300 rounded-lg flex-1"
                    placeholder="#0ea5e9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="w-12 h-12 rounded-lg border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="px-3 py-2 border border-slate-300 rounded-lg flex-1"
                    placeholder="#1e293b"
                  />
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Color Preview</h4>
                <div className="space-y-2">
                  <ColorPreview color={settings.primaryColor} label="Primary (Buttons, Links)" />
                  <ColorPreview color={settings.secondaryColor} label="Secondary (Text, Borders)" />
                </div>
              </div>
            </div>
          </div>

          {/* Company Tagline */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Company Tagline
            </h3>
            <textarea
              value={settings.companyTagline}
              onChange={(e) => setSettings(prev => ({ ...prev, companyTagline: e.target.value }))}
              placeholder="Enter a tagline for your company..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none"
              rows={3}
            />
            <p className="text-xs text-slate-500 mt-2">
              This will appear below your company name in the portal
            </p>
          </div>

          {/* Branding Toggle */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Show Company Branding</h3>
                <p className="text-slate-600 text-sm">Display your custom branding in the portal</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showBranding}
                  onChange={(e) => setSettings(prev => ({ ...prev, showBranding: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        {previewMode && (
          <div className="lg:sticky lg:top-6">
            <BrandPreview />
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : saved ? (
            <Check className="h-4 w-4 mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {loading ? 'Saving...' : saved ? 'Saved!' : 'Save Branding'}
        </Button>
      </div>
    </div>
  );
}