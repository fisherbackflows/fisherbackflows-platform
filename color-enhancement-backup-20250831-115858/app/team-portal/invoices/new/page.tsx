'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  DollarSign,
  User,
  FileText,
  Calendar,
  Send,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface InvoiceService {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceForm {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  issueDate: string;
  dueDate: string;
  services: InvoiceService[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string;
  terms: string;
}

const serviceTemplates = [
  { description: 'Annual Backflow Test - RP Device', rate: 85.00 },
  { description: 'Annual Backflow Test - DC Device', rate: 85.00 },
  { description: 'Annual Backflow Test - PVB Device', rate: 85.00 },
  { description: 'Annual Backflow Test - DCDA Device', rate: 95.00 },
  { description: 'Annual Backflow Test - SVB Device', rate: 75.00 },
  { description: 'Backflow Device Repair - Relief Valve', rate: 150.00 },
  { description: 'Backflow Device Repair - Check Valve', rate: 125.00 },
  { description: 'Backflow Device Installation', rate: 450.00 },
  { description: 'Emergency Service Call', rate: 125.00 },
  { description: 'Travel Time', rate: 75.00 },
  { description: 'Parts - Relief Valve Assembly', rate: 40.00 },
  { description: 'Parts - Check Valve', rate: 25.00 },
  { description: 'Consultation Fee', rate: 95.00 }
];

export default function NewInvoicePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<InvoiceForm>({
    customerId: '',
    customerName: '',
    customerEmail: '',
    customerAddress: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    services: [],
    subtotal: 0,
    taxRate: 9.0, // Washington State tax rate
    taxAmount: 0,
    total: 0,
    notes: '',
    terms: 'Payment due within 30 days. Late fees may apply after due date.'
  });

  const [customers] = useState([
    { 
      id: '1', 
      name: 'Johnson Properties LLC', 
      email: 'manager@johnsonproperties.com',
      address: '1234 Pacific Ave, Tacoma, WA 98402'
    },
    { 
      id: '2', 
      name: 'Smith Residence', 
      email: 'john.smith@gmail.com',
      address: '5678 6th Ave, Tacoma, WA 98406'
    },
    { 
      id: '3', 
      name: 'Parkland Medical Center', 
      email: 'facilities@parklandmedical.com',
      address: '910 112th St E, Parkland, WA 98444'
    },
    { 
      id: '4', 
      name: 'Harbor View Apartments', 
      email: 'maintenance@harborview.com',
      address: '2500 Harborview Dr, Gig Harbor, WA 98335'
    },
    { 
      id: '5', 
      name: 'Downtown Deli', 
      email: 'owner@downtowndeli.com',
      address: '789 Commerce St, Tacoma, WA 98402'
    }
  ]);

  // Recalculate totals when services change
  useEffect(() => {
    const subtotal = formData.services.reduce((sum, service) => sum + service.amount, 0);
    const taxAmount = subtotal * (formData.taxRate / 100);
    const total = subtotal + taxAmount;

    setFormData(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      total
    }));
  }, [formData.services, formData.taxRate]);

  const handleInputChange = (field: keyof InvoiceForm, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId,
        customerName: customer.name,
        customerEmail: customer.email,
        customerAddress: customer.address
      }));
    }
  };

  const addService = () => {
    const newService: InvoiceService = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0
    };

    setFormData(prev => ({
      ...prev,
      services: [...prev.services, newService]
    }));
  };

  const updateService = (serviceId: string, field: keyof InvoiceService, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map(service => {
        if (service.id === serviceId) {
          const updatedService = { ...service, [field]: value };
          
          // Recalculate amount when quantity or rate changes
          if (field === 'quantity' || field === 'rate') {
            updatedService.amount = updatedService.quantity * updatedService.rate;
          }
          
          return updatedService;
        }
        return service;
      })
    }));
  };

  const removeService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter(service => service.id !== serviceId)
    }));
  };

  const addServiceFromTemplate = (template: typeof serviceTemplates[0]) => {
    const newService: InvoiceService = {
      id: Date.now().toString(),
      description: template.description,
      quantity: 1,
      rate: template.rate,
      amount: template.rate
    };

    setFormData(prev => ({
      ...prev,
      services: [...prev.services, newService]
    }));
  };

  const handleSubmit = async (e: React.FormEvent, action: 'save' | 'send') => {
    e.preventDefault();
    setSaving(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Saving invoice:', { ...formData, action });
      
      alert(`Invoice ${action === 'save' ? 'saved as draft' : 'saved and sent'} successfully!`);
      router.push('/team-portal/invoices');
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Error saving invoice. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/team-portal/invoices">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">New Invoice</h1>
              <p className="text-sm text-gray-600">Create a new invoice for services</p>
            </div>
          </div>
        </div>
      </header>

      <form className="p-4 pb-32">
        {/* Customer Information */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Customer Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer *
              </label>
              <select
                className="form-select"
                value={formData.customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                required
              >
                <option value="">Select a customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            {formData.customerName && (
              <div className="bg-white rounded-lg p-3">
                <div className="font-medium text-gray-900">{formData.customerName}</div>
                <div className="text-sm text-gray-600">{formData.customerEmail}</div>
                <div className="text-sm text-gray-600">{formData.customerAddress}</div>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Details */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Invoice Details
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Date *
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.issueDate}
                  onChange={(e) => handleInputChange('issueDate', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Services
            </h2>
            <Button type="button" variant="outline" size="sm" onClick={addService}>
              <Plus className="h-4 w-4 mr-1" />
              Add Service
            </Button>
          </div>

          {/* Service Templates */}
          {formData.services.length === 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Quick Add Common Services:</p>
              <div className="flex flex-wrap gap-2">
                {serviceTemplates.slice(0, 3).map((template, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => addServiceFromTemplate(template)}
                    className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                  >
                    {template.description} - {formatCurrency(template.rate)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {formData.services.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No services added yet</p>
              <p className="text-sm">Add the services provided to this customer</p>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.services.map((service, index) => (
                <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-gray-900">Service #{index + 1}</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => removeService(service.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={service.description}
                        onChange={(e) => updateService(service.id, 'description', e.target.value)}
                        placeholder="Service description"
                        required
                      />
                      {serviceTemplates.length > 0 && (
                        <div className="mt-1">
                          <select
                            className="text-xs text-gray-600 bg-transparent border-none"
                            onChange={(e) => {
                              const template = serviceTemplates.find(t => t.description === e.target.value);
                              if (template) {
                                updateService(service.id, 'description', template.description);
                                updateService(service.id, 'rate', template.rate);
                              }
                            }}
                            value=""
                          >
                            <option value="">Choose from template...</option>
                            {serviceTemplates.map((template, idx) => (
                              <option key={idx} value={template.description}>
                                {template.description} - {formatCurrency(template.rate)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="form-input"
                          value={service.quantity}
                          onChange={(e) => updateService(service.id, 'quantity', parseInt(e.target.value) || 1)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rate *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-input"
                          value={service.rate}
                          onChange={(e) => updateService(service.id, 'rate', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Amount
                        </label>
                        <div className="form-input bg-white text-gray-900 font-medium">
                          {formatCurrency(service.amount)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Invoice Totals */}
          {formData.services.length > 0 && (
            <div className="mt-6 bg-white rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(formData.subtotal)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">Tax:</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="20"
                      className="w-16 text-xs border border-gray-300 rounded px-1 py-0.5"
                      value={formData.taxRate}
                      onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value) || 0)}
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                  <span className="font-medium">{formatCurrency(formData.taxAmount)}</span>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(formData.total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notes & Terms */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Notes & Terms
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                className="form-textarea"
                rows={3}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes for the customer..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Terms
              </label>
              <textarea
                className="form-textarea"
                rows={2}
                value={formData.terms}
                onChange={(e) => handleInputChange('terms', e.target.value)}
                placeholder="Payment terms and conditions..."
              />
            </div>
          </div>
        </div>
      </form>

      {/* Fixed Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-3">
          <Button 
            type="button"
            onClick={(e) => handleSubmit(e, 'save')}
            disabled={saving || !formData.customerId || formData.services.length === 0}
            className="flex-1"
            variant="outline"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button 
            type="button"
            onClick={(e) => handleSubmit(e, 'send')}
            disabled={saving || !formData.customerId || formData.services.length === 0}
            className="flex-1"
          >
            <Send className="h-4 w-4 mr-2" />
            {saving ? 'Sending...' : 'Save & Send'}
          </Button>
        </div>
        <Button 
          type="button" 
          variant="ghost" 
          className="w-full mt-2" 
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}