'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  CreditCard,
  DollarSign,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  User,
  Building,
  Phone,
  Mail,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Shield,
  Banknote,
  FileText,
  Download
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  name: string;
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  services: {
    description: string;
    amount: number;
  }[];
  tax: number;
  total: number;
}

export default function PaymentPage() {
  const router = useRouter();
  
  // Safe searchParams access for SSR compatibility
  let invoiceId = '';
  try {
    const searchParams = useSearchParams();
    invoiceId = searchParams?.get('invoice') || '';
  } catch (error) {
    // Fallback for SSR
    console.log('SearchParams not available during SSR');
  }
  
  const [paymentStep, setPaymentStep] = useState<'lookup' | 'invoice' | 'payment' | 'success'>('lookup');
  const [lookupMethod, setLookupMethod] = useState<'invoice' | 'phone' | 'email'>('invoice');
  const [lookupValue, setLookupValue] = useState('');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'new_card' | 'saved_card' | 'bank'>('new_card');
  const [savedMethods, setSavedMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCardCVV, setShowCardCVV] = useState(false);
  
  const [cardForm, setCardForm] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: '',
    zip: ''
  });

  const [bankForm, setBankForm] = useState({
    routingNumber: '',
    accountNumber: '',
    accountType: 'checking' as 'checking' | 'savings',
    accountName: ''
  });

  useEffect(() => {
    // Load sample data
    const sampleInvoices: Invoice[] = [
      {
        id: 'inv-1',
        invoiceNumber: 'INV-2024-125',
        date: '2024-08-20',
        dueDate: '2024-09-19',
        amount: 85.00,
        description: 'Annual Backflow Test - PVB Device',
        customerName: 'John Smith',
        customerEmail: 'john.smith@gmail.com',
        customerPhone: '(253) 555-0124',
        services: [
          { description: 'Annual Backflow Test - PVB Device', amount: 85.00 }
        ],
        tax: 7.65,
        total: 92.65
      },
      {
        id: 'inv-2',
        invoiceNumber: 'INV-2024-126',
        date: '2024-08-22',
        dueDate: '2024-09-21',
        amount: 170.00,
        description: 'Device Repair & Test',
        customerName: 'John Smith',
        customerEmail: 'john.smith@gmail.com',
        customerPhone: '(253) 555-0124',
        services: [
          { description: 'Relief Valve Repair', amount: 150.00 },
          { description: 'Re-test After Repair', amount: 85.00 }
        ],
        tax: 21.15,
        total: 235.00
      }
    ];

    const samplePaymentMethods: PaymentMethod[] = [
      {
        id: 'card-1',
        type: 'card',
        name: 'Visa ending in 4242',
        last4: '4242',
        expiryMonth: 12,
        expiryYear: 2027,
        isDefault: true
      },
      {
        id: 'bank-1',
        type: 'bank',
        name: 'Checking ****1234',
        last4: '1234',
        isDefault: false
      }
    ];

    setInvoices(sampleInvoices);
    setSavedMethods(samplePaymentMethods);

    // If invoice ID provided, jump to invoice view
    if (invoiceId) {
      const foundInvoice = sampleInvoices.find(inv => inv.id === invoiceId);
      if (foundInvoice) {
        setSelectedInvoices([invoiceId]);
        setPaymentStep('payment');
      }
    }
  }, [invoiceId]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate finding invoices
      const customerInvoices = invoices.filter(inv => 
        (lookupMethod === 'invoice' && inv.invoiceNumber.toLowerCase().includes(lookupValue.toLowerCase())) ||
        (lookupMethod === 'phone' && inv.customerPhone.includes(lookupValue)) ||
        (lookupMethod === 'email' && inv.customerEmail.toLowerCase().includes(lookupValue.toLowerCase()))
      );

      if (customerInvoices.length > 0) {
        setSelectedInvoices(customerInvoices.map(inv => inv.id));
        setPaymentStep('invoice');
      } else {
        alert('No invoices found. Please check your information and try again.');
      }
    } catch (error) {
      alert('Error looking up invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate payment processing
      console.log('Processing payment:', {
        invoices: selectedInvoices,
        paymentMethod,
        cardForm: paymentMethod === 'new_card' ? cardForm : null,
        bankForm: paymentMethod === 'bank' ? bankForm : null
      });
      
      setPaymentStep('success');
    } catch (error) {
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{4})(?=\d)/g, '$1 ').trim().substring(0, 19);
  };

  const formatExpiry = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    return `${numbers.substring(0, 2)}/${numbers.substring(2, 4)}`;
  };

  const selectedInvoiceData = invoices.filter(inv => selectedInvoices.includes(inv.id));
  const totalAmount = selectedInvoiceData.reduce((sum, inv) => sum + inv.total, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            {paymentStep !== 'lookup' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (paymentStep === 'success') {
                    router.push('/portal/dashboard');
                  } else {
                    setPaymentStep(paymentStep === 'payment' ? 'invoice' : 'lookup');
                  }
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <Link href="/" className="flex items-center space-x-2">
                <div className="text-xl font-bold text-gray-900">
                  Fisher <span className="text-blue-600">Backflows</span>
                </div>
              </Link>
              <div className="text-sm text-gray-600">Secure Payment Portal</div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4">
        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          {['lookup', 'invoice', 'payment', 'success'].map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                paymentStep === step ? 'bg-blue-600 text-white' :
                ['lookup', 'invoice', 'payment', 'success'].indexOf(paymentStep) > index ? 'bg-green-600 text-white' :
                'bg-gray-200 text-gray-600'
              }`}>
                {['lookup', 'invoice', 'payment', 'success'].indexOf(paymentStep) > index ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  index + 1
                )}
              </div>
              {index < 3 && (
                <div className={`w-16 h-1 mx-2 ${
                  ['lookup', 'invoice', 'payment', 'success'].indexOf(paymentStep) > index ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Lookup Step */}
        {paymentStep === 'lookup' && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center mb-8">
                <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4">
                  <CreditCard className="h-10 w-10 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Pay Your Bill</h1>
                <p className="text-gray-600">Enter your information to find and pay outstanding invoices</p>
              </div>

              <form onSubmit={handleLookup} className="space-y-6">
                {/* Lookup Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Find your bill by:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'invoice', label: 'Invoice #', icon: FileText },
                      { key: 'phone', label: 'Phone', icon: Phone },
                      { key: 'email', label: 'Email', icon: Mail }
                    ].map(method => {
                      const Icon = method.icon;
                      return (
                        <button
                          key={method.key}
                          type="button"
                          onClick={() => setLookupMethod(method.key as any)}
                          className={`flex flex-col items-center space-y-1 p-3 rounded-lg border transition-colors ${
                            lookupMethod === method.key
                              ? 'border-blue-600 bg-blue-50 text-blue-600'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-sm font-medium">{method.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Lookup Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {lookupMethod === 'invoice' ? 'Invoice Number' :
                     lookupMethod === 'phone' ? 'Phone Number' : 'Email Address'}
                  </label>
                  <input
                    type={lookupMethod === 'email' ? 'email' : 'text'}
                    required
                    className="form-input"
                    placeholder={
                      lookupMethod === 'invoice' ? 'INV-2024-125' :
                      lookupMethod === 'phone' ? '(253) 555-0123' :
                      'john@example.com'
                    }
                    value={lookupValue}
                    onChange={(e) => setLookupValue(e.target.value)}
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Searching...' : 'Find My Bills'}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Invoice Selection Step */}
        {paymentStep === 'invoice' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Outstanding Invoices</h2>
              
              <div className="space-y-4 mb-8">
                {selectedInvoiceData.map(invoice => (
                  <div key={invoice.id} className="border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{invoice.invoiceNumber}</h3>
                        <p className="text-gray-600">{invoice.description}</p>
                        <p className="text-sm text-gray-500">
                          Issued: {new Date(invoice.date).toLocaleDateString()} • 
                          Due: {new Date(invoice.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatCurrency(invoice.total)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {invoice.services.map((service, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{service.description}</span>
                          <span>{formatCurrency(service.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm border-t pt-2">
                        <span>Tax</span>
                        <span>{formatCurrency(invoice.tax)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Total</span>
                        <span>{formatCurrency(invoice.total)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total Amount Due:</span>
                  <span className="text-2xl font-bold text-blue-600">{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => setPaymentStep('lookup')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={() => setPaymentStep('payment')}
                  className="flex-1"
                >
                  Proceed to Payment
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Step */}
        {paymentStep === 'payment' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Information</h2>
              
              {/* Payment Summary */}
              <div className="bg-blue-50 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-2">Payment Summary</h3>
                <div className="space-y-1">
                  {selectedInvoiceData.map(invoice => (
                    <div key={invoice.id} className="flex justify-between text-sm">
                      <span>{invoice.invoiceNumber}</span>
                      <span>{formatCurrency(invoice.total)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total Payment:</span>
                      <span className="text-blue-600">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handlePayment} className="space-y-6">
                {/* Payment Method Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Payment Method
                  </label>
                  <div className="space-y-3">
                    {savedMethods.length > 0 && savedMethods.map(method => (
                      <label key={method.id} className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={paymentMethod === method.id}
                          onChange={() => setPaymentMethod(method.id)}
                          className="h-4 w-4 text-blue-600"
                        />
                        <div className="flex items-center space-x-3">
                          {method.type === 'card' ? (
                            <CreditCard className="h-6 w-6 text-gray-400" />
                          ) : (
                            <Building className="h-6 w-6 text-gray-400" />
                          )}
                          <div>
                            <div className="font-medium">{method.name}</div>
                            {method.isDefault && (
                              <div className="text-sm text-green-600">Default</div>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                    
                    <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="new_card"
                        checked={paymentMethod === 'new_card'}
                        onChange={() => setPaymentMethod('new_card')}
                        className="h-4 w-4 text-blue-600"
                      />
                      <CreditCard className="h-6 w-6 text-gray-400" />
                      <span className="font-medium">New Credit/Debit Card</span>
                    </label>
                    
                    <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank"
                        checked={paymentMethod === 'bank'}
                        onChange={() => setPaymentMethod('bank')}
                        className="h-4 w-4 text-blue-600"
                      />
                      <Building className="h-6 w-6 text-gray-400" />
                      <span className="font-medium">Bank Account (ACH)</span>
                    </label>
                  </div>
                </div>

                {/* Credit Card Form */}
                {paymentMethod === 'new_card' && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Card Information</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="1234 5678 9012 3456"
                        value={cardForm.number}
                        onChange={(e) => setCardForm(prev => ({
                          ...prev,
                          number: formatCardNumber(e.target.value)
                        }))}
                        maxLength={19}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          placeholder="MM/YY"
                          value={cardForm.expiry}
                          onChange={(e) => setCardForm(prev => ({
                            ...prev,
                            expiry: formatExpiry(e.target.value)
                          }))}
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CVV
                        </label>
                        <div className="relative">
                          <input
                            type={showCardCVV ? 'text' : 'password'}
                            required
                            className="form-input pr-10"
                            placeholder="123"
                            value={cardForm.cvv}
                            onChange={(e) => setCardForm(prev => ({
                              ...prev,
                              cvv: e.target.value.replace(/\D/g, '').substring(0, 4)
                            }))}
                            maxLength={4}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowCardCVV(!showCardCVV)}
                          >
                            {showCardCVV ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="John Smith"
                        value={cardForm.name}
                        onChange={(e) => setCardForm(prev => ({
                          ...prev,
                          name: e.target.value
                        }))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="98406"
                        value={cardForm.zip}
                        onChange={(e) => setCardForm(prev => ({
                          ...prev,
                          zip: e.target.value.replace(/\D/g, '').substring(0, 5)
                        }))}
                        maxLength={5}
                      />
                    </div>
                  </div>
                )}

                {/* Bank Account Form */}
                {paymentMethod === 'bank' && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Bank Account Information</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Type
                      </label>
                      <select
                        className="form-select"
                        value={bankForm.accountType}
                        onChange={(e) => setBankForm(prev => ({
                          ...prev,
                          accountType: e.target.value as 'checking' | 'savings'
                        }))}
                      >
                        <option value="checking">Checking</option>
                        <option value="savings">Savings</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Routing Number
                      </label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="123456789"
                        value={bankForm.routingNumber}
                        onChange={(e) => setBankForm(prev => ({
                          ...prev,
                          routingNumber: e.target.value.replace(/\D/g, '').substring(0, 9)
                        }))}
                        maxLength={9}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Number
                      </label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="12345678901234"
                        value={bankForm.accountNumber}
                        onChange={(e) => setBankForm(prev => ({
                          ...prev,
                          accountNumber: e.target.value.replace(/\D/g, '').substring(0, 17)
                        }))}
                        maxLength={17}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Holder Name
                      </label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="John Smith"
                        value={bankForm.accountName}
                        onChange={(e) => setBankForm(prev => ({
                          ...prev,
                          accountName: e.target.value
                        }))}
                      />
                    </div>
                  </div>
                )}

                {/* Security Notice */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <div className="text-sm text-green-800">
                      <strong>Secure Payment:</strong> Your payment information is encrypted and processed securely. We never store your payment details.
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => setPaymentStep('invoice')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit"
                    disabled={loading}
                    className="flex-1"
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    {loading ? 'Processing...' : `Pay ${formatCurrency(totalAmount)}`}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Success Step */}
        {paymentStep === 'success' && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
              <p className="text-gray-600 mb-6">
                Your payment of {formatCurrency(totalAmount)} has been processed successfully.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-600 mb-2">Transaction Details:</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Transaction ID:</span>
                    <span className="font-mono">TXN-{Date.now().toString().slice(-6)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Date:</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Amount:</span>
                    <span className="font-semibold">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <Button className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download Receipt
                </Button>
                
                <div className="flex space-x-4">
                  <Button variant="outline" className="flex-1" asChild>
                    <Link href="/portal/dashboard">
                      View Account
                    </Link>
                  </Button>
                  <Button variant="outline" className="flex-1" asChild>
                    <Link href="/">
                      Return Home
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Security Footer */}
      <footer className="mt-16 bg-gray-800 text-white py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-5 w-5" />
            <span className="font-semibold">Your Security is Our Priority</span>
          </div>
          <p className="text-sm text-gray-300">
            This payment portal uses bank-level 256-bit SSL encryption to protect your personal and financial information.
          </p>
        </div>
      </footer>
    </div>
  );
}