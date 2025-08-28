import { NextRequest, NextResponse } from 'next/server'

export interface TestReport {
  id: string
  customerId: string
  customerName: string
  deviceId: string
  testDate: string
  testType: string
  results: {
    initialPressure: number
    finalPressure: number
    testDuration: number
    status: 'Passed' | 'Failed' | 'Needs Repair'
  }
  technician: string
  notes?: string
  waterDistrict?: string
  submitted: boolean
  submittedDate?: string
}

// Mock test reports data
const testReports: TestReport[] = [
  {
    id: '1',
    customerId: '1',
    customerName: 'John Smith',
    deviceId: 'dev1',
    testDate: '2024-01-15',
    testType: 'Annual Test',
    results: {
      initialPressure: 15.2,
      finalPressure: 14.8,
      testDuration: 600,
      status: 'Passed'
    },
    technician: 'Mike Fisher',
    notes: 'Device functioning properly',
    waterDistrict: 'Metro Water District',
    submitted: true,
    submittedDate: '2024-01-15'
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status')
    
    let filteredReports = testReports
    
    // Filter by customer ID
    if (customerId) {
      filteredReports = filteredReports.filter(report =>
        report.customerId === customerId
      )
    }
    
    // Filter by status
    if (status) {
      filteredReports = filteredReports.filter(report =>
        report.results.status === status
      )
    }
    
    return NextResponse.json(filteredReports)
  } catch (error) {
    console.error('Error fetching test reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test reports' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Validate required fields
    if (!data.customerId || !data.deviceId || !data.results) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Create new test report
    const newReport: TestReport = {
      id: String(testReports.length + 1),
      testDate: new Date().toISOString().split('T')[0],
      testType: data.testType || 'Annual Test',
      technician: data.technician || 'Mike Fisher',
      submitted: false,
      ...data
    }
    
    testReports.push(newReport)
    
    return NextResponse.json(newReport, { status: 201 })
  } catch (error) {
    console.error('Error creating test report:', error)
    return NextResponse.json(
      { error: 'Failed to create test report' },
      { status: 500 }
    )
  }
}