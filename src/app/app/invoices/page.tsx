'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
  User
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
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: Edit },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-800', icon: Send },
  viewed: { label: 'Viewed', color: 'bg-purple-100 text-purple-800', icon: Eye },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-600', icon: Clock }
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load sample invoice data
    const sampleInvoices: Invoice[] = [
      {
        id: '1',
        invoiceNumber: 'INV-2024-001',
        customerId: '1',
        customerName: 'Johnson Properties LLC',
        customerEmail: 'manager@johnsonproperties.com',
        issueDate: '2024-08-15',
        dueDate: '2024-09-14',
        amount: 255.00,
        tax: 22.95,
        total: 277.95,
        status: 'paid',
        services: [
          { description: 'Annual Backflow Test - RP Device', quantity: 2, rate: 85.00, amount: 170.00 },
          { description: 'Annual Backflow Test - DC Device', quantity: 1, rate: 85.00, amount: 85.00 }
        ],
        notes: 'All devices passed testing. Next test due March 2025.',
        paidDate: '2024-08-20',
        paymentMethod: 'Check'
      },
      {
        id: '2',
        invoiceNumber: 'INV-2024-002',
        customerId: '2',
        customerName: 'Smith Residence',
        customerEmail: 'john.smith@gmail.com',
        issueDate: '2024-08-18',
        dueDate: '2024-09-17',
        amount: 85.00,
        tax: 7.65,
        total: 92.65,
        status: 'viewed',
        services: [
          { description: 'Annual Backflow Test - PVB Device', quantity: 1, rate: 85.00, amount: 85.00 }
        ],
        notes: 'Device passed testing. Certificate mailed to customer.'
      },
      {
        id: '3',
        invoiceNumber: 'INV-2024-003',
        customerId: '3',
        customerName: 'Parkland Medical Center',
        customerEmail: 'facilities@parklandmedical.com',
        issueDate: '2024-08-10',
        dueDate: '2024-09-09',
        amount: 595.00,
        tax: 53.55,
        total: 648.55,
        status: 'overdue',
        services: [
          { description: 'Annual Backflow Test - RP Device', quantity: 3, rate: 85.00, amount: 255.00 },
          { description: 'Backflow Device Repair - Relief Valve', quantity: 2, rate: 150.00, amount: 300.00 },
          { description: 'Parts - Relief Valve Assembly', quantity: 1, rate: 40.00, amount: 40.00 }
        ],
        notes: 'Two devices required repairs. Follow-up test completed successfully.'
      },
      {
        id: '4',
        invoiceNumber: 'INV-2024-004',
        customerId: '4',
        customerName: 'Harbor View Apartments',
        customerEmail: 'maintenance@harborview.com',
        issueDate: '2024-08-22',
        dueDate: '2024-09-21',
        amount: 680.00,
        tax: 61.20,
        total: 741.20,
        status: 'sent',
        services: [
          { description: 'Annual Backflow Test - RP Device', quantity: 6, rate: 85.00, amount: 510.00 },
          { description: 'Annual Backflow Test - DC Device', quantity: 2, rate: 85.00, amount: 170.00 }
        ],
        notes: 'Large apartment complex - 8 total devices tested. All passed.'
      },
      {
        id: '5',
        invoiceNumber: 'INV-2024-005',
        customerId: '5',
        customerName: 'Downtown Deli',
        customerEmail: 'owner@downtowndeli.com',
        issueDate: '2024-08-25',
        dueDate: '2024-09-24',
        amount: 170.00,
        tax: 15.30,
        total: 185.30,
        status: 'draft',
        services: [
          { description: 'Annual Backflow Test - DC Device', quantity: 2, rate: 85.00, amount: 170.00 }
        ],
        notes: 'Commercial kitchen - 2 devices tested and passed.'
      }
    ];

    setTimeout(() => {
      setInvoices(sampleInvoices);
      setLoading(false);
    }, 500);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoices...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
            <Button asChild>
              <Link href="/app/invoices/new">
                <Plus className="h-4 w-4 mr-2" />
                New Invoice
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4">
        {/* Financial Overview */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-lg font-bold text-green-700">{formatCurrency(totals.paid)}</div>
            <div className="text-xs text-green-600">Paid This Month</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-lg font-bold text-blue-700">{formatCurrency(totals.outstanding)}</div>
            <div className="text-xs text-blue-600">Outstanding</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-red-50 rounded-lg p-4 text-center shadow-sm">
            <div className="text-lg font-bold text-red-700">{formatCurrency(totals.overdue)}</div>
            <div className="text-xs text-red-600">Overdue</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center shadow-sm">
            <div className="text-lg font-bold text-gray-700">{formatCurrency(totals.total)}</div>
            <div className="text-xs text-gray-600">Total Revenue</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex flex-col space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search invoices..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex space-x-2 overflow-x-auto">
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
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                    statusFilter === filter.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Invoices List */}
        <div className="space-y-3">
          {filteredInvoices.length > 0 ? (
            filteredInvoices.map((invoice) => {
              const StatusIcon = statusConfig[invoice.status].icon;
              return (
                <div key={invoice.id} className="bg-white rounded-lg shadow-sm">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {invoice.invoiceNumber}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig[invoice.status].color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[invoice.status].label}
                          </span>
                        </div>
                        <p className="text-gray-600">{invoice.customerName}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(invoice.total)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Due {formatDate(invoice.dueDate)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Issued:</span>
                        <span className="font-medium">{formatDate(invoice.issueDate)}</span>
                      </div>
                      
                      {invoice.paidDate && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Paid:</span>
                          <span className="font-medium text-green-600">
                            {formatDate(invoice.paidDate)} ({invoice.paymentMethod})
                          </span>
                        </div>
                      )}

                      <div className="text-sm text-gray-600 bg-gray-50 rounded p-2 mt-2">
                        {invoice.services.map((service, index) => (
                          <div key={index} className="flex justify-between">
                            <span>{service.description} (×{service.quantity})</span>
                            <span className="font-medium">{formatCurrency(service.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center justify-between pt-3 border-t mt-4">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/app/invoices/${invoice.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                        {(invoice.status === 'draft' || invoice.status === 'sent') && (
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/app/invoices/${invoice.id}/edit`}>
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Link>
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                          <Button size="sm" variant="outline">
                            <Send className="h-4 w-4 mr-1" />
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
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? "Try adjusting your search or filters" 
                  : "Get started by creating your first invoice"
                }
              </p>
              {(!searchTerm && statusFilter === 'all') && (
                <Button asChild>
                  <Link href="/app/invoices/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Invoice
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
          <Link href="/app" className="flex flex-col items-center py-2 px-1 text-gray-600 hover:text-gray-900">
            <div className="h-6 w-6 bg-gray-400 rounded"></div>
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/app/customers" className="flex flex-col items-center py-2 px-1 text-gray-600 hover:text-gray-900">
            <User className="h-6 w-6" />
            <span className="text-xs">Customers</span>
          </Link>
          <Link href="/app/test-report" className="flex flex-col items-center py-2 px-1 text-gray-600 hover:text-gray-900">
            <Plus className="h-6 w-6" />
            <span className="text-xs">Test</span>
          </Link>
          <Link href="/app/schedule" className="flex flex-col items-center py-2 px-1 text-gray-600 hover:text-gray-900">
            <Calendar className="h-6 w-6" />
            <span className="text-xs">Schedule</span>
          </Link>
          <Link href="/app/more" className="flex flex-col items-center py-2 px-1 text-blue-600 bg-blue-50">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
              <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
              <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
            </div>
            <span className="text-xs font-medium">More</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}