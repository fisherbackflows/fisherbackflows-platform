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
  draft: { label: 'Draft', color: 'glass text-white/80 border-blue-400', icon: Edit },
  sent: { label: 'Sent', color: 'glass border-blue-400 text-blue-300 glow-blue-sm', icon: Send },
  viewed: { label: 'Viewed', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Eye },
  paid: { label: 'Paid', color: 'bg-emerald-500/20 border border-emerald-400 glow-blue-sm text-emerald-700 border-emerald-200', icon: CheckCircle },
  overdue: { label: 'Overdue', color: 'glass border-red-400 text-red-300 glow-blue-sm', icon: AlertTriangle },
  cancelled: { label: 'Cancelled', color: 'glass text-white/90 border-blue-400', icon: Clock }
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
        
        const response = await fetch('/api/invoices');
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
      <div className="min-h-screen bg-black">
        <TeamPortalNavigation userInfo={{ name: 'Team Member', email: '' }} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="text-white/90 mt-4">Loading invoices...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <TeamPortalNavigation userInfo={{ name: 'Team Member', email: '' }} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="space-y-8">
          {/* Professional Header */}
          <div className="glass rounded-xl glow-blue-sm border border-blue-400 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center space-x-4">
                <Link href="/team-portal/dashboard">
                  <Button className="glass hover:glass text-white/80 p-2 rounded-2xl">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div className="p-3 bg-emerald-500/20 border border-emerald-400 glow-blue-sm rounded-2xl">
                  <DollarSign className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Invoice Management</h1>
                  <p className="text-white/90 mt-1">Track and manage all your invoices and payments</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Link href="/team-portal/invoices/new">
                  <Button className="glass-btn-primary hover:glow-blue text-white px-6 py-3 rounded-2xl font-medium transition-colors duration-200 flex items-center">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Invoice
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Professional Financial Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="glass rounded-xl glow-blue-sm border border-blue-400 p-6 text-center hover:glow-blue transition-shadow duration-200">
              <div className="text-2xl font-bold text-emerald-300">{invoices.length > 0 ? formatCurrency(totals.paid) : '$0'}</div>
              <div className="text-sm text-white/90 mt-1">Paid This Month</div>
            </div>
            <div className="glass rounded-xl glow-blue-sm border border-blue-400 p-6 text-center hover:glow-blue transition-shadow duration-200">
              <div className="text-2xl font-bold text-blue-300">{invoices.length > 0 ? formatCurrency(totals.outstanding) : '$0'}</div>
              <div className="text-sm text-white/90 mt-1">Outstanding</div>
            </div>
            <div className="glass rounded-xl glow-blue-sm border border-blue-400 p-6 text-center hover:glow-blue transition-shadow duration-200">
              <div className="text-2xl font-bold text-red-300">{invoices.length > 0 ? formatCurrency(totals.overdue) : '$0'}</div>
              <div className="text-sm text-white/90 mt-1">Overdue</div>
            </div>
            <div className="glass rounded-xl glow-blue-sm border border-blue-400 p-6 text-center hover:glow-blue transition-shadow duration-200">
              <div className="text-2xl font-bold text-white">{invoices.length > 0 ? formatCurrency(totals.total) : '$0'}</div>
              <div className="text-sm text-white/90 mt-1">Total Revenue</div>
            </div>
          </div>

          {/* Professional Search and Filters */}
          <div className="glass rounded-xl glow-blue-sm border border-blue-400 p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Search Invoices</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/90 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search by invoice number, customer, or email..."
                    className="w-full pl-10 pr-4 py-3 border border-blue-400 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors duration-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Filter by Status</label>
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
                      className={`px-4 py-2 rounded-2xl text-sm font-medium transition-colors duration-200 ${
                        statusFilter === filter.key
                          ? 'bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl text-white glow-blue-sm'
                          : 'glass text-white hover:glass'
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
                  <div key={invoice.id} className="glass rounded-xl glow-blue-sm border border-blue-400 hover:glow-blue transition-shadow duration-200">
                    <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-bold text-white text-lg">
                            {invoice.invoiceNumber}
                          </h3>
                          <span className={`inline-flex items-center px-3 py-1 rounded-2xl text-sm font-medium border ${statusConfig[invoice.status].color}`}>
                            <StatusIcon className="h-4 w-4 mr-1" />
                            {statusConfig[invoice.status].label}
                          </span>
                        </div>
                        <p className="text-white/90 font-medium">{invoice.customerName}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                          {formatCurrency(invoice.total)}
                        </div>
                        <div className="text-sm text-white/80 font-medium">
                          Due {formatDate(invoice.dueDate)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/80 font-medium">Issued:</span>
                          <span className="text-white font-semibold">{formatDate(invoice.issueDate)}</span>
                        </div>
                        
                        {invoice.paidDate && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/80 font-medium">Paid:</span>
                            <span className="font-semibold text-emerald-300">
                              {formatDate(invoice.paidDate)} ({invoice.paymentMethod})
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="glass border border-blue-400 rounded-2xl p-4">
                        <h4 className="text-sm font-medium text-white/80 mb-3">Services</h4>
                        <div className="space-y-2">
                          {invoice.services.map((service, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="text-white/90">{service.description} (×{service.quantity})</span>
                              <span className="font-semibold text-white">{formatCurrency(service.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Professional Quick Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-blue-400 mt-6">
                      <div className="flex space-x-2">
                        <Link href={`/team-portal/invoices/${invoice.id}`}>
                          <Button className="glass hover:glass text-white/80 px-4 py-2 rounded-2xl text-sm font-medium transition-colors duration-200 flex items-center">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                        {(invoice.status === 'draft' || invoice.status === 'sent') && (
                          <Link href={`/team-portal/invoices/${invoice.id}/edit`}>
                            <Button className="glass-btn-primary hover:glow-blue text-white px-4 py-2 rounded-2xl text-sm font-medium transition-colors duration-200 flex items-center">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </Link>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button className="glass hover:glass text-white/80 px-4 py-2 rounded-2xl text-sm font-medium transition-colors duration-200 flex items-center">
                          <Download className="h-4 w-4 mr-2" />
                          PDF
                        </Button>
                        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                          <Button className="glass-btn-primary hover:glow-blue bg-emerald-500/20 border border-emerald-400 glow-blue-sm0/30 border-emerald-400 text-white px-4 py-2 rounded-2xl text-sm font-medium transition-colors duration-200 flex items-center">
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
              <div className="glass rounded-xl glow-blue-sm border border-blue-400 p-12 text-center">
                <DollarSign className="h-16 w-16 text-white/90 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-3">No invoices found</h3>
                <p className="text-white/90 mb-8 max-w-md mx-auto">
                  {searchTerm || statusFilter !== 'all' 
                    ? "Try adjusting your search or filters to find the invoices you're looking for." 
                    : "Get started by creating your first invoice after completing a backflow test."
                  }
                </p>
                {(!searchTerm && statusFilter === 'all') && (
                  <div className="space-y-4">
                    <Link href="/team-portal/invoices/new">
                      <Button className="glass-btn-primary hover:glow-blue text-white px-6 py-3 rounded-2xl font-medium transition-colors duration-200 flex items-center mx-auto">
                        <PlusCircle className="h-5 w-5 mr-2" />
                        Create Your First Invoice
                      </Button>
                    </Link>
                    <p className="text-sm text-white/80">
                      Or <Link href="/team-portal/test-report" className="text-blue-300 hover:text-blue-300 font-medium">complete a test first</Link>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}