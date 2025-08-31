'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  MapPin, 
  Hash, 
  Calendar, 
  Droplet, 
  Settings,
  Upload,
  Trash2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Device {
  id?: string;
  location: string;
  address: string;
  serialNumber: string;
  size: string;
  make: string;
  model: string;
  type: string;
  installDate: string;
  lastTestDate?: string;
  nextTestDate: string;
  status?: string;
  daysUntilTest?: number;
  testingRequired: boolean;
  notes?: string;
  photos?: string[];
}

interface DeviceFormProps {
  device?: Device;
  onClose: () => void;
  onSave: (device: Device) => void;
  isOpen: boolean;
}

const deviceSizes = ['1/2"', '3/4"', '1"', '1-1/4"', '1-1/2"', '2"', '2-1/2"', '3"', '4"', '6"', '8"'];
const deviceMakes = ['Watts', 'Febco', 'Zurn Wilkins', 'Apollo', 'Ames', 'Conbraco', 'Hersey', 'Other'];
const deviceTypes = [
  'Reduced Pressure Zone (RPZ)',
  'Double Check Valve (DCV)', 
  'Pressure Vacuum Breaker (PVB)',
  'Atmospheric Vacuum Breaker (AVB)',
  'Spill-Resistant Vacuum Breaker (SVB)'
];

