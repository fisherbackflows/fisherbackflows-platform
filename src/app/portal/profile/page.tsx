'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit2,
  Save,
  X,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface CustomerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  propertyType: string;
  accountNumber: string;
  accountStatus: string;
  createdAt: string;
}

export default function CustomerProfilePage() {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    }
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/customer/profile');
      const data = await response.json();

      if (response.ok) {
        setProfile(data.profile);
        setEditForm({
          firstName: data.profile.firstName,
          lastName: data.profile.lastName,
          phone: data.profile.phone,
          address: { ...data.profile.address }
        });
      } else {
        setError(data.error || 'Failed to load profile');
      }
    } catch (err) {
      setError('Network error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();

      if (response.ok) {
        setProfile(data.profile);
        setIsEditing(false);
        setSuccess('Profile updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Network error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setEditForm({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        address: { ...profile.address }
      });
    }
    setIsEditing(false);
    setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <header className="glass border-b border-blue-400 glow-blue-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <Link href="/portal/dashboard" className="inline-flex items-center text-blue-300 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="glass border border-blue-400 rounded-2xl p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-white/80">Loading your profile...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black">
        <header className="glass border-b border-blue-400 glow-blue-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <Link href="/portal/dashboard" className="inline-flex items-center text-blue-300 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="glass border border-red-400 rounded-2xl p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Profile Not Found</h2>
            <p className="text-white/80 mb-4">We couldn't load your profile information.</p>
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <Button onClick={fetchProfile} className="glass-btn-primary">
              Retry
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="glass border-b border-blue-400 glow-blue-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/portal/dashboard" className="inline-flex items-center text-blue-300 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>

            <h1 className="text-xl font-semibold text-white">My Profile</h1>

            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="glass-btn-primary hover:glow-blue"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  onClick={handleCancel}
                  className="glass hover:glass text-white/80"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="glass-btn-primary hover:glow-blue"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-400/50 rounded-xl glass">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <p className="text-green-300">{success}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-400/50 rounded-xl glass">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        )}

        <div className="glass border border-blue-400 rounded-2xl p-8 glow-blue-sm">
          {/* Account Overview */}
          <div className="border-b border-blue-400/30 pb-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">Account Overview</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <User className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">Account Number</p>
                  <p className="text-white font-medium">{profile.accountNumber}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">Account Status</p>
                  <p className="text-green-400 font-medium capitalize">{profile.accountStatus}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Personal Information</h3>

            <div className="grid md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  First Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-blue-400 glass text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400/50"
                    required
                  />
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
                    <User className="h-5 w-5 text-blue-400" />
                    <span className="text-white">{profile.firstName}</span>
                  </div>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Last Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-blue-400 glass text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400/50"
                    required
                  />
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
                    <User className="h-5 w-5 text-blue-400" />
                    <span className="text-white">{profile.lastName}</span>
                  </div>
                )}
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Email Address
                </label>
                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
                  <Mail className="h-5 w-5 text-blue-400" />
                  <span className="text-white">{profile.email}</span>
                  <span className="text-white/60 text-xs">(Contact support to change)</span>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-blue-400 glass text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400/50"
                    placeholder="(253) 555-0123"
                  />
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
                    <Phone className="h-5 w-5 text-blue-400" />
                    <span className="text-white">{profile.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Address */}
            <div>
              <h4 className="text-lg font-medium text-white mb-4">Property Address</h4>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Street Address
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.address.street}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        address: { ...prev.address, street: e.target.value }
                      }))}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-blue-400 glass text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400/50"
                      placeholder="123 Main Street"
                    />
                  ) : (
                    <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
                      <MapPin className="h-5 w-5 text-blue-400" />
                      <span className="text-white">{profile.address.street}</span>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      City
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.address.city}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          address: { ...prev.address, city: e.target.value }
                        }))}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-blue-400 glass text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400/50"
                        placeholder="Tacoma"
                      />
                    ) : (
                      <div className="p-3 bg-white/5 rounded-xl">
                        <span className="text-white">{profile.address.city}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      State
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.address.state}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          address: { ...prev.address, state: e.target.value }
                        }))}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-blue-400 glass text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400/50"
                        placeholder="WA"
                      />
                    ) : (
                      <div className="p-3 bg-white/5 rounded-xl">
                        <span className="text-white">{profile.address.state}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      ZIP Code
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.address.zipCode}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          address: { ...prev.address, zipCode: e.target.value }
                        }))}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-blue-400 glass text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400/50"
                        placeholder="98401"
                      />
                    ) : (
                      <div className="p-3 bg-white/5 rounded-xl">
                        <span className="text-white">{profile.address.zipCode}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Property Type */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Property Type
              </label>
              <div className="p-3 bg-white/5 rounded-xl">
                <span className="text-white capitalize">{profile.propertyType}</span>
              </div>
            </div>

            {/* Account Created */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Member Since
              </label>
              <div className="p-3 bg-white/5 rounded-xl">
                <span className="text-white">
                  {new Date(profile.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}