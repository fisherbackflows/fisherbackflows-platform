'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { TeamPortalNavigation } from '@/components/navigation/UnifiedNavigation';
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
  User,
  ArrowLeft,
  PlusCircle,
  FileText
} from 'lucide-react';
import Link from 'next/link';

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
  draft: { label: 'Draft', color: 'bg-slate-400 text-slate-700 border-slate-200', icon: Edit },
  sent: { label: 'Sent', color: 'bg-blue-200 text-blue-700 border-blue-200', icon: Send },
  viewed: { label: 'Viewed', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Eye },
  paid: { label: 'Paid', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  overdue: { label: 'Overdue', color: 'bg-red-200 text-red-700 border-red-200', icon: AlertTriangle },
  cancelled: { label: 'Cancelled', color: 'bg-slate-400 text-slate-800 border-slate-200', icon: Clock }
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('/api/team/invoices');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setInvoices(data.invoices || []);
          } else {
            setInvoices([]);
          }
        } else {
          // API doesn't exist yet - show empty state
          setInvoices([]);
        }
      } catch (error) {
        console.error('Error loading invoices:', error);
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <TeamPortalNavigation userInfo={null} />
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="text-slate-800 mt-4">Loading invoices...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <TeamPortalNavigation userInfo={null} />
      
      <main className="p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Professional Header */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center space-x-4">
                <Link href="/team-portal/dashboard">
                  <Button className="bg-slate-300 hover:bg-slate-400 text-slate-700 p-2 rounded-lg">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Invoice Management</h1>
                  <p className="text-slate-800 mt-1">Track and manage all your invoices and payments</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Link href="/team-portal/invoices/new">
                  <Button className="bg-blue-700 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Invoice
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Professional Financial Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center hover:shadow-md transition-shadow duration-200">
              <div className="text-2xl font-bold text-emerald-600">{invoices.length > 0 ? formatCurrency(totals.paid) : '$0'}</div>
              <div className="text-sm text-slate-800 mt-1">Paid This Month</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center hover:shadow-md transition-shadow duration-200">
              <div className="text-2xl font-bold text-blue-800">{invoices.length > 0 ? formatCurrency(totals.outstanding) : '$0'}</div>
              <div className="text-sm text-slate-800 mt-1">Outstanding</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center hover:shadow-md transition-shadow duration-200">
              <div className="text-2xl font-bold text-red-800">{invoices.length > 0 ? formatCurrency(totals.overdue) : '$0'}</div>
              <div className="text-sm text-slate-800 mt-1">Overdue</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center hover:shadow-md transition-shadow duration-200">
              <div className="text-2xl font-bold text-slate-900">{invoices.length > 0 ? formatCurrency(totals.total) : '$0'}</div>
              <div className="text-sm text-slate-800 mt-1">Total Revenue</div>
            </div>
          </div>

          {/* Professional Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Search Invoices</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-800 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search by invoice number, customer, or email..."
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Status</label>
                <div className="flex flex-wrap gap-2">
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
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        statusFilter === filter.key
                          ? 'bg-blue-700 text-white shadow-sm'
                          : 'bg-slate-300 text-slate-900 hover:bg-slate-400'
                      }`}
                    >
                      {filter.label} ({filter.count})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Professional Invoices List */}
          <div className="space-y-4">
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice) => {
                const StatusIcon = statusConfig[invoice.status].icon;
                return (
                  <div key={invoice.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200">
                    <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-bold text-slate-900 text-lg">
                            {invoice.invoiceNumber}
                          </h3>
                          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border ${statusConfig[invoice.status].color}`}>
                            <StatusIcon className="h-4 w-4 mr-1" />
                            {statusConfig[invoice.status].label}
                          </span>
                        </div>
                        <p className="text-slate-800 font-medium">{invoice.customerName}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-900">
                          {formatCurrency(invoice.total)}
                        </div>
                        <div className="text-sm text-slate-700 font-medium">
                          Due {formatDate(invoice.dueDate)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-700 font-medium">Issued:</span>
                          <span className="text-slate-900 font-semibold">{formatDate(invoice.issueDate)}</span>
                        </div>
                        
                        {invoice.paidDate && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-700 font-medium">Paid:</span>
                            <span className="font-semibold text-emerald-600">
                              {formatDate(invoice.paidDate)} ({invoice.paymentMethod})
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-400 border border-slate-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-slate-700 mb-3">Services</h4>
                        <div className="space-y-2">
                          {invoice.services.map((service, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="text-slate-800">{service.description} (×{service.quantity})</span>
                              <span className="font-semibold text-slate-900">{formatCurrency(service.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Professional Quick Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-6">
                      <div className="flex space-x-2">
                        <Link href={`/team-portal/invoices/${invoice.id}`}>
                          <Button className="bg-slate-300 hover:bg-slate-400 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                        {(invoice.status === 'draft' || invoice.status === 'sent') && (
                          <Link href={`/team-portal/invoices/${invoice.id}/edit`}>
                            <Button className="bg-blue-700 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </Link>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button className="bg-slate-300 hover:bg-slate-400 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                          <Download className="h-4 w-4 mr-2" />
                          PDF
                        </Button>
                        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center">
                            <Send className="h-4 w-4 mr-2" />
                            Send
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <DollarSign className="h-16 w-16 text-slate-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-slate-900 mb-3">No invoices found</h3>
                <p className="text-slate-800 mb-8 max-w-md mx-auto">
                  {searchTerm || statusFilter !== 'all' 
                    ? "Try adjusting your search or filters to find the invoices you're looking for." 
                    : "Get started by creating your first invoice after completing a backflow test."
                  }
                </p>
                {(!searchTerm && statusFilter === 'all') && (
                  <div className="space-y-4">
                    <Link href="/team-portal/invoices/new">
                      <Button className="bg-blue-700 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center mx-auto">
                        <PlusCircle className="h-5 w-5 mr-2" />
                        Create Your First Invoice
                      </Button>
                    </Link>
                    <p className="text-sm text-slate-700">
                      Or <Link href="/team-portal/test-report" className="text-blue-800 hover:text-blue-800 font-medium">complete a test first</Link>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}