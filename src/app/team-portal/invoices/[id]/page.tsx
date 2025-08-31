'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Edit,
  Download,
  Send,
  DollarSign,
  Calendar,
  User,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface Invoice {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  date: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockInvoice: Invoice = {
      id: invoiceId,
      number: `INV-${invoiceId.padStart(4, '0')}`,
      customerId: '1',
      customerName: 'John Smith',
      customerEmail: 'john.smith@example.com',
      customerAddress: '123 Main St\nTacoma, WA 98401',
      date: '2024-03-15',
      dueDate: '2024-04-14',
      status: Math.random() > 0.5 ? 'sent' : 'paid',
      items: [
        {
          description: 'Annual Backflow Preventer Testing',
          quantity: 1,
          rate: 85.00,
          amount: 85.00
        }
      ],
      subtotal: 85.00,
      tax: 8.33,
      total: 93.33,
      notes: 'Annual testing completed successfully. Device is functioning properly.'
    };

    setInvoice(mockInvoice);
    setLoading(false);
  }, [invoiceId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-900';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'sent': return <Send className="h-4 w-4" />;
      case 'overdue': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invoice Not Found</h1>
          <Link href="/app/invoices">
            <Button>Back to Invoices</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/app/invoices">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{invoice.number}</h1>
                <div className="flex items-center mt-1">
                  {getStatusIcon(invoice.status)}
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                    {invoice.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline">
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Link href={`/app/invoices/${invoiceId}/edit`}>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Invoice Header */}
          <div className="p-8 border-b">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Fisher Backflows</h2>
                <p className="text-gray-600">
                  Professional Backflow Testing<br />
                  Pierce County, WA<br />
                  (253) 278-8692<br />
                  service@fisherbackflows.com
                </p>
              </div>
              <div className="text-right">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">INVOICE</h3>
                <p className="text-gray-600">
                  <strong>Invoice #:</strong> {invoice.number}<br />
                  <strong>Date:</strong> {invoice.date}<br />
                  <strong>Due Date:</strong> {invoice.dueDate}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="p-8 border-b">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Bill To:</h4>
                <div className="text-gray-600">
                  <p className="font-medium">{invoice.customerName}</p>
                  <p className="whitespace-pre-line">{invoice.customerAddress}</p>
                  <p>{invoice.customerEmail}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Service Details:</h4>
                <div className="text-gray-600">
                  <div className="flex items-center mb-1">
                    <Calendar className="h-4 w-4 mr-2" />
                    Service Date: {invoice.date}
                  </div>
                  <div className="flex items-center mb-1">
                    <User className="h-4 w-4 mr-2" />
                    Customer ID: {invoice.customerId}
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Payment Due: {invoice.dueDate}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="p-8 border-b">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 font-semibold">Description</th>
                  <th className="text-center py-3 font-semibold">Qty</th>
                  <th className="text-right py-3 font-semibold">Rate</th>
                  <th className="text-right py-3 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-4">{item.description}</td>
                    <td className="py-4 text-center">{item.quantity}</td>
                    <td className="py-4 text-right">${item.rate.toFixed(2)}</td>
                    <td className="py-4 text-right">${item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="p-8">
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between py-2 border-b">
                  <span>Subtotal:</span>
                  <span>${invoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Tax (9.8%):</span>
                  <span>${invoice.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-3 font-bold text-lg">
                  <span>Total:</span>
                  <span>${invoice.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div className="mt-8 p-4 bg-white rounded-lg">
                <h4 className="font-semibold mb-2">
                  <FileText className="h-4 w-4 inline mr-2" />
                  Notes:
                </h4>
                <p className="text-gray-600">{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}