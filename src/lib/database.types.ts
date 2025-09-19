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
          status: 'active' | 'inactive' | 'needs_service' | 'Active' | 'Inactive' | 'Needs Service'
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
          status?: 'active' | 'inactive' | 'needs_service' | 'Active' | 'Inactive' | 'Needs Service'
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
          status?: 'active' | 'inactive' | 'needs_service' | 'Active' | 'Inactive' | 'Needs Service'
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
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          phone: string | null
          role: 'admin' | 'technician' | 'customer' | 'user'
          organization_id: string
          active: boolean
          permissions: Json | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          phone?: string | null
          role?: 'admin' | 'technician' | 'customer' | 'user'
          organization_id: string
          active?: boolean
          permissions?: Json | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          phone?: string | null
          role?: 'admin' | 'technician' | 'customer' | 'user'
          organization_id?: string
          active?: boolean
          permissions?: Json | null
          metadata?: Json | null
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          customer_id: string
          invoice_id: string | null
          amount: number
          status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded' | 'requires_action'
          payment_date: string
          payment_method: string | null
          transaction_id: string | null
          stripe_payment_intent_id: string | null
          client_secret: string | null
          receipt_url: string | null
          refund_amount: number | null
          refund_date: string | null
          refund_reason: string | null
          error_message: string | null
          notes: string | null
          processed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          invoice_id?: string | null
          amount: number
          status?: 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded' | 'requires_action'
          payment_date?: string
          payment_method?: string | null
          transaction_id?: string | null
          stripe_payment_intent_id?: string | null
          client_secret?: string | null
          receipt_url?: string | null
          refund_amount?: number | null
          refund_date?: string | null
          refund_reason?: string | null
          error_message?: string | null
          notes?: string | null
          processed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          invoice_id?: string | null
          amount?: number
          status?: 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded' | 'requires_action'
          payment_date?: string
          payment_method?: string | null
          transaction_id?: string | null
          stripe_payment_intent_id?: string | null
          client_secret?: string | null
          receipt_url?: string | null
          refund_amount?: number | null
          refund_date?: string | null
          refund_reason?: string | null
          error_message?: string | null
          notes?: string | null
          processed_at?: string | null
          updated_at?: string
        }
      }
      team_users: {
        Row: {
          id: string
          user_id: string
          role: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          status?: string
        }
      }
      technicians: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          role: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          role?: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          role?: string
          status?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          read?: boolean
        }
      }
      email_verifications: {
        Row: {
          id: string
          user_id: string
          email: string
          token: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          token: string
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          token?: string
          expires_at?: string
        }
      }
      security_logs: {
        Row: {
          id: string
          user_id: string | null
          event_type: string
          severity: string
          message: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          event_type: string
          severity: string
          message: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          event_type?: string
          severity?: string
          message?: string
          metadata?: Json | null
        }
      }
      test_reports: {
        Row: {
          id: string
          customer_id: string
          device_id: string
          appointment_id: string | null
          technician_id: string
          test_date: string
          test_time: string | null
          test_result: 'pending' | 'pass' | 'fail' | 'Passed' | 'Failed' | 'Needs Repair'
          test_data: Json | null
          initial_pressure: number | null
          final_pressure: number | null
          test_duration: number | null
          repairs_needed: boolean
          follow_up_required: boolean
          follow_up_date: string | null
          certification_number: string | null
          notes: string | null
          status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          device_id: string
          appointment_id?: string | null
          technician_id: string
          test_date: string
          test_time?: string | null
          test_result?: 'pending' | 'pass' | 'fail' | 'Passed' | 'Failed' | 'Needs Repair'
          test_data?: Json | null
          initial_pressure?: number | null
          final_pressure?: number | null
          test_duration?: number | null
          repairs_needed?: boolean
          follow_up_required?: boolean
          follow_up_date?: string | null
          certification_number?: string | null
          notes?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          device_id?: string
          appointment_id?: string | null
          technician_id?: string
          test_date?: string
          test_time?: string | null
          test_result?: 'pending' | 'pass' | 'fail' | 'Passed' | 'Failed' | 'Needs Repair'
          test_data?: Json | null
          initial_pressure?: number | null
          final_pressure?: number | null
          test_duration?: number | null
          repairs_needed?: boolean
          follow_up_required?: boolean
          follow_up_date?: string | null
          certification_number?: string | null
          notes?: string | null
          status?: string | null
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