'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  X,
  Droplet,
  MapPin,
  Calendar,
  Settings,
  Save,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DeviceRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (device: any) => void;
}

const DEVICE_TYPES = [
  'Reduced Pressure Zone (RPZ)',
  'Double Check Valve (DCV)',
  'Pressure Vacuum Breaker (PVB)',
  'Atmospheric Vacuum Breaker (AVB)',
  'Air Gap',
  'Other'
];

const MANUFACTURERS = [
  'Watts', 'Febco', 'Wilkins', 'Ames', 'Apollo', 'Conbraco', 'Other'
];

const DEVICE_SIZES = [
  '1/2"', '3/4"', '1"', '1 1/4"', '1 1/2"', '2"', '2 1/2"', '3"', '4"', '6"', '8"', '10"', '12"'
];

export default function DeviceRegistrationModal({ isOpen, onClose, onSuccess }: DeviceRegistrationModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    device_type: '',
    manufacturer: '',
    model: '',
    size_inches: '',
    serial_number: '',
    location_description: '',
    installation_date: '',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.device_type) newErrors.device_type = 'Device type is required';
    if (!formData.manufacturer) newErrors.manufacturer = 'Manufacturer is required';
    if (!formData.model.trim()) newErrors.model = 'Model is required';
    if (!formData.size_inches) newErrors.size_inches = 'Device size is required';
    if (!formData.location_description.trim()) newErrors.location_description = 'Location description is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/portal/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Device registered successfully!');
        onSuccess(data.device);
        onClose();
        // Reset form
        setFormData({
          device_type: '',
          manufacturer: '',
          model: '',
          size_inches: '',
          serial_number: '',
          location_description: '',
          installation_date: '',
          notes: ''
        });
        setErrors({});
      } else {
        toast.error(data.error || 'Failed to register device');
        if (data.details && Array.isArray(data.details)) {
          data.details.forEach((error: string) => {
            toast.error(error);
          });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl border border-blue-400 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl">
                <Droplet className="h-6 w-6 text-blue-300" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Register New Device</h2>
                <p className="text-white/80 text-sm">Add a backflow prevention device to your account</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              className="glass hover:glass text-white p-2 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Device Type */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Device Type <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.device_type}
                onChange={(e) => handleInputChange('device_type', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl bg-white/10 border glass text-white focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm transition-all duration-200 ${
                  errors.device_type ? 'border-red-400' : 'border-blue-400'
                }`}
              >
                <option value="" className="bg-slate-900 text-white">Select device type</option>
                {DEVICE_TYPES.map(type => (
                  <option key={type} value={type} className="bg-slate-900 text-white">{type}</option>
                ))}
              </select>
              {errors.device_type && <p className="text-red-400 text-sm mt-1">{errors.device_type}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Manufacturer */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Manufacturer <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.manufacturer}
                  onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl bg-white/10 border glass text-white focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm transition-all duration-200 ${
                    errors.manufacturer ? 'border-red-400' : 'border-blue-400'
                  }`}
                >
                  <option value="" className="bg-slate-900 text-white">Select manufacturer</option>
                  {MANUFACTURERS.map(manufacturer => (
                    <option key={manufacturer} value={manufacturer} className="bg-slate-900 text-white">{manufacturer}</option>
                  ))}
                </select>
                {errors.manufacturer && <p className="text-red-400 text-sm mt-1">{errors.manufacturer}</p>}
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Model <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl bg-white/10 border glass text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm transition-all duration-200 ${
                    errors.model ? 'border-red-400' : 'border-blue-400'
                  }`}
                  placeholder="e.g., Series 909, 765-1"
                />
                {errors.model && <p className="text-red-400 text-sm mt-1">{errors.model}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Size */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Size <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.size_inches}
                  onChange={(e) => handleInputChange('size_inches', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl bg-white/10 border glass text-white focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm transition-all duration-200 ${
                    errors.size_inches ? 'border-red-400' : 'border-blue-400'
                  }`}
                >
                  <option value="" className="bg-slate-900 text-white">Select size</option>
                  {DEVICE_SIZES.map(size => (
                    <option key={size} value={size} className="bg-slate-900 text-white">{size}</option>
                  ))}
                </select>
                {errors.size_inches && <p className="text-red-400 text-sm mt-1">{errors.size_inches}</p>}
              </div>

              {/* Serial Number */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={formData.serial_number}
                  onChange={(e) => handleInputChange('serial_number', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-blue-400 glass text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm transition-all duration-200"
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Location Description <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.location_description}
                onChange={(e) => handleInputChange('location_description', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl bg-white/10 border glass text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm transition-all duration-200 ${
                  errors.location_description ? 'border-red-400' : 'border-blue-400'
                }`}
                placeholder="e.g., Front yard water meter area, Basement utility room"
              />
              {errors.location_description && <p className="text-red-400 text-sm mt-1">{errors.location_description}</p>}
            </div>

            {/* Installation Date */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Installation Date
              </label>
              <input
                type="date"
                value={formData.installation_date}
                onChange={(e) => handleInputChange('installation_date', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-blue-400 glass text-white focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm transition-all duration-200"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-blue-400 glass text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400/50 focus:glow-blue-sm transition-all duration-200"
                placeholder="Any additional information about this device"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-blue-400/20">
              <Button
                type="button"
                onClick={onClose}
                className="glass hover:glass text-white px-6 py-3 rounded-2xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="glass-btn-primary hover:glow-blue text-white px-8 py-3 rounded-2xl glow-blue-sm disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Registering...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Save className="h-4 w-4" />
                    <span>Register Device</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}