'use client';

import { useState } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  FileText, 
  Download, 
  Eye, 
  ArrowLeft,
  Settings,
  CheckCircle,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Calendar,
  Receipt,
  Banknote,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/ui/Logo';
import Link from 'next/link';

// Mock data for invoices and payments
const mockInvoices = [
  {
    id: 'INV-2024-001',
    date: '2024-12-15',
    dueDate: '2025-01-15',
    amount: 85.00,
    status: 'paid',
    serviceDate: '2024-12-10',
    serviceType: 'Annual Backflow Test',
    deviceLocation: '123 Main St - Backyard',
    testResults: 'Passed',
    paymentDate: '2024-12-20',
    paymentMethod: 'Credit Card',
    description: 'Annual testing of backflow prevention device'
  },
  {
    id: 'INV-2024-002',
    date: '2024-12-20',
    dueDate: '2025-01-20',
    amount: 150.00,
    status: 'overdue',
    serviceDate: '2024-12-15',
    serviceType: 'Device Repair',
    deviceLocation: '123 Main St - Front Yard',
    testResults: 'Repaired',
    paymentDate: null,
    paymentMethod: null,
    description: 'Repair of malfunctioning relief valve'
  },
  {
    id: 'INV-2025-001',
    date: '2025-01-05',
    dueDate: '2025-02-05',
    amount: 85.00,
    status: 'pending',
    serviceDate: '2025-01-02',
    serviceType: 'Annual Backflow Test',
    deviceLocation: '456 Oak Ave - Basement',
    testResults: 'Passed',
    paymentDate: null,
    paymentMethod: null,
    description: 'Annual testing of backflow prevention device'
  }
];

const mockPayments = [
  {
    id: 'PAY-001',
    date: '2024-12-20',
    amount: 85.00,
    method: 'Credit Card',
    invoiceId: 'INV-2024-001',
    status: 'completed',
    transactionId: 'TXN-ABC123456',
    cardLast4: '4242'
  },
  {
    id: 'PAY-002',
    date: '2024-11-15',
    amount: 170.00,
    method: 'Check',
    invoiceId: 'INV-2024-000',
    status: 'completed',
    transactionId: 'CHK-789456123',
    cardLast4: null
  }
];

