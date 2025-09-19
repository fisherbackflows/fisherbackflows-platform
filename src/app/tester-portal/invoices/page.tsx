'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  DollarSign,
  Plus,
  Search,
  Filter,
  Download,
  Send,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Users,
  ArrowLeft,
  MoreVertical,
  TrendingUp,
  FileText,
  CreditCard
} from 'lucide-react'

interface Invoice {
  id: string
  invoice_number: string
  customer_name: string
  customer_id: string
  customer_email: string
  issue_date: string
  due_date: string
  amount: number
  tax: number
  total: number
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled'
  services: {
    description: string
    quantity: number
    rate: number
    amount: number
  }[]
  notes?: string
  paid_date?: string
  payment_method?: string
  devices_tested: number
}

export default function TesterPortalInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [dateFilter, setDateFilter] = useState<string>('all')

  useEffect(() => {
    fetchInvoices()
  }, [])

  useEffect(() => {
    filterInvoices()
  }, [searchTerm, statusFilter, dateFilter, invoices])

  const fetchInvoices = async () => {
    try {
      // Mock data - will be replaced with real API
      const mockInvoices: Invoice[] = [
        {
          id: '1',
          invoice_number: 'INV-2025-001',
          customer_name: 'ABC Manufacturing',
          customer_id: '1',
          customer_email: 'admin@abcmfg.com',
          issue_date: '2025-01-10',
          due_date: '2025-02-09',
          amount: 150.00,
          tax: 12.00,
          total: 162.00,
          status: 'sent',
          services: [
            {
              description: 'Annual Backflow Test - Febco 860 3/4"',
              quantity: 1,
              rate: 150.00,
              amount: 150.00
            }
          ],
          notes: 'Test passed - device operational',
          devices_tested: 1
        },
        {
          id: '2',
          invoice_number: 'INV-2025-002',
          customer_name: 'Green Valley School District',
          customer_id: '2',
          customer_email: 'facilities@gvsd.edu',
          issue_date: '2025-01-08',
          due_date: '2025-02-07',
          amount: 275.00,
          tax: 22.00,
          total: 297.00,
          status: 'overdue',
          services: [
            {
              description: 'Annual Backflow Test - Watts 909 1"',
              quantity: 1,
              rate: 150.00,
              amount: 150.00
            },
            {
              description: 'Repair Service - Valve Replacement',
              quantity: 1,
              rate: 125.00,
              amount: 125.00
            }
          ],
          notes: 'Device repaired and retested - now compliant',
          devices_tested: 1
        },
        {
          id: '3',
          invoice_number: 'INV-2025-003',
          customer_name: 'Metro Apartments',
          customer_id: '3',
          customer_email: 'maintenance@metroapts.com',
          issue_date: '2025-01-12',
          due_date: '2025-02-11',
          amount: 300.00,
          tax: 24.00,
          total: 324.00,
          status: 'paid',
          services: [
            {
              description: 'Annual Backflow Test - Multiple Devices',
              quantity: 2,
              rate: 150.00,
              amount: 300.00
            }
          ],
          paid_date: '2025-01-15',
          payment_method: 'Credit Card',
          devices_tested: 2
        }
      ]

      setInvoices(mockInvoices)
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterInvoices = () => {
    let filtered = invoices

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(invoice =>
        invoice.invoice_number.toLowerCase().includes(term) ||
        invoice.customer_name.toLowerCase().includes(term) ||
        invoice.customer_email.toLowerCase().includes(term)
      )
    }

    if (statusFilter === 'active') {
      filtered = filtered.filter(invoice => ['sent', 'viewed', 'overdue'].includes(invoice.status))
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter)
    }

    if (dateFilter === 'month') {
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      filtered = filtered.filter(invoice => {
        const issueDate = new Date(invoice.issue_date)
        return issueDate.getMonth() === currentMonth && issueDate.getFullYear() === currentYear
      })
    }

    setFilteredInvoices(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-400 bg-gray-400/20'
      case 'sent': return 'text-blue-400 bg-blue-400/20'
      case 'viewed': return 'text-purple-400 bg-purple-400/20'
      case 'paid': return 'text-green-400 bg-green-400/20'
      case 'overdue': return 'text-red-400 bg-red-400/20'
      case 'cancelled': return 'text-gray-400 bg-gray-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit className="h-4 w-4" />
      case 'sent': return <Send className="h-4 w-4" />
      case 'viewed': return <Eye className="h-4 w-4" />
      case 'paid': return <CheckCircle className="h-4 w-4" />
      case 'overdue': return <AlertTriangle className="h-4 w-4" />
      case 'cancelled': return <Clock className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getStatusCounts = () => {
    return {
      all: invoices.length,
      active: invoices.filter(i => ['sent', 'viewed', 'overdue'].includes(i.status)).length,
      draft: invoices.filter(i => i.status === 'draft').length,
      sent: invoices.filter(i => i.status === 'sent').length,
      paid: invoices.filter(i => i.status === 'paid').length,
      overdue: invoices.filter(i => i.status === 'overdue').length
    }
  }

  const getTotals = () => {
    const activeInvoices = invoices.filter(i => ['sent', 'viewed', 'overdue'].includes(i.status))
    const paidInvoices = invoices.filter(i => i.status === 'paid')
    const overdueInvoices = invoices.filter(i => i.status === 'overdue')
    
    return {
      outstanding: activeInvoices.reduce((sum, inv) => sum + inv.total, 0),
      paid: paidInvoices.reduce((sum, inv) => sum + inv.total, 0),
      overdue: overdueInvoices.reduce((sum, inv) => sum + inv.total, 0),
      avgInvoice: invoices.length > 0 ? invoices.reduce((sum, inv) => sum + inv.total, 0) / invoices.length : 0
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const statusCounts = getStatusCounts()
  const totals = getTotals()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-white/80">Loading invoices...</p>
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
                <DollarSign className="h-8 w-8 text-cyan-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Invoice Management</h1>
                  <p className="text-cyan-400">{filteredInvoices.length} invoices</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/tester-portal/invoices/new"
                className="bg-cyan-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-cyan-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Invoice</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-300 text-sm font-medium">Outstanding</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(totals.outstanding)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-cyan-400" />
            </div>
            <p className="text-green-400 text-sm mt-2">{statusCounts.active} active invoices</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-300 text-sm font-medium">Paid This Month</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(totals.paid)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
            <p className="text-green-400 text-sm mt-2">{statusCounts.paid} invoices</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-300 text-sm font-medium">Overdue</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(totals.overdue)}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
            <p className="text-red-400 text-sm mt-2">{statusCounts.overdue} invoices</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-300 text-sm font-medium">Avg Invoice</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(totals.avgInvoice)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-400" />
            </div>
            <p className="text-blue-400 text-sm mt-2">Per invoice average</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-cyan-400/20">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cyan-400" />
              <input
                type="text"
                placeholder="Search invoices..."
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
                <option value="active" className="bg-slate-800">Active ({statusCounts.active})</option>
                <option value="all" className="bg-slate-800">All ({statusCounts.all})</option>
                <option value="draft" className="bg-slate-800">Draft ({statusCounts.draft})</option>
                <option value="sent" className="bg-slate-800">Sent ({statusCounts.sent})</option>
                <option value="paid" className="bg-slate-800">Paid ({statusCounts.paid})</option>
                <option value="overdue" className="bg-slate-800">Overdue ({statusCounts.overdue})</option>
              </select>
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cyan-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="all" className="bg-slate-800">All Time</option>
                <option value="month" className="bg-slate-800">This Month</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoices List */}
        <div className="space-y-4">
          {filteredInvoices.map((invoice) => (
            <div 
              key={invoice.id}
              className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6 hover:bg-white/15 transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-bold text-white">{invoice.invoice_number}</h3>
                    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                      <span className="capitalize">{invoice.status}</span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Customer Info */}
                    <div className="space-y-2">
                      <Link 
                        href={`/tester-portal/customers/${invoice.customer_id}`}
                        className="flex items-center text-cyan-300 hover:text-white transition-colors"
                      >
                        <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="font-medium">{invoice.customer_name}</span>
                      </Link>
                      <p className="text-white/60 text-sm">{invoice.customer_email}</p>
                    </div>

                    {/* Dates */}
                    <div className="space-y-2">
                      <div className="flex items-center text-white/80 text-sm">
                        <Calendar className="h-4 w-4 mr-2 flex-shrink-0 text-cyan-400" />
                        <span>Issued: {formatDate(invoice.issue_date)}</span>
                      </div>
                      <div className="flex items-center text-white/80 text-sm">
                        <Clock className="h-4 w-4 mr-2 flex-shrink-0 text-cyan-400" />
                        <span>Due: {formatDate(invoice.due_date)}</span>
                      </div>
                      {invoice.paid_date && (
                        <div className="flex items-center text-green-400 text-sm">
                          <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>Paid: {formatDate(invoice.paid_date)}</span>
                        </div>
                      )}
                    </div>

                    {/* Services Summary */}
                    <div className="space-y-2">
                      <p className="text-white/60 text-xs uppercase tracking-wide">Services</p>
                      <div className="space-y-1">
                        {invoice.services.slice(0, 2).map((service, index) => (
                          <p key={index} className="text-white/80 text-sm">
                            {service.description}
                          </p>
                        ))}
                        {invoice.services.length > 2 && (
                          <p className="text-cyan-400 text-sm">+{invoice.services.length - 2} more</p>
                        )}
                      </div>
                      <p className="text-white/60 text-sm">{invoice.devices_tested} device{invoice.devices_tested !== 1 ? 's' : ''} tested</p>
                    </div>
                  </div>

                  {/* Notes */}
                  {invoice.notes && (
                    <div className="mt-4 p-3 bg-white/5 rounded-lg">
                      <p className="text-white/80 text-sm">{invoice.notes}</p>
                    </div>
                  )}
                </div>

                {/* Amount and Actions */}
                <div className="ml-6 text-right">
                  <div className="mb-4">
                    <p className="text-3xl font-bold text-white">{formatCurrency(invoice.total)}</p>
                    <p className="text-white/60 text-sm">Total Amount</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/tester-portal/invoices/${invoice.id}`}
                      className="p-2 bg-cyan-600/20 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-600/30 hover:text-white rounded-lg transition-all"
                      title="View Invoice"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    {(invoice.status === 'draft' || invoice.status === 'sent') && (
                      <Link
                        href={`/tester-portal/invoices/${invoice.id}/edit`}
                        className="p-2 bg-blue-600/20 border border-blue-400/30 text-blue-300 hover:bg-blue-600/30 hover:text-white rounded-lg transition-all"
                        title="Edit Invoice"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                    )}
                    <button 
                      className="p-2 bg-green-600/20 border border-green-400/30 text-green-300 hover:bg-green-600/30 hover:text-white rounded-lg transition-all"
                      title="Download PDF"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <MoreVertical className="h-4 w-4 text-white/60" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredInvoices.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-md mx-auto">
              <DollarSign className="h-16 w-16 text-cyan-400/50 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Invoices Found</h3>
              <p className="text-white/80 mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by creating your first invoice.'
                }
              </p>
              {(!searchTerm && statusFilter === 'all') && (
                <Link
                  href="/tester-portal/invoices/new"
                  className="inline-flex items-center px-4 py-2 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}