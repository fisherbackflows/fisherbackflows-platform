'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CompanyBrandingSettings from '@/components/team/CompanyBrandingSettings';

interface BrandingSettings {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  companyTagline: string;
  showBranding: boolean;
}

export default function CompanyBrandingPage() {
  const [settings, setSettings] = useState<BrandingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchUserAndSettings();
  }, []);

  const fetchUserAndSettings = async () => {
    try {
      // Get current user to determine company
      const userResponse = await fetch('/api/team/auth/me');
      if (!userResponse.ok) {
        router.push('/team-portal/login');
        return;
      }

      const userData = await userResponse.json();
      if (userData.role !== 'company_admin') {
        router.push('/team-portal/dashboard');
        return;
      }

      setCompanyId(userData.user.company_id);

      // Fetch branding settings
      const settingsResponse = await fetch(`/api/team/company/branding?companyId=${userData.user.company_id}`);
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSettings(settingsData.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (newSettings: BrandingSettings) => {
    if (!companyId) throw new Error('No company ID available');

    const response = await fetch('/api/team/company/branding', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyId,
        ...newSettings
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save settings');
    }

    const result = await response.json();
    setSettings(result.settings);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6">
                  <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
                  <div className="h-20 bg-slate-200 rounded"></div>
                </div>
                <div className="bg-white rounded-xl p-6">
                  <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
                  <div className="h-32 bg-slate-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <CompanyBrandingSettings
          companyId={companyId!}
          currentSettings={settings || undefined}
          onSave={handleSaveSettings}
        />
      </div>
    </div>
  );
}