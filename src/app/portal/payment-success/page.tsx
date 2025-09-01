'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { UnifiedLayout, UnifiedCard, UnifiedButton } from '@/components/ui/unified-layout';
import { CheckCircle, Download, Home, Receipt, Mail, Calendar, Loader2 } from 'lucide-react';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [payment, setPayment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const paymentId = searchParams?.get('payment_id');
    const sessionId = searchParams?.get('session_id');
    
    if (paymentId || sessionId) {
      fetchPaymentDetails(paymentId, sessionId);
    } else {
      setIsLoading(false);
    }
  }, [searchParams]);

  const fetchPaymentDetails = async (paymentId?: string | null, sessionId?: string | null) => {
    try {
      let url = '/api/payments/process';
      if (paymentId) {
        url += `?paymentId=${paymentId}`;
      } else if (sessionId) {
        url += `?sessionId=${sessionId}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setPayment(data.payment);
      }
    } catch (error) {
      console.error('Failed to fetch payment details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReceipt = async () => {
    if (!payment?.id) return;
    
    try {
      const response = await fetch(`/api/payments/receipt/${payment.id}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${payment.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Receipt downloaded!');
      } else {
        toast.error('Failed to download receipt');
      }
    } catch (error) {
      console.error('Receipt download error:', error);
      toast.error('Failed to download receipt');
    }
  };

  const emailReceipt = async () => {
    if (!payment?.id) return;
    
    try {
      const response = await fetch(`/api/payments/receipt/${payment.id}/email`, {
        method: 'POST'
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Receipt sent to your email!');
      } else {
        toast.error('Failed to send receipt');
      }
    } catch (error) {
      console.error('Email receipt error:', error);
      toast.error('Failed to send receipt');
    }
  };

  if (isLoading) {
    return (
      <UnifiedLayout
        title="Payment Successful"
        subtitle="Loading payment details..."
        showBackButton={true}
        backHref="/portal/dashboard"
        showUserActions={true}
      >
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-slate-700">Loading payment details...</p>
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout
      title="Payment Successful"
      subtitle="Thank you for your payment"
      showBackButton={true}
      backHref="/portal/dashboard"
      showUserActions={true}
    >
      <div className="max-w-4xl mx-auto px-4 py-16">
        <UnifiedCard className="text-center bg-green-700/10 border-green-500/30">
          {/* Success Icon */}
          <div className="bg-green-700/20 border border-green-500/30 rounded-full p-4 w-16 h-16 mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-white mb-2">
            Payment Completed Successfully!
          </h1>
          <p className="text-lg text-white/70 mb-8">
            Thank you for your payment. Your invoice has been paid in full.
          </p>

          {/* Payment Details */}
          {payment && (
            <div className="bg-gray-800/50 rounded-lg p-6 mb-8 text-left">
              <h2 className="font-semibold text-white mb-4 flex items-center">
                <Receipt className="h-5 w-5 mr-2" />
                Payment Details
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-700">Amount Paid:</span>
                  <span className="font-semibold text-green-400 text-lg">
                    ${payment.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">Transaction ID:</span>
                  <span className="font-mono text-sm text-slate-800">
                    {payment.transaction_id || payment.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">Date:</span>
                  <span className="text-slate-800">{new Date(payment.processed_at || payment.created_at).toLocaleDateString()}</span>
                </div>
                {payment.invoice && (
                  <div className="flex justify-between">
                    <span className="text-slate-700">Invoice:</span>
                    <span className="text-slate-800">#{payment.invoice.invoice_number}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-700">Payment Method:</span>
                  <span className="capitalize text-slate-800">
                    {payment.payment_method || 'Card'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            {payment?.receipt_url && (
              <UnifiedButton
                className="w-full"
                onClick={downloadReceipt}
                variant="primary"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Receipt
              </UnifiedButton>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <UnifiedButton
                variant="outline"
                onClick={emailReceipt}
                className="flex items-center"
              >
                <Mail className="mr-2 h-4 w-4" />
                Email Receipt
              </UnifiedButton>
              <Link href="/portal/dashboard">
                <UnifiedButton variant="secondary" className="flex items-center">
                  <Home className="mr-2 h-4 w-4" />
                  Return to Dashboard
                </UnifiedButton>
              </Link>
            </div>
          </div>

          {/* Important Notes */}
          <div className="mt-8 p-4 bg-blue-700/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-start space-x-2">
              <Calendar className="h-5 w-5 text-blue-400 mt-0.5" />
              <div className="text-sm text-slate-800 text-left">
                <h3 className="font-medium mb-1 text-white">What happens next?</h3>
                <ul className="space-y-1 text-xs">
                  <li>• You'll receive an email confirmation shortly</li>
                  <li>• Your invoice status has been updated to "Paid"</li>
                  <li>• A receipt has been generated for your records</li>
                  {payment?.payment_method === 'bank' && (
                    <li>• ACH payments may take 3-5 business days to clear</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <p className="text-sm text-slate-700 mt-6">
            Questions about your payment?{' '}
            <Link href="/portal/help" className="text-blue-400 hover:text-blue-300 underline">
              Contact Support
            </Link>
          </p>
        </UnifiedCard>

        {/* Security Notice */}
        <div className="mt-8 text-center text-sm text-white/50">
          <p>🔒 This transaction was processed securely through Fisher Backflows</p>
          <p>Your payment information was encrypted and never stored on our servers</p>
        </div>
      </div>
    </UnifiedLayout>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <UnifiedLayout
        title="Payment Successful"
        subtitle="Loading..."
        showBackButton={true}
        backHref="/portal/dashboard"
        showUserActions={true}
      >
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-slate-700">Loading...</p>
        </div>
      </UnifiedLayout>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}