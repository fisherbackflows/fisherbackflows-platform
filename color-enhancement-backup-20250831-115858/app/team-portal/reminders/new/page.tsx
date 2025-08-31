'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Save,
  Bell,
  Calendar,
  User,
  FileText,
  Mail,
  Phone
} from 'lucide-react';
import Link from 'next/link';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  nextDue: string;
}

export default function NewReminderPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formData, setFormData] = useState({
    customerId: '',
    reminderDate: '',
    reminderType: 'email',
    message: '',
    isAutomated: false,
    daysBeforeDue: 30
  });

  useEffect(() => {
    // Mock customers data - replace with actual API call
    const mockCustomers: Customer[] = [
      { 
        id: '1', 
        name: 'John Smith', 
        email: 'john@example.com', 
        phone: '(253) 555-0123',
        nextDue: '2024-12-15' 
      },
      { 
        id: '2', 
        name: 'Jane Doe', 
        email: 'jane@example.com', 
        phone: '(253) 555-0124',
        nextDue: '2024-11-20' 
      },
      { 
        id: '3', 
        name: 'Bob Johnson', 
        email: 'bob@example.com', 
        phone: '(253) 555-0125',
        nextDue: '2024-10-30' 
      }
    ];
    setCustomers(mockCustomers);

    // Set default message
    setFormData(prev => ({
      ...prev,
      message: `Dear [Customer Name],

This is a friendly reminder that your annual backflow testing is due on [Due Date].

To schedule your appointment, please:
• Call us at (253) 278-8692
• Email us at service@fisherbackflows.com
• Visit our online portal to book online

Thank you for choosing Fisher Backflows for your backflow testing needs.

Best regards,
Fisher Backflows Team`
    }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock save - replace with actual API call
    console.log('Creating reminder:', formData);
    
    // Simulate successful save
    alert('Reminder created successfully!');
    window.location.href = '/team-portal/reminders';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const customerId = e.target.value;
    const customer = customers.find(c => c.id === customerId);
    
    if (customer && formData.isAutomated) {
      // Calculate reminder date based on due date and days before
      const dueDate = new Date(customer.nextDue);
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(dueDate.getDate() - formData.daysBeforeDue);
      
      setFormData(prev => ({
        ...prev,
        customerId,
        reminderDate: reminderDate.toISOString().split('T')[0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        customerId
      }));
    }
  };

  const selectedCustomer = customers.find(c => c.id === formData.customerId);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/team-portal/reminders">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">New Reminder</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4 inline mr-2" />
                  Customer
                </label>
                <select
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleCustomerChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - Due: {customer.nextDue}
                    </option>
                  ))}
                </select>
                {selectedCustomer && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Email: {selectedCustomer.email}</p>
                    <p>Phone: {selectedCustomer.phone}</p>
                    <p>Next Testing Due: {selectedCustomer.nextDue}</p>
                  </div>
                )}
              </div>

              {/* Automated Reminder Toggle */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isAutomated"
                    checked={formData.isAutomated}
                    onChange={handleInputChange}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Automated reminder based on due date
                  </span>
                </label>
              </div>

              {/* Days Before Due (for automated reminders) */}
              {formData.isAutomated && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Send reminder how many days before due date?
                  </label>
                  <select
                    name="daysBeforeDue"
                    value={formData.daysBeforeDue}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={7}>7 days before</option>
                    <option value={14}>14 days before</option>
                    <option value={30}>30 days before</option>
                    <option value={60}>60 days before</option>
                  </select>
                </div>
              )}

              {/* Reminder Date (for manual reminders) */}
              {!formData.isAutomated && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Reminder Date
                  </label>
                  <input
                    type="date"
                    name="reminderDate"
                    value={formData.reminderDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}

              {/* Reminder Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Bell className="h-4 w-4 inline mr-2" />
                  Reminder Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-white">
                    <input
                      type="radio"
                      name="reminderType"
                      value="email"
                      checked={formData.reminderType === 'email'}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <Mail className="h-4 w-4 mr-2 text-blue-600" />
                    <span>Email</span>
                  </label>
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-white">
                    <input
                      type="radio"
                      name="reminderType"
                      value="sms"
                      checked={formData.reminderType === 'sms'}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <Phone className="h-4 w-4 mr-2 text-green-600" />
                    <span>SMS</span>
                  </label>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="h-4 w-4 inline mr-2" />
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your reminder message..."
                  required
                />
                <p className="mt-2 text-xs text-gray-500">
                  You can use [Customer Name] and [Due Date] as placeholders that will be automatically replaced.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4 mr-2" />
                  Create Reminder
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}