'use client';

import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  FileText, 
  Download, 
  Eye, 
  CheckCircle,
  AlertTriangle,
  Clock,
  Calendar,
  Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCustomerData } from '@/hooks/useCustomerData';

export default function CustomerBillingPage() {
  const { customer, loading, error } = useCustomerData();
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    if (customer?.id) {
      loadInvoices();
    }
  }, [customer]);

  async function loadInvoices() {
    try {
      setLoadingInvoices(true);
      const token = localStorage.getItem('portal_token');
      
      const response = await fetch(`/api/invoices?customerId=${customer.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoadingInvoices(false);
    }
  }

  async function downloadInvoicePDF(invoiceId) {
    try {
      const token = localStorage.getItem('portal_token');
      
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to download PDF');
        alert('Failed to download invoice. Please try again.');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('An error occurred while downloading the invoice.');
    }
  }

  async function handlePayInvoice(invoice) {
    // Navigate to payment page with invoice details
    window.location.href = `/portal/pay?invoiceId=${invoice.id}&amount=${invoice.total}`;
  }

  if (loading || loadingInvoices) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-white/80">Loading your billing information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Unable to Load Billing</h2>
          <p className="text-white/80 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="btn-glow">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const balance = customer?.balance || 0;
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue');
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-grid opacity-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600/80/5 via-transparent to-blue-500/80/5" />

      {/* Header */}
      <header className="glass border-b border-blue-400 sticky top-0 z-50 glow-blue-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold text-white">
                Fisher Backflows
              </Link>
              <nav className="hidden md:flex space-x-1">
                <Link href="/portal/dashboard" className="px-4 py-2 rounded-2xl text-white/90 hover:text-white hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm transition-all font-medium">
                  Dashboard
                </Link>
                <Link href="/portal/devices" className="px-4 py-2 rounded-2xl text-white/90 hover:text-white hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm transition-all font-medium">
                  Devices
                </Link>
                <Link href="/portal/billing" className="px-4 py-2 rounded-2xl glass-btn-primary text-white glow-blue-sm font-medium">
                  Billing
                </Link>
                <Link href="/portal/reports" className="px-4 py-2 rounded-2xl text-white/90 hover:text-white hover:bg-gradient-to-r from-blue-600/80 to-blue-500/80 backdrop-blur-xl/10 hover:glow-blue-sm transition-all font-medium">
                  Reports
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="font-semibold text-white">{customer?.name}</p>
                <p className="text-sm text-white/80">Account: {customer?.accountNumber}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">

      {/* Navigation Header */}
      <header className="glass border-b border-blue-400 glow-blue-sm mb-6">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/portal/dashboard">
              <Button variant="ghost" className="text-blue-300 hover:text-white">
                ← Back to Dashboard
              </Button>
            </Link>
            <nav className="flex space-x-4">
              <Link href="/portal/billing">
                <Button variant="ghost" className="text-blue-300 hover:text-white">Billing</Button>
              </Link>
              <Link href="/portal/devices">
                <Button variant="ghost" className="text-blue-300 hover:text-white">Devices</Button>
              </Link>
              <Link href="/portal/reports">
                <Button variant="ghost" className="text-blue-300 hover:text-white">Reports</Button>
              </Link>
              <Link href="/portal/schedule">
                <Button variant="ghost" className="text-blue-300 hover:text-white">Schedule</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-white">Billing & Payments</h1>
              <p className="text-white/90 text-lg">Manage your invoices and payment methods</p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-sm">Current Balance</p>
              <p className={`text-3xl font-bold ${balance > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                ${balance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass rounded-2xl p-6 border border-blue-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Invoices</p>
                <p className="text-2xl font-bold text-white">{invoices.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          
          <div className="glass rounded-2xl p-6 border border-blue-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Pending</p>
                <p className="text-2xl font-bold text-orange-400">{pendingInvoices.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-400" />
            </div>
          </div>
          
          <div className="glass rounded-2xl p-6 border border-blue-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Paid</p>
                <p className="text-2xl font-bold text-green-400">{paidInvoices.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>
        </div>

        {/* Invoices Section */}
        <div className="glass rounded-2xl p-6 border border-blue-400">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Invoices</h2>
          
          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-16 w-16 text-blue-400 mx-auto mb-4" />
              <p className="text-white/60">No invoices found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="glass rounded-2xl p-4 border border-blue-400/50 hover:glow-blue-sm transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <Receipt className="h-5 w-5 text-blue-400" />
                        <div>
                          <p className="font-bold text-white">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-white/60">
                            {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center px-4">
                      <p className="text-white/60 text-xs">Amount</p>
                      <p className="font-bold text-white">${(invoice.total || invoice.amount || 0).toFixed(2)}</p>
                    </div>
                    
                    <div className="text-center px-4">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        invoice.status === 'paid' 
                          ? 'bg-green-500/20 text-green-400'
                          : invoice.status === 'overdue'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {invoice.status?.toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="btn-glass p-2 rounded-2xl"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => downloadInvoicePDF(invoice.id)}
                        className="btn-glass p-2 rounded-2xl"
                        title="Download Invoice"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {invoice.status !== 'paid' && (
                        <Button
                          onClick={() => handlePayInvoice(invoice)}
                          className="btn-glow px-4 py-2 rounded-2xl text-sm"
                        >
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invoice Details Modal */}
        {selectedInvoice && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass rounded-2xl p-8 border border-blue-400 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Invoice Details</h2>
                <Button
                  onClick={() => setSelectedInvoice(null)}
                  className="btn-glass p-2 rounded-2xl"
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/60 text-sm">Invoice Number</label>
                    <p className="text-white font-bold">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <label className="text-white/60 text-sm">Status</label>
                    <p className={`font-bold ${
                      selectedInvoice.status === 'paid' 
                        ? 'text-green-400' 
                        : selectedInvoice.status === 'overdue'
                          ? 'text-red-400'
                          : 'text-orange-400'
                    }`}>
                      {selectedInvoice.status?.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <label className="text-white/60 text-sm">Issue Date</label>
                    <p className="text-white">{selectedInvoice.issueDate ? new Date(selectedInvoice.issueDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-white/60 text-sm">Due Date</label>
                    <p className="text-white">{selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
                
                <div className="border-t border-blue-400/30 pt-4">
                  <label className="text-white/60 text-sm">Amount</label>
                  <p className="text-3xl font-bold text-white">${(selectedInvoice.total || selectedInvoice.amount || 0).toFixed(2)}</p>
                </div>
                
                {selectedInvoice.notes && (
                  <div>
                    <label className="text-white/60 text-sm">Notes</label>
                    <p className="text-white">{selectedInvoice.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-8 flex justify-end space-x-4">
                <Button
                  onClick={() => setSelectedInvoice(null)}
                  className="btn-glass px-6 py-2 rounded-2xl"
                >
                  Close
                </Button>
                <Button
                  onClick={() => downloadInvoicePDF(selectedInvoice.id)}
                  className="btn-glass px-6 py-2 rounded-2xl"
                >
                  Download PDF
                </Button>
                {selectedInvoice.status !== 'paid' && (
                  <Button
                    onClick={() => handlePayInvoice(selectedInvoice)}
                    className="btn-glow px-6 py-2 rounded-2xl"
                  >
                    Pay Now
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}