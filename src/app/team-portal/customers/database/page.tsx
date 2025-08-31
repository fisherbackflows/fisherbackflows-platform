'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Database,
  Search,
  Filter,
  Download,
  Upload,
  Users,
  Calendar,
  Bell,
  MapPin,
  Phone,
  Mail,
  Building2,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  FileText,
  Settings
} from 'lucide-react';
import Link from 'next/link';

interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  customerType: 'residential' | 'commercial' | 'industrial';
  waterDistrict: string;
  createdDate: string;
  lastTestDate: string | null;
  nextTestDue: string | null;
  status: 'active' | 'inactive' | 'overdue';
  devices: {
    id: string;
    type: 'RP' | 'PVB' | 'DC' | 'DCDA' | 'SVB';
    manufacturer: string;
    model: string;
    serialNumber: string;
    location: string;
    installDate: string;
    size: string;
    lastTestDate: string | null;
    nextTestDue: string | null;
    status: 'current' | 'due' | 'overdue' | 'failed';
  }[];
  testHistory: {
    id: string;
    testDate: string;
    deviceId: string;
    result: 'passed' | 'failed';
    technicianName: string;
    notes: string;
    nextDueDate: string;
  }[];
  invoiceHistory: {
    id: string;
    invoiceNumber: string;
    date: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue';
  }[];
  communicationLog: {
    id: string;
    date: string;
    type: 'email' | 'phone' | 'text' | 'mail';
    subject: string;
    notes: string;
    automated: boolean;
  }[];
  preferences: {
    preferredContactMethod: 'email' | 'phone' | 'text' | 'mail';
    reminderDays: number;
    autoSchedule: boolean;
    emailNotifications: boolean;
    textNotifications: boolean;
  };
  totalPaid: number;
  outstandingBalance: number;
  notes: string;
}