export default function BillingPage() {
  const [invoices] = useState(mockInvoices);
  const [payments] = useState(mockPayments);
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments'>('invoices');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-400 bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/20 border-green-400/30';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      case 'overdue': return 'text-red-400 bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl/20 border-red-400/30';
      case 'cancelled': return 'text-white/80 bg-black/30 backdrop-blur-lg/20 border-blue-500/50/30';
      default: return 'text-blue-400 bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 border-blue-400/30';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'credit card':
        return <CreditCard className="h-4 w-4" />;
      case 'check':
        return <FileText className="h-4 w-4" />;
      case 'cash':
        return <Banknote className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.deviceLocation.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || invoice.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.method.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const billingStats = {
    totalInvoices: invoices.length,
    paidInvoices: invoices.filter(i => i.status === 'paid').length,
    pendingAmount: invoices.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0),
    overdueInvoices: invoices.filter(i => i.status === 'overdue').length
  };

  return (
    <div className="min-h-screen bg-black">

      {/* Header */}
      <header className="glass border-b border-blue-400 glow-blue-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/portal/dashboard">
                <Button className="glass hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm text-white px-3 py-2 rounded-2xl">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <Logo width={160} height={128} />
            </div>
            <div className="flex items-center space-x-4">
              <Button className="glass-btn-primary hover:glow-blue text-white px-4 py-2 rounded-2xl">
                <Plus className="h-4 w-4 mr-2" />
                Payment Method
              </Button>
              <Button className="glass hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm text-white px-4 py-2 rounded-2xl">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 ">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Billing & Payments</h1>
          <p className="text-white/80">
            Manage your invoices, view payment history, and make secure payments.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass border border-blue-400 rounded-xl p-6 hover:glow-blue transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl p-2">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <span className="text-2xl font-bold">{billingStats.totalInvoices}</span>
            </div>
            <h3 className="font-medium mb-1">Total Invoices</h3>
            <p className="text-white/80 text-sm">All time invoices</p>
          </div>

          <div className="glass border border-blue-400 rounded-xl p-6 hover:glow-blue transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl p-2">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <span className="text-2xl font-bold text-green-400">{billingStats.paidInvoices}</span>
            </div>
            <h3 className="font-medium mb-1">Paid Invoices</h3>
            <p className="text-white/80 text-sm">Successfully paid</p>
          </div>

          <div className="glass border border-blue-400 rounded-xl p-6 hover:glow-blue transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl p-2">
                <DollarSign className="h-6 w-6 text-yellow-400" />
              </div>
              <span className="text-2xl font-bold text-yellow-400">${billingStats.pendingAmount.toFixed(2)}</span>
            </div>
            <h3 className="font-medium mb-1">Pending Amount</h3>
            <p className="text-white/80 text-sm">Outstanding balance</p>
          </div>

          <div className="glass border border-blue-400 rounded-xl p-6 hover:glow-blue transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl p-2">
                <AlertTriangle className={`h-6 w-6 ${billingStats.overdueInvoices > 0 ? 'text-red-400' : 'text-green-400'}`} />
              </div>
              <span className={`text-2xl font-bold ${billingStats.overdueInvoices > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {billingStats.overdueInvoices}
              </span>
            </div>
            <h3 className="font-medium mb-1">Overdue Invoices</h3>
            <p className="text-white/80 text-sm">Need immediate attention</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Invoices/Payments */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tab Navigation */}
            <div className="glass border border-blue-400 rounded-xl p-6">
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={() => setActiveTab('invoices')}
                  className={`px-4 py-2 rounded-2xl font-medium transition-colors ${
                    activeTab === 'invoices' 
                      ? 'bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 text-blue-400' 
                      : 'text-white/80 hover:text-white/90'
                  }`}
                >
                  <FileText className="h-4 w-4 inline mr-2" />
                  Invoices
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`px-4 py-2 rounded-2xl font-medium transition-colors ${
                    activeTab === 'payments' 
                      ? 'bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/20 text-blue-400' 
                      : 'text-white/80 hover:text-white/90'
                  }`}
                >
                  <Receipt className="h-4 w-4 inline mr-2" />
                  Payment History
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/90" />
                  <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/90 border border-blue-400 glass text-black w-full pl-10 pr-4 py-3 rounded-2xl placeholder-gray-500"
                  />
                </div>
                {activeTab === 'invoices' && (
                  <div className="flex items-center space-x-2">
                    <Filter className="h-5 w-5 text-white/80" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="border border-blue-400 glass text-white px-4 py-3 rounded-2xl text-white bg-transparent"
                    >
                      <option value="all" className="glass">All Status</option>
                      <option value="paid" className="glass">Paid</option>
                      <option value="pending" className="glass">Pending</option>
                      <option value="overdue" className="glass">Overdue</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="glass border border-blue-400 rounded-2xl p-6 glow-blue-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">
                  {activeTab === 'invoices' ? 'Your Invoices' : 'Payment History'}
                </h2>
              </div>

              {/* Invoices Tab */}
              {activeTab === 'invoices' && (
                <div className="space-y-4">
                  {filteredInvoices.map((invoice) => (
                    <div key={invoice.id} className="glass border border-blue-400 rounded-2xl p-6 hover:glass transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-lg text-white">{invoice.id}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-white/80 text-sm mb-1">{invoice.serviceType}</p>
                          <p className="text-white/80 text-sm">{invoice.deviceLocation}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-white">${invoice.amount.toFixed(2)}</div>
                          <div className="text-white/80 text-sm">
                            Due: {new Date(invoice.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                        <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl p-3">
                          <div className="flex items-center text-blue-400 mb-1">
                            <Calendar className="h-4 w-4 mr-2" />
                            Service Date
                          </div>
                          <p className="text-white/90 font-medium">
                            {new Date(invoice.serviceDate).toLocaleDateString()}
                          </p>
                          <p className="text-white/80 text-xs">Test Result: {invoice.testResults}</p>
                        </div>

                        <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl p-3">
                          <div className="flex items-center text-blue-400 mb-1">
                            <FileText className="h-4 w-4 mr-2" />
                            Invoice Date
                          </div>
                          <p className="text-white/90 font-medium">
                            {new Date(invoice.date).toLocaleDateString()}
                          </p>
                          <p className="text-white/80 text-xs">Generated</p>
                        </div>

                        <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl p-3">
                          <div className="flex items-center text-blue-400 mb-1">
                            {invoice.status === 'paid' ? <CheckCircle className="h-4 w-4 mr-2" /> : <Clock className="h-4 w-4 mr-2" />}
                            Payment Status
                          </div>
                          <p className="text-white/90 font-medium">
                            {invoice.status === 'paid' ? 'Paid' : 'Pending'}
                          </p>
                          <p className="text-white/80 text-xs">
                            {invoice.paymentDate ? new Date(invoice.paymentDate).toLocaleDateString() : 'Not paid'}
                          </p>
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        {invoice.status !== 'paid' && (
                          <Button className="glass-btn-primary hover:glow-blue text-white px-4 py-2 rounded-2xl text-sm">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Pay Now
                          </Button>
                        )}
                        <Button className="glass hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm text-white px-4 py-2 rounded-2xl text-sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button className="glass hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm text-white px-4 py-2 rounded-2xl text-sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  ))}

                  {filteredInvoices.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="h-16 w-16 text-white/90 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white/80 mb-2">No invoices found</h3>
                      <p className="text-white/90">
                        {searchTerm || filterStatus !== 'all' 
                          ? 'Try adjusting your search or filter criteria.'
                          : 'Your invoices will appear here once services are provided.'
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Payments Tab */}
              {activeTab === 'payments' && (
                <div className="space-y-4">
                  {filteredPayments.map((payment) => (
                    <div key={payment.id} className="glass border border-blue-400 rounded-2xl p-6 hover:glass transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl p-3">
                            {getPaymentMethodIcon(payment.method)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-white">{payment.id}</h3>
                            <p className="text-white/80 text-sm">For invoice: {payment.invoiceId}</p>
                            <p className="text-white/80 text-sm">
                              {payment.method}
                              {payment.cardLast4 && ` ending in ${payment.cardLast4}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-400">${payment.amount.toFixed(2)}</div>
                          <div className="text-white/80 text-sm">
                            {new Date(payment.date).toLocaleDateString()}
                          </div>
                          <span className="px-2 py-1 rounded-full text-xs font-medium border text-green-400 bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/20 border-green-400/30">
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl p-3 text-sm">
                        <p className="text-blue-400 mb-1">Transaction ID</p>
                        <p className="text-white/90 font-mono">{payment.transactionId}</p>
                      </div>
                    </div>
                  ))}

                  {filteredPayments.length === 0 && (
                    <div className="text-center py-12">
                      <Receipt className="h-16 w-16 text-white/90 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white/80 mb-2">No payments found</h3>
                      <p className="text-white/90">
                        {searchTerm 
                          ? 'Try adjusting your search criteria.'
                          : 'Your payment history will appear here once payments are made.'
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Quick Actions & Payment Methods */}
          <div className="space-y-8">
            {/* Quick Pay */}
            {billingStats.pendingAmount > 0 && (
              <div className="glass border border-blue-400 rounded-2xl p-6 glow-blue-sm ">
                <h2 className="text-xl font-bold text-white mb-4">Outstanding Balance</h2>
                
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">
                    ${billingStats.pendingAmount.toFixed(2)}
                  </div>
                  <p className="text-white/80 text-sm">
                    {billingStats.overdueInvoices > 0 
                      ? `${billingStats.overdueInvoices} overdue invoice${billingStats.overdueInvoices > 1 ? 's' : ''}`
                      : 'Pending payment'
                    }
                  </p>
                </div>

                <Button className="w-full glass-btn-primary hover:glow-blue text-white py-3 rounded-2xl mb-3">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pay All Outstanding
                </Button>
                
                <Button className="w-full glass hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm text-white py-2 rounded-2xl text-sm">
                  Set Up Auto-Pay
                </Button>
              </div>
            )}

            {/* Quick Actions */}
            <div className="glass border border-blue-400 rounded-2xl p-6 glow-blue-sm">
              <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
              
              <div className="space-y-3">
                <Button className="w-full glass hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm text-white py-3 rounded-2xl justify-start">
                  <Plus className="h-5 w-5 mr-3" />
                  Add Payment Method
                </Button>
                
                <Button className="w-full glass hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm text-white py-3 rounded-2xl justify-start">
                  <Download className="h-5 w-5 mr-3" />
                  Download All Invoices
                </Button>
                
                <Button className="w-full glass hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm text-white py-3 rounded-2xl justify-start">
                  <FileText className="h-5 w-5 mr-3" />
                  Request Statement
                </Button>
                
                <Button className="w-full glass hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm text-white py-3 rounded-2xl justify-start">
                  <Settings className="h-5 w-5 mr-3" />
                  Billing Preferences
                </Button>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="glass border border-blue-400 rounded-2xl p-6 glow-blue-sm">
              <h2 className="text-xl font-bold text-white mb-6">Saved Payment Methods</h2>
              
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-blue-400" />
                      <div>
                        <p className="text-white font-medium text-sm">•••• 4242</p>
                        <p className="text-white/80 text-xs">Expires 12/27</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/20 text-green-400 rounded">
                      Default
                    </span>
                  </div>
                </div>
                
                <Button className="w-full glass hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm text-white py-3 rounded-2xl justify-center text-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Card
                </Button>
              </div>
            </div>

            {/* Support */}
            <div className="bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl rounded-2xl p-6">
              <h2 className="text-lg font-bold text-blue-400 mb-4">Billing Support</h2>
              
              <div className="space-y-3 text-sm">
                <p className="text-white/90">
                  Questions about your bill? We're here to help.
                </p>
                <div className="space-y-2">
                  <a href="tel:2532788692" className="flex items-center text-white/90 hover:text-blue-400 transition-colors">
                    📞 (253) 278-8692
                  </a>
                  <a href="mailto:billing@fisherbackflows.com" className="flex items-center text-white/90 hover:text-blue-400 transition-colors">
                    ✉️ billing@fisherbackflows.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}