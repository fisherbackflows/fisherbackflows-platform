'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Edit,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock
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
  zip: string;
  lastTestDate: string | null;
  nextTestDue: string | null;
  status: 'current' | 'due' | 'overdue' | 'inactive';
  deviceCount: number;
  totalPaid: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRealCustomers = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('/api/team/customers');
        if (!response.ok) {
          throw new Error(`Failed to load customers: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.success && data.customers) {
          setCustomers(data.customers);
        } else {
          console.warn('No customer data available');
          setCustomers([]);
        }
      } catch (error) {
        console.error('Error loading customers:', error);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    loadRealCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm);
    
    const matchesFilter = statusFilter === 'all' || customer.status === statusFilter;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current': return 'bg-green-100 text-green-800';
      case 'due': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'current': return <CheckCircle className="h-4 w-4" />;
      case 'due': return <Clock className="h-4 w-4" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusCounts = () => {
    return {
      all: customers.length,
      current: customers.filter(c => c.status === 'current').length,
      due: customers.filter(c => c.status === 'due').length,
      overdue: customers.filter(c => c.status === 'overdue').length,
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <Button asChild>
              <Link href="/team-portal/customers/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-lg font-bold text-gray-900">{statusCounts.all}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center shadow-sm">
            <div className="text-lg font-bold text-green-700">{statusCounts.current}</div>
            <div className="text-xs text-green-600">Current</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center shadow-sm">
            <div className="text-lg font-bold text-yellow-700">{statusCounts.due}</div>
            <div className="text-xs text-yellow-600">Due Soon</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center shadow-sm">
            <div className="text-lg font-bold text-red-700">{statusCounts.overdue}</div>
            <div className="text-xs text-red-600">Overdue</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex flex-col space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search customers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex space-x-2 overflow-x-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                  statusFilter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({statusCounts.all})
              </button>
              <button
                onClick={() => setStatusFilter('current')}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                  statusFilter === 'current' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Current ({statusCounts.current})
              </button>
              <button
                onClick={() => setStatusFilter('due')}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                  statusFilter === 'due' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Due ({statusCounts.due})
              </button>
              <button
                onClick={() => setStatusFilter('overdue')}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                  statusFilter === 'overdue' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Overdue ({statusCounts.overdue})
              </button>
            </div>
          </div>
        </div>

        {/* Customer List */}
        <div className="space-y-3">
          {filteredCustomers.length > 0 ? 
            filteredCustomers.map((customer) => (
              <div key={customer.id} className="bg-white rounded-lg shadow-sm">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{customer.name}</h3>
                      <div className="flex items-center mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                          {getStatusIcon(customer.status)}
                          <span className="ml-1 capitalize">{customer.status}</span>
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          {customer.deviceCount} device{customer.deviceCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/team-portal/customers/${customer.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      {customer.address}, {customer.city}, {customer.state} {customer.zip}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        <a href={`tel:${customer.phone}`} className="hover:text-blue-600">
                          {customer.phone}
                        </a>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        <a href={`mailto:${customer.email}`} className="hover:text-blue-600 truncate">
                          {customer.email}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-sm">
                        <span className="text-gray-500">Last Test:</span>
                        <span className="ml-1 font-medium">{formatDate(customer.lastTestDate)}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Next Due:</span>
                        <span className={`ml-1 font-medium ${
                          customer.status === 'overdue' ? 'text-red-600' : 
                          customer.status === 'due' ? 'text-yellow-600' : 
                          'text-gray-900'
                        }`}>
                          {formatDate(customer.nextTestDue)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex space-x-2 mt-4">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/team-portal/test-report?customer=${customer.id}`}>
                        <FileText className="h-4 w-4 mr-1" />
                        Test
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/team-portal/schedule?customer=${customer.id}`}>
                        <Calendar className="h-4 w-4 mr-1" />
                        Schedule
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`tel:${customer.phone}`}>
                        <Phone className="h-4 w-4 mr-1" />
                        Call
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))
          : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? "Try adjusting your search or filters" 
                  : "Get started by adding your first customer"
                }
              </p>
              {(!searchTerm && statusFilter === 'all') && (
                <Button asChild>
                  <Link href="/team-portal/customers/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Customer
                  </Link>
                </Button>
              )}
            </div>
          )
          }
        </div>
      </main>
    </div>
  );
}