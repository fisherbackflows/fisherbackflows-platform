'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Users, 
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Eye,
  Edit,
  MoreVertical
} from 'lucide-react'

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  devices_count: number
  last_test_date?: string
  next_test_due?: string
  status: 'active' | 'overdue' | 'inactive'
  total_revenue: number
  created_at: string
}

export default function TesterPortalCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    filterCustomers()
  }, [searchTerm, statusFilter, customers])

  const fetchCustomers = async () => {
    try {
      // Mock data - will be replaced with real API
      const mockCustomers: Customer[] = [
        {
          id: '1',
          name: 'ABC Manufacturing',
          email: 'admin@abcmfg.com',
          phone: '(555) 123-4567',
          address: '123 Industrial Way',
          city: 'Tacoma',
          state: 'WA',
          devices_count: 3,
          last_test_date: '2024-09-15',
          next_test_due: '2025-09-15',
          status: 'active',
          total_revenue: 450,
          created_at: '2024-01-15'
        },
        {
          id: '2',
          name: 'Green Valley School District',
          email: 'facilities@gvsd.edu',
          phone: '(555) 987-6543',
          address: '456 Education Blvd',
          city: 'Puyallup',
          state: 'WA',
          devices_count: 7,
          last_test_date: '2024-12-01',
          next_test_due: '2024-12-30',
          status: 'overdue',
          total_revenue: 1050,
          created_at: '2023-08-20'
        },
        {
          id: '3',
          name: 'Metro Apartments',
          email: 'maintenance@metroapts.com',
          phone: '(555) 456-7890',
          address: '789 Urban Street',
          city: 'Seattle',
          state: 'WA',
          devices_count: 12,
          last_test_date: '2024-10-20',
          next_test_due: '2025-10-20',
          status: 'active',
          total_revenue: 1800,
          created_at: '2023-05-10'
        }
      ]

      setCustomers(mockCustomers)
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterCustomers = () => {
    let filtered = customers

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term) ||
        customer.phone?.includes(term) ||
        customer.city?.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter)
    }

    setFilteredCustomers(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/20'
      case 'overdue': return 'text-red-400 bg-red-400/20'
      case 'inactive': return 'text-gray-400 bg-gray-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'overdue': return <AlertTriangle className="h-4 w-4" />
      case 'inactive': return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-white/80">Loading customers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900">
      {/* Header */}
      <header className="border-b border-cyan-400/20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/tester-portal/dashboard/crm" className="text-cyan-400 hover:text-white">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-cyan-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Customer Management</h1>
                  <p className="text-cyan-400">{filteredCustomers.length} customers</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/tester-portal/customers/new"
                className="bg-cyan-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-cyan-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Customer</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="mb-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-cyan-400/20">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cyan-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-cyan-400/30 rounded-lg text-white placeholder-cyan-300 focus:outline-none focus:border-cyan-400"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cyan-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="all" className="bg-slate-800">All Status</option>
                <option value="active" className="bg-slate-800">Active</option>
                <option value="overdue" className="bg-slate-800">Overdue</option>
                <option value="inactive" className="bg-slate-800">Inactive</option>
              </select>
            </div>

            <div className="flex items-center text-white/80">
              <Users className="h-5 w-5 text-cyan-400 mr-2" />
              <span className="text-sm">Total: {filteredCustomers.length} customers</span>
            </div>
          </div>
        </div>

        {/* Customers Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div 
              key={customer.id}
              className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6 hover:scale-105 transition-all duration-200"
            >
              {/* Customer Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">{customer.name}</h3>
                  <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                    {getStatusIcon(customer.status)}
                    <span className="capitalize">{customer.status}</span>
                  </div>
                </div>
                <div className="relative">
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <MoreVertical className="h-4 w-4 text-white/60" />
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-cyan-300 text-sm">
                  <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{customer.email}</span>
                </div>
                {customer.phone && (
                  <div className="flex items-center text-cyan-300 text-sm">
                    <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center text-cyan-300 text-sm">
                    <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{customer.address}, {customer.city}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-white font-bold text-lg">{customer.devices_count}</p>
                  <p className="text-white/60 text-xs">Devices</p>
                </div>
                <div className="text-center">
                  <p className="text-green-400 font-bold text-lg">${customer.total_revenue}</p>
                  <p className="text-white/60 text-xs">Revenue</p>
                </div>
              </div>

              {/* Next Test Due */}
              {customer.next_test_due && (
                <div className="mb-4 p-2 bg-white/5 rounded-lg">
                  <p className="text-white/60 text-xs">Next Test Due:</p>
                  <p className="text-white text-sm font-medium">
                    {new Date(customer.next_test_due).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                <Link
                  href={`/tester-portal/customers/${customer.id}`}
                  className="flex-1 py-2 bg-cyan-600/20 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-600/30 hover:text-white rounded-lg text-sm transition-all flex items-center justify-center space-x-1"
                >
                  <Eye className="h-4 w-4" />
                  <span>View</span>
                </Link>
                <Link
                  href={`/tester-portal/customers/${customer.id}/edit`}
                  className="flex-1 py-2 bg-blue-600/20 border border-blue-400/30 text-blue-300 hover:bg-blue-600/30 hover:text-white rounded-lg text-sm transition-all flex items-center justify-center space-x-1"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredCustomers.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-md mx-auto">
              <Users className="h-16 w-16 text-cyan-400/50 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Customers Found</h3>
              <p className="text-white/80 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter.'
                  : 'Get started by adding your first customer.'
                }
              </p>
              {(!searchTerm && statusFilter === 'all') && (
                <Link
                  href="/tester-portal/customers/new"
                  className="inline-flex items-center px-4 py-2 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}