'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  User,
  CreditCard,
  Calendar,
  FileText,
  Download,
  Eye,
  Phone,
  Mail,
  MapPin,
  Bell,
  Settings,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Building2,
  LogOut,
  Shield,
  History,
  Plus,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface CustomerAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  accountNumber: string;
  customerSince: string;
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    autoPayEnabled: boolean;
    preferredContactMethod: 'email' | 'phone' | 'text';
  };
}

interface Device {
  id: string;
  type: 'RP' | 'PVB' | 'DC' | 'DCDA' | 'SVB';
  manufacturer: string;
  model: string;
  serialNumber: string;
  location: string;
  installDate: string;
  lastTestDate: string | null;
  nextTestDue: string | null;
  status: 'current' | 'due' | 'overdue';
  certificateUrl?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  description: string;
  paidDate?: string;
  paymentMethod?: string;
}

interface TestHistory {
  id: string;
  deviceId: string;
  testDate: string;
  result: 'passed' | 'failed';
  technicianName: string;
  notes: string;
  certificateUrl?: string;
}

export default function CustomerDashboardPage() {
  const [account, setAccount] = useState<CustomerAccount | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [testHistory, setTestHistory] = useState<TestHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'billing' | 'devices' | 'history'>('overview');

  useEffect(() => {
    // Load customer data
    const sampleAccount: CustomerAccount = {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@gmail.com',
      phone: '(253) 555-0124',
      address: '5678 6th Ave',
      city: 'Tacoma',
      state: 'WA',
      zip: '98406',
      accountNumber: 'FB-2023-001',
      customerSince: '2023-06-10',
      preferences: {
        emailNotifications: true,
        smsNotifications: true,
        autoPayEnabled: false,
        preferredContactMethod: 'email'
      }
    };

    const sampleDevices: Device[] = [
      {
        id: 'dev-1',
        type: 'PVB',
        manufacturer: 'Febco',
        model: '765',
        serialNumber: 'PVB-67890',
        location: 'Front Yard',
        installDate: '2018-08-15',
        lastTestDate: '2024-01-20',
        nextTestDue: '2025-01-20',
        status: 'current',
        certificateUrl: '/certificates/cert-2024-001.pdf'
      }
    ];

    const sampleInvoices: Invoice[] = [
      {
        id: 'inv-1',
        invoiceNumber: 'INV-2024-125',
        date: '2024-08-20',
        dueDate: '2024-09-19',
        amount: 92.65,
        status: 'pending',
        description: 'Annual Backflow Test - PVB Device'
      },
      {
        id: 'inv-2',
        invoiceNumber: 'INV-2024-002',
        date: '2024-01-21',
        dueDate: '2024-02-20',
        amount: 85.00,
        status: 'paid',
        description: 'Annual Backflow Test - PVB Device',
        paidDate: '2024-01-25',
        paymentMethod: 'Credit Card'
      }
    ];

    const sampleHistory: TestHistory[] = [
      {
        id: 'test-1',
        deviceId: 'dev-1',
        testDate: '2024-01-20',
        result: 'passed',
        technicianName: 'John Fisher',
        notes: 'Device operating normally, all tests passed',
        certificateUrl: '/certificates/cert-2024-001.pdf'
      },
      {
        id: 'test-2',
        deviceId: 'dev-1',
        testDate: '2023-01-15',
        result: 'passed',
        technicianName: 'John Fisher',
        notes: 'Annual test completed successfully'
      }
    ];

    setTimeout(() => {
      setAccount(sampleAccount);
      setDevices(sampleDevices);
      setInvoices(sampleInvoices);
      setTestHistory(sampleHistory);
      setLoading(false);
    }, 500);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getDeviceStatus = (device: Device) => {
    if (!device.nextTestDue) return { color: 'gray', label: 'No test scheduled' };
    
    const today = new Date();
    const dueDate = new Date(device.nextTestDue);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) return { color: 'red', label: `${Math.abs(daysUntilDue)} days overdue` };
    if (daysUntilDue <= 30) return { color: 'yellow', label: `Due in ${daysUntilDue} days` };
    return { color: 'green', label: 'Current' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!account) {
    return <div>Account not found</div>;
  }

  const pendingInvoices = invoices.filter(inv => inv.status !== 'paid');
  const totalPending = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="text-xl font-bold text-gray-900">
                  Fisher <span className="text-blue-600">Backflows</span>
                </div>
              </Link>
              <div className="hidden md:block text-gray-300">|</div>
              <div className="hidden md:block text-gray-600">Customer Portal</div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-gray-700 font-medium">{account.name}</span>
              </div>
              <Button variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2">Welcome back, {account.name.split(' ')[0]}!</h1>
              <p className="text-blue-100 mb-4">Account #{account.accountNumber}</p>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>{account.city}, {account.state}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Customer since {formatDate(account.customerSince)}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-white/20 rounded-lg p-3">
                <div className="text-sm text-blue-100">Outstanding Balance</div>
                <div className="text-2xl font-bold">
                  {totalPending > 0 ? formatCurrency(totalPending) : '$0.00'}
                </div>
                {totalPending > 0 && (
                  <Button size="sm" className="bg-white text-blue-600 hover:bg-blue-50 mt-2">
                    <CreditCard className="h-4 w-4 mr-1" />
                    Pay Now
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Button asChild className="h-auto p-4 flex-col space-y-2">
            <Link href="/portal/pay">
              <CreditCard className="h-8 w-8" />
              <span>Pay Bill</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto p-4 flex-col space-y-2">
            <Link href="/portal/schedule">
              <Calendar className="h-8 w-8" />
              <span>Schedule Test</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto p-4 flex-col space-y-2">
            <Link href="/portal/certificates">
              <FileText className="h-8 w-8" />
              <span>Certificates</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto p-4 flex-col space-y-2">
            <Link href="/portal/settings">
              <Settings className="h-8 w-8" />
              <span>Settings</span>
            </Link>
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b">
            <div className="flex space-x-8 px-6">
              {[
                { key: 'overview', label: 'Overview', icon: User },
                { key: 'billing', label: 'Billing', icon: DollarSign },
                { key: 'devices', label: 'Devices', icon: Building2 },
                { key: 'history', label: 'History', icon: History }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Device Status Overview */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Status</h3>
                  <div className="space-y-4">
                    {devices.map(device => {
                      const status = getDeviceStatus(device);
                      return (
                        <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <Building2 className="h-6 w-6 text-gray-400" />
                              <div>
                                <div className="font-medium text-gray-900">
                                  {device.type} Device - {device.location}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {device.manufacturer} {device.model} ({device.serialNumber})
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              status.color === 'green' ? 'bg-green-100 text-green-800' :
                              status.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {status.label}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Next test: {formatDate(device.nextTestDue)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {testHistory.slice(0, 3).map(test => (
                      <div key={test.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            Test Completed - {devices.find(d => d.id === test.deviceId)?.location}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDate(test.testDate)} by {test.technicianName}
                          </div>
                        </div>
                        {test.certificateUrl && (
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-1" />
                            Certificate
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Billing & Payments</h3>
                  {pendingInvoices.length > 0 && (
                    <Button asChild>
                      <Link href="/portal/pay">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay Outstanding Bills
                      </Link>
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {invoices.map(invoice => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-6 w-6 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {invoice.invoiceNumber}
                            </div>
                            <div className="text-sm text-gray-600">
                              {invoice.description}
                            </div>
                            <div className="text-sm text-gray-600">
                              Issued: {formatDate(invoice.date)} • Due: {formatDate(invoice.dueDate)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(invoice.amount)}
                        </div>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {invoice.status.toUpperCase()}
                        </div>
                        <div className="mt-2 space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {invoice.status !== 'paid' && (
                            <Button size="sm" asChild>
                              <Link href={`/portal/pay?invoice=${invoice.id}`}>
                                <CreditCard className="h-4 w-4 mr-1" />
                                Pay
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Devices Tab */}
            {activeTab === 'devices' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Your Backflow Devices</h3>
                <div className="space-y-4">
                  {devices.map(device => (
                    <div key={device.id} className="border rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {device.type} Backflow Preventer
                          </h4>
                          <p className="text-gray-600">{device.location}</p>
                        </div>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          device.status === 'current' ? 'bg-green-100 text-green-800' :
                          device.status === 'due' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {device.status.toUpperCase()}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-500">Manufacturer</div>
                          <div className="font-medium">{device.manufacturer}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Model</div>
                          <div className="font-medium">{device.model}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Serial Number</div>
                          <div className="font-medium">{device.serialNumber}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Installed</div>
                          <div className="font-medium">{formatDate(device.installDate)}</div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t">
                        <div>
                          <div className="text-sm text-gray-500">Last Tested</div>
                          <div className="font-medium">{formatDate(device.lastTestDate)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Next Test Due</div>
                          <div className="font-medium">{formatDate(device.nextTestDue)}</div>
                        </div>
                        <div className="space-x-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href="/portal/schedule">
                              <Calendar className="h-4 w-4 mr-1" />
                              Schedule
                            </Link>
                          </Button>
                          {device.certificateUrl && (
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4 mr-1" />
                              Certificate
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Test History</h3>
                <div className="space-y-4">
                  {testHistory.map(test => (
                    <div key={test.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${
                          test.result === 'passed' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {test.result === 'passed' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {devices.find(d => d.id === test.deviceId)?.location} - {test.result.toUpperCase()}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDate(test.testDate)} by {test.technicianName}
                          </div>
                          {test.notes && (
                            <div className="text-sm text-gray-500 mt-1">{test.notes}</div>
                          )}
                        </div>
                      </div>
                      {test.certificateUrl && (
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          Certificate
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}