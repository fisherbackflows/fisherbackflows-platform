'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { FileText, Plus, Save, Send, User, Calendar, Settings, CheckCircle, XCircle, Camera, Upload, ArrowLeft } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

interface UserPermissions {
  isOwner: boolean
  subscriptions: string[]
  userInfo: any
}

interface TestResult {
  id: string
  testName: string
  initialPressure: string
  finalPressure: string
  passedTest: boolean
  notes: string
}

interface TestReport {
  customerId: string
  customerName: string
  deviceType: 'RP' | 'PVB' | 'DC' | 'DCDA' | 'SVB'
  deviceSize: string
  manufacturer: string
  model: string
  serialNumber: string
  location: string
  testDate: string
  testTime: string
  technicianName: string
  technicianCertification: string
  waterDistrict: string
  testResults: TestResult[]
  overallPass: boolean
  repairsNeeded: boolean
  repairDescription: string
  notes: string
  photos: string[]
}

function TestReportContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<TestReport>({
    customerId: '',
    customerName: '',
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
    notes: '',
    photos: []
  })

  const [customers] = useState([
    { id: '1', name: 'Johnson Properties LLC' },
    { id: '2', name: 'Smith Residence' },
    { id: '3', name: 'Parkland Medical Center' },
    { id: '4', name: 'Harbor View Apartments' },
    { id: '5', name: 'Downtown Deli' }
  ])

  const deviceTypes = [
    { value: 'RP', label: 'Reduced Pressure (RP)', tests: ['Inlet Shutoff', 'First Check', 'Relief Valve', 'Second Check'] },
    { value: 'DC', label: 'Double Check (DC)', tests: ['Inlet Shutoff', 'First Check', 'Second Check'] },
    { value: 'PVB', label: 'Pressure Vacuum Breaker (PVB)', tests: ['Inlet Shutoff', 'Air Inlet', 'Check Valve'] },
    { value: 'DCDA', label: 'Double Check Detector Assembly (DCDA)', tests: ['Inlet Shutoff', 'First Check', 'Second Check', 'Bypass'] },
    { value: 'SVB', label: 'Spill-Resistant Vacuum Breaker (SVB)', tests: ['Inlet Shutoff', 'Air Inlet', 'Check Valve'] }
  ]

  const waterDistricts = [
    'Tacoma Water',
    'Lakewood Water District',
    'Puyallup Water',
    'Gig Harbor Water',
    'Pierce County Water Utility'
  ]

  useEffect(() => {
    fetchPermissions()
  }, [])

  useEffect(() => {
    if (permissions && hasAccess('compliance')) {
      const customerId = searchParams?.get('customer')
      if (customerId) {
        const customer = customers.find(c => c.id === customerId)
        if (customer) {
          setFormData(prev => ({
            ...prev,
            customerId,
            customerName: customer.name
          }))
        }
      }
      initializeTestResults()
    }
  }, [permissions, searchParams])

  useEffect(() => {
    if (hasAccess('compliance')) {
      initializeTestResults()
    }
  }, [formData.deviceType])

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/tester-portal/permissions')
      if (response.ok) {
        const data = await response.json()
        setPermissions(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const hasAccess = (feature: string) => {
    if (!permissions) return false
    return permissions.isOwner || permissions.subscriptions.includes(feature)
  }

  const initializeTestResults = () => {
    const deviceType = deviceTypes.find(d => d.value === formData.deviceType)
    if (deviceType && formData.testResults.length === 0) {
      const testResults: TestResult[] = deviceType.tests.map((testName, index) => ({
        id: `test-${index}`,
        testName,
        initialPressure: '',
        finalPressure: '',
        passedTest: true,
        notes: ''
      }))

      setFormData(prev => ({
        ...prev,
        testResults
      }))
    }
  }

  const handleInputChange = (field: keyof TestReport, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    if (field === 'testResults') {
      const allTestsPass = value.every((test: TestResult) => test.passedTest)
      setFormData(prev => ({
        ...prev,
        overallPass: allTestsPass
      }))
    }
  }

  const updateTestResult = (testId: string, field: keyof TestResult, value: any) => {
    const updatedResults = formData.testResults.map(test => 
      test.id === testId ? { ...test, [field]: value } : test
    )
    
    handleInputChange('testResults', updatedResults)
  }

  const handleDeviceTypeChange = (newType: string) => {
    setFormData(prev => ({
      ...prev,
      deviceType: newType as TestReport['deviceType'],
      testResults: []
    }))

    setTimeout(() => {
      const deviceType = deviceTypes.find(d => d.value === newType)
      if (deviceType) {
        const testResults: TestResult[] = deviceType.tests.map((testName, index) => ({
          id: `test-${index}`,
          testName,
          initialPressure: '',
          finalPressure: '',
          passedTest: true,
          notes: ''
        }))

        setFormData(prev => ({
          ...prev,
          testResults
        }))
      }
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent, action: 'draft' | 'submit' | 'district') => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/tester-portal/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, action })
      })

      if (response.ok) {
        if (action === 'draft') {
          alert('Test report saved as draft!')
        } else if (action === 'district') {
          alert('Test report saved and sent to district!')
          router.push('/tester-portal/compliance/districts')
        } else {
          alert('Test report saved successfully!')
          router.push('/tester-portal/dashboard')
        }
      }
    } catch (error) {
      console.error('Error saving test report:', error)
      alert('Error saving test report. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!hasAccess('compliance') && !permissions?.isOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
            <FileText className="h-8 w-8 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Test Reports</h2>
          <p className="text-cyan-200 mb-6">
            This feature requires a compliance subscription to create and manage test reports.
          </p>
          <div className="space-y-3">
            <Link
              href="/tester-portal/upgrade"
              className="block bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all"
            >
              Upgrade to Access
            </Link>
            <Link
              href="/tester-portal/dashboard"
              className="block text-cyan-400 hover:text-white transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-white/80">Loading test report...</p>
        </div>
      </div>
    )
  }

  const currentDeviceType = deviceTypes.find(d => d.value === formData.deviceType)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900">
      {/* Header */}
      <div className="border-b border-cyan-400/20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/tester-portal/dashboard" className="bg-cyan-500/20 hover:bg-cyan-500/30 p-2 rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5 text-cyan-400" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center">
                  <FileText className="h-8 w-8 text-cyan-400 mr-3" />
                  Test Report
                  {permissions?.isOwner && (
                    <span className="ml-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      OWNER ACCESS
                    </span>
                  )}
                </h1>
                <p className="text-cyan-200 mt-2">
                  {formData.customerName || 'New Test Report'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Customer & Device Info */}
          <div className="bg-black/40 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <User className="h-6 w-6 mr-3" />
              Customer & Device Information
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Customer *
                </label>
                <select
                  className="w-full px-4 py-3 bg-black/20 border border-cyan-400/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white"
                  value={formData.customerId}
                  onChange={(e) => {
                    const customerId = e.target.value
                    const customer = customers.find(c => c.id === customerId)
                    handleInputChange('customerId', customerId)
                    handleInputChange('customerName', customer?.name || '')
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Device Type *
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-black/20 border border-cyan-400/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white"
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
                  <label className="block text-sm font-medium text-white mb-2">
                    Size *
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-black/20 border border-cyan-400/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white"
                    value={formData.deviceSize}
                    onChange={(e) => handleInputChange('deviceSize', e.target.value)}
                    required
                  >
                    <option value="3/4\"">3/4"</option>
                    <option value="1\"">1"</option>
                    <option value="1.5\"">1.5"</option>
                    <option value="2\"">2"</option>
                    <option value="3\"">3"</option>
                    <option value="4\"">4"</option>
                    <option value="6\"">6"</option>
                    <option value="8\"">8"</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-black/20 border border-cyan-400/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white placeholder-cyan-300"
                    value={formData.manufacturer}
                    onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                    placeholder="e.g. Watts, Zurn, Febco"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Model
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-black/20 border border-cyan-400/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white placeholder-cyan-300"
                    value={formData.model}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    placeholder="Model number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-black/20 border border-cyan-400/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white placeholder-cyan-300"
                    value={formData.serialNumber}
                    onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                    placeholder="Serial number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-black/20 border border-cyan-400/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white placeholder-cyan-300"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g. Front yard, Basement"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Test Details */}
          <div className="bg-black/40 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Calendar className="h-6 w-6 mr-3" />
              Test Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Test Date *
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-black/20 border border-cyan-400/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white"
                  value={formData.testDate}
                  onChange={(e) => handleInputChange('testDate', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Test Time *
                </label>
                <input
                  type="time"
                  className="w-full px-4 py-3 bg-black/20 border border-cyan-400/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white"
                  value={formData.testTime}
                  onChange={(e) => handleInputChange('testTime', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Water District
                </label>
                <select
                  className="w-full px-4 py-3 bg-black/20 border border-cyan-400/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white"
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
          <div className="bg-black/40 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Settings className="h-6 w-6 mr-3" />
              Test Results - {currentDeviceType?.label}
            </h2>
            
            <div className="space-y-4">
              {formData.testResults.map((test, index) => (
                <div key={test.id} className="bg-black/20 border border-cyan-400/20 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-white">
                      {index + 1}. {test.testName}
                    </h3>
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => updateTestResult(test.id, 'passedTest', true)}
                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          test.passedTest 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        }`}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Pass
                      </button>
                      <button
                        type="button"
                        onClick={() => updateTestResult(test.id, 'passedTest', false)}
                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          !test.passedTest 
                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' 
                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        }`}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Fail
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-cyan-300 mb-2">
                        Initial PSI
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full px-3 py-2 bg-black/20 border border-cyan-400/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white placeholder-cyan-300"
                        value={test.initialPressure}
                        onChange={(e) => updateTestResult(test.id, 'initialPressure', e.target.value)}
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-cyan-300 mb-2">
                        Final PSI
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full px-3 py-2 bg-black/20 border border-cyan-400/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white placeholder-cyan-300"
                        value={test.finalPressure}
                        onChange={(e) => updateTestResult(test.id, 'finalPressure', e.target.value)}
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-cyan-300 mb-2">
                        Notes
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-black/20 border border-cyan-400/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white placeholder-cyan-300"
                        value={test.notes}
                        onChange={(e) => updateTestResult(test.id, 'notes', e.target.value)}
                        placeholder="Optional notes"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Overall Status */}
            <div className="mt-6 p-4 rounded-lg bg-black/20 border border-cyan-400/20">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Overall Result</h3>
                <div className={`flex items-center px-4 py-2 rounded-lg text-sm font-semibold ${
                  formData.overallPass 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                    : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                }`}>
                  {formData.overallPass ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      PASSED
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      FAILED
                    </>
                  )}
                </div>
              </div>
              
              {!formData.overallPass && (
                <div className="mt-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <input
                      type="checkbox"
                      id="repairsNeeded"
                      checked={formData.repairsNeeded}
                      onChange={(e) => handleInputChange('repairsNeeded', e.target.checked)}
                      className="rounded border-cyan-400/50 text-cyan-400 focus:ring-cyan-400"
                    />
                    <label htmlFor="repairsNeeded" className="text-sm font-medium text-white">
                      Repairs needed
                    </label>
                  </div>
                  
                  {formData.repairsNeeded && (
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-black/20 border border-cyan-400/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white placeholder-cyan-300"
                      value={formData.repairDescription}
                      onChange={(e) => handleInputChange('repairDescription', e.target.value)}
                      placeholder="Describe repairs needed..."
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Additional Notes & Photos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-black/40 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Additional Notes
              </h2>
              <textarea
                className="w-full px-4 py-3 bg-black/20 border border-cyan-400/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white placeholder-cyan-300 resize-none"
                rows={4}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Optional observations or notes..."
              />
            </div>

            <div className="bg-black/40 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                Photos
              </h2>
              <div className="text-center py-8 border-2 border-dashed border-cyan-400/30 rounded-lg">
                <Camera className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
                <button 
                  type="button" 
                  className="bg-cyan-500/20 text-cyan-400 px-4 py-2 rounded-lg font-semibold hover:bg-cyan-500/30 transition-all"
                >
                  <Upload className="h-4 w-4 inline mr-2" />
                  Add Photos
                </button>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              type="button"
              onClick={(e) => handleSubmit(e, 'draft')}
              disabled={saving || !formData.customerId} 
              className="flex-1 bg-gray-500/20 text-gray-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Save className="h-5 w-5 inline mr-2" />
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
            <button 
              type="button"
              onClick={(e) => handleSubmit(e, 'submit')}
              disabled={saving || !formData.customerId} 
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Save className="h-5 w-5 inline mr-2" />
              {saving ? 'Saving...' : 'Save Report'}
            </button>
            <button 
              type="button"
              onClick={(e) => handleSubmit(e, 'district')}
              disabled={saving || !formData.customerId} 
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="h-5 w-5 inline mr-2" />
              {saving ? 'Sending...' : 'Send to District'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TestReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-white/80">Loading...</p>
        </div>
      </div>
    }>
      <TestReportContent />
    </Suspense>
  )
}