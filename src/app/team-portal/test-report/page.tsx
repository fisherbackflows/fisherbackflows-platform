'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { TeamPortalNavigation } from '@/components/navigation/UnifiedNavigation';
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
import Image from 'next/image';
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
    <div className="min-h-screen bg-black">
      <TeamPortalNavigation userInfo={{ name: 'Team Member', email: '' }} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button className="glass hover:glass text-white/80 border border-blue-400" size="sm" asChild>
              <Link href="/team-portal/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Test Report</h1>
              <p className="text-white/60">
                {formData.customerName || 'New Test Report'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="pb-20">
        {/* Customer & Device Info - KEEP EXPANDED */}
        <div className="glass rounded-2xl glow-blue-sm border border-blue-400 p-6 mb-4">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Customer & Device
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Customer *
              </label>
              <select
                className="w-full px-3 py-2 border border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white"
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
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Device Type *
                </label>
                <select
                  className="w-full px-3 py-2 border border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white"
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
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Size *
                </label>
                <select
                  className="w-full px-3 py-2 border border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white"
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
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Manufacturer
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white/10 border border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder-gray-400"
                  value={formData.manufacturer}
                  onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                  placeholder="e.g. Watts, Zurn, Febco"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white/10 border border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder-gray-400"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  placeholder="Model number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white/10 border border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder-gray-400"
                  value={formData.serialNumber}
                  onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                  placeholder="Serial number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white/10 border border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder-gray-400"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g. Front yard, Basement"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Test Details - COMPACT */}
        <div className="glass rounded-2xl glow-blue-sm border border-blue-400 p-4 mb-4">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Test Details
          </h2>
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">
                Date *
              </label>
              <input
                type="date"
                className="w-full px-2 py-1.5 text-sm border border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white"
                value={formData.testDate}
                onChange={(e) => handleInputChange('testDate', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">
                Time *
              </label>
              <input
                type="time"
                className="w-full px-2 py-1.5 text-sm border border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white"
                value={formData.testTime}
                onChange={(e) => handleInputChange('testTime', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">
                District
              </label>
              <select
                className="w-full px-2 py-1.5 text-sm border border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white"
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

        {/* Test Results - COMPACT */}
        <div className="glass rounded-2xl glow-blue-sm border border-blue-400 p-4 mb-4">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Test Results - {currentDeviceType?.label}
          </h2>
          
          <div className="space-y-2">
            {formData.testResults.map((test, index) => (
              <div key={test.id} className="border border-blue-400 rounded-xl p-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-white">
                    {index + 1}. {test.testName}
                  </h3>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => updateTestResult(test.id, 'passedTest', true)}
                      className={`flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        test.passedTest 
                          ? 'bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/20 border border-green-400 glow-blue-sm text-green-300' 
                          : 'bg-black/30 backdrop-blur-lg text-white/80 hover:bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl'
                      }`}
                    >
                      <CheckCircle className="h-3 w-3 mr-0.5" />
                      Pass
                    </button>
                    <button
                      type="button"
                      onClick={() => updateTestResult(test.id, 'passedTest', false)}
                      className={`flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        !test.passedTest 
                          ? 'bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl/20 border border-red-400 glow-blue-sm text-red-300' 
                          : 'bg-black/30 backdrop-blur-lg text-white/80 hover:bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl'
                      }`}
                    >
                      <XCircle className="h-3 w-3 mr-0.5" />
                      Fail
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-white/90 mb-0.5">
                      Initial PSI
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full px-2 py-1 text-sm border border-blue-400 rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400 text-white"
                      value={test.initialPressure}
                      onChange={(e) => updateTestResult(test.id, 'initialPressure', e.target.value)}
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/90 mb-0.5">
                      Final PSI
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full px-2 py-1 text-sm border border-blue-400 rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400 text-white"
                      value={test.finalPressure}
                      onChange={(e) => updateTestResult(test.id, 'finalPressure', e.target.value)}
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/90 mb-0.5">
                      Notes
                    </label>
                    <input
                      type="text"
                      className="w-full px-2 py-1 text-sm border border-blue-400 rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400 text-white"
                      value={test.notes}
                      onChange={(e) => updateTestResult(test.id, 'notes', e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Overall Status - COMPACT */}
          <div className="mt-3 p-3 rounded-xl glass border border-blue-400">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Overall Result</h3>
              <div className={`flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                formData.overallPass 
                  ? 'bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/20 border border-green-400 glow-blue-sm text-green-300' 
                  : 'bg-gradient-to-r from-red-600/80 to-red-500/80 backdrop-blur-xl/20 border border-red-400 glow-blue-sm text-red-300'
              }`}>
                {formData.overallPass ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    PASSED
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    FAILED
                  </>
                )}
              </div>
            </div>
            
            {!formData.overallPass && (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="repairsNeeded"
                    checked={formData.repairsNeeded}
                    onChange={(e) => handleInputChange('repairsNeeded', e.target.checked)}
                    className="rounded border-blue-500/50 text-blue-300 focus:ring-blue-400 h-3 w-3"
                  />
                  <label htmlFor="repairsNeeded" className="text-xs font-medium text-white/80">
                    Repairs needed
                  </label>
                </div>
                
                {formData.repairsNeeded && (
                  <input
                    type="text"
                    className="w-full px-2 py-1 text-sm border border-blue-400 rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400 text-white mt-1"
                    value={formData.repairDescription}
                    onChange={(e) => handleInputChange('repairDescription', e.target.value)}
                    placeholder="Describe repairs..."
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Additional Notes & Photos - COMPACT */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="glass rounded-2xl glow-blue-sm border border-blue-400 p-4">
            <h2 className="text-sm font-semibold text-white mb-2">
              Additional Notes
            </h2>
            <textarea
              className="w-full px-2 py-1.5 text-sm border border-blue-400 rounded-xl focus:ring-1 focus:ring-blue-400 focus:border-blue-400 text-white resize-none"
              rows={3}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Optional observations..."
            />
          </div>

          <div className="glass rounded-2xl glow-blue-sm border border-blue-400 p-4">
            <h2 className="text-sm font-semibold text-white mb-2 flex items-center">
              <Camera className="h-4 w-4 mr-1" />
              Photos
            </h2>
            <div className="text-center py-4 border border-dashed border-blue-500/50 rounded">
              <Camera className="h-6 w-6 text-white/80 mx-auto mb-1" />
              <Button type="button" className="glass hover:glass text-white/80 border border-blue-400 text-xs px-2 py-1" size="sm">
                <Upload className="h-3 w-3 mr-1" />
                Add Photos
              </Button>
            </div>
          </div>
        </div>

        {/* Submit Buttons - COMPACT */}
        <div className="flex gap-2">
          <Button 
            type="button"
            onClick={(e) => handleSubmit(e, 'draft')}
            disabled={saving || !formData.customerId} 
            className="flex-1 glass hover:glass text-white/80 border border-blue-400 text-sm py-2"
          >
            <Save className="h-3 w-3 mr-1" />
            {saving ? 'Saving...' : 'Draft'}
          </Button>
          <Button 
            type="button"
            onClick={(e) => handleSubmit(e, 'submit')}
            disabled={saving || !formData.customerId} 
            className="flex-1 glass-btn-primary hover:glow-blue text-white text-sm py-2"
          >
            <Save className="h-3 w-3 mr-1" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button 
            type="button"
            onClick={(e) => handleSubmit(e, 'district')}
            disabled={saving || !formData.customerId} 
            className="flex-1 glass-btn-primary hover:glow-blue bg-gradient-to-r from-green-600/80 to-green-500/80 backdrop-blur-xl/30 border-green-400 text-white text-sm py-2"
          >
            <Send className="h-3 w-3 mr-1" />
            {saving ? 'Sending...' : 'Send to District'}
          </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TestReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black">
        <TeamPortalNavigation userInfo={{ name: 'Team Member', email: '' }} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-white/90 mt-4">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <TestReportContent />
    </Suspense>
  );
}