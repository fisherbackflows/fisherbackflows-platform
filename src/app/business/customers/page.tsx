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
  Clock,
  PlusCircle,
  Download,
  Upload,
  MoreVertical
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

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    // Load customers - this will be replaced with actual API call
    const loadCustomers = async () => {
      try {
        // Mock data for now
        const mockCustomers: Customer[] = [
          {
            id: '1',
            name: 'John Smith',
            email: 'john.smith@email.com',
            phone: '(253) 555-0123',
            address: '123 Main St',
            city: 'Tacoma',
            state: 'WA',
            zip: '98401',
            lastTestDate: '2024-01-15',
            nextTestDue: '2025-01-15',
            status: 'current',
            deviceCount: 1,
            totalPaid: 350
          },
          {
            id: '2',
            name: 'Sarah Johnson',
            email: 'sarah.johnson@email.com',
            phone: '(253) 555-0124',
            address: '456 Oak Ave',
            city: 'Seattle',
            state: 'WA',
            zip: '98101',
            lastTestDate: '2023-12-10',
            nextTestDue: '2024-12-10',
            status: 'due',
            deviceCount: 2,
            totalPaid: 700
          },
          {
            id: '3',
            name: 'Mike Wilson',
            email: 'mike.wilson@email.com',
            phone: '(253) 555-0125',
            address: '789 Pine St',
            city: 'Spokane',
            state: 'WA',
            zip: '99201',
            lastTestDate: '2023-10-05',
            nextTestDue: '2024-10-05',
            status: 'overdue',
            deviceCount: 1,
            totalPaid: 175
          }
        ];

        setCustomers(mockCustomers);
      } catch (error) {
        console.error('Failed to load customers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm);

    const matchesFilter = filterStatus === 'all' || customer.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current': return 'border-emerald-400 bg-emerald-500/20 text-emerald-200';
      case 'due': return 'border-amber-400 bg-amber-500/20 text-amber-200';
      case 'overdue': return 'border-red-400 bg-red-500/20 text-red-200';
      case 'inactive': return 'border-gray-400 bg-gray-500/20 text-gray-200';
      default: return 'border-blue-400 bg-blue-500/20 text-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-white/80">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-grid opacity-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-blue-500/5" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Customer Management</h1>
              <p className="text-white/60">Manage your customer database</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/business">
                <Button variant="outline" className="border-blue-400 text-white/80">
                  ← Back to Dashboard
                </Button>
              </Link>
              <Link href="/business/customers/new">
                <Button className="glass-btn-primary hover:glow-blue text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 relative z-10">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass border border-blue-400 rounded-xl p-4 glow-blue-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Customers</p>
                <p className="text-2xl font-bold text-white">{customers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-300" />
            </div>
          </div>

          <div className="glass border border-emerald-400/50 rounded-xl p-4 glow-blue-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Current</p>
                <p className="text-2xl font-bold text-white">
                  {customers.filter(c => c.status === 'current').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-300" />
            </div>
          </div>

          <div className="glass border border-amber-400/50 rounded-xl p-4 glow-blue-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Due Soon</p>
                <p className="text-2xl font-bold text-white">
                  {customers.filter(c => c.status === 'due').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-300" />
            </div>
          </div>

          <div className="glass border border-red-400/50 rounded-xl p-4 glow-blue-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Overdue</p>
                <p className="text-2xl font-bold text-white">
                  {customers.filter(c => c.status === 'overdue').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-300" />
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="glass border border-blue-400 rounded-xl p-6 glow-blue-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">

            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/60 focus:border-blue-400 focus:outline-none"
                placeholder="Search customers by name, email, or phone..."
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-3 bg-black/50 border border-white/20 rounded-xl text-white focus:border-blue-400 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="current">Current</option>
                <option value="due">Due Soon</option>
                <option value="overdue">Overdue</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <Button variant="outline" className="border-blue-400 text-white/80">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" className="border-blue-400 text-white/80">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
          </div>
        </div>

        {/* Customer List */}
        <div className="glass border border-blue-400 rounded-xl glow-blue-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-4 text-white/80 font-medium">Customer</th>
                  <th className="text-left px-6 py-4 text-white/80 font-medium">Contact</th>
                  <th className="text-left px-6 py-4 text-white/80 font-medium">Location</th>
                  <th className="text-left px-6 py-4 text-white/80 font-medium">Last Test</th>
                  <th className="text-left px-6 py-4 text-white/80 font-medium">Status</th>
                  <th className="text-left px-6 py-4 text-white/80 font-medium">Devices</th>
                  <th className="text-left px-6 py-4 text-white/80 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">

                    {/* Customer Name */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-white">{customer.name}</p>
                        <p className="text-white/60 text-sm">${customer.totalPaid.toLocaleString()} total</p>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-3 w-3 text-white/60" />
                          <span className="text-white/80 text-sm">{customer.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-3 w-3 text-white/60" />
                          <span className="text-white/80 text-sm">{customer.phone}</span>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-3 w-3 text-white/60" />
                        <div>
                          <p className="text-white/80 text-sm">{customer.address}</p>
                          <p className="text-white/60 text-xs">{customer.city}, {customer.state} {customer.zip}</p>
                        </div>
                      </div>
                    </td>

                    {/* Last Test */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white/80 text-sm">
                          {customer.lastTestDate ? new Date(customer.lastTestDate).toLocaleDateString() : 'Never'}
                        </p>
                        <p className="text-white/60 text-xs">
                          Due: {customer.nextTestDue ? new Date(customer.nextTestDue).toLocaleDateString() : 'TBD'}
                        </p>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(customer.status)}`}>
                        {customer.status.toUpperCase()}
                      </span>
                    </td>

                    {/* Devices */}
                    <td className="px-6 py-4">
                      <span className="text-white/80">{customer.deviceCount}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Link href={`/business/customers/${customer.id}`}>
                          <Button variant="outline" size="sm" className="border-blue-400 text-white/80">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" className="border-blue-400 text-white/80">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-white/40 mx-auto mb-4" />
              <p className="text-white/60">No customers found matching your criteria</p>
              <Link href="/business/customers/new" className="mt-4 inline-block">
                <Button className="glass-btn-primary hover:glow-blue text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Customer
                </Button>
              </Link>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}