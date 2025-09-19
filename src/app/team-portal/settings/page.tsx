'use client';

import { useState, useEffect } from 'react';
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
  Globe,
  Lock,
  Eye,
  EyeOff,
  Clock,
  Monitor,
  Download,
  Activity,
  Keyboard,
  AlertCircle,
  CheckCircle,
  Calendar,
  Languages,
  FileDown,
  FileUp,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // Business Info
    businessName: 'Fisher Backflows',
    contactEmail: 'service@fisherbackflows.com',
    contactPhone: '(253) 278-8692',
    address: 'Pierce County, WA',
    timezone: 'America/Los_Angeles',

    // Display Preferences
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    startWeekOn: 'sunday',
    compactView: false,
    showGridLines: true,
    rowsPerPage: 25,

    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    reminderDays: 30,
    dailyDigest: true,
    instantAlerts: true,
    appointmentReminders: true,
    paymentReminders: true,
    reportDeadlines: true,

    // Invoicing
    invoicePrefix: 'INV-',
    taxRate: 9.8,
    paymentTerms: 30,
    autoGenerateInvoices: true,
    attachPDFToEmail: true,

    // Data Management
    autoBackup: true,
    backupFrequency: 'daily',
    exportFormat: 'xlsx',
    includeArchived: false,

    // Security
    autoLogout: 60,
    requireStrongPasswords: true,
    twoFactorAuth: false,
    sessionTimeout: true,
    loginAlerts: true
  });

  const [userInfo, setUserInfo] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    // Load user info
    const loadUserInfo = async () => {
      try {
        const response = await fetch('/api/team/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUserInfo(userData);
        }
      } catch (error) {
        console.error('Failed to load user info:', error);
      }
    };

    // Load saved settings from localStorage
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('team_portal_settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings(parsed);
        }
      } catch (error) {
        console.error('Error loading saved settings:', error);
      }
    };

    loadUserInfo();
    loadSettings();
  }, []);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handlePasswordSubmit = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      alert('New password must be at least 8 characters long');
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await fetch('/api/team/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Password changed successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        alert(data.error || 'Failed to change password');
      }
    } catch (error) {
      alert('An error occurred while changing password');
    } finally {
      setPasswordLoading(false);
    }
  };

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

  const handleSave = async () => {
    try {
      // Save settings to localStorage for now
      // In the future, you could save to a user preferences API
      localStorage.setItem('team_portal_settings', JSON.stringify(settings));

      // Trigger a custom event to notify other components of setting changes
      window.dispatchEvent(new CustomEvent('settingsChanged', { detail: settings }));

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    }
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
          {/* Account Settings */}
          <div className="glass rounded-2xl glow-blue-sm border border-blue-400 p-6">
            <h2 className="text-lg font-semibold mb-4">
              <Lock className="h-5 w-5 inline mr-2" />
              Account Settings
            </h2>

            {userInfo && (
              <div className="mb-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-white/70">Email:</span>
                    <span className="ml-2 text-white font-medium">{userInfo.email}</span>
                  </div>
                  <div>
                    <span className="text-white/70">Role:</span>
                    <span className="ml-2 text-white font-medium capitalize">{userInfo.role}</span>
                  </div>
                  <div>
                    <span className="text-white/70">Name:</span>
                    <span className="ml-2 text-white font-medium">{userInfo.first_name} {userInfo.last_name}</span>
                  </div>
                  <div>
                    <span className="text-white/70">Last Login:</span>
                    <span className="ml-2 text-white font-medium">
                      {userInfo.last_login ? new Date(userInfo.last_login).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-md font-medium text-white mb-4">Change Password</h3>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 pr-10 border border-blue-500/50 rounded-xl bg-black/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-2.5 text-white/60 hover:text-white"
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 pr-10 border border-blue-500/50 rounded-xl bg-black/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Enter new password (min. 8 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-2.5 text-white/60 hover:text-white"
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 pr-10 border border-blue-500/50 rounded-xl bg-black/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Confirm your new password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-2.5 text-white/60 hover:text-white"
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handlePasswordSubmit}
                    disabled={passwordLoading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                    className="glass-btn-primary hover:glow-blue disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    {passwordLoading ? 'Changing Password...' : 'Change Password'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

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
                  className="w-full px-3 py-2 border border-blue-500/50 rounded-xl bg-black/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                  className="w-full px-3 py-2 border border-blue-500/50 rounded-xl bg-black/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                  className="w-full px-3 py-2 border border-blue-500/50 rounded-xl bg-black/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                  className="w-full px-3 py-2 border border-blue-500/50 rounded-xl bg-black/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
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

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">Daily Digest</h3>
                  <p className="text-sm text-white/90">Receive a daily summary email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="dailyDigest"
                    checked={settings.dailyDigest}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-black/30 backdrop-blur-lg peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:glass after:border-blue-500/50 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">Appointment Reminders</h3>
                  <p className="text-sm text-white/90">Get notified before appointments</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="appointmentReminders"
                    checked={settings.appointmentReminders}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-black/30 backdrop-blur-lg peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:glass after:border-blue-500/50 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">Payment Reminders</h3>
                  <p className="text-sm text-white/90">Alert for overdue payments</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="paymentReminders"
                    checked={settings.paymentReminders}
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
                    className="w-full px-3 py-2 border border-blue-500/50 rounded-xl bg-black/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                  className="w-full px-3 py-2 border border-blue-500/50 rounded-xl bg-black/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                  className="w-full px-3 py-2 border border-blue-500/50 rounded-xl bg-black/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                  className="w-full px-3 py-2 border border-blue-500/50 rounded-xl bg-black/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value={15}>Net 15</option>
                  <option value={30}>Net 30</option>
                  <option value={60}>Net 60</option>
                </select>
              </div>
            </div>
          </div>

          {/* Display Preferences */}
          <div className="glass rounded-2xl glow-blue-sm border border-blue-400 p-6">
            <h2 className="text-lg font-semibold mb-4">
              <Monitor className="h-5 w-5 inline mr-2" />
              Display Preferences
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Date Format
                </label>
                <select
                  name="dateFormat"
                  value={settings.dateFormat}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-blue-500/50 rounded-xl bg-black/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="MMM DD, YYYY">MMM DD, YYYY</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Time Format
                </label>
                <select
                  name="timeFormat"
                  value={settings.timeFormat}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-blue-500/50 rounded-xl bg-black/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="12h">12-hour (AM/PM)</option>
                  <option value="24h">24-hour</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Week Starts On
                </label>
                <select
                  name="startWeekOn"
                  value={settings.startWeekOn}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-blue-500/50 rounded-xl bg-black/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="sunday">Sunday</option>
                  <option value="monday">Monday</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Timezone
                </label>
                <select
                  name="timezone"
                  value={settings.timezone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-blue-500/50 rounded-xl bg-black/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Rows Per Page
                </label>
                <select
                  name="rowsPerPage"
                  value={settings.rowsPerPage}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-blue-500/50 rounded-xl bg-black/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value={10}>10 rows</option>
                  <option value={25}>25 rows</option>
                  <option value={50}>50 rows</option>
                  <option value={100}>100 rows</option>
                </select>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">Compact View</h3>
                  <p className="text-sm text-white/90">Show more information in less space</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="compactView"
                    checked={settings.compactView}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-black/30 backdrop-blur-lg peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:glass after:border-blue-500/50 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">Show Grid Lines</h3>
                  <p className="text-sm text-white/90">Display grid lines in tables</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="showGridLines"
                    checked={settings.showGridLines}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-black/30 backdrop-blur-lg peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:glass after:border-blue-500/50 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl"></div>
                </label>
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
                    className="w-full px-3 py-2 border border-blue-500/50 rounded-xl bg-black/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
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

          {/* Data Management */}
          <div className="glass rounded-2xl glow-blue-sm border border-blue-400 p-6">
            <h2 className="text-lg font-semibold mb-4">
              <Database className="h-5 w-5 inline mr-2" />
              Data Management
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Auto Backup Frequency
                </label>
                <select
                  name="backupFrequency"
                  value={settings.backupFrequency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-blue-500/50 rounded-xl bg-black/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="manual">Manual Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Default Export Format
                </label>
                <select
                  name="exportFormat"
                  value={settings.exportFormat}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-blue-500/50 rounded-xl bg-black/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="xlsx">Excel (.xlsx)</option>
                  <option value="csv">CSV (.csv)</option>
                  <option value="pdf">PDF (.pdf)</option>
                  <option value="json">JSON (.json)</option>
                </select>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">Automatic Backups</h3>
                  <p className="text-sm text-white/90">Automatically backup your data</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="autoBackup"
                    checked={settings.autoBackup}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-black/30 backdrop-blur-lg peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:glass after:border-blue-500/50 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">Include Archived Data</h3>
                  <p className="text-sm text-white/90">Include archived records in exports</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="includeArchived"
                    checked={settings.includeArchived}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-black/30 backdrop-blur-lg peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:glass after:border-blue-500/50 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl"></div>
                </label>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-blue-500/30">
              <div className="flex flex-wrap gap-3">
                <Button className="glass border border-blue-500/50 hover:bg-blue-500/20">
                  <Download className="h-4 w-4 mr-2" />
                  Export All Data
                </Button>
                <Button className="glass border border-blue-500/50 hover:bg-blue-500/20">
                  <FileUp className="h-4 w-4 mr-2" />
                  Import Data
                </Button>
                <Button className="glass border border-blue-500/50 hover:bg-blue-500/20">
                  <Activity className="h-4 w-4 mr-2" />
                  View Activity Log
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass rounded-2xl glow-blue-sm border border-blue-400 p-6">
            <h2 className="text-lg font-semibold mb-4">
              <Keyboard className="h-5 w-5 inline mr-2" />
              Keyboard Shortcuts
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between p-3 bg-blue-500/10 rounded-lg">
                <span className="text-white/90">Quick Search</span>
                <kbd className="px-2 py-1 bg-black/30 rounded text-blue-300">Ctrl + K</kbd>
              </div>
              <div className="flex justify-between p-3 bg-blue-500/10 rounded-lg">
                <span className="text-white/90">New Customer</span>
                <kbd className="px-2 py-1 bg-black/30 rounded text-blue-300">Ctrl + N</kbd>
              </div>
              <div className="flex justify-between p-3 bg-blue-500/10 rounded-lg">
                <span className="text-white/90">New Appointment</span>
                <kbd className="px-2 py-1 bg-black/30 rounded text-blue-300">Ctrl + A</kbd>
              </div>
              <div className="flex justify-between p-3 bg-blue-500/10 rounded-lg">
                <span className="text-white/90">Save Changes</span>
                <kbd className="px-2 py-1 bg-black/30 rounded text-blue-300">Ctrl + S</kbd>
              </div>
              <div className="flex justify-between p-3 bg-blue-500/10 rounded-lg">
                <span className="text-white/90">Toggle Dark Mode</span>
                <kbd className="px-2 py-1 bg-black/30 rounded text-blue-300">Ctrl + D</kbd>
              </div>
              <div className="flex justify-between p-3 bg-blue-500/10 rounded-lg">
                <span className="text-white/90">Settings</span>
                <kbd className="px-2 py-1 bg-black/30 rounded text-blue-300">Ctrl + ,</kbd>
              </div>
            </div>

            <div className="mt-6 p-4 bg-amber-500/10 rounded-xl border border-amber-500/30">
              <div className="flex items-start space-x-3">
                <HelpCircle className="h-5 w-5 text-amber-300 mt-0.5" />
                <div>
                  <h4 className="text-amber-300 font-medium">Pro Tip</h4>
                  <p className="text-amber-200/90 text-sm mt-1">
                    Press <kbd className="px-1.5 py-0.5 bg-black/30 rounded text-amber-300">?</kbd> at any time to view all available keyboard shortcuts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 p-6 glass rounded-2xl border border-blue-400/30">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <p className="text-white/60 text-sm">Last settings update</p>
              <p className="text-white font-medium">{new Date().toLocaleDateString()}</p>
            </div>
            <div className="flex gap-3">
              <Button className="glass border border-red-500/50 text-red-300 hover:bg-red-500/20">
                Reset to Defaults
              </Button>
              <Button onClick={handleSave} className="glass-btn-primary hover:glow-blue">
                <CheckCircle className="h-4 w-4 mr-2" />
                Save All Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}