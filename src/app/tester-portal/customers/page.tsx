'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  MapPin,
  Phone,
  Mail,
  Calendar,
  FileText,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'

interface Customer {
  id: string
  first_name: string
  last_name: string
  company_name: string | null
  email: string
  phone: string
  address_line1: string
  city: string
  state: string
  zip_code: string
  account_number: string | null
  account_status: string
  created_at: string
}

interface UserPermissions {
  isOwner: boolean
  subscriptions: string[]
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Check permissions first
      const permResponse = await fetch('/api/tester-portal/permissions')
      if (permResponse.ok) {
        const permData = await permResponse.json()
        setPermissions(permData.data)
      }

      // Fetch customers
      const response = await fetch('/api/team/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers || [])
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const hasAccess = (feature: string) => {
    if (!permissions) return false
    return permissions.isOwner || permissions.subscriptions.includes(feature)
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      `${customer.first_name} ${customer.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      (customer.company_name && customer.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesFilter = filterStatus === 'all' || customer.account_status === filterStatus
    
    return matchesSearch && matchesFilter
  })

  if (!hasAccess('customer-management') && !permissions?.isOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
            <Users className="h-8 w-8 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Customer Management</h2>
          <p className="text-cyan-200 mb-6">
            This feature requires a Customer Management subscription to access advanced customer tools and data.
          </p>
          <div className="space-y-3">
            <Link
              href="/tester-portal/upgrade"
              className="block bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all"
            >
              Upgrade to Access
            </Link>
            <Link
              href="/tester-portal/dashboard"
              className="block text-cyan-400 hover:text-white transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
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
      <div className="border-b border-cyan-400/20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <Users className="h-8 w-8 text-cyan-400 mr-3" />
                Customer Management
                {permissions?.isOwner && (
                  <span className="ml-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    OWNER ACCESS
                  </span>
                )}
              </h1>
              <p className="text-cyan-200 mt-1">
                Manage your customer database and relationships
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/tester-portal/customers/import"
                className="flex items-center space-x-2 bg-cyan-600/80 text-white px-4 py-2 rounded-lg font-medium hover:bg-cyan-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Import</span>
              </Link>
              <Link
                href="/tester-portal/customers/new"
                className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Add Customer</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cyan-400" />
            <input
              type="text"
              placeholder="Search customers by name, email, phone, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-cyan-400/30 rounded-lg text-white placeholder-cyan-300 focus:outline-none focus:border-cyan-400 focus:bg-white/20"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cyan-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-3 bg-white/10 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:bg-white/20"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-cyan-300">Total Customers</h3>
              <Users className="h-5 w-5 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-white">{customers.length}</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-cyan-300">Active</h3>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <p className="text-2xl font-bold text-green-400">
              {customers.filter(c => c.account_status === 'active').length}
            </p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-cyan-300">This Month</h3>
              <Calendar className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-400">
              {customers.filter(c => {
                const created = new Date(c.created_at)
                const now = new Date()
                return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
              }).length}
            </p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-cyan-300">Filtered Results</h3>
              <Search className="h-5 w-5 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-cyan-400">{filteredCustomers.length}</p>
          </div>
        </div>

        {/* Customer Table */}
        <div className="bg-white/5 backdrop-blur-sm border border-cyan-400/20 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cyan-600/20 border-b border-cyan-400/20">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">Location</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">Account</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-cyan-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-400/10">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-white">
                          {customer.first_name} {customer.last_name}
                        </div>
                        {customer.company_name && (
                          <div className="text-sm text-cyan-300">{customer.company_name}</div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-cyan-200">
                          <Mail className="h-4 w-4 mr-2 text-cyan-400" />
                          {customer.email}
                        </div>
                        <div className="flex items-center text-sm text-cyan-200">
                          <Phone className="h-4 w-4 mr-2 text-cyan-400" />
                          {customer.phone}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-start text-sm text-cyan-200">
                        <MapPin className="h-4 w-4 mr-2 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div>{customer.address_line1}</div>
                          <div>{customer.city}, {customer.state} {customer.zip_code}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        customer.account_status === 'active' 
                          ? 'bg-green-500/20 text-green-400'
                          : customer.account_status === 'inactive'
                          ? 'bg-red-500/20 text-red-400'  
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {customer.account_status}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-cyan-200">
                        {customer.account_number || 'No account #'}
                      </div>
                      <div className="text-xs text-cyan-300 mt-1">
                        Added {new Date(customer.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <Link
                          href={`/tester-portal/customers/${customer.id}`}
                          className="p-2 text-cyan-400 hover:text-white hover:bg-cyan-500/20 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/tester-portal/customers/${customer.id}/edit`}
                          className="p-2 text-blue-400 hover:text-white hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          className="p-2 text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors"
                          title="More Options"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-cyan-400/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {searchTerm || filterStatus !== 'all' ? 'No customers match your search' : 'No customers yet'}
              </h3>
              <p className="text-cyan-300 mb-6">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search terms or filters'
                  : 'Add your first customer to get started'
                }
              </p>
              {(!searchTerm && filterStatus === 'all') && (
                <Link
                  href="/tester-portal/customers/new"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add First Customer</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}