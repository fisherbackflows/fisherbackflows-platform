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
import { PortalNavigation } from '@/components/navigation/UnifiedNavigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function CustomerBillingPage() {
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

      <PortalNavigation userInfo={{
        name: customer?.name,
        email: customer?.email,
        accountNumber: customer?.accountNumber
      }} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">

        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-white">Billing & Payments</h1>
              <p className="text-white/90 text-base sm:text-lg">Manage your invoices and payment methods</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-white/60 text-sm">Current Balance</p>
              <p className={`text-2xl sm:text-3xl font-bold ${balance > 0 ? 'text-orange-200' : 'text-green-200'}`}>
                ${balance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="glass rounded-2xl p-4 sm:p-6 border border-blue-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Invoices</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{invoices.length}</p>
              </div>
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
            </div>
          </div>
          
          <div className="glass rounded-2xl p-4 sm:p-6 border border-blue-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Pending</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-200">{pendingInvoices.length}</p>
              </div>
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-200" />
            </div>
          </div>
          
          <div className="glass rounded-2xl p-4 sm:p-6 border border-blue-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Paid</p>
                <p className="text-xl sm:text-2xl font-bold text-green-200">{paidInvoices.length}</p>
              </div>
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-200" />
            </div>
          </div>
        </div>

        {/* Invoices Section */}
        <div className="glass rounded-2xl p-4 sm:p-6 border border-blue-400">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Recent Invoices</h2>
          
          {invoices.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Receipt className="h-12 w-12 sm:h-16 sm:w-16 text-blue-400 mx-auto mb-4" />
              <p className="text-white/60">No invoices found</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="glass rounded-2xl p-3 sm:p-4 border border-blue-400/50 hover:glow-blue-sm transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white truncate">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-white/60">
                            {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-center gap-4">
                      <div className="text-center sm:px-4">
                        <p className="text-white/60 text-xs">Amount</p>
                        <p className="font-bold text-white">${(invoice.total || invoice.amount || 0).toFixed(2)}</p>
                      </div>
                      
                      <div className="text-center sm:px-4">
                        <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${
                          invoice.status === 'paid' 
                            ? 'bg-green-500/20 text-green-200'
                            : invoice.status === 'overdue'
                              ? 'bg-red-500/20 text-red-200'
                              : 'bg-orange-500/20 text-orange-200'
                        }`}>
                          {invoice.status?.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 sm:ml-4 justify-center sm:justify-start">
                      <Button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="btn-glass p-2 rounded-2xl flex-shrink-0"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => downloadInvoicePDF(invoice.id)}
                        className="btn-glass p-2 rounded-2xl flex-shrink-0"
                        title="Download Invoice"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {invoice.status !== 'paid' && (
                        <Button
                          onClick={() => handlePayInvoice(invoice)}
                          className="btn-glow px-3 sm:px-4 py-2 rounded-2xl text-sm"
                        >
                          <span className="hidden sm:inline">Pay Now</span>
                          <span className="sm:hidden">Pay</span>
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
            <div className="glass rounded-2xl p-4 sm:p-6 lg:p-8 border border-blue-400 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Invoice Details</h2>
                <Button
                  onClick={() => setSelectedInvoice(null)}
                  className="btn-glass p-2 rounded-2xl flex-shrink-0"
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/60 text-sm">Invoice Number</label>
                    <p className="text-white font-bold break-all">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <label className="text-white/60 text-sm">Status</label>
                    <p className={`font-bold ${
                      selectedInvoice.status === 'paid' 
                        ? 'text-green-200' 
                        : selectedInvoice.status === 'overdue'
                          ? 'text-red-200'
                          : 'text-orange-200'
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
                  <p className="text-2xl sm:text-3xl font-bold text-white">${(selectedInvoice.total || selectedInvoice.amount || 0).toFixed(2)}</p>
                </div>
                
                {selectedInvoice.notes && (
                  <div>
                    <label className="text-white/60 text-sm">Notes</label>
                    <p className="text-white break-words">{selectedInvoice.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-end gap-3 sm:space-x-4 sm:gap-0">
                <Button
                  onClick={() => setSelectedInvoice(null)}
                  className="btn-glass px-4 sm:px-6 py-2 rounded-2xl order-last sm:order-first"
                >
                  Close
                </Button>
                <Button
                  onClick={() => downloadInvoicePDF(selectedInvoice.id)}
                  className="btn-glass px-4 sm:px-6 py-2 rounded-2xl"
                >
                  <span className="hidden sm:inline">Download PDF</span>
                  <span className="sm:hidden">Download</span>
                </Button>
                {selectedInvoice.status !== 'paid' && (
                  <Button
                    onClick={() => handlePayInvoice(selectedInvoice)}
                    className="btn-glow px-4 sm:px-6 py-2 rounded-2xl"
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

export default function CustomerBillingPageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <CustomerBillingPage />
    </ErrorBoundary>
  )
}