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
  User,
  PlusCircle,
  FileText,
  MoreVertical,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  createdDate: string;
  services: string[];
  paymentMethod?: string;
}

export default function InvoiceManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    // Load invoices - this will be replaced with actual API call
    const loadInvoices = async () => {
      try {
        // Mock data for now
        const mockInvoices: Invoice[] = [
          {
            id: '1',
            invoiceNumber: 'INV-2024-001',
            customerId: '1',
            customerName: 'John Smith',
            amount: 350,
            dueDate: '2024-02-15',
            status: 'sent',
            createdDate: '2024-01-15',
            services: ['Annual Backflow Test', 'Device Certification']
          },
          {
            id: '2',
            invoiceNumber: 'INV-2024-002',
            customerId: '2',
            customerName: 'Sarah Johnson',
            amount: 700,
            dueDate: '2024-02-20',
            status: 'paid',
            createdDate: '2024-01-20',
            services: ['Annual Backflow Test x2', 'Repair Service'],
            paymentMethod: 'Credit Card'
          },
          {
            id: '3',
            invoiceNumber: 'INV-2024-003',
            customerId: '3',
            customerName: 'Mike Wilson',
            amount: 175,
            dueDate: '2024-01-30',
            status: 'overdue',
            createdDate: '2024-01-01',
            services: ['Annual Backflow Test']
          },
          {
            id: '4',
            invoiceNumber: 'INV-2024-004',
            customerId: '4',
            customerName: 'Lisa Chen',
            amount: 525,
            dueDate: '2024-03-01',
            status: 'draft',
            createdDate: '2024-02-01',
            services: ['Installation Test', 'Annual Backflow Test']
          }
        ];

        setInvoices(mockInvoices);
      } catch (error) {
        console.error('Failed to load invoices:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, []);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'all' || invoice.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'border-emerald-400 bg-emerald-500/20 text-emerald-200';
      case 'sent': return 'border-blue-400 bg-blue-500/20 text-blue-200';
      case 'overdue': return 'border-red-400 bg-red-500/20 text-red-200';
      case 'draft': return 'border-gray-400 bg-gray-500/20 text-gray-200';
      case 'cancelled': return 'border-orange-400 bg-orange-500/20 text-orange-200';
      default: return 'border-blue-400 bg-blue-500/20 text-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'sent': return <Send className="h-4 w-4" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4" />;
      case 'draft': return <Edit className="h-4 w-4" />;
      case 'cancelled': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const paidAmount = invoices.filter(i => i.status === 'paid').reduce((sum, invoice) => sum + invoice.amount, 0);
  const pendingAmount = invoices.filter(i => i.status === 'sent').reduce((sum, invoice) => sum + invoice.amount, 0);
  const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((sum, invoice) => sum + invoice.amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-white/80">Loading invoices...</p>
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
              <h1 className="text-2xl font-bold text-white">Invoice Management</h1>
              <p className="text-white/60">Track billing and payments</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/business">
                <Button variant="outline" className="border-blue-400 text-white/80">
                  ← Back to Dashboard
                </Button>
              </Link>
              <Link href="/business/invoices/new">
                <Button className="glass-btn-primary hover:glow-blue text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 relative z-10">

        {/* Financial Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass border border-blue-400 rounded-xl p-4 glow-blue-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Invoiced</p>
                <p className="text-2xl font-bold text-white">${totalAmount.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-300" />
            </div>
          </div>

          <div className="glass border border-emerald-400/50 rounded-xl p-4 glow-blue-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Paid</p>
                <p className="text-2xl font-bold text-white">${paidAmount.toLocaleString()}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-300" />
            </div>
          </div>

          <div className="glass border border-amber-400/50 rounded-xl p-4 glow-blue-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Pending</p>
                <p className="text-2xl font-bold text-white">${pendingAmount.toLocaleString()}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-300" />
            </div>
          </div>

          <div className="glass border border-red-400/50 rounded-xl p-4 glow-blue-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Overdue</p>
                <p className="text-2xl font-bold text-white">${overdueAmount.toLocaleString()}</p>
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
                placeholder="Search by invoice number or customer..."
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
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <Button variant="outline" className="border-blue-400 text-white/80">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Invoice List */}
        <div className="glass border border-blue-400 rounded-xl glow-blue-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-4 text-white/80 font-medium">Invoice</th>
                  <th className="text-left px-6 py-4 text-white/80 font-medium">Customer</th>
                  <th className="text-left px-6 py-4 text-white/80 font-medium">Amount</th>
                  <th className="text-left px-6 py-4 text-white/80 font-medium">Due Date</th>
                  <th className="text-left px-6 py-4 text-white/80 font-medium">Status</th>
                  <th className="text-left px-6 py-4 text-white/80 font-medium">Services</th>
                  <th className="text-left px-6 py-4 text-white/80 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">

                    {/* Invoice Number */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-white">{invoice.invoiceNumber}</p>
                        <p className="text-white/60 text-sm">
                          Created: {new Date(invoice.createdDate).toLocaleDateString()}
                        </p>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-white/60" />
                        <span className="text-white/80">{invoice.customerName}</span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4">
                      <p className="text-white font-semibold">${invoice.amount.toLocaleString()}</p>
                      {invoice.paymentMethod && (
                        <p className="text-white/60 text-sm flex items-center">
                          <CreditCard className="h-3 w-3 mr-1" />
                          {invoice.paymentMethod}
                        </p>
                      )}
                    </td>

                    {/* Due Date */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-white/60" />
                        <span className="text-white/80">
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border flex items-center space-x-1 w-fit ${getStatusColor(invoice.status)}`}>
                        {getStatusIcon(invoice.status)}
                        <span>{invoice.status.toUpperCase()}</span>
                      </span>
                    </td>

                    {/* Services */}
                    <td className="px-6 py-4">
                      <div>
                        {invoice.services.slice(0, 2).map((service, idx) => (
                          <p key={idx} className="text-white/80 text-sm">{service}</p>
                        ))}
                        {invoice.services.length > 2 && (
                          <p className="text-white/60 text-xs">+{invoice.services.length - 2} more</p>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Link href={`/business/invoices/${invoice.id}`}>
                          <Button variant="outline" size="sm" className="border-blue-400 text-white/80">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </Link>
                        <Link href={`/business/invoices/${invoice.id}/edit`}>
                          <Button variant="outline" size="sm" className="border-blue-400 text-white/80">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </Link>
                        {invoice.status === 'draft' && (
                          <Button variant="outline" size="sm" className="border-emerald-400 text-emerald-200">
                            <Send className="h-3 w-3" />
                          </Button>
                        )}
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

          {filteredInvoices.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-white/40 mx-auto mb-4" />
              <p className="text-white/60">No invoices found matching your criteria</p>
              <Link href="/business/invoices/new" className="mt-4 inline-block">
                <Button className="glass-btn-primary hover:glow-blue text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Invoice
                </Button>
              </Link>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}