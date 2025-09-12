'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DollarSign, Plus, Search, Download, Send, Eye, Edit, CheckCircle, Clock, AlertTriangle, PlusCircle } from 'lucide-react'

interface UserPermissions {
  isOwner: boolean
  subscriptions: string[]
  userInfo: any
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  services: {
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }[];
  notes: string;
  paidDate?: string;
  paymentMethod?: string;
}

const statusConfig = {
  draft: { label: 'Draft', color: 'glass text-white/80 border-blue-400', icon: Edit },
  sent: { label: 'Sent', color: 'glass border-blue-400 text-blue-300 glow-blue-sm', icon: Send },
  viewed: { label: 'Viewed', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Eye },
  paid: { label: 'Paid', color: 'bg-emerald-500/20 border border-emerald-400 glow-blue-sm text-emerald-700 border-emerald-200', icon: CheckCircle },
  overdue: { label: 'Overdue', color: 'glass border-red-400 text-red-300 glow-blue-sm', icon: AlertTriangle },
  cancelled: { label: 'Cancelled', color: 'glass text-white/90 border-blue-400', icon: Clock }
};

export default function InvoicesPage() {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('active')

  useEffect(() => {
    fetchPermissions()
  }, [])

  useEffect(() => {
    if (permissions && hasAccess('billing')) {
      loadInvoices()
    }
  }, [permissions])

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/tester-portal/permissions')
      if (response.ok) {
        const data = await response.json()
        setPermissions(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadInvoices = async () => {
    try {
      const response = await fetch('/api/tester-portal/invoices')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.invoices) {
          setInvoices(data.invoices)
        }
      }
    } catch (error) {
      console.error('Failed to load invoices:', error)
    }
  }

  const hasAccess = (feature: string) => {
    if (!permissions) return false
    return permissions.isOwner || permissions.subscriptions.includes(feature)
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = statusFilter === 'all' || 
      (statusFilter === 'active' && ['sent', 'viewed', 'overdue'].includes(invoice.status)) ||
      invoice.status === statusFilter;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusCounts = () => {
    return {
      all: invoices.length,
      active: invoices.filter(i => ['sent', 'viewed', 'overdue'].includes(i.status)).length,
      draft: invoices.filter(i => i.status === 'draft').length,
      sent: invoices.filter(i => i.status === 'sent').length,
      paid: invoices.filter(i => i.status === 'paid').length,
      overdue: invoices.filter(i => i.status === 'overdue').length
    };
  };

  const getTotals = () => {
    const activeInvoices = invoices.filter(i => ['sent', 'viewed', 'overdue'].includes(i.status));
    const paidInvoices = invoices.filter(i => i.status === 'paid');
    const overdueInvoices = invoices.filter(i => i.status === 'overdue');
    
    return {
      outstanding: activeInvoices.reduce((sum, inv) => sum + inv.total, 0),
      paid: paidInvoices.reduce((sum, inv) => sum + inv.total, 0),
      overdue: overdueInvoices.reduce((sum, inv) => sum + inv.total, 0),
      total: invoices.reduce((sum, inv) => sum + inv.total, 0)
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const statusCounts = getStatusCounts();
  const totals = getTotals();

  if (!hasAccess('billing') && !permissions?.isOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
            <DollarSign className="h-8 w-8 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Invoice Management</h2>
          <p className="text-cyan-200 mb-6">
            This feature requires a billing subscription to create and manage invoices.
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
          <p className="mt-4 text-white/80">Loading invoices...</p>
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
                <DollarSign className="h-8 w-8 text-cyan-400 mr-3" />
                Invoice Management
                {permissions?.isOwner && (
                  <span className="ml-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    OWNER ACCESS
                  </span>
                )}
              </h1>
              <p className="text-cyan-200 mt-2">Track and manage all your invoices and payments</p>
            </div>
            <Link
              href="/tester-portal/invoices/new"
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all"
            >
              <Plus className="h-5 w-5 inline mr-2" />
              New Invoice
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Financial Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-black/40 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6 text-center">
            <div className="text-2xl font-bold text-green-400">{formatCurrency(totals.paid)}</div>
            <div className="text-sm text-cyan-300 mt-1">Paid This Month</div>
          </div>
          <div className="bg-black/40 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6 text-center">
            <div className="text-2xl font-bold text-blue-400">{formatCurrency(totals.outstanding)}</div>
            <div className="text-sm text-cyan-300 mt-1">Outstanding</div>
          </div>
          <div className="bg-black/40 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6 text-center">
            <div className="text-2xl font-bold text-red-400">{formatCurrency(totals.overdue)}</div>
            <div className="text-sm text-cyan-300 mt-1">Overdue</div>
          </div>
          <div className="bg-black/40 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6 text-center">
            <div className="text-2xl font-bold text-white">{formatCurrency(totals.total)}</div>
            <div className="text-sm text-cyan-300 mt-1">Total Revenue</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-black/40 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6 mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Search Invoices</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by invoice number, customer, or email..."
                  className="w-full pl-12 pr-4 py-3 bg-black/20 border border-cyan-400/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-white placeholder-cyan-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">Filter by Status</label>
              <div className="flex flex-wrap gap-3">
                {[
                  { key: 'active', label: 'Active', count: statusCounts.active },
                  { key: 'all', label: 'All', count: statusCounts.all },
                  { key: 'draft', label: 'Draft', count: statusCounts.draft },
                  { key: 'sent', label: 'Sent', count: statusCounts.sent },
                  { key: 'paid', label: 'Paid', count: statusCounts.paid },
                  { key: 'overdue', label: 'Overdue', count: statusCounts.overdue }
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setStatusFilter(filter.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      statusFilter === filter.key
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                        : 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                    }`}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Invoices List */}
        <div className="space-y-6">
          {filteredInvoices.length > 0 ? (
            filteredInvoices.map((invoice) => {
              const StatusIcon = statusConfig[invoice.status].icon;
              return (
                <div key={invoice.id} className="bg-black/40 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6 hover:bg-black/50 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-bold text-white text-xl">
                          {invoice.invoiceNumber}
                        </h3>
                        <span className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold ${statusConfig[invoice.status].color}`}>
                          <StatusIcon className="h-4 w-4 mr-2" />
                          {statusConfig[invoice.status].label}
                        </span>
                      </div>
                      <p className="text-cyan-200 font-medium">{invoice.customerName}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-green-400">
                        {formatCurrency(invoice.total)}
                      </div>
                      <div className="text-sm text-cyan-300 font-medium">
                        Due {formatDate(invoice.dueDate)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-cyan-300 font-medium">Issued:</span>
                        <span className="text-white font-semibold">{formatDate(invoice.issueDate)}</span>
                      </div>
                      
                      {invoice.paidDate && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-cyan-300 font-medium">Paid:</span>
                          <span className="font-semibold text-green-400">
                            {formatDate(invoice.paidDate)} ({invoice.paymentMethod})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="bg-black/20 border border-cyan-400/20 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-cyan-300 mb-3">Services</h4>
                      <div className="space-y-2">
                        {invoice.services.map((service, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-white">{service.description} (×{service.quantity})</span>
                            <span className="font-semibold text-green-400">{formatCurrency(service.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-cyan-400/20">
                      <div className="flex space-x-3">
                        <Link href={`/tester-portal/invoices/${invoice.id}`}>
                          <button className="bg-cyan-500/20 text-cyan-400 px-4 py-2 rounded-lg font-semibold hover:bg-cyan-500/30 transition-all">
                            <Eye className="h-4 w-4 inline mr-2" />
                            View
                          </button>
                        </Link>
                        {(invoice.status === 'draft' || invoice.status === 'sent') && (
                          <Link href={`/tester-portal/invoices/${invoice.id}/edit`}>
                            <button className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg font-semibold hover:bg-blue-500/30 transition-all">
                              <Edit className="h-4 w-4 inline mr-2" />
                              Edit
                            </button>
                          </Link>
                        )}
                      </div>
                      
                      <div className="flex space-x-3">
                        <button className="bg-purple-500/20 text-purple-400 px-4 py-2 rounded-lg font-semibold hover:bg-purple-500/30 transition-all">
                          <Download className="h-4 w-4 inline mr-2" />
                          PDF
                        </button>
                        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                          <button className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all">
                            <Send className="h-4 w-4 inline mr-2" />
                            Send
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-black/40 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-12 text-center">
              <DollarSign className="h-16 w-16 text-cyan-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">No invoices found</h3>
              <p className="text-cyan-200 text-lg mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? "Try adjusting your search or filters to find the invoices you're looking for." 
                  : "Get started by creating your first invoice after completing a backflow test."
                }
              </p>
              {(!searchTerm && statusFilter === 'all') && (
                <div className="space-y-4">
                  <Link
                    href="/tester-portal/invoices/new"
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all inline-block"
                  >
                    <PlusCircle className="h-5 w-5 inline mr-2" />
                    Create Your First Invoice
                  </Link>
                  <p className="text-sm text-cyan-300">
                    Or <Link href="/tester-portal/reports" className="text-blue-400 hover:text-blue-300 font-medium">complete a test first</Link>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}