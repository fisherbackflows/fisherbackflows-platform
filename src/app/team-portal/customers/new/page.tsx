'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Save,
  Phone,
  Mail,
  MapPin,
  Building,
  User,
  Plus,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Device {
  id: string;
  type: 'RP' | 'PVB' | 'DC' | 'DCDA' | 'SVB';
  manufacturer: string;
  model: string;
  serialNumber: string;
  location: string;
  installDate: string;
  size: string;
}

interface CustomerForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  customerType: 'residential' | 'commercial' | 'industrial';
  waterDistrict: string;
  notes: string;
  devices: Device[];
}

export default function NewCustomerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CustomerForm>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: 'Tacoma',
    state: 'WA',
    zip: '',
    customerType: 'residential',
    waterDistrict: 'Tacoma Water',
    notes: '',
    devices: []
  });

  const deviceTypes = [
    { value: 'RP', label: 'Reduced Pressure (RP)' },
    { value: 'PVB', label: 'Pressure Vacuum Breaker (PVB)' },
    { value: 'DC', label: 'Double Check (DC)' },
    { value: 'DCDA', label: 'Double Check Detector Assembly (DCDA)' },
    { value: 'SVB', label: 'Spill-Resistant Vacuum Breaker (SVB)' }
  ];

  const waterDistricts = [
    'Tacoma Water',
    'Lakewood Water District',
    'Puyallup Water',
    'Gig Harbor Water',
    'Pierce County Water Utility',
    'Steilacoom Water',
    'University Place Water',
    'Other'
  ];

  const handleInputChange = (field: keyof CustomerForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addDevice = () => {
    const newDevice: Device = {
      id: Date.now().toString(),
      type: 'RP',
      manufacturer: '',
      model: '',
      serialNumber: '',
      location: '',
      installDate: '',
      size: '3/4"'
    };

    setFormData(prev => ({
      ...prev,
      devices: [...prev.devices, newDevice]
    }));
  };

  const updateDevice = (deviceId: string, field: keyof Device, value: string) => {
    setFormData(prev => ({
      ...prev,
      devices: prev.devices.map(device => 
        device.id === deviceId ? { ...device, [field]: value } : device
      )
    }));
  };

  const removeDevice = (deviceId: string) => {
    setFormData(prev => ({
      ...prev,
      devices: prev.devices.filter(device => device.id !== deviceId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, you'd send this data to your API
      console.log('Saving customer:', formData);
      
      router.push('/team-portal/customers');
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Error saving customer. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    handleInputChange('phone', formatted);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/team-portal/customers">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold text-gray-900">Add New Customer</h1>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-4 pb-20">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Basic Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                className="form-input"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter customer or business name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="(253) 555-0123"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Type
              </label>
              <select
                className="form-select"
                value={formData.customerType}
                onChange={(e) => handleInputChange('customerType', e.target.value as 'residential' | 'commercial' | 'industrial')}
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
              </select>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Address
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                required
                className="form-input"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="1234 Main Street"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Tacoma"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP *
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.zip}
                  onChange={(e) => handleInputChange('zip', e.target.value)}
                  placeholder="98402"
                  maxLength={5}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Water District
              </label>
              <select
                className="form-select"
                value={formData.waterDistrict}
                onChange={(e) => handleInputChange('waterDistrict', e.target.value)}
              >
                {waterDistricts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Devices */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Backflow Devices
            </h2>
            <Button type="button" variant="outline" size="sm" onClick={addDevice}>
              <Plus className="h-4 w-4 mr-1" />
              Add Device
            </Button>
          </div>

          {formData.devices.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Building className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No devices added yet</p>
              <p className="text-sm">Add backflow prevention devices for this customer</p>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.devices.map((device, index) => (
                <div key={device.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-gray-900">Device #{index + 1}</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => removeDevice(device.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Device Type
                      </label>
                      <select
                        className="form-select"
                        value={device.type}
                        onChange={(e) => updateDevice(device.id, 'type', e.target.value as Device['type'])}
                      >
                        {deviceTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Size
                      </label>
                      <select
                        className="form-select"
                        value={device.size}
                        onChange={(e) => updateDevice(device.id, 'size', e.target.value)}
                      >
                        <option value="3/4&quot;">3/4"</option>
                        <option value="1&quot;">1"</option>
                        <option value="1.5&quot;">1.5"</option>
                        <option value="2&quot;">2"</option>
                        <option value="3&quot;">3"</option>
                        <option value="4&quot;">4"</option>
                        <option value="6&quot;">6"</option>
                        <option value="8&quot;">8"</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Manufacturer
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={device.manufacturer}
                        onChange={(e) => updateDevice(device.id, 'manufacturer', e.target.value)}
                        placeholder="e.g. Watts, Zurn, Febco"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Model
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={device.model}
                        onChange={(e) => updateDevice(device.id, 'model', e.target.value)}
                        placeholder="Model number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Serial Number
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={device.serialNumber}
                        onChange={(e) => updateDevice(device.id, 'serialNumber', e.target.value)}
                        placeholder="Serial number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={device.location}
                        onChange={(e) => updateDevice(device.id, 'location', e.target.value)}
                        placeholder="e.g. Front yard, Basement"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Additional Notes
          </h2>
          <textarea
            className="form-textarea"
            rows={4}
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Any additional information about this customer..."
          />
        </div>

        {/* Actions */}
        <div className="flex space-x-4">
          <Button type="submit" disabled={saving} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Customer'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}