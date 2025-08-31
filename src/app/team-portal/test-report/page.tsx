'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Save,
  Send,
  FileText,
  User,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Camera,
  Upload,
  Calendar,
  Clock,
  MapPin
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface TestResult {
  id: string;
  testName: string;
  initialPressure: string;
  finalPressure: string;
  passedTest: boolean;
  notes: string;
}

interface TestReport {
  customerId: string;
  customerName: string;
  deviceId: string;
  deviceType: 'RP' | 'PVB' | 'DC' | 'DCDA' | 'SVB';
  deviceSize: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  location: string;
  testDate: string;
  testTime: string;
  technicianName: string;
  technicianCertification: string;
  waterDistrict: string;
  testResults: TestResult[];
  overallPass: boolean;
  repairsNeeded: boolean;
  repairDescription: string;
  nextTestDate: string;
  customerSignature: string;
  technicianSignature: string;
  notes: string;
  photos: string[];
}

function TestReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<TestReport>({
    customerId: '',
    customerName: '',
    deviceId: '',
    deviceType: 'RP',
    deviceSize: '3/4"',
    manufacturer: '',
    model: '',
    serialNumber: '',
    location: '',
    testDate: new Date().toISOString().split('T')[0],
    testTime: new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    technicianName: 'John Fisher',
    technicianCertification: 'BAT-WA-12345',
    waterDistrict: 'Tacoma Water',
    testResults: [],
    overallPass: true,
    repairsNeeded: false,
    repairDescription: '',
    nextTestDate: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0],
    customerSignature: '',
    technicianSignature: '',
    notes: '',
    photos: []
  });

  const [customers] = useState([
    { id: '1', name: 'Johnson Properties LLC' },
    { id: '2', name: 'Smith Residence' },
    { id: '3', name: 'Parkland Medical Center' },
    { id: '4', name: 'Harbor View Apartments' },
    { id: '5', name: 'Downtown Deli' }
  ]);

  const deviceTypes = [
    { value: 'RP', label: 'Reduced Pressure (RP)', tests: ['Inlet Shutoff', 'First Check', 'Relief Valve', 'Second Check'] },
    { value: 'DC', label: 'Double Check (DC)', tests: ['Inlet Shutoff', 'First Check', 'Second Check'] },
    { value: 'PVB', label: 'Pressure Vacuum Breaker (PVB)', tests: ['Inlet Shutoff', 'Air Inlet', 'Check Valve'] },
    { value: 'DCDA', label: 'Double Check Detector Assembly (DCDA)', tests: ['Inlet Shutoff', 'First Check', 'Second Check', 'Bypass'] },
    { value: 'SVB', label: 'Spill-Resistant Vacuum Breaker (SVB)', tests: ['Inlet Shutoff', 'Air Inlet', 'Check Valve'] }
  ];

  const waterDistricts = [
    'Tacoma Water',
    'Lakewood Water District',
    'Puyallup Water',
    'Gig Harbor Water',
    'Pierce County Water Utility'
  ];

  // Handle searchParams after component mounts
  useEffect(() => {
    const customerId = searchParams?.get('customer');
    if (customerId) {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        setFormData(prev => ({
          ...prev,
          customerId,
          customerName: customer.name
        }));
      }
    }
  }, [searchParams]);

  // Initialize test results based on device type
  useEffect(() => {
    initializeTestResults();
  }, [formData.deviceType]);

  const initializeTestResults = () => {
    const deviceType = deviceTypes.find(d => d.value === formData.deviceType);
    if (deviceType && formData.testResults.length === 0) {
      const testResults: TestResult[] = deviceType.tests.map((testName, index) => ({
        id: `test-${index}`,
        testName,
        initialPressure: '',
        finalPressure: '',
        passedTest: true,
        notes: ''
      }));

      setFormData(prev => ({
        ...prev,
        testResults
      }));
    }
  };

  const handleInputChange = (field: keyof TestReport, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-calculate overall pass status
    if (field === 'testResults') {
      const allTestsPass = value.every((test: TestResult) => test.passedTest);
      setFormData(prev => ({
        ...prev,
        overallPass: allTestsPass
      }));
    }
  };

  const updateTestResult = (testId: string, field: keyof TestResult, value: any) => {
    const updatedResults = formData.testResults.map(test => 
      test.id === testId ? { ...test, [field]: value } : test
    );
    
    handleInputChange('testResults', updatedResults);
  };

  const handleDeviceTypeChange = (newType: string) => {
    setFormData(prev => ({
      ...prev,
      deviceType: newType as TestReport['deviceType'],
      testResults: [] // Reset test results
    }));

    // Re-initialize test results for new device type
    setTimeout(() => {
      const deviceType = deviceTypes.find(d => d.value === newType);
      if (deviceType) {
        const testResults: TestResult[] = deviceType.tests.map((testName, index) => ({
          id: `test-${index}`,
          testName,
          initialPressure: '',
          finalPressure: '',
          passedTest: true,
          notes: ''
        }));

        setFormData(prev => ({
          ...prev,
          testResults
        }));
      }
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent, action: 'draft' | 'submit' | 'district') => {
    e.preventDefault();
    setSaving(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Saving test report:', { ...formData, action });
      
      if (action === 'draft') {
        // Save as draft - don't redirect
        alert('Test report saved as draft!');
        setSaving(false);
      } else if (action === 'district') {
        // Save and create district report entry
        const districtReport = {
          reportNumber: `TR-${new Date().getFullYear()}-${Date.now().toString().slice(-3)}`,
          waterDistrict: formData.waterDistrict,
          customerId: formData.customerId,
          customerName: formData.customerName,
          testDate: formData.testDate,
          deviceType: formData.deviceType,
          deviceSerial: formData.serialNumber,
          testResult: formData.overallPass ? 'passed' : 'failed',
          technicianName: formData.technicianName,
          certificateNumber: formData.technicianCertification,
          notes: formData.notes
        };
        
        console.log('Creating district report:', districtReport);
        alert('Test report saved and sent to district reports queue!');
        router.push('/team-portal/district-reports');
      } else {
        // Regular submit
        alert('Test report saved successfully!');
        router.push('/team-portal');
      }
    } catch (error) {
      console.error('Error saving test report:', error);
      alert('Error saving test report. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const currentDeviceType = deviceTypes.find(d => d.value === formData.deviceType);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300" size="sm" asChild>
              <Link href="/app">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Test Report</h1>
              <p className="text-sm text-slate-600">
                {formData.customerName || 'New Test Report'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-4 pb-20">
        {/* Customer & Device Info */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Customer & Device
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Customer *
              </label>
              <select
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                value={formData.customerId}
                onChange={(e) => {
                  const customerId = e.target.value;
                  const customer = customers.find(c => c.id === customerId);
                  handleInputChange('customerId', customerId);
                  handleInputChange('customerName', customer?.name || '');
                }}
                required
              >
                <option value="">Select a customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Device Type *
                </label>
                <select
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                  value={formData.deviceType}
                  onChange={(e) => handleDeviceTypeChange(e.target.value)}
                  required
                >
                  {deviceTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Size *
                </label>
                <select
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                  value={formData.deviceSize}
                  onChange={(e) => handleInputChange('deviceSize', e.target.value)}
                  required
                >
                  <option value="3/4&quot;">3/4"</option>
                  <option value="1&quot;">1"</option>
                  <option value="1.5&quot;">1.5"</option>
                  <option value="2&quot;">2"</option>
                  <option value="3&quot;">3"</option>
                  <option value="4&quot;">4"</option>
                  <option value="6&quot;">6"</option>
                  <option value="8&quot;">8"</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Manufacturer
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 placeholder-slate-600"
                  value={formData.manufacturer}
                  onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                  placeholder="e.g. Watts, Zurn, Febco"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 placeholder-slate-600"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  placeholder="Model number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 placeholder-slate-600"
                  value={formData.serialNumber}
                  onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                  placeholder="Serial number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 placeholder-slate-600"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g. Front yard, Basement"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Test Details */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
            <Calendar className="h-6 w-6 mr-3" />
            Test Details
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Test Date *
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                  value={formData.testDate}
                  onChange={(e) => handleInputChange('testDate', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Test Time *
                </label>
                <input
                  type="time"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                  value={formData.testTime}
                  onChange={(e) => handleInputChange('testTime', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Water District
              </label>
              <select
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                value={formData.waterDistrict}
                onChange={(e) => handleInputChange('waterDistrict', e.target.value)}
              >
                {waterDistricts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Test Results - {currentDeviceType?.label}
          </h2>
          
          <div className="space-y-4">
            {formData.testResults.map((test, index) => (
              <div key={test.id} className="border border-gray-300 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-slate-900">
                    {index + 1}. {test.testName}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => updateTestResult(test.id, 'passedTest', true)}
                      className={`flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        test.passedTest 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-700 hover:bg-green-50'
                      }`}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Pass
                    </button>
                    <button
                      type="button"
                      onClick={() => updateTestResult(test.id, 'passedTest', false)}
                      className={`flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        !test.passedTest 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-700 hover:bg-red-50'
                      }`}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Fail
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Initial Pressure (PSI)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                      value={test.initialPressure}
                      onChange={(e) => updateTestResult(test.id, 'initialPressure', e.target.value)}
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Final Pressure (PSI)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                      value={test.finalPressure}
                      onChange={(e) => updateTestResult(test.id, 'finalPressure', e.target.value)}
                      placeholder="0.0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Test Notes
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 resize-none"
                    rows={2}
                    value={test.notes}
                    onChange={(e) => updateTestResult(test.id, 'notes', e.target.value)}
                    placeholder="Optional notes about this test..."
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Overall Status */}
          <div className="mt-6 p-4 rounded-lg bg-slate-100 border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Overall Test Result</h3>
              <div className={`flex items-center px-4 py-2 rounded-full font-semibold ${
                formData.overallPass 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {formData.overallPass ? (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    PASSED
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 mr-2" />
                    FAILED
                  </>
                )}
              </div>
            </div>
            
            {!formData.overallPass && (
              <div className="mt-4">
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    id="repairsNeeded"
                    checked={formData.repairsNeeded}
                    onChange={(e) => handleInputChange('repairsNeeded', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="repairsNeeded" className="text-sm font-medium text-slate-700">
                    Repairs needed
                  </label>
                </div>
                
                {formData.repairsNeeded && (
                  <textarea
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 resize-none mt-2"
                    rows={3}
                    value={formData.repairDescription}
                    onChange={(e) => handleInputChange('repairDescription', e.target.value)}
                    placeholder="Describe the repairs needed..."
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Additional Notes */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Additional Notes
          </h2>
          <textarea
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 resize-none"
            rows={4}
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Any additional observations or notes about the test..."
          />
        </div>

        {/* Photos Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Camera className="h-5 w-5 mr-2" />
            Photos
          </h2>
          <div className="text-center py-8 border-2 border-dashed border-gray-400 rounded-lg">
            <Camera className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-slate-700 mb-2">Take photos of the device</p>
            <Button type="button" className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Add Photos
            </Button>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="space-y-3">
          <div className="flex space-x-3">
            <Button 
              type="button"
              onClick={(e) => handleSubmit(e, 'draft')}
              disabled={saving || !formData.customerId} 
              className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button 
              type="button"
              onClick={(e) => handleSubmit(e, 'submit')}
              disabled={saving || !formData.customerId} 
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Report'}
            </Button>
          </div>
          
          <Button 
            type="button"
            onClick={(e) => handleSubmit(e, 'district')}
            disabled={saving || !formData.customerId} 
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Send className="h-4 w-4 mr-2" />
            {saving ? 'Sending...' : 'Save & Send to Water District'}
          </Button>
          
          <Button 
            type="button" 
            variant="ghost" 
            className="w-full" 
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function TestReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600 mt-4">Loading...</p>
        </div>
      </div>
    }>
      <TestReportContent />
    </Suspense>
  );
}