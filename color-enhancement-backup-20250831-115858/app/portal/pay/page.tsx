'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { UnifiedLayout, UnifiedCard, UnifiedButton } from '@/components/ui/unified-layout';
import { 
  CreditCard,
  DollarSign,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  Lock,
  Mail,
  Phone,
  Building,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  description: string;
  status: 'overdue' | 'due' | 'paid';
}

function PaymentPageContent() {
  const searchParams = useSearchParams();
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Sample invoices - replace with actual data
  const invoices: Invoice[] = [
    {
      id: '1',
      invoiceNumber: 'INV-2024-125',
      date: '2024-08-20',
      dueDate: '2024-09-19',
      amount: 85.00,
      description: 'Annual Backflow Test - PVB Device',
      status: 'due'
    },
    {
      id: '2',
      invoiceNumber: 'INV-2024-126',
      date: '2024-08-22',
      dueDate: '2024-09-21',
      amount: 170.00,
      description: 'Device Repair & Test',
      status: 'overdue'
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleQuickPayment = async (invoiceId: string) => {
    setIsLoading(true);
    
    try {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (!invoice) return;

      // Create Stripe checkout session
      const response = await fetch('/api/payments/test-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: invoice.amount,
          description: invoice.description,
          successUrl: `${window.location.origin}/portal/payment-success`,
          cancelUrl: `${window.location.origin}/portal/payment-cancelled`
        })
      });

      const data = await response.json();

      if (data.success && data.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UnifiedLayout
      title="Make a Payment"
      subtitle="Pay your outstanding invoices securely online"
      showBackButton={true}
      backHref="/portal/dashboard"
      showUserActions={true}
    >
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        
        {/* Outstanding Invoices */}
        <UnifiedCard>
          <div className="flex items-center mb-6">
            <FileText className="h-6 w-6 text-blue-400 mr-3" />
            <h2 className="text-xl font-semibold text-white">Outstanding Invoices</h2>
          </div>
          
          {invoices.length > 0 ? (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className={`border rounded-lg p-6 transition-all cursor-pointer ${
                    selectedInvoice === invoice.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  onClick={() => setSelectedInvoice(selectedInvoice === invoice.id ? null : invoice.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium text-white">{invoice.invoiceNumber}</h3>
                      <p className="text-white/70">{invoice.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-white/60">
                        <span>Issued: {new Date(invoice.date).toLocaleDateString()}</span>
                        <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-2xl font-bold text-white">
                        {formatCurrency(invoice.amount)}
                      </p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          invoice.status === 'overdue'
                            ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                            : 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30'
                        }`}
                      >
                        {invoice.status === 'overdue' ? 'Overdue' : 'Due'}
                      </span>
                    </div>
                  </div>
                  
                  {selectedInvoice === invoice.id && (
                    <div className="mt-6 pt-6 border-t border-gray-600">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-blue-400">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span className="text-sm">Selected for payment</span>
                        </div>
                        <UnifiedButton
                          onClick={() => handleQuickPayment(invoice.id)}
                          disabled={isLoading}
                          className="flex items-center"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <DollarSign className="h-4 w-4 mr-2" />
                              Pay {formatCurrency(invoice.amount)}
                            </>
                          )}
                        </UnifiedButton>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-white/60">No outstanding invoices</p>
              <p className="text-white/40 text-sm mt-1">All payments are up to date!</p>
            </div>
          )}
        </UnifiedCard>

        {/* Payment Methods */}
        <div className="grid md:grid-cols-2 gap-8">
          <UnifiedCard>
            <div className="flex items-center mb-6">
              <CreditCard className="h-6 w-6 text-blue-400 mr-3" />
              <h2 className="text-xl font-semibold text-white">Credit Card Payment</h2>
            </div>
            <div className="space-y-4">
              <p className="text-white/70">
                Pay instantly with your credit or debit card. Secure processing through Stripe.
              </p>
              <div className="flex items-center space-x-2 text-sm text-white/60">
                <Lock className="h-4 w-4" />
                <span>256-bit SSL encryption</span>
              </div>
              <UnifiedButton className="w-full" variant="primary">
                Pay with Card
              </UnifiedButton>
            </div>
          </UnifiedCard>

          <UnifiedCard>
            <div className="flex items-center mb-6">
              <Building className="h-6 w-6 text-blue-400 mr-3" />
              <h2 className="text-xl font-semibold text-white">Bank Transfer</h2>
            </div>
            <div className="space-y-4">
              <p className="text-white/70">
                Lower fees with ACH bank transfer. Takes 3-5 business days to process.
              </p>
              <div className="text-sm text-white/60">
                <p>Fee: 0.8% (capped at $5.00)</p>
              </div>
              <UnifiedButton className="w-full" variant="secondary">
                Pay with Bank Account
              </UnifiedButton>
            </div>
          </UnifiedCard>
        </div>

        {/* Payment Security */}
        <UnifiedCard className="bg-green-600/10 border-green-500/30">
          <div className="flex items-start space-x-4">
            <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-3">
              <Shield className="h-6 w-6 text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-white mb-2">Secure Payment Processing</h3>
              <p className="text-white/70 mb-4">
                All payments are processed securely through Stripe. We never store your payment 
                information on our servers. Your data is encrypted and transmitted directly to 
                Stripe's PCI-compliant servers.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-white/60">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  PCI DSS Compliant
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  256-bit SSL Encryption
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  Fraud Protection
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  Instant Receipts
                </div>
              </div>
            </div>
          </div>
        </UnifiedCard>

        {/* Need Help */}
        <UnifiedCard>
          <div className="text-center">
            <h3 className="text-lg font-medium text-white mb-4">Need Help?</h3>
            <p className="text-white/70 mb-6">
              If you're having trouble making a payment or have questions about your bill, 
              we're here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <UnifiedButton variant="outline" className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                (253) 278-8692
              </UnifiedButton>
              <UnifiedButton variant="outline" className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                Email Support
              </UnifiedButton>
            </div>
          </div>
        </UnifiedCard>
      </div>
    </UnifiedLayout>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <UnifiedLayout
        title="Make a Payment"
        subtitle="Loading payment portal..."
        showBackButton={true}
        backHref="/portal/dashboard"
      >
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-white/60">Loading payment options...</p>
        </div>
      </UnifiedLayout>
    }>
      <PaymentPageContent />
    </Suspense>
  );
}