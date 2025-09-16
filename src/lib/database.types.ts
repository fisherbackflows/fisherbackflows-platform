export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          allowed_ips: string[] | null
          company_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_preview: string
          last_used_at: string | null
          name: string
          rate_limit_per_hour: number | null
          scopes: string[] | null
          updated_at: string | null
        }
        Insert: {
          allowed_ips?: string[] | null
          company_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_preview: string
          last_used_at?: string | null
          name: string
          rate_limit_per_hour?: number | null
          scopes?: string[] | null
          updated_at?: string | null
        }
        Update: {
          allowed_ips?: string[] | null
          company_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_preview?: string
          last_used_at?: string | null
          name?: string
          rate_limit_per_hour?: number | null
          scopes?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      api_rate_limits: {
        Row: {
          api_key_id: string
          created_at: string | null
          id: string
          request_count: number | null
          window_start: string
        }
        Insert: {
          api_key_id: string
          created_at?: string | null
          id?: string
          request_count?: number | null
          window_start: string
        }
        Update: {
          api_key_id?: string
          created_at?: string | null
          id?: string
          request_count?: number | null
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_rate_limits_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage_logs: {
        Row: {
          api_key_id: string
          company_id: string
          created_at: string | null
          endpoint: string
          id: string
          ip_address: unknown | null
          method: string
          request_size: number | null
          response_size: number | null
          response_time_ms: number | null
          status_code: number | null
          user_agent: string | null
        }
        Insert: {
          api_key_id: string
          company_id: string
          created_at?: string | null
          endpoint: string
          id?: string
          ip_address?: unknown | null
          method: string
          request_size?: number | null
          response_size?: number | null
          response_time_ms?: number | null
          status_code?: number | null
          user_agent?: string | null
        }
        Update: {
          api_key_id?: string
          company_id?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          ip_address?: unknown | null
          method?: string
          request_size?: number | null
          response_size?: number | null
          response_time_ms?: number | null
          status_code?: number | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_usage_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          appointment_type: string | null
          assigned_technician: string | null
          company_id: string | null
          completion_notes: string | null
          created_at: string | null
          customer_can_track: boolean | null
          customer_id: string
          customer_notes: string | null
          device_id: string | null
          estimated_arrival: string | null
          estimated_duration: number | null
          id: string
          priority: string | null
          scheduled_date: string
          scheduled_time_end: string | null
          scheduled_time_start: string
          special_instructions: string | null
          status: string | null
          technician_last_location: string | null
          technician_latitude: number | null
          technician_longitude: number | null
          technician_notes: string | null
          travel_distance_km: number | null
          travel_time: number | null
          updated_at: string | null
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          appointment_type?: string | null
          assigned_technician?: string | null
          company_id?: string | null
          completion_notes?: string | null
          created_at?: string | null
          customer_can_track?: boolean | null
          customer_id: string
          customer_notes?: string | null
          device_id?: string | null
          estimated_arrival?: string | null
          estimated_duration?: number | null
          id?: string
          priority?: string | null
          scheduled_date: string
          scheduled_time_end?: string | null
          scheduled_time_start: string
          special_instructions?: string | null
          status?: string | null
          technician_last_location?: string | null
          technician_latitude?: number | null
          technician_longitude?: number | null
          technician_notes?: string | null
          travel_distance_km?: number | null
          travel_time?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          appointment_type?: string | null
          assigned_technician?: string | null
          company_id?: string | null
          completion_notes?: string | null
          created_at?: string | null
          customer_can_track?: boolean | null
          customer_id?: string
          customer_notes?: string | null
          device_id?: string | null
          estimated_arrival?: string | null
          estimated_duration?: number | null
          id?: string
          priority?: string | null
          scheduled_date?: string
          scheduled_time_end?: string | null
          scheduled_time_start?: string
          special_instructions?: string | null
          status?: string | null
          technician_last_location?: string | null
          technician_latitude?: number | null
          technician_longitude?: number | null
          technician_notes?: string | null
          travel_distance_km?: number | null
          travel_time?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_health_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          error_message: string | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          status: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          status?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          status?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      billing_invoices: {
        Row: {
          amount_due: number | null
          amount_paid: number | null
          billing_period_end: string | null
          billing_period_start: string | null
          created_at: string | null
          currency: string | null
          customer_id: string | null
          due_date: string | null
          hosted_invoice_url: string | null
          id: string
          invoice_pdf: string | null
          metadata: Json | null
          paid_at: string | null
          payment_intent_id: string | null
          status: string | null
          stripe_invoice_id: string
          subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount_due?: number | null
          amount_paid?: number | null
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          due_date?: string | null
          hosted_invoice_url?: string | null
          id: string
          invoice_pdf?: string | null
          metadata?: Json | null
          paid_at?: string | null
          payment_intent_id?: string | null
          status?: string | null
          stripe_invoice_id: string
          subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number | null
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          due_date?: string | null
          hosted_invoice_url?: string | null
          id?: string
          invoice_pdf?: string | null
          metadata?: Json | null
          paid_at?: string | null
          payment_intent_id?: string | null
          status?: string | null
          stripe_invoice_id?: string
          subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_health_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "billing_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_subscriptions: {
        Row: {
          amount_per_period: number
          billing_cycle: string | null
          created_at: string | null
          currency: string | null
          current_period_end: string
          current_period_start: string
          customer_id: string | null
          device_ids: string[] | null
          id: string
          is_active: boolean | null
          service_type: string | null
          status: string | null
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
        }
        Insert: {
          amount_per_period: number
          billing_cycle?: string | null
          created_at?: string | null
          currency?: string | null
          current_period_end: string
          current_period_start: string
          customer_id?: string | null
          device_ids?: string[] | null
          id: string
          is_active?: boolean | null
          service_type?: string | null
          status?: string | null
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
        }
        Update: {
          amount_per_period?: number
          billing_cycle?: string | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string
          current_period_start?: string
          customer_id?: string | null
          device_ids?: string[] | null
          id?: string
          is_active?: boolean | null
          service_type?: string | null
          status?: string | null
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_subscriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_health_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_subscriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          business_type: string | null
          certification_level: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string | null
          features: Json | null
          id: string
          license_number: string | null
          max_users: number | null
          name: string
          phone: string | null
          plan_type: string | null
          slug: string
          state: string | null
          status: string | null
          subdomain: string | null
          subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string | null
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          business_type?: string | null
          certification_level?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          features?: Json | null
          id?: string
          license_number?: string | null
          max_users?: number | null
          name: string
          phone?: string | null
          plan_type?: string | null
          slug: string
          state?: string | null
          status?: string | null
          subdomain?: string | null
          subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          business_type?: string | null
          certification_level?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          features?: Json | null
          id?: string
          license_number?: string | null
          max_users?: number | null
          name?: string
          phone?: string | null
          plan_type?: string | null
          slug?: string
          state?: string | null
          status?: string | null
          subdomain?: string | null
          subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          business_hours: Json | null
          company_id: string
          company_tagline: string | null
          created_at: string | null
          default_emergency_price: number | null
          default_retest_price: number | null
          default_test_price: number | null
          email_notifications: Json | null
          google_calendar_enabled: boolean | null
          id: string
          logo_url: string | null
          primary_color: string | null
          stripe_connected: boolean | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          business_hours?: Json | null
          company_id: string
          company_tagline?: string | null
          created_at?: string | null
          default_emergency_price?: number | null
          default_retest_price?: number | null
          default_test_price?: number | null
          email_notifications?: Json | null
          google_calendar_enabled?: boolean | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          stripe_connected?: boolean | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          business_hours?: Json | null
          company_id?: string
          company_tagline?: string | null
          created_at?: string | null
          default_emergency_price?: number | null
          default_retest_price?: number | null
          default_test_price?: number | null
          email_notifications?: Json | null
          google_calendar_enabled?: boolean | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          stripe_connected?: boolean | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_feedback: {
        Row: {
          additional_comments: string | null
          appointment_id: string | null
          created_at: string | null
          customer_id: string | null
          feedback_type: string
          follow_up_required: boolean | null
          id: string
          is_anonymous: boolean | null
          metadata: Json | null
          overall_rating: number | null
          priority: string | null
          responses: Json | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          additional_comments?: string | null
          appointment_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          feedback_type: string
          follow_up_required?: boolean | null
          id?: string
          is_anonymous?: boolean | null
          metadata?: Json | null
          overall_rating?: number | null
          priority?: string | null
          responses?: Json | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          additional_comments?: string | null
          appointment_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          feedback_type?: string
          follow_up_required?: boolean | null
          id?: string
          is_anonymous?: boolean | null
          metadata?: Json | null
          overall_rating?: number | null
          priority?: string | null
          responses?: Json | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_feedback_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_feedback_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_health_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_feedback_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_lifetime_metrics: {
        Row: {
          avg_invoice_amount: number | null
          customer_id: string | null
          customer_status: string | null
          days_as_customer: number | null
          first_purchase_date: string | null
          id: string
          last_purchase_date: string | null
          last_updated: string | null
          predicted_ltv: number | null
          total_invoices: number | null
          total_lifetime_value: number | null
          total_payments: number | null
        }
        Insert: {
          avg_invoice_amount?: number | null
          customer_id?: string | null
          customer_status?: string | null
          days_as_customer?: number | null
          first_purchase_date?: string | null
          id?: string
          last_purchase_date?: string | null
          last_updated?: string | null
          predicted_ltv?: number | null
          total_invoices?: number | null
          total_lifetime_value?: number | null
          total_payments?: number | null
        }
        Update: {
          avg_invoice_amount?: number | null
          customer_id?: string | null
          customer_status?: string | null
          days_as_customer?: number | null
          first_purchase_date?: string | null
          id?: string
          last_purchase_date?: string | null
          last_updated?: string | null
          predicted_ltv?: number | null
          total_invoices?: number | null
          total_lifetime_value?: number | null
          total_payments?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_lifetime_metrics_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customer_health_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_lifetime_metrics_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          account_number: string | null
          account_status: string | null
          address_line1: string
          address_line2: string | null
          auth_user_id: string | null
          billing_address_line1: string | null
          billing_address_line2: string | null
          billing_address_same: boolean | null
          billing_city: string | null
          billing_state: string | null
          billing_zip_code: string | null
          city: string
          company_id: string | null
          company_name: string | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          notes: string | null
          password_hash: string | null
          phone: string
          preferred_contact_method: string | null
          state: string
          stripe_customer_id: string | null
          updated_at: string | null
          zip_code: string
        }
        Insert: {
          account_number?: string | null
          account_status?: string | null
          address_line1: string
          address_line2?: string | null
          auth_user_id?: string | null
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_address_same?: boolean | null
          billing_city?: string | null
          billing_state?: string | null
          billing_zip_code?: string | null
          city: string
          company_id?: string | null
          company_name?: string | null
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          password_hash?: string | null
          phone: string
          preferred_contact_method?: string | null
          state: string
          stripe_customer_id?: string | null
          updated_at?: string | null
          zip_code: string
        }
        Update: {
          account_number?: string | null
          account_status?: string | null
          address_line1?: string
          address_line2?: string | null
          auth_user_id?: string | null
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_address_same?: boolean | null
          billing_city?: string | null
          billing_state?: string | null
          billing_zip_code?: string | null
          city?: string
          company_id?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          password_hash?: string | null
          phone?: string
          preferred_contact_method?: string | null
          state?: string
          stripe_customer_id?: string | null
          updated_at?: string | null
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          company_id: string | null
          created_at: string | null
          customer_id: string
          device_status: string | null
          device_type: string
          id: string
          installation_date: string | null
          last_test_date: string | null
          location_description: string
          manufacturer: string
          model: string
          next_test_due: string | null
          notes: string | null
          permit_number: string | null
          serial_number: string | null
          size_inches: string
          updated_at: string | null
          water_district: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          customer_id: string
          device_status?: string | null
          device_type: string
          id?: string
          installation_date?: string | null
          last_test_date?: string | null
          location_description: string
          manufacturer: string
          model: string
          next_test_due?: string | null
          notes?: string | null
          permit_number?: string | null
          serial_number?: string | null
          size_inches: string
          updated_at?: string | null
          water_district?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          customer_id?: string
          device_status?: string | null
          device_type?: string
          id?: string
          installation_date?: string | null
          last_test_date?: string | null
          location_description?: string
          manufacturer?: string
          model?: string
          next_test_due?: string | null
          notes?: string | null
          permit_number?: string | null
          serial_number?: string | null
          size_inches?: string
          updated_at?: string | null
          water_district?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_health_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      email_verifications: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_used: boolean | null
          token: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_used?: boolean | null
          token: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_used?: boolean | null
          token?: string
          user_id?: string | null
        }
        Relationships: []
      }
      event_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          ip_address: string | null
          severity: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          severity?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          severity?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      invoice_line_items: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          quantity: number | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          quantity?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          appointment_id: string | null
          created_at: string | null
          customer_id: string
          due_date: string | null
          id: string
          invoice_number: string
          notes: string | null
          paid_date: string | null
          services: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          created_at?: string | null
          customer_id: string
          due_date?: string | null
          id?: string
          invoice_number: string
          notes?: string | null
          paid_date?: string | null
          services?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          created_at?: string | null
          customer_id?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          notes?: string | null
          paid_date?: string | null
          services?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_health_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          message: string | null
          name: string
          phone: string | null
          service_type: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          service_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          service_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_interactions: {
        Row: {
          clicked_at: string | null
          created_at: string | null
          dismissed_at: string | null
          id: string
          interaction_type: string
          notification_id: string
          opened_at: string | null
          user_id: string | null
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string | null
          dismissed_at?: string | null
          id?: string
          interaction_type: string
          notification_id: string
          opened_at?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_at?: string | null
          created_at?: string | null
          dismissed_at?: string | null
          id?: string
          interaction_type?: string
          notification_id?: string
          opened_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_interactions_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notification_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          message: string
          notification_type: string
          recipient_id: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message: string
          notification_type: string
          recipient_id?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message?: string
          notification_type?: string
          recipient_id?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          created_at: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          message_template: string
          name: string
          notification_type: string
          title_template: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          message_template: string
          name: string
          notification_type: string
          title_template: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          message_template?: string
          name?: string
          notification_type?: string
          title_template?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          created_at: string | null
          customer_id: string
          expires_month: number | null
          expires_year: number | null
          fingerprint: string | null
          id: string
          is_default: boolean | null
          last4: string | null
          payment_method_type: string
          stripe_payment_method_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          expires_month?: number | null
          expires_year?: number | null
          fingerprint?: string | null
          id?: string
          is_default?: boolean | null
          last4?: string | null
          payment_method_type: string
          stripe_payment_method_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          expires_month?: number | null
          expires_year?: number | null
          fingerprint?: string | null
          id?: string
          is_default?: boolean | null
          last4?: string | null
          payment_method_type?: string
          stripe_payment_method_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_health_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_methods_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          customer_id: string
          id: string
          invoice_id: string | null
          notes: string | null
          payment_date: string
          payment_method: string | null
          payment_reference: string | null
          stripe_payment_intent_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          customer_id: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          payment_reference?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          customer_id?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          payment_reference?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_health_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          outcome: string | null
          resource: string | null
          risk_score: number | null
          session_id: string | null
          severity: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          outcome?: string | null
          resource?: string | null
          risk_score?: number | null
          session_id?: string | null
          severity?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          outcome?: string | null
          resource?: string | null
          risk_score?: number | null
          session_id?: string | null
          severity?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      technician_current_location: {
        Row: {
          battery_level: number | null
          created_at: string | null
          heading: number | null
          id: string
          is_active: boolean | null
          is_on_call: boolean | null
          latitude: number
          longitude: number
          speed: number | null
          technician_id: string
          updated_at: string | null
        }
        Insert: {
          battery_level?: number | null
          created_at?: string | null
          heading?: number | null
          id?: string
          is_active?: boolean | null
          is_on_call?: boolean | null
          latitude: number
          longitude: number
          speed?: number | null
          technician_id: string
          updated_at?: string | null
        }
        Update: {
          battery_level?: number | null
          created_at?: string | null
          heading?: number | null
          id?: string
          is_active?: boolean | null
          is_on_call?: boolean | null
          latitude?: number
          longitude?: number
          speed?: number | null
          technician_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technician_current_location_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "team_users"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_locations: {
        Row: {
          appointment_id: string | null
          created_at: string | null
          id: string
          latitude: number
          longitude: number
          recorded_at: string
          technician_id: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string | null
          id?: string
          latitude: number
          longitude: number
          recorded_at: string
          technician_id: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string | null
          id?: string
          latitude?: number
          longitude?: number
          recorded_at?: string
          technician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "technician_locations_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_locations_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "team_users"
            referencedColumns: ["id"]
          },
        ]
      }
      team_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: string | null
          last_activity: string | null
          session_token: string
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          last_activity?: string | null
          session_token: string
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          last_activity?: string | null
          session_token?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "team_users"
            referencedColumns: ["id"]
          },
        ]
      }
      team_users: {
        Row: {
          certification_level: string | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          is_active: boolean | null
          last_name: string
          password_hash: string
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          certification_level?: string | null
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          is_active?: boolean | null
          last_name: string
          password_hash: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          certification_level?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean | null
          last_name?: string
          password_hash?: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tester_schedules: {
        Row: {
          created_at: string | null
          end_time: string
          id: string
          is_active: boolean | null
          schedule_date: string
          start_time: string
          technician_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_time: string
          id?: string
          is_active?: boolean | null
          schedule_date: string
          start_time: string
          technician_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string
          id?: string
          is_active?: boolean | null
          schedule_date?: string
          start_time?: string
          technician_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tester_schedules_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "team_users"
            referencedColumns: ["id"]
          },
        ]
      }
      test_reports: {
        Row: {
          appointment_id: string
          created_at: string | null
          customer_id: string
          device_id: string
          id: string
          notes: string | null
          pass_fail: boolean
          test_date: string
          test_pressure: number | null
          updated_at: string | null
        }
        Insert: {
          appointment_id: string
          created_at?: string | null
          customer_id: string
          device_id: string
          id?: string
          notes?: string | null
          pass_fail: boolean
          test_date: string
          test_pressure?: number | null
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string
          created_at?: string | null
          customer_id?: string
          device_id?: string
          id?: string
          notes?: string | null
          pass_fail?: boolean
          test_date?: string
          test_pressure?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_reports_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_reports_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_health_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_reports_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_reports_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      time_off_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          end_date: string
          id: string
          notes: string | null
          reason: string | null
          start_date: string
          status: string | null
          technician_id: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          end_date: string
          id?: string
          notes?: string | null
          reason?: string | null
          start_date: string
          status?: string | null
          technician_id: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          end_date?: string
          id?: string
          notes?: string | null
          reason?: string | null
          start_date?: string
          status?: string | null
          technician_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_off_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "team_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_off_requests_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "team_users"
            referencedColumns: ["id"]
          },
        ]
      }
      water_department_submissions: {
        Row: {
          created_at: string | null
          district_id: string
          id: string
          submission_data: Json
          submission_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          district_id: string
          id?: string
          submission_data: Json
          submission_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          district_id?: string
          id?: string
          submission_data?: Json
          submission_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "water_department_submissions_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "water_districts"
            referencedColumns: ["id"]
          },
        ]
      }
      water_districts: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          district_code: string | null
          id: string
          name: string
          submission_frequency: string | null
          updated_at: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          district_code?: string | null
          id?: string
          name: string
          submission_frequency?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          district_code?: string | null
          id?: string
          name?: string
          submission_frequency?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      customer_health_metrics: {
        Row: {
          account_status: string | null
          avg_days_between_appointments: number | null
          company_id: string | null
          created_at: string | null
          customer_lifetime_value: number | null
          device_count: number | null
          email: string | null
          first_name: string | null
          id: string | null
          last_appointment_date: string | null
          last_name: string | null
          last_payment_date: string | null
          overdue_balance: number | null
          overdue_days: number | null
          overdue_devices: number | null
          phone: string | null
          risk_score: number | null
          total_appointments: number | null
          total_invoices: number | null
          total_payments: number | null
          unpaid_balance: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      update_updated_at_column: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never