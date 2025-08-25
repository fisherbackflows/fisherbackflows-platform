import { NextRequest, NextResponse } from 'next/server'

export interface Appointment {
  id: string
  customerId: string
  customerName: string
  customerPhone: string
  serviceType: string
  date: string
  time: string
  duration: number
  status: 'Scheduled' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled'
  deviceLocation?: string
  notes?: string
  technician?: string
  createdDate: string
}

// Mock appointment data
const appointments: Appointment[] = [
  {
    id: '1',
    customerId: '1',
    customerName: 'John Smith',
    customerPhone: '555-0123',
    serviceType: 'Annual Test',
    date: '2024-12-28',
    time: '10:00',
    duration: 60,
    status: 'Scheduled',
    deviceLocation: '123 Main St - Backyard',
    notes: 'Call before arrival',
    technician: 'Mike Fisher',
    createdDate: '2024-12-20'
  },
  {
    id: '2',
    customerId: '2',
    customerName: 'ABC Corporation',
    customerPhone: '555-0456',
    serviceType: 'Repair & Retest',
    date: '2024-12-30',
    time: '14:00',
    duration: 90,
    status: 'Confirmed',
    deviceLocation: '456 Business Ave - Main Building',
    notes: 'Device failed previous test',
    technician: 'Mike Fisher',
    createdDate: '2024-12-18'
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    
    let filteredAppointments = appointments
    
    // Filter by customer ID
    if (customerId) {
      filteredAppointments = filteredAppointments.filter(appointment =>
        appointment.customerId === customerId
      )
    }
    
    // Filter by date
    if (date) {
      filteredAppointments = filteredAppointments.filter(appointment =>
        appointment.date === date
      )
    }
    
    // Filter by status
    if (status && status !== 'All') {
      filteredAppointments = filteredAppointments.filter(appointment =>
        appointment.status === status
      )
    }
    
    return NextResponse.json(filteredAppointments)
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Validate required fields
    if (!data.customerId || !data.serviceType || !data.date || !data.time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Check for scheduling conflicts
    const conflictingAppointment = appointments.find(appointment =>
      appointment.date === data.date &&
      appointment.time === data.time &&
      appointment.status !== 'Cancelled'
    )
    
    if (conflictingAppointment) {
      return NextResponse.json(
        { error: 'Time slot already booked' },
        { status: 409 }
      )
    }
    
    // Create new appointment
    const newAppointment: Appointment = {
      id: String(appointments.length + 1),
      duration: 60, // Default duration
      status: 'Scheduled',
      technician: 'Mike Fisher',
      createdDate: new Date().toISOString().split('T')[0],
      ...data
    }
    
    appointments.push(newAppointment)
    
    return NextResponse.json(newAppointment, { status: 201 })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}