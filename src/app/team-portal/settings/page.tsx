'use client';

import { useState } from 'react';
import { TeamPortalNavigation } from '@/components/navigation/UnifiedNavigation';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Save,
  User,
  Bell,
  Mail,
  Shield,
  Database,
  Palette,
  Globe
} from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // Business Info
    businessName: 'Fisher Backflows',
    contactEmail: 'service@fisherbackflows.com',
    contactPhone: '(253) 278-8692',
    address: 'Pierce County, WA',
    
    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    reminderDays: 30,
    
    // Invoicing
    invoicePrefix: 'INV-',
    taxRate: 9.8,
    paymentTerms: 30,
    
    // Security
    autoLogout: 60,
    requireStrongPasswords: true,
    twoFactorAuth: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setSettings(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else if (type === 'number') {
      setSettings(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSave = () => {
    // Mock save - replace with actual API call
    console.log('Saving settings:', settings);
    alert('Settings saved successfully!');
  };

  return (
    <div className="min-h-screen bg-black">
      <TeamPortalNavigation userInfo={{ name: 'Team Member', email: '' }} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Settings</h1>
            <p className="text-white/60">Configure your application preferences</p>
          </div>
          <Button onClick={handleSave} className="glass-btn-primary hover:glow-blue">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
        <div className="space-y-6">
          {/* Business Information */}
          <div className="glass rounded-2xl glow-blue-sm border border-blue-400 p-6">
            <h2 className="text-lg font-semibold mb-4">
              <User className="h-5 w-5 inline mr-2" />
              Business Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={settings.businessName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-blue-500/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={settings.contactEmail}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-blue-500/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={settings.contactPhone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-blue-500/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Business Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={settings.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-blue-500/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="glass rounded-2xl glow-blue-sm border border-blue-400 p-6">
            <h2 className="text-lg font-semibold mb-4">
              <Bell className="h-5 w-5 inline mr-2" />
              Notification Settings
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">Email Notifications</h3>
                  <p className="text-sm text-white/90">Receive notifications via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={settings.emailNotifications}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-black/30 backdrop-blur-lg peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:glass after:border-blue-500/50 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">SMS Notifications</h3>
                  <p className="text-sm text-white/90">Receive notifications via text message</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="smsNotifications"
                    checked={settings.smsNotifications}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-black/30 backdrop-blur-lg peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:glass after:border-blue-500/50 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl"></div>
                </label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Default Reminder Days Before Due
                  </label>
                  <select
                    name="reminderDays"
                    value={settings.reminderDays}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-blue-500/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Invoicing Settings */}
          <div className="glass rounded-2xl glow-blue-sm border border-blue-400 p-6">
            <h2 className="text-lg font-semibold mb-4">
              <Mail className="h-5 w-5 inline mr-2" />
              Invoicing Settings
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Invoice Number Prefix
                </label>
                <input
                  type="text"
                  name="invoicePrefix"
                  value={settings.invoicePrefix}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-blue-500/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="taxRate"
                  value={settings.taxRate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-blue-500/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Payment Terms (Days)
                </label>
                <select
                  name="paymentTerms"
                  value={settings.paymentTerms}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-blue-500/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value={15}>Net 15</option>
                  <option value={30}>Net 30</option>
                  <option value={60}>Net 60</option>
                </select>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="glass rounded-2xl glow-blue-sm border border-blue-400 p-6">
            <h2 className="text-lg font-semibold mb-4">
              <Shield className="h-5 w-5 inline mr-2" />
              Security Settings
            </h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Auto Logout (minutes)
                  </label>
                  <select
                    name="autoLogout"
                    value={settings.autoLogout}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-blue-500/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                    <option value={480}>8 hours</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">Require Strong Passwords</h3>
                    <p className="text-sm text-white/90">Enforce strong password requirements</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="requireStrongPasswords"
                      checked={settings.requireStrongPasswords}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-black/30 backdrop-blur-lg peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:glass after:border-blue-500/50 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">Two-Factor Authentication</h3>
                    <p className="text-sm text-white/90">Add extra security to your account</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="twoFactorAuth"
                      checked={settings.twoFactorAuth}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-black/30 backdrop-blur-lg peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:glass after:border-blue-500/50 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}