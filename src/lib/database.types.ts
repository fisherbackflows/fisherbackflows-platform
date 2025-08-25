export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          account_number: string
          name: string
          email: string
          phone: string
          address: string
          balance: number
          next_test_date: string | null
          status: 'Active' | 'Inactive' | 'Needs Service'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          account_number: string
          name: string
          email: string
          phone: string
          address: string
          balance?: number
          next_test_date?: string | null
          status?: 'Active' | 'Inactive' | 'Needs Service'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          account_number?: string
          name?: string
          email?: string
          phone?: string
          address?: string
          balance?: number
          next_test_date?: string | null
          status?: 'Active' | 'Inactive' | 'Needs Service'
          updated_at?: string
        }
      }
      devices: {
        Row: {
          id: string
          customer_id: string
          location: string
          serial_number: string
          size: string
          make: string
          model: string
          install_date: string
          last_test_date: string | null
          next_test_date: string | null
          status: 'Passed' | 'Failed' | 'Needs Repair'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          location: string
          serial_number: string
          size: string
          make: string
          model: string
          install_date: string
          last_test_date?: string | null
          next_test_date?: string | null
          status?: 'Passed' | 'Failed' | 'Needs Repair'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          location?: string
          serial_number?: string
          size?: string
          make?: string
          model?: string
          install_date?: string
          last_test_date?: string | null
          next_test_date?: string | null
          status?: 'Passed' | 'Failed' | 'Needs Repair'
          updated_at?: string
        }
      }
      test_reports: {
        Row: {
          id: string
          customer_id: string
          device_id: string
          test_date: string
          test_type: string
          initial_pressure: number
          final_pressure: number
          test_duration: number
          status: 'Passed' | 'Failed' | 'Needs Repair'
          technician: string
          notes: string | null
          water_district: string | null
          submitted: boolean
          submitted_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          device_id: string
          test_date: string
          test_type: string
          initial_pressure: number
          final_pressure: number
          test_duration: number
          status: 'Passed' | 'Failed' | 'Needs Repair'
          technician: string
          notes?: string | null
          water_district?: string | null
          submitted?: boolean
          submitted_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          device_id?: string
          test_date?: string
          test_type?: string
          initial_pressure?: number
          final_pressure?: number
          test_duration?: number
          status?: 'Passed' | 'Failed' | 'Needs Repair'
          technician?: string
          notes?: string | null
          water_district?: string | null
          submitted?: boolean
          submitted_date?: string | null
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          customer_id: string
          invoice_number: string
          issue_date: string
          due_date: string
          amount: number
          status: 'Pending' | 'Paid' | 'Overdue' | 'Cancelled'
          services: Json
          notes: string | null
          paid_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          invoice_number: string
          issue_date: string
          due_date: string
          amount: number
          status?: 'Pending' | 'Paid' | 'Overdue' | 'Cancelled'
          services: Json
          notes?: string | null
          paid_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          invoice_number?: string
          issue_date?: string
          due_date?: string
          amount?: number
          status?: 'Pending' | 'Paid' | 'Overdue' | 'Cancelled'
          services?: Json
          notes?: string | null
          paid_date?: string | null
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          customer_id: string
          service_type: string
          appointment_date: string
          appointment_time: string
          duration: number
          status: 'Scheduled' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled'
          device_location: string | null
          notes: string | null
          technician: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          service_type: string
          appointment_date: string
          appointment_time: string
          duration?: number
          status?: 'Scheduled' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled'
          device_location?: string | null
          notes?: string | null
          technician?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          service_type?: string
          appointment_date?: string
          appointment_time?: string
          duration?: number
          status?: 'Scheduled' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled'
          device_location?: string | null
          notes?: string | null
          technician?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}