'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  FileText,
  Edit,
  Plus,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  deviceType: string;
  lastTested: string;
  nextDue: string;
  status: 'active' | 'overdue' | 'upcoming';
}

interface TestReport {
  id: string;
  date: string;
  result: 'pass' | 'fail';
  notes: string;
  technician: string;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [testReports, setTestReports] = useState<TestReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        
        // Fetch customer data from API
        const response = await fetch(`/api/customers/${customerId}`);
        if (!response.ok) {
          throw new Error('Customer not found');
        }
        const customerData = await response.json();
        
        // Transform API data to match component expectations
        const transformedCustomer: Customer = {
          id: customerData.id,
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          address: customerData.address,
          deviceType: customerData.devices?.[0]?.device_type || 'No devices',
          lastTested: customerData.devices?.[0]?.last_test_date || 'Never',
          nextDue: customerData.devices?.[0]?.next_test_due || 'Unknown',
          status: customerData.status === 'active' ? 'active' : 'inactive'
        };
        
        setCustomer(transformedCustomer);
        
        // TODO: Fetch test reports from API
        // For now, using empty array
        setTestReports([]);
        
      } catch (error) {
        console.error('Error fetching customer:', error);
        // Handle error - could set an error state
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white/80 mb-4">Customer Not Found</h1>
          <Link href="/team-portal/customers">
            <Button>Back to Customers</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="glass glow-blue-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/team-portal/customers">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-white/80">{customer.name}</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Link href={`/team-portal/customers/${customerId}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Link href={`/team-portal/test-report?customer=${customerId}`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Test
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Customer Info */}
          <div className="lg:col-span-1">
            <div className="glass rounded-2xl glow-blue-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-white/80 mr-3" />
                  <span>{customer.phone}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-white/80 mr-3" />
                  <span>{customer.email}</span>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 text-white/80 mr-3 mt-1" />
                  <span>{customer.address}</span>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl glow-blue-sm p-6 mt-6">
              <h2 className="text-lg font-semibold mb-4">Device Information</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Type:</span> {customer.deviceType}</p>
                <p><span className="font-medium">Last Tested:</span> {customer.lastTested}</p>
                <p><span className="font-medium">Next Due:</span> {customer.nextDue}</p>
                <div className="flex items-center mt-2">
                  {customer.status === 'active' ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
                  )}
                  <span className="capitalize">{customer.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Test Reports */}
          <div className="lg:col-span-2">
            <div className="glass rounded-2xl glow-blue-sm">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Test History</h2>
                  <Link href={`/team-portal/test-report?customer=${customerId}`}>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Test Report
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {testReports.length === 0 ? (
                  <div className="text-center py-8 text-white/80">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-white/80" />
                    <p>No test reports yet</p>
                    <Link href={`/team-portal/test-report?customer=${customerId}`}>
                      <Button className="mt-4">Create First Report</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {testReports.map((report) => (
                      <div key={report.id} className="border rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-white/80 mr-2" />
                            <span className="font-medium">{report.date}</span>
                            <div className={`ml-3 px-2 py-1 rounded-full text-xs ${
                              report.result === 'pass' ? 'bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/20 border border-green-400 glow-blue-sm text-green-300' : 'bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl/20 border border-red-400 glow-blue-sm text-red-300'
                            }`}>
                              {report.result.toUpperCase()}
                            </div>
                          </div>
                          <span className="text-sm text-white/80">by {report.technician}</span>
                        </div>
                        <p className="text-white/80">{report.notes}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}