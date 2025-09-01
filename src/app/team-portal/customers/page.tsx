'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { TeamPortalNavigation } from '@/components/navigation/UnifiedNavigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
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
  Clock,
  PlusCircle
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
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    // Load user info for navigation
    const loadUserInfo = async () => {
      try {
        const response = await fetch('/api/team/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUserInfo(data);
        }
      } catch (error) {
        console.error('Error loading user info:', error);
      }
    };
    loadUserInfo();
  }, []);

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
      case 'current': return 'bg-green-300 text-green-800';
      case 'due': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-300 text-red-800';
      case 'inactive': return 'bg-slate-100 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
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
      <div className="min-h-screen bg-white">
        <TeamPortalNavigation userInfo={userInfo} />
        <main className="p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
            <LoadingSpinner size="lg" color="blue" text="Loading customers..." />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <TeamPortalNavigation userInfo={userInfo} />
      
      <main className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Professional Header */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-3">
                  Customer Management
                </h1>
                <p className="text-xl text-slate-800 leading-relaxed">
                  View and manage your customer database
                </p>
              </div>
              <Button className="bg-blue-700 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-sm font-medium transition-colors duration-200 flex items-center" asChild>
                <Link href="/team-portal/customers/new">
                  <PlusCircle className="h-5 w-5 mr-2" />
                  Add Customer
                </Link>
              </Button>
            </div>
          </div>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-200 rounded-lg">
                  <Users className="h-8 w-8 text-blue-800" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-slate-900">{statusCounts.all}</div>
                  <div className="text-sm text-slate-700">Total Customers</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-200 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-800" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-slate-900">{statusCounts.current}</div>
                  <div className="text-sm text-slate-700">Current</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-slate-900">{statusCounts.due}</div>
                  <div className="text-sm text-slate-700">Due Soon</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-200 rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-red-800" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-slate-900">{statusCounts.overdue}</div>
                  <div className="text-sm text-slate-700">Overdue</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-800 h-4 w-4" />
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
                    ? 'bg-blue-700 text-white' 
                    : 'bg-gray-300 text-slate-800 hover:bg-gray-400'
                }`}
              >
                All ({statusCounts.all})
              </button>
              <button
                onClick={() => setStatusFilter('current')}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                  statusFilter === 'current' 
                    ? 'bg-green-700 text-white' 
                    : 'bg-gray-300 text-slate-800 hover:bg-gray-400'
                }`}
              >
                Current ({statusCounts.current})
              </button>
              <button
                onClick={() => setStatusFilter('due')}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                  statusFilter === 'due' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-gray-300 text-slate-800 hover:bg-gray-400'
                }`}
              >
                Due ({statusCounts.due})
              </button>
              <button
                onClick={() => setStatusFilter('overdue')}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                  statusFilter === 'overdue' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-300 text-slate-800 hover:bg-gray-400'
                }`}
              >
                Overdue ({statusCounts.overdue})
              </button>
            </div>
          </div>
        </div>

          {/* Customer List */}
          <div className="space-y-4">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <div key={customer.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 text-lg">{customer.name}</h3>
                      <div className="flex items-center mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                          {getStatusIcon(customer.status)}
                          <span className="ml-1 capitalize">{customer.status}</span>
                        </span>
                        <span className="ml-2 text-sm text-slate-700">
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
                    <div className="flex items-center text-sm text-slate-800">
                      <MapPin className="h-4 w-4 mr-2 text-slate-800" />
                      {customer.address}, {customer.city}, {customer.state} {customer.zip}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-slate-800">
                        <Phone className="h-4 w-4 mr-2 text-slate-800" />
                        <a href={`tel:${customer.phone}`} className="hover:text-blue-800">
                          {customer.phone}
                        </a>
                      </div>
                      <div className="flex items-center text-sm text-slate-800">
                        <Mail className="h-4 w-4 mr-2 text-slate-800" />
                        <a href={`mailto:${customer.email}`} className="hover:text-blue-800 truncate">
                          {customer.email}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-sm">
                        <span className="text-slate-700">Last Test:</span>
                        <span className="ml-1 font-medium">{formatDate(customer.lastTestDate)}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-700">Next Due:</span>
                        <span className={`ml-1 font-medium ${
                          customer.status === 'overdue' ? 'text-red-800' : 
                          customer.status === 'due' ? 'text-yellow-600' : 
                          'text-slate-900'
                        }`}>
                          {formatDate(customer.nextTestDue)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex space-x-2 mt-4">
                    <Button size="sm" className="bg-white hover:bg-white text-slate-700 border border-slate-300" asChild>
                      <Link href={`/team-portal/test-report?customer=${customer.id}`}>
                        <FileText className="h-4 w-4 mr-1" />
                        Test
                      </Link>
                    </Button>
                    <Button size="sm" className="bg-white hover:bg-white text-slate-700 border border-slate-300" asChild>
                      <Link href={`/team-portal/schedule?customer=${customer.id}`}>
                        <Calendar className="h-4 w-4 mr-1" />
                        Schedule
                      </Link>
                    </Button>
                    <Button size="sm" className="bg-white hover:bg-white text-slate-700 border border-slate-300" asChild>
                      <Link href={`tel:${customer.phone}`}>
                        <Phone className="h-4 w-4 mr-1" />
                        Call
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No customers found</h3>
              <p className="text-slate-700 mb-4">
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
          )}
          </div>
        </div>
      </main>
    </div>
  );
}