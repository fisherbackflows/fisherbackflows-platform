'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { TeamPortalNavigation } from '@/components/navigation/UnifiedNavigation';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Save,
  User,
  Phone,
  Mail,
  MapPin,
  Settings,
  Calendar,
  FileText
} from 'lucide-react';
import Link from 'next/link';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  deviceType: string;
  deviceLocation: string;
  lastTested: string;
  nextDue: string;
  notes: string;
  status: 'active' | 'inactive';
}

export default function EditCustomerPage() {
  const params = useParams();
  const customerId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Customer>({
    id: customerId,
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'WA',
    zipCode: '',
    deviceType: '',
    deviceLocation: '',
    lastTested: '',
    nextDue: '',
    notes: '',
    status: 'active'
  });

  useEffect(() => {
    async function loadCustomer() {
      try {
        const response = await fetch(`/api/customers/${customerId}`);
        if (!response.ok) {
          throw new Error('Customer not found');
        }
        
        const data = await response.json();
        const customer = data.customer;
        
        // Transform API data to match form structure
        const customerData: Customer = {
          id: customer.id,
          name: `${customer.first_name} ${customer.last_name}`.trim(),
          email: customer.email || '',
          phone: customer.phone || '',
          address: customer.address_line1 || customer.address || '',
          city: customer.city || '',
          state: customer.state || 'WA',
          zipCode: customer.zip_code || '',
          deviceType: customer.devices?.[0]?.device_type || 'Unknown',
          deviceLocation: customer.devices?.[0]?.location || 'Unknown',
          lastTested: customer.devices?.[0]?.last_test_date || 'Never',
          nextDue: customer.devices?.[0]?.next_test_due || 'Unknown',
          notes: customer.notes || '',
          status: customer.status === 'active' ? 'active' : 'inactive'
        };
        
        setFormData(customerData);
      } catch (error) {
        console.error('Error loading customer:', error);
        alert('Failed to load customer data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    if (customerId) {
      loadCustomer();
    }
  }, [customerId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Transform form data to match API expectations
      const customerData = {
        first_name: formData.name.split(' ')[0] || formData.name,
        last_name: formData.name.split(' ').slice(1).join(' ') || '',
        email: formData.email,
        phone: formData.phone,
        address_line1: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zipCode,
        notes: formData.notes,
        status: formData.status
      };

      // Update customer
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update customer');
      }

      const result = await response.json();
      console.log('Customer updated successfully:', result);

      alert('Customer updated successfully!');
      window.location.href = `/team-portal/customers/${customerId}`;
    } catch (error) {
      console.error('Error updating customer:', error);
      alert(`Error updating customer: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <TeamPortalNavigation userInfo={{ name: 'Team Member', email: '' }} />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href={`/team-portal/customers/${customerId}`}>
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white">Edit Customer</h1>
          </div>
        </div>
        <div className="glass rounded-2xl glow-blue-sm">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Information */}
              <div>
                <h2 className="text-lg font-semibold mb-4">
                  <User className="h-5 w-5 inline mr-2" />
                  Customer Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-blue-500/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-blue-500/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      <Phone className="h-4 w-4 inline mr-1" />
                      Phone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-blue-500/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h2 className="text-lg font-semibold mb-4">
                  <MapPin className="h-5 w-5 inline mr-2" />
                  Address Information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-blue-500/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-blue-500/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        State
                      </label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-blue-500/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        <option value="WA">Washington</option>
                        <option value="OR">Oregon</option>
                        <option value="CA">California</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-blue-500/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Device Information */}
              <div>
                <h2 className="text-lg font-semibold mb-4">
                  <Settings className="h-5 w-5 inline mr-2" />
                  Device Information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Device Type *
                    </label>
                    <select
                      name="deviceType"
                      value={formData.deviceType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-blue-500/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    >
                      <option value="">Select device type</option>
                      <option value="Reduced Pressure Zone">Reduced Pressure Zone (RPZ)</option>
                      <option value="Double Check Valve">Double Check Valve (DC)</option>
                      <option value="Pressure Vacuum Breaker">Pressure Vacuum Breaker (PVB)</option>
                      <option value="Atmospheric Vacuum Breaker">Atmospheric Vacuum Breaker (AVB)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Device Location
                    </label>
                    <input
                      type="text"
                      name="deviceLocation"
                      value={formData.deviceLocation}
                      onChange={handleInputChange}
                      placeholder="e.g., Front yard, near water meter"
                      className="w-full px-3 py-2 border border-blue-500/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>
              </div>

              {/* Testing Information */}
              <div>
                <h2 className="text-lg font-semibold mb-4">
                  <Calendar className="h-5 w-5 inline mr-2" />
                  Testing Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Last Tested
                    </label>
                    <input
                      type="date"
                      name="lastTested"
                      value={formData.lastTested}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-blue-500/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Next Due Date
                    </label>
                    <input
                      type="date"
                      name="nextDue"
                      value={formData.nextDue}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-blue-500/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h2 className="text-lg font-semibold mb-4">
                  <FileText className="h-5 w-5 inline mr-2" />
                  Additional Information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-blue-500/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-blue-500/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Special instructions, gate codes, preferred appointment times, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t">
                <Button type="submit" className="glass-btn-primary hover:glow-blue">
                  <Save className="h-4 w-4 mr-2" />
                  Update Customer
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}