export default function CustomerDatabasePage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  useEffect(() => {
    // Load comprehensive customer database
    const sampleCustomers: CustomerRecord[] = [
      {
        id: '1',
        name: 'Johnson Properties LLC',
        email: 'manager@johnsonproperties.com',
        phone: '(253) 555-0123',
        address: '1234 Pacific Ave',
        city: 'Tacoma',
        state: 'WA',
        zip: '98402',
        customerType: 'commercial',
        waterDistrict: 'Tacoma Water',
        createdDate: '2023-01-15',
        lastTestDate: '2024-03-15',
        nextTestDue: '2025-03-15',
        status: 'active',
        devices: [
          {
            id: 'dev-1-1',
            type: 'RP',
            manufacturer: 'Watts',
            model: 'Series 909',
            serialNumber: 'RP-12345-A',
            location: 'Main Building Entrance',
            installDate: '2020-05-01',
            size: '3/4"',
            lastTestDate: '2024-03-15',
            nextTestDue: '2025-03-15',
            status: 'current'
          },
          {
            id: 'dev-1-2',
            type: 'RP',
            manufacturer: 'Watts',
            model: 'Series 909',
            serialNumber: 'RP-12345-B',
            location: 'Building B Service Line',
            installDate: '2020-05-01',
            size: '1"',
            lastTestDate: '2024-03-15',
            nextTestDue: '2025-03-15',
            status: 'current'
          }
        ],
        testHistory: [
          {
            id: 'test-1-1',
            testDate: '2024-03-15',
            deviceId: 'dev-1-1',
            result: 'passed',
            technicianName: 'John Fisher',
            notes: 'All systems functioning properly',
            nextDueDate: '2025-03-15'
          }
        ],
        invoiceHistory: [
          {
            id: 'inv-1-1',
            invoiceNumber: 'INV-2024-001',
            date: '2024-03-16',
            amount: 170.00,
            status: 'paid'
          }
        ],
        communicationLog: [
          {
            id: 'comm-1-1',
            date: '2024-02-15',
            type: 'email',
            subject: 'Annual Test Reminder',
            notes: 'Automated reminder sent 30 days before due date',
            automated: true
          }
        ],
        preferences: {
          preferredContactMethod: 'email',
          reminderDays: 30,
          autoSchedule: true,
          emailNotifications: true,
          textNotifications: false
        },
        totalPaid: 850.00,
        outstandingBalance: 0,
        notes: 'Large commercial property, prefers early morning appointments'
      },
      {
        id: '2',
        name: 'Smith Residence',
        email: 'john.smith@gmail.com',
        phone: '(253) 555-0124',
        address: '5678 6th Ave',
        city: 'Tacoma',
        state: 'WA',
        zip: '98406',
        customerType: 'residential',
        waterDistrict: 'Tacoma Water',
        createdDate: '2023-06-10',
        lastTestDate: '2024-01-20',
        nextTestDue: '2025-01-20',
        status: 'active',
        devices: [
          {
            id: 'dev-2-1',
            type: 'PVB',
            manufacturer: 'Febco',
            model: '765',
            serialNumber: 'PVB-67890',
            location: 'Front Yard',
            installDate: '2018-08-15',
            size: '3/4"',
            lastTestDate: '2024-01-20',
            nextTestDue: '2025-01-20',
            status: 'current'
          }
        ],
        testHistory: [
          {
            id: 'test-2-1',
            testDate: '2024-01-20',
            deviceId: 'dev-2-1',
            result: 'passed',
            technicianName: 'John Fisher',
            notes: 'Device operating normally',
            nextDueDate: '2025-01-20'
          }
        ],
        invoiceHistory: [
          {
            id: 'inv-2-1',
            invoiceNumber: 'INV-2024-002',
            date: '2024-01-21',
            amount: 85.00,
            status: 'paid'
          }
        ],
        communicationLog: [
          {
            id: 'comm-2-1',
            date: '2023-12-20',
            type: 'phone',
            subject: 'Appointment Confirmation',
            notes: 'Called to confirm January test appointment',
            automated: false
          }
        ],
        preferences: {
          preferredContactMethod: 'phone',
          reminderDays: 14,
          autoSchedule: false,
          emailNotifications: true,
          textNotifications: true
        },
        totalPaid: 255.00,
        outstandingBalance: 0,
        notes: 'Prefers afternoon appointments after 2pm'
      },
      {
        id: '3',
        name: 'Parkland Medical Center',
        email: 'facilities@parklandmedical.com',
        phone: '(253) 555-0125',
        address: '910 112th St E',
        city: 'Parkland',
        state: 'WA',
        zip: '98444',
        customerType: 'commercial',
        waterDistrict: 'Pierce County Water Utility',
        createdDate: '2022-03-01',
        lastTestDate: '2023-11-10',
        nextTestDue: '2024-11-10',
        status: 'overdue',
        devices: [
          {
            id: 'dev-3-1',
            type: 'RP',
            manufacturer: 'Zurn Wilkins',
            model: '375XL',
            serialNumber: 'RP-11111',
            location: 'Main Water Service',
            installDate: '2019-02-01',
            size: '2"',
            lastTestDate: '2023-11-10',
            nextTestDue: '2024-11-10',
            status: 'overdue'
          }
        ],
        testHistory: [
          {
            id: 'test-3-1',
            testDate: '2023-11-10',
            deviceId: 'dev-3-1',
            result: 'failed',
            technicianName: 'John Fisher',
            notes: 'Relief valve needed replacement, device repaired and retested',
            nextDueDate: '2024-11-10'
          }
        ],
        invoiceHistory: [
          {
            id: 'inv-3-1',
            invoiceNumber: 'INV-2024-003',
            date: '2024-08-10',
            amount: 648.55,
            status: 'overdue'
          }
        ],
        communicationLog: [
          {
            id: 'comm-3-1',
            date: '2024-11-15',
            type: 'email',
            subject: 'URGENT: Overdue Test Notification',
            notes: 'Automated overdue notification sent',
            automated: true
          }
        ],
        preferences: {
          preferredContactMethod: 'email',
          reminderDays: 45,
          autoSchedule: false,
          emailNotifications: true,
          textNotifications: false
        },
        totalPaid: 1250.00,
        outstandingBalance: 648.55,
        notes: 'Medical facility - requires scheduling during non-peak hours'
      }
    ];

    setTimeout(() => {
      setCustomers(sampleCustomers);
      setLoading(false);
    }, 500);
  }, []);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm) ||
                         customer.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    const matchesType = typeFilter === 'all' || customer.customerType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusCounts = () => {
    return {
      all: customers.length,
      active: customers.filter(c => c.status === 'active').length,
      overdue: customers.filter(c => c.status === 'overdue').length,
      inactive: customers.filter(c => c.status === 'inactive').length
    };
  };

  const getTypeStats = () => {
    return {
      residential: customers.filter(c => c.customerType === 'residential').length,
      commercial: customers.filter(c => c.customerType === 'commercial').length,
      industrial: customers.filter(c => c.customerType === 'industrial').length
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const statusCounts = getStatusCounts();
  const typeStats = getTypeStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-800">Loading customer database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Database className="h-6 w-6 mr-2" />
              Customer Database
            </h1>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button size="sm" asChild>
                <Link href="/app/customers/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Link>
              </Button>
            </div>
          </div>

          {/* Database Stats */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-blue-200 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-blue-700">{customers.length}</div>
              <div className="text-xs text-blue-800">Total Customers</div>
            </div>
            <div className="bg-green-200 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-green-700">{statusCounts.active}</div>
              <div className="text-xs text-green-800">Active</div>
            </div>
            <div className="bg-red-200 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-red-700">{statusCounts.overdue}</div>
              <div className="text-xs text-red-800">Overdue</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-purple-700">
                {customers.reduce((sum, c) => sum + c.devices.length, 0)}
              </div>
              <div className="text-xs text-purple-600">Total Devices</div>
            </div>
          </div>

          {/* Customer Type Breakdown */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-2 text-center">
              <div className="text-lg font-semibold text-gray-700">{typeStats.residential}</div>
              <div className="text-xs text-gray-800">Residential</div>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <div className="text-lg font-semibold text-gray-700">{typeStats.commercial}</div>
              <div className="text-xs text-gray-800">Commercial</div>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <div className="text-lg font-semibold text-gray-700">{typeStats.industrial}</div>
              <div className="text-xs text-gray-800">Industrial</div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex flex-col space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800 h-4 w-4" />
              <input
                type="text"
                placeholder="Search customers, phone, email, address..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex space-x-2 overflow-x-auto">
              {[
                { key: 'all', label: 'All Status', count: statusCounts.all },
                { key: 'active', label: 'Active', count: statusCounts.active },
                { key: 'overdue', label: 'Overdue', count: statusCounts.overdue }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setStatusFilter(filter.key)}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                    statusFilter === filter.key
                      ? 'bg-blue-700 text-white'
                      : 'bg-gray-300 text-gray-900 hover:bg-gray-400'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>

            <div className="flex space-x-2 overflow-x-auto">
              {[
                { key: 'all', label: 'All Types' },
                { key: 'residential', label: 'Residential' },
                { key: 'commercial', label: 'Commercial' },
                { key: 'industrial', label: 'Industrial' }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setTypeFilter(filter.key)}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                    typeFilter === filter.key
                      ? 'bg-green-700 text-white'
                      : 'bg-gray-300 text-gray-900 hover:bg-gray-400'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Customer Records */}
        <div className="space-y-3">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => (
              <div key={customer.id} className="bg-white rounded-lg shadow-sm">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{customer.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          customer.status === 'active' ? 'bg-green-300 text-green-800' :
                          customer.status === 'overdue' ? 'bg-red-300 text-red-800' :
                          'bg-gray-300 text-gray-900'
                        }`}>
                          {customer.status.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          customer.customerType === 'residential' ? 'bg-blue-300 text-blue-800' :
                          customer.customerType === 'commercial' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {customer.customerType.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-800">
                        {customer.devices.length} device{customer.devices.length !== 1 ? 's' : ''} • 
                        Customer since {formatDate(customer.createdDate)}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/app/customers/${customer.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-gray-800" />
                          <span>{customer.city}, {customer.state}</span>
                        </div>
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-1 text-gray-800" />
                          <span>{customer.waterDistrict}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-1 text-gray-800" />
                          <a href={`tel:${customer.phone}`} className="text-blue-800 hover:underline">
                            {customer.phone}
                          </a>
                        </div>
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-1 text-gray-800" />
                          <a href={`mailto:${customer.email}`} className="text-blue-800 hover:underline">
                            {customer.email}
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Device Summary */}
                    <div className="bg-white rounded-lg p-3 mt-3">
                      <div className="text-sm font-medium text-gray-900 mb-2">Devices & Test Status</div>
                      {customer.devices.map((device, idx) => (
                        <div key={device.id} className="flex items-center justify-between text-sm mb-1 last:mb-0">
                          <span>{device.type} - {device.serialNumber} ({device.location})</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            device.status === 'current' ? 'bg-green-300 text-green-700' :
                            device.status === 'due' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-300 text-red-700'
                          }`}>
                            Next: {formatDate(device.nextTestDue)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Financial Summary */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center space-x-4 text-sm">
                        <div>
                          <span className="text-gray-700">Total Paid:</span>
                          <span className="ml-1 font-medium text-green-800">{formatCurrency(customer.totalPaid)}</span>
                        </div>
                        {customer.outstandingBalance > 0 && (
                          <div>
                            <span className="text-gray-700">Outstanding:</span>
                            <span className="ml-1 font-medium text-red-800">{formatCurrency(customer.outstandingBalance)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          customer.preferences.autoSchedule ? 'bg-green-300 text-green-700' : 'bg-gray-300 text-gray-900'
                        }`}>
                          Auto-Schedule: {customer.preferences.autoSchedule ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex space-x-2">
                        <Button size="sm" className="bg-white hover:bg-slate-400 text-slate-700 border border-slate-300" asChild>
                          <Link href={`/app/test-report?customer=${customer.id}`}>
                            <FileText className="h-4 w-4 mr-1" />
                            Test
                          </Link>
                        </Button>
                        <Button size="sm" className="bg-white hover:bg-slate-400 text-slate-700 border border-slate-300" asChild>
                          <Link href={`/app/schedule?customer=${customer.id}`}>
                            <Calendar className="h-4 w-4 mr-1" />
                            Schedule
                          </Link>
                        </Button>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button size="sm" className="bg-white hover:bg-slate-400 text-slate-700 border border-slate-300">
                          <Bell className="h-4 w-4 mr-1" />
                          Notify
                        </Button>
                        <Button size="sm" className="bg-white hover:bg-slate-400 text-slate-700 border border-slate-300">
                          <Settings className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <Database className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-700 mb-4">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? "Try adjusting your search or filters" 
                  : "Get started by adding your first customer"
                }
              </p>
              {(!searchTerm && statusFilter === 'all' && typeFilter === 'all') && (
                <Button asChild>
                  <Link href="/app/customers/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Customer
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="grid grid-cols-5">
          <Link href="/app" className="flex flex-col items-center py-2 px-1 text-gray-800 hover:text-gray-900">
            <div className="h-6 w-6 bg-gray-400 rounded"></div>
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/app/customers" className="flex flex-col items-center py-2 px-1 text-blue-800 bg-blue-200">
            <Users className="h-6 w-6" />
            <span className="text-xs font-medium">Customers</span>
          </Link>
          <Link href="/app/test-report" className="flex flex-col items-center py-2 px-1 text-gray-800 hover:text-gray-900">
            <Plus className="h-6 w-6" />
            <span className="text-xs">Test</span>
          </Link>
          <Link href="/app/schedule" className="flex flex-col items-center py-2 px-1 text-gray-800 hover:text-gray-900">
            <Calendar className="h-6 w-6" />
            <span className="text-xs">Schedule</span>
          </Link>
          <Link href="/app/more" className="flex flex-col items-center py-2 px-1 text-gray-800 hover:text-gray-900">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
            </div>
            <span className="text-xs">More</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}