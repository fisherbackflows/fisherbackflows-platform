// Manual type fixes for common database schema mismatches
// These types reflect the actual database structure

export interface CustomerRecord {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_name?: string;
  preferred_contact_method?: string;
  // ... other fields
}

export interface TeamUserRecord {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role?: string;
  // ... other fields
}

export interface DeviceRecord {
  id: string;
  customer_id: string;
  device_type: string;
  manufacturer: string; // NOT 'make'
  model: string;
  location_description: string; // NOT 'location'
  // ... other fields
}

export interface AppointmentRecord {
  id: string;
  customer_id: string;
  scheduled_date: string;
  scheduled_time_start: string;
  status?: string;
  appointment_type?: string;
  customer_notes?: string; // NOT 'notes'
  technician_notes?: string;
  completion_notes?: string;
  special_instructions?: string;
  assigned_technician?: string;
  // ... other fields
}

// Helper types for common query patterns
export interface AppointmentWithRelations {
  id: string;
  customer_id: string;
  scheduled_date: string;
  status?: string;
  customers: CustomerRecord[]; // Array, not single object
  devices?: DeviceRecord[]; // Array, not single object
}