export default function DeviceForm({ device, onClose, onSave, isOpen }: DeviceFormProps) {
  const [formData, setFormData] = useState<Device>({
    location: '',
    address: '',
    serialNumber: '',
    size: '3/4"',
    make: 'Watts',
    model: '',
    type: 'Reduced Pressure Zone (RPZ)',
    installDate: '',
    nextTestDate: '',
    testingRequired: true,
    notes: '',
    photos: []
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (device) {
      setFormData({ ...device });
    } else {
      // Reset form for new device
      const currentDate = new Date();
      const nextYear = new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), currentDate.getDate());
      
      setFormData({
        location: '',
        address: '',
        serialNumber: '',
        size: '3/4"',
        make: 'Watts',
        model: '',
        type: 'Reduced Pressure Zone (RPZ)',
        installDate: currentDate.toISOString().split('T')[0],
        nextTestDate: nextYear.toISOString().split('T')[0],
        testingRequired: true,
        notes: '',
        photos: []
      });
    }
    setErrors({});
    setSuccess('');
  }, [device, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.serialNumber.trim()) {
      newErrors.serialNumber = 'Serial number is required';
    }
    
    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }
    
    if (!formData.installDate) {
      newErrors.installDate = 'Install date is required';
    }
    
    if (!formData.nextTestDate) {
      newErrors.nextTestDate = 'Next test date is required';
    }

    // Validate that next test date is after install date
    if (formData.installDate && formData.nextTestDate) {
      const installDate = new Date(formData.installDate);
      const nextTestDate = new Date(formData.nextTestDate);
      
      if (nextTestDate <= installDate) {
        newErrors.nextTestDate = 'Next test date must be after install date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setSuccess('');

    try {
      // Calculate days until test
      const nextTest = new Date(formData.nextTestDate);
      const today = new Date();
      const daysUntilTest = Math.ceil((nextTest.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Determine status based on days until test
      let status = 'Passed';
      if (daysUntilTest < 0) {
        status = 'Overdue';
      } else if (daysUntilTest <= 30) {
        status = 'Due Soon';
      }

      const deviceData: Device = {
        ...formData,
        daysUntilTest,
        status,
        id: device?.id || `dev_${Date.now()}`
      };

      // In a real app, this would make an API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess(`Device ${device ? 'updated' : 'added'} successfully!`);
      
      setTimeout(() => {
        onSave(deviceData);
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Error saving device:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto glow-blue-sm">
        {/* Header */}
        <div className="glass-blue rounded-t-2xl p-6 border-b border-white/10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold gradient-text">
                {device ? 'Edit Device' : 'Add New Device'}
              </h2>
              <p className="text-white/60 mt-1">
                {device ? 'Update device information and testing schedule' : 'Register a new backflow prevention device'}
              </p>
            </div>
            <Button onClick={onClose} className="btn-glass p-2 rounded-lg">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Location Description *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Front Yard, Basement, etc."
                    className={`input-glass w-full pl-10 pr-4 py-3 rounded-lg ${errors.location ? 'border-red-400/50' : ''}`}
                  />
                </div>
                {errors.location && (
                  <p className="text-red-400 text-xs mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.location}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Full Address *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Main St, Tacoma, WA 98401"
                  className={`input-glass w-full px-4 py-3 rounded-lg ${errors.address ? 'border-red-400/50' : ''}`}
                />
                {errors.address && (
                  <p className="text-red-400 text-xs mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.address}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Serial Number *
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                  placeholder="BF-2024-001"
                  className={`input-glass w-full pl-10 pr-4 py-3 rounded-lg ${errors.serialNumber ? 'border-red-400/50' : ''}`}
                />
              </div>
              {errors.serialNumber && (
                <p className="text-red-400 text-xs mt-1 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.serialNumber}
                </p>
              )}
            </div>
          </div>

          {/* Device Specifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Device Specifications</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Size</label>
                <select
                  value={formData.size}
                  onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                  className="input-glass w-full px-4 py-3 rounded-lg"
                >
                  {deviceSizes.map(size => (
                    <option key={size} value={size} className="bg-black">{size}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Make</label>
                <select
                  value={formData.make}
                  onChange={(e) => setFormData(prev => ({ ...prev, make: e.target.value }))}
                  className="input-glass w-full px-4 py-3 rounded-lg"
                >
                  {deviceMakes.map(make => (
                    <option key={make} value={make} className="bg-black">{make}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Model *</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                  placeholder="Series 909"
                  className={`input-glass w-full px-4 py-3 rounded-lg ${errors.model ? 'border-red-400/50' : ''}`}
                />
                {errors.model && (
                  <p className="text-red-400 text-xs mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.model}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Device Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="input-glass w-full px-4 py-3 rounded-lg"
              >
                {deviceTypes.map(type => (
                  <option key={type} value={type} className="bg-black">{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Testing Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Testing Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Install Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
                  <input
                    type="date"
                    value={formData.installDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, installDate: e.target.value }))}
                    className={`input-glass w-full pl-10 pr-4 py-3 rounded-lg ${errors.installDate ? 'border-red-400/50' : ''}`}
                  />
                </div>
                {errors.installDate && (
                  <p className="text-red-400 text-xs mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.installDate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Next Test Due *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
                  <input
                    type="date"
                    value={formData.nextTestDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, nextTestDate: e.target.value }))}
                    className={`input-glass w-full pl-10 pr-4 py-3 rounded-lg ${errors.nextTestDate ? 'border-red-400/50' : ''}`}
                  />
                </div>
                {errors.nextTestDate && (
                  <p className="text-red-400 text-xs mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.nextTestDate}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-3 text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.testingRequired}
                  onChange={(e) => setFormData(prev => ({ ...prev, testingRequired: e.target.checked }))}
                  className="form-checkbox h-5 w-5 text-blue-700 rounded border-white/20 bg-white/10"
                />
                <span>Annual testing required</span>
              </label>
              <p className="text-white/50 text-xs mt-1 ml-8">
                Most backflow devices require annual testing by state law
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional information about this device..."
              rows={3}
              className="input-glass w-full px-4 py-3 rounded-lg resize-none"
            />
          </div>

          {/* Success Message */}
          {success && (
            <div className="glass-blue border border-green-500/20 rounded-lg p-4 flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-white/10">
            <Button
              type="button"
              onClick={onClose}
              className="btn-glass px-6 py-3 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="btn-glow px-6 py-3 rounded-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {device ? 'Update Device' : 'Add Device'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}