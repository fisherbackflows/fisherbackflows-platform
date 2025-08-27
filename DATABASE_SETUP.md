# Fisher Backflows - Automated Database Setup

Your Fisher Backflows application now has a fully automated customer management system with database integration. Here's how to set it up:

## 🚀 Quick Start

### 1. Set Up Supabase Database

1. Go to [Supabase](https://supabase.com) and create a new project
2. In the SQL editor, run the contents of `supabase-schema.sql` to create all tables
3. Copy your project credentials from Settings > API

### 2. Configure Environment Variables

Create a `.env.local` file with your credentials:

```bash
# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Google Calendar Integration (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token
GOOGLE_CALENDAR_EMAIL=fisherbackflows@gmail.com
```

### 3. Start the Application

```bash
npm run dev
```

## 🤖 Automation Features

Your system now includes complete automation for:

### Customer Management
- **Auto customer creation** with unique account numbers (FB001, FB002, etc.)
- **Device tracking** with automatic test date calculations
- **Status management** (Active, Needs Service, etc.)

### Appointment Booking
- **Calendar integration** with Google Calendar
- **Conflict detection** - no double bookings
- **Auto-confirmation** with customer details
- **Next test date calculation** (1 year from completion)

### Test Completion Workflow
- **Automated report generation** when tests are completed
- **Invoice auto-creation** based on service type and device size
- **Device status updates** (Passed/Failed/Needs Repair)
- **Customer status updates** based on test results
- **Next test scheduling** for passed devices

### Pricing Automation
- **3/4" devices**: $75
- **1" devices**: $100
- **1.5" devices**: $125  
- **2" devices**: $150
- **Repair & Retest**: $50 base + $35 retest

### Invoice Management
- **Auto-generation** after test completion
- **Overdue detection** and status updates
- **30-day payment terms**
- **Unique invoice numbering** (INV-2025-001, etc.)

## 📊 Database Schema

The system uses 5 main tables:

1. **customers** - Customer information and account details
2. **devices** - Backflow devices with test schedules
3. **appointments** - Scheduled services with calendar sync
4. **test_reports** - Test results and compliance data
5. **invoices** - Billing with automated pricing

## 🔧 API Endpoints

### Automated Workflows
- `POST /api/appointments` - Books appointment + creates calendar event
- `POST /api/test-reports/complete` - Completes test + generates invoice + updates schedules
- `GET /api/customers` - Lists customers with devices and appointments
- `GET /api/invoices` - Lists invoices with auto-overdue detection

### Calendar Integration
- `GET /api/calendar/available-dates` - Gets availability from Google Calendar
- Auto-creates calendar events when appointments are booked
- Syncs with external booking sources

## 🚨 Error Handling

The system includes fallbacks:
- **Database offline**: Falls back to mock data
- **Google Calendar offline**: Appointments still work, just no calendar sync
- **Missing credentials**: System shows configuration warnings

## 🎯 What Happens When You Book an Appointment

1. Customer selects date/time on calendar
2. System checks for conflicts across all sources
3. Appointment created in database
4. Google Calendar event auto-created
5. Customer receives confirmation
6. Next test date automatically calculated
7. Device tracking updated

## 🎯 What Happens When You Complete a Test

1. Test results entered via API
2. Test report auto-generated and stored
3. Invoice automatically created with correct pricing
4. Device status and next test date updated
5. Customer status updated based on results
6. Appointment marked complete
7. Calendar updated

## 🔐 Security & Compliance

- Row Level Security ready (commented in schema)
- Service role for admin operations
- Environment variable protection
- Input validation on all endpoints
- SQL injection prevention

## 📱 Mobile Ready

All automation works on mobile devices through the responsive web interface.

## 🚀 Next Steps

1. Run the SQL schema in Supabase
2. Add your environment variables
3. Test the booking flow
4. Set up Google Calendar (optional but recommended)
5. Import your existing customer data

The system is now fully automated and ready for production use! 🎉