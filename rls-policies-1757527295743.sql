-- Enable RLS for customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Enable RLS for team_users
ALTER TABLE public.team_users ENABLE ROW LEVEL SECURITY;

-- Enable RLS for devices
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Enable RLS for appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Enable RLS for test_reports
ALTER TABLE public.test_reports ENABLE ROW LEVEL SECURITY;

-- Enable RLS for invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Enable RLS for payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Enable RLS for billing_subscriptions
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;

-- Enable RLS for billing_invoices
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;

-- Enable RLS for security_logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS for technician_locations
ALTER TABLE public.technician_locations ENABLE ROW LEVEL SECURITY;

-- Enable RLS for technician_current_location
ALTER TABLE public.technician_current_location ENABLE ROW LEVEL SECURITY;

-- Enable RLS for audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS for email_verifications
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Enable RLS for leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Enable RLS for time_off_requests
ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;

-- Enable RLS for tester_schedules
ALTER TABLE public.tester_schedules ENABLE ROW LEVEL SECURITY;

-- Enable RLS for team_sessions
ALTER TABLE public.team_sessions ENABLE ROW LEVEL SECURITY;

-- Enable RLS for water_districts
ALTER TABLE public.water_districts ENABLE ROW LEVEL SECURITY;

-- Enable RLS for water_department_submissions
ALTER TABLE public.water_department_submissions ENABLE ROW LEVEL SECURITY;

-- Enable RLS for notification_templates
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Enable RLS for push_subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Enable RLS for notification_logs
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS for notification_interactions
ALTER TABLE public.notification_interactions ENABLE ROW LEVEL SECURITY;
