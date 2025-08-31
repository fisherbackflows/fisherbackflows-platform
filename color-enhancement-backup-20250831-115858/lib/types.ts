// Type definitions for Fisher Backflows application

export interface Customer {
  id: string;
  name: string;
  address: string;
  city: string;
  zip: string;
  phone?: string;
  email?: string;
  district: string;
  lastTest?: string;
  nextDue?: string;
  devices: Device[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  id: string;
  customerId: string;
  type: 'RPZ' | 'DCVA' | 'PVB' | 'SVB';
  size: string;
  manufacturer: string;
  model?: string;
  serial: string;
  location: string;
  installDate?: string;
  lastTest?: string;
  status: 'active' | 'inactive' | 'needs_repair';
}

export interface TestReport {
  id: string;
  customerId: string;
  deviceId: string;
  testDate: string;
  testerName: string;
  testerLicense: string;
  testResults: TestResults;
  overallResult: 'PASSED' | 'FAILED' | 'NEEDS_REPAIR';
  repairs?: string;
  comments?: string;
  photos?: string[];
  signature?: string;
  customerSignature?: string;
  submitted: boolean;
  submittedAt?: string;
  createdAt: string;
}

export interface TestResults {
  // RPZ specific
  checkValve1?: {
    initial?: number;
    final?: number;
    result: 'PASS' | 'FAIL';
  };
  checkValve2?: {
    initial?: number;
    final?: number;
    result: 'PASS' | 'FAIL';
  };
  reliefValve?: {
    openingPoint?: number;
    result: 'PASS' | 'FAIL';
  };
  
  // DCVA specific
  dcvaCheckValve1?: {
    closedTight: boolean;
    result: 'PASS' | 'FAIL';
  };
  dcvaCheckValve2?: {
    closedTight: boolean;
    result: 'PASS' | 'FAIL';
  };
  
  // PVB specific
  pvbCheckValve?: {
    closedTight: boolean;
    result: 'PASS' | 'FAIL';
  };
  airInletValve?: {
    openingPoint?: number;
    result: 'PASS' | 'FAIL';
  };
}

export interface Appointment {
  id: string;
  customerId: string;
  date: string;
  time: string;
  service: 'annual-test' | 'repair' | 'installation' | 'inspection';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  address: string;
  estimatedDuration: number;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  number: string;
  customerId: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  paidDate?: string;
  paymentMethod?: 'cash' | 'check' | 'card' | 'bank_transfer';
  notes?: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface WaterDistrict {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  submitMethod: 'email' | 'online' | 'mail' | 'fax';
  website?: string;
  reportFormat: 'pdf' | 'form' | 'online';
  requirements: {
    submissionDeadline: number; // days after test
    certificationRequired: boolean;
    photos: boolean;
    specificForms: boolean;
  };
  emailTemplate?: {
    subject: string;
    body: string;
  };
}

export interface Reminder {
  id: string;
  customerId: string;
  type: 'annual-30' | 'final-7' | 'overdue' | 'custom';
  method: 'email' | 'sms' | 'call' | 'email+sms' | 'email+call' | 'sms+call' | 'all';
  scheduledDate: string;
  sentDate?: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  message?: string;
  response?: string;
  createdAt: string;
}

export interface BusinessMetrics {
  totalCustomers: number;
  testsThisMonth: number;
  testsThisYear: number;
  revenueThisMonth: number;
  revenueThisYear: number;
  pendingInvoices: number;
  overdueTests: number;
  activeReminders: number;
  averageTestTime: number;
  customerSatisfaction: number;
}

export interface RouteOptimization {
  date: string;
  appointments: Appointment[];
  optimizedOrder: string[]; // appointment IDs in order
  totalDistance: number;
  totalTravelTime: number;
  estimatedCompletion: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form types
export interface CustomerFormData {
  name: string;
  address: string;
  city: string;
  zip: string;
  phone: string;
  email: string;
  district: string;
  notes: string;
}

export interface TestFormData {
  customerId: string;
  deviceId: string;
  testDate: string;
  deviceType: string;
  deviceSize: string;
  manufacturer: string;
  model: string;
  serial: string;
  location: string;
  testResults: TestResults;
  repairs: string;
  comments: string;
  nextTestDue: string;
}

// Component Props
export interface DashboardStats {
  todayTests: number;
  weekTests: number;
  pendingReports: number;
  monthRevenue: number;
}

export interface ScheduleViewProps {
  appointments: Appointment[];
  customers: Customer[];
  onAppointmentClick: (appointment: Appointment) => void;
  onAddAppointment: () => void;
}

export interface TestReportProps {
  customer?: Customer;
  device?: Device;
  onSave: (report: TestReport) => void;
  onCancel: () => void;
}

// Utility types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AppState {
  customers: Customer[];
  appointments: Appointment[];
  testReports: TestReport[];
  invoices: Invoice[];
  reminders: Reminder[];
  waterDistricts: WaterDistrict[];
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSync?: string;
}