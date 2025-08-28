// Comprehensive TypeScript types for the Fisher Backflows platform
// This file replaces all 'any' types with proper type definitions

// Database record types
export interface Customer {
  id: string;
  account_number: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  balance: number;
  next_test_date?: string;
  status: 'active' | 'inactive' | 'suspended';
  organization_id: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  devices?: Device[];
}

export interface Device {
  id: string;
  customer_id: string;
  serial_number: string;
  size?: string;
  make?: string;
  model?: string;
  installation_date?: string;
  last_test_date?: string;
  location?: string;
  notes?: string;
  organization_id: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TestReport {
  id: string;
  customer_id: string;
  device_id: string;
  test_date: string;
  initial_pressure?: number;
  final_pressure?: number;
  test_duration?: number;
  test_result: 'Passed' | 'Failed' | 'Needs Repair';
  notes?: string;
  technician_name?: string;
  water_district?: string;
  photos?: string[];
  pdf_path?: string;
  submitted_to_water_dept: boolean;
  organization_id: string;
  technician_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  customer_id: string;
  invoice_number: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'payment_failed';
  due_date?: string;
  paid_date?: string;
  description?: string;
  line_items?: InvoiceLineItem[];
  pdf_path?: string;
  stripe_invoice_id?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  tax_rate?: number;
}

export interface Appointment {
  id: string;
  customer_id: string;
  appointment_date: string;
  appointment_time: string;
  service_type?: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  device_location?: string;
  organization_id: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  technician?: AuthUser;
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'customer' | 'technician' | 'admin';
  organization_id?: string;
  created_at: string;
  updated_at: string;
  email_confirmed: boolean;
  last_sign_in_at?: string;
}

export interface Technician {
  id: string;
  user_id: string;
  employee_id: string;
  name: string;
  phone?: string;
  email?: string;
  certifications?: string[];
  active: boolean;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  domain?: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// API Request/Response types
export interface CreateCustomerRequest {
  account_number: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: Customer['status'];
}

export interface CreateDeviceRequest {
  customer_id: string;
  serial_number: string;
  size?: string;
  make?: string;
  model?: string;
  installation_date?: string;
  location?: string;
  notes?: string;
}

export interface UpdateDeviceRequest {
  serial_number?: string;
  size?: string;
  make?: string;
  model?: string;
  installation_date?: string;
  last_test_date?: string;
  location?: string;
  notes?: string;
}

export interface CreateTestReportRequest {
  customer_id: string;
  device_id: string;
  test_date: string;
  initial_pressure?: number;
  final_pressure?: number;
  test_duration?: number;
  test_result: TestReport['test_result'];
  notes?: string;
  technician_name?: string;
  water_district?: string;
  photos?: string[];
}

export interface CreateInvoiceRequest {
  customer_id: string;
  services: InvoiceService[];
  due_date?: string;
  notes?: string;
}

export interface InvoiceService {
  description: string;
  quantity: number;
  rate: number;
}

export interface CreateAppointmentRequest {
  customer_id: string;
  appointment_date: string;
  appointment_time: string;
  service_type?: string;
  notes?: string;
  device_location?: string;
}

export interface UpdateAppointmentRequest {
  appointment_date?: string;
  appointment_time?: string;
  service_type?: string;
  status?: Appointment['status'];
  notes?: string;
  device_location?: string;
  assigned_to?: string;
}

// API Response wrappers
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Lead generation types
export interface LeadData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  property_type: 'residential' | 'commercial';
  device_count?: number;
  last_test_date?: string;
  urgency: 'low' | 'medium' | 'high';
  source: string;
}

export interface QualifiedLead extends LeadData {
  id: string;
  priority_score: number;
  qualification_status: 'qualified' | 'unqualified' | 'pending';
  qualification_notes?: string;
  created_at: string;
}

// Monitoring and logging types
export interface ClientError {
  id: string;
  error_id: string;
  error_name: string;
  error_message: string;
  error_stack?: string;
  component_stack?: string;
  url?: string;
  user_agent?: string;
  session_id?: string;
  reported_at?: string;
  created_at: string;
}

export interface UserDevice {
  id: string;
  user_id: string;
  device_type: string;
  fcm_token?: string;
  device_info?: Record<string, unknown>;
  active: boolean;
  last_used_at?: string;
  created_at: string;
}

// Form data types
export interface DeviceFormData {
  serial_number: string;
  size: string;
  make: string;
  model: string;
  installation_date: string;
  location: string;
  notes: string;
}

export interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  account_number: string;
}

export interface TestReportFormData {
  customer_id: string;
  device_id: string;
  initial_pressure: number;
  final_pressure: number;
  test_duration: number;
  test_result: TestReport['test_result'];
  notes: string;
  water_district: string;
  technician_name: string;
  photos: File[];
}

// Calendar and scheduling types
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  attendees?: string[];
}

export interface AvailableSlot {
  date: string;
  time: string;
  available: boolean;
  technician?: string;
}

// Utility types
export type DatabaseRecord = 
  | Customer 
  | Device 
  | TestReport 
  | Invoice 
  | Appointment 
  | AuthUser 
  | Technician 
  | Organization;

export type FormErrors<T> = Partial<Record<keyof T, string>>;

export type LoadingState = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface AsyncState<T> {
  data: T | null;
  status: LoadingState;
  error: string | null;
}

// Component prop types
export interface PageProps {
  params?: Record<string, string>;
  searchParams?: Record<string, string | string[]>;
}

export interface LayoutProps {
  children: React.ReactNode;
}

// Validation schemas export (for runtime type checking)
export type { z } from 'zod';