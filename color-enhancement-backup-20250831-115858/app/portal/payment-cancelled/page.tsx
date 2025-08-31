'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { UnifiedLayout, UnifiedCard, UnifiedButton } from '@/components/ui/unified-layout';
import { XCircle, ArrowLeft, RotateCcw, HelpCircle, CreditCard, Loader2, Phone, Mail } from 'lucide-react';

function PaymentCancelledContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
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

  const retryPayment = () => {
    if (payment?.invoice_id) {
      router.push(`/portal/pay?invoice=${payment.invoice_id}`);
    } else {
      router.push('/portal/pay');
    }
  };

  if (isLoading) {
    return (
      <UnifiedLayout
        title="Payment Cancelled"
        subtitle="Loading..."
        showBackButton={true}
        backHref="/portal/pay"
        showUserActions={true}
      >
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-white/60">Loading...</p>
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout
      title="Payment Cancelled"
      subtitle="Your payment was cancelled"
      showBackButton={true}
      backHref="/portal/pay"
      showUserActions={true}
    >
      <div className="max-w-4xl mx-auto px-4 py-16">
        <UnifiedCard className="text-center bg-yellow-600/10 border-yellow-500/30">
          {/* Cancelled Icon */}
          <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-full p-4 w-16 h-16 mx-auto mb-6">
            <XCircle className="h-8 w-8 text-yellow-400" />
          </div>

          {/* Cancellation Message */}
          <h1 className="text-3xl font-bold text-white mb-2">
            Payment Cancelled
          </h1>
          <p className="text-lg text-white/70 mb-8">
            Your payment was cancelled and no charges were made to your account.
          </p>

            {/* Payment Details (if available) */}
            {payment && (
              <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Information
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-semibold">${payment.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="text-red-600 font-medium">Cancelled</span>
                  </div>
                  {payment.invoice && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Invoice:</span>
                      <span>#{payment.invoice.invoice_number}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Why was it cancelled? */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
              <h3 className="font-medium text-yellow-800 mb-2 flex items-center">
                <HelpCircle className="h-5 w-5 mr-2" />
                Why was my payment cancelled?
              </h3>
              <div className="text-sm text-yellow-700 text-left">
                <p className="mb-2">Common reasons for payment cancellation:</p>
                <ul className="space-y-1 text-xs">
                  <li>• You clicked the back button or closed the payment window</li>
                  <li>• Payment took too long to complete</li>
                  <li>• You chose to cancel during the payment process</li>
                  <li>• Browser or network connection issues</li>
                </ul>
              </div>
            </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <UnifiedButton
              onClick={retryPayment}
              className="w-full"
              variant="primary"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Try Payment Again
            </UnifiedButton>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/portal/dashboard">
                <UnifiedButton variant="secondary" className="flex items-center">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return to Dashboard
                </UnifiedButton>
              </Link>
              <UnifiedButton variant="outline" className="flex items-center">
                <Phone className="mr-2 h-4 w-4" />
                (253) 278-8692
              </UnifiedButton>
            </div>
          </div>
        </UnifiedCard>
      </div>
    </UnifiedLayout>
  );
}

export default function PaymentCancelledPage() {
  return (
    <Suspense fallback={
      <UnifiedLayout
        title="Payment Cancelled"
        subtitle="Loading..."
        showBackButton={true}
        backHref="/portal/pay"
        showUserActions={true}
      >
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-white/60">Loading...</p>
        </div>
      </UnifiedLayout>
    }>
      <PaymentCancelledContent />
    </Suspense>
  );